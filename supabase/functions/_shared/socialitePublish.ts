// SOCIALITE publishing — one place that posts to every platform. Used by
// socialite-publish (Post now) and socialite-scheduler (timed posts).
// Keys come from the encrypted vault (SOCIALITE → Accounts).
//   facebook : account_id = Page ID, token = Page token
//   instagram: account_id = IG Business ID, token (or FB token)
//   threads  : account_id = Threads user ID, token = Threads token
//   x        : token = "consumerKey:consumerSecret:accessToken:accessSecret" (OAuth 1.0a, Read+Write)
//   tiktok   : token = user access token (video.publish scope); media must be a public URL
//   youtube  : token = OAuth access token (youtube.upload scope); needs a video URL
//
// Formats (payload.format on scheduled rows / body.format on Post now):
//   photo    — one image (the original path, unchanged)
//   reel     — one video: IG posts it as a Reel, FB as a Page video post
//   carousel — 2–10 photos: IG carousel (child containers), FB multi-photo post
//   story    — one photo (or video on IG): IG Story / FB Page photo Story.
//              Stories carry no visible caption on either platform; the text
//              still travels with the row for Shield dedupe + history.
// Other platforms ignore `format` and keep their existing behavior.
import { getCredential } from "./socialiteVault.ts";

const G = "https://graph.facebook.com/v20.0";
const isVideo = (u?: string) => !!u && /\.(mp4|mov|m4v|webm)(\?|$)/i.test(u);

export type PostFormat = "photo" | "carousel" | "reel" | "story";

// ---------- X (OAuth 1.0a HMAC-SHA1) ----------
const pct = (s: string) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
export async function xAuthHeader(method: string, url: string, ck: string, cs: string, at: string, as: string, query: Record<string, string> = {}) {
  const o: Record<string, string> = {
    oauth_consumer_key: ck, oauth_nonce: crypto.randomUUID().replace(/-/g, ""), oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)), oauth_token: at, oauth_version: "1.0",
  };
  const all: Record<string, string> = { ...o, ...query };
  const params = Object.keys(all).sort().map((k) => `${pct(k)}=${pct(all[k])}`).join("&");
  const base = `${method}&${pct(url)}&${pct(params)}`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(`${pct(cs)}&${pct(as)}`), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const sig = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(base)))));
  o.oauth_signature = sig;
  return "OAuth " + Object.keys(o).sort().map((k) => `${pct(k)}="${pct(o[k])}"`).join(", ");
}

// ---------- Meta format helpers (carousel / stories) ----------

/** Polls an IG container until Meta finishes processing it (or gives up). */
async function igWait(id: string, token: string, tries = 20, delayMs = 3000): Promise<boolean> {
  for (let i = 0; i < tries; i++) {
    try {
      const s = await (await fetch(`${G}/${id}?fields=status_code&access_token=${encodeURIComponent(token)}`)).json();
      if (s?.status_code === "FINISHED") return true;
      if (s?.status_code === "ERROR" || s?.status_code === "EXPIRED") return false;
    } catch { /* a network blip is not a failed container — keep waiting */ }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

/** Instagram carousel: one child container per item, one CAROUSEL container, publish. */
async function igCarousel(igId: string, token: string, text: string, media: string[]): Promise<any> {
  const childIds: string[] = [];
  for (const u of media.slice(0, 10)) {
    const params: Record<string, string> = isVideo(u)
      ? { media_type: "VIDEO", video_url: u, is_carousel_item: "true", access_token: token }
      : { image_url: u, is_carousel_item: "true", access_token: token };
    const c = await (await fetch(`${G}/${igId}/media`, { method: "POST", body: new URLSearchParams(params) })).json();
    if (!c.id) return c;
    childIds.push(c.id);
  }
  for (const id of childIds) await igWait(id, token, 10, 2000); // children must be FINISHED before the parent will publish
  const parent = await (await fetch(`${G}/${igId}/media`, { method: "POST", body: new URLSearchParams({ media_type: "CAROUSEL", children: childIds.join(","), caption: text, access_token: token }) })).json();
  if (!parent.id) return parent;
  await igWait(parent.id, token);
  return (await fetch(`${G}/${igId}/media_publish`, { method: "POST", body: new URLSearchParams({ creation_id: parent.id, access_token: token }) })).json();
}

/** Instagram Story: a STORIES container, then publish. No caption — IG does not take one. */
async function igStory(igId: string, token: string, m: string): Promise<any> {
  const params: Record<string, string> = isVideo(m)
    ? { media_type: "STORIES", video_url: m, access_token: token }
    : { media_type: "STORIES", image_url: m, access_token: token };
  const c = await (await fetch(`${G}/${igId}/media`, { method: "POST", body: new URLSearchParams(params) })).json();
  if (!c.id) return c;
  await igWait(c.id, token);
  return (await fetch(`${G}/${igId}/media_publish`, { method: "POST", body: new URLSearchParams({ creation_id: c.id, access_token: token }) })).json();
}

/** Facebook Page photo Story: upload the photo unpublished, then post it to the Page's story. */
async function fbPhotoStory(pageId: string, token: string, photoUrl: string): Promise<any> {
  const up = await (await fetch(`${G}/${pageId}/photos`, { method: "POST", body: new URLSearchParams({ url: photoUrl, published: "false", access_token: token }) })).json();
  if (!up.id) return up;
  return (await fetch(`${G}/${pageId}/stories`, { method: "POST", body: new URLSearchParams({ photo_id: up.id, access_token: token }) })).json();
}

/** Facebook multi-photo post (the FB shape of a carousel): unpublished uploads + attached_media. */
async function fbMultiPhoto(pageId: string, token: string, text: string, media: string[]): Promise<any> {
  const ids: string[] = [];
  for (const u of media.slice(0, 10)) {
    if (isVideo(u)) continue; // attached_media is photos; a stray video falls back to the single-media path below
    const up = await (await fetch(`${G}/${pageId}/photos`, { method: "POST", body: new URLSearchParams({ url: u, published: "false", access_token: token }) })).json();
    if (up.id) ids.push(up.id);
  }
  if (ids.length < 2) return null; // caller falls back to the original single-photo path
  return (await fetch(`${G}/${pageId}/feed`, {
    method: "POST",
    body: new URLSearchParams({ message: text, attached_media: JSON.stringify(ids.map((id) => ({ media_fbid: id }))), access_token: token }),
  })).json();
}

async function postOne(p: string, text: string, media: string[], owner: string, format?: PostFormat): Promise<any> {
  const m = media[0];
  if (p === "facebook") {
    const fb = await getCredential("facebook", owner);
    if (!fb?.accountId) return { error: "Facebook not connected" };
    // Stories: Page photo stories live on their own endpoint. A video cannot
    // be a Page photo story, so it posts as a normal Page video instead.
    if (format === "story" && m) {
      if (!isVideo(m)) return fbPhotoStory(fb.accountId, fb.token, m);
      const q = new URLSearchParams({ access_token: fb.token, file_url: m, description: text });
      const r = await (await fetch(`${G}/${fb.accountId}/videos`, { method: "POST", body: q })).json();
      return { ...r, note: "Facebook Page stories are photo-only here; posted as a video post instead." };
    }
    // Carousel: several photos in one post (the original path below only ever used media[0]).
    if (format === "carousel" && media.length > 1) {
      const r = await fbMultiPhoto(fb.accountId, fb.token, text, media);
      if (r) return r;
    }
    const url = m ? `${G}/${fb.accountId}/${isVideo(m) ? "videos" : "photos"}` : `${G}/${fb.accountId}/feed`;
    const q = new URLSearchParams({ access_token: fb.token, ...(m ? (isVideo(m) ? { file_url: m, description: text } : { url: m, caption: text }) : { message: text }) });
    return (await fetch(url, { method: "POST", body: q })).json();
  }
  if (p === "instagram") {
    const ig = await getCredential("instagram", owner);
    const token = ig?.token || (await getCredential("facebook", owner))?.token;
    if (!ig?.accountId || !token) return { error: "Instagram not connected" };
    if (!m) return { error: "Instagram needs an image or video" };
    if (format === "story") return igStory(ig.accountId, token, m);
    if (media.length > 1) return igCarousel(ig.accountId, token, text, media);
    const c = await (await fetch(`${G}/${ig.accountId}/media`, { method: "POST", body: new URLSearchParams({ ...(isVideo(m) ? { media_type: "REELS", video_url: m } : { image_url: m }), caption: text, access_token: token }) })).json();
    if (!c.id) return c;
    if (isVideo(m)) await new Promise((r) => setTimeout(r, 15000)); // let IG process the video
    return (await fetch(`${G}/${ig.accountId}/media_publish`, { method: "POST", body: new URLSearchParams({ creation_id: c.id, access_token: token }) })).json();
  }
  if (p === "threads") {
    const t = await getCredential("threads", owner);
    if (!t?.accountId) return { error: "Threads not connected" };
    const T = "https://graph.threads.net/v1.0";
    const body = new URLSearchParams({ text: text.slice(0, 500), access_token: t.token, media_type: m ? (isVideo(m) ? "VIDEO" : "IMAGE") : "TEXT", ...(m ? (isVideo(m) ? { video_url: m } : { image_url: m }) : {}) });
    const c = await (await fetch(`${T}/${t.accountId}/threads`, { method: "POST", body })).json();
    if (!c.id) return c;
    if (m) await new Promise((r) => setTimeout(r, isVideo(m) ? 20000 : 3000));
    return (await fetch(`${T}/${t.accountId}/threads_publish`, { method: "POST", body: new URLSearchParams({ creation_id: c.id, access_token: t.token }) })).json();
  }
  if (p === "x") {
    const x = await getCredential("x", owner);
    if (!x) return { error: "X not connected" };
    const [ck, cs, at, as] = x.token.split(":");
    if (!ck || !cs || !at || !as) return { error: "X needs 4 keys: API key, API secret, access token, access secret" };
    const url = "https://api.x.com/2/tweets";
    const r = await fetch(url, { method: "POST", headers: { Authorization: await xAuthHeader("POST", url, ck, cs, at, as), "Content-Type": "application/json" }, body: JSON.stringify({ text: text.slice(0, 280) }) });
    const j = await r.json();
    return r.ok ? j : { error: j?.detail || j?.title || "X rejected the post" };
  }
  if (p === "tiktok") {
    const t = await getCredential("tiktok", owner);
    if (!t) return { error: "TikTok not connected" };
    if (!m) return { error: "TikTok needs a video or photo" };
    const H = { Authorization: `Bearer ${t.token}`, "Content-Type": "application/json; charset=UTF-8" };
    const r = isVideo(m)
      ? await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", { method: "POST", headers: H, body: JSON.stringify({ post_info: { title: text.slice(0, 2200), privacy_level: "PUBLIC_TO_EVERYONE" }, source_info: { source: "PULL_FROM_URL", video_url: m } }) })
      : await fetch("https://open.tiktokapis.com/v2/post/publish/content/init/", { method: "POST", headers: H, body: JSON.stringify({ media_type: "PHOTO", post_mode: "DIRECT_POST", post_info: { title: text.slice(0, 90), description: text.slice(0, 4000), privacy_level: "PUBLIC_TO_EVERYONE" }, source_info: { source: "PULL_FROM_URL", photo_images: media.slice(0, 35), photo_cover_index: 0 } }) });
    const j = await r.json();
    return j?.error?.code && j.error.code !== "ok" ? { error: j.error.message || j.error.code } : j;
  }
  if (p === "youtube") {
    const y = await getCredential("youtube", owner);
    if (!y) return { error: "YouTube not connected" };
    if (!isVideo(m)) return { error: "YouTube needs a video (.mp4)" };
    const vid = await fetch(m!);
    if (!vid.ok) return { error: "Could not download the video" };
    const bytes = new Uint8Array(await vid.arrayBuffer());
    const meta = JSON.stringify({ snippet: { title: (text.split("\n")[0] || "Startup Factory Hub").slice(0, 100), description: text.slice(0, 5000) }, status: { privacyStatus: "public" } }); // SFH: YouTube fallback title (was "Wonderlands" in WW)
    const b = "socialite" + crypto.randomUUID();
    const head = new TextEncoder().encode(`--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${b}\r\nContent-Type: video/*\r\n\r\n`);
    const tail = new TextEncoder().encode(`\r\n--${b}--`);
    const body = new Uint8Array(head.length + bytes.length + tail.length);
    body.set(head); body.set(bytes, head.length); body.set(tail, head.length + bytes.length);
    const r = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status", { method: "POST", headers: { Authorization: `Bearer ${y.token}`, "Content-Type": `multipart/related; boundary=${b}` }, body });
    const j = await r.json();
    return r.ok ? j : { error: j?.error?.message || "YouTube rejected the upload" };
  }
  return { error: "Unknown platform" };
}

/** Publishes with the keys of `owner` (the SOCIALITE user who posts).
 *  `format` is optional; without it every platform behaves exactly as before. */
export async function publishAll(text: string, platforms: string[], media: string[], owner: string, format?: PostFormat) {
  const results: Record<string, any> = {};
  await Promise.all(platforms.map(async (p) => {
    try { results[p] = await postOne(p, text, media, owner, format); } catch (e) { results[p] = { error: (e as Error).message }; }
  }));
  const errs = Object.entries(results).filter(([, r]) => r?.error).map(([k, r]) => `${k}: ${typeof r.error === "string" ? r.error : r.error.message}`);
  return { success: !errs.length && platforms.length > 0, results, error: errs.join(" · ") || undefined };
}
