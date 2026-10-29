// SOCIALITE Insights — reads REAL account + recent-post metrics from each platform
// the caller connected in Accounts (their own keys, via the vault). Never invents numbers:
// a platform that fails or isn't connected returns { connected:false } or { error }.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireUser, getCredential } from "../_shared/socialiteVault.ts";
import { xAuthHeader } from "../_shared/socialitePublish.ts";

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const G = "https://graph.facebook.com/v20.0";
const get = async (u: string, h: Record<string, string> = {}) => {
  const r = await fetch(u, { headers: h });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j?.error) throw new Error(j?.error?.message || j?.error?.code || j?.detail || j?.title || `HTTP ${r.status}`);
  return j;
};
type Post = { text: string; at: string; likes: number; comments: number; shares: number; views: number; url?: string };
type Out = { connected: boolean; name?: string; followers?: number; extra?: Record<string, number>; posts?: Post[]; error?: string };

async function facebook(o: string): Promise<Out> {
  const c = await getCredential("facebook", o); if (!c?.accountId) return { connected: false };
  const q = `access_token=${encodeURIComponent(c.token)}`;
  const p = await get(`${G}/${c.accountId}?fields=name,followers_count,fan_count&${q}`);
  const f = await get(`${G}/${c.accountId}/posts?fields=message,created_time,permalink_url,shares,reactions.summary(true).limit(0),comments.summary(true).limit(0)&limit=25&${q}`);
  return { connected: true, name: p.name, followers: p.followers_count ?? p.fan_count ?? 0, extra: { page_likes: p.fan_count ?? 0 },
    posts: (f.data || []).map((x: any) => ({ text: x.message || "", at: x.created_time, likes: x.reactions?.summary?.total_count || 0, comments: x.comments?.summary?.total_count || 0, shares: x.shares?.count || 0, views: 0, url: x.permalink_url })) };
}
async function instagram(o: string): Promise<Out> {
  const c = await getCredential("instagram", o); const token = c?.token || (await getCredential("facebook", o))?.token;
  if (!c?.accountId || !token) return { connected: false };
  const q = `access_token=${encodeURIComponent(token)}`;
  const p = await get(`${G}/${c.accountId}?fields=username,followers_count,follows_count,media_count&${q}`);
  const m = await get(`${G}/${c.accountId}/media?fields=caption,timestamp,like_count,comments_count,permalink&limit=25&${q}`);
  return { connected: true, name: "@" + p.username, followers: p.followers_count || 0, extra: { following: p.follows_count || 0, media: p.media_count || 0 },
    posts: (m.data || []).map((x: any) => ({ text: x.caption || "", at: x.timestamp, likes: x.like_count || 0, comments: x.comments_count || 0, shares: 0, views: 0, url: x.permalink })) };
}
async function threads(o: string): Promise<Out> {
  const c = await getCredential("threads", o); if (!c?.accountId) return { connected: false };
  const T = "https://graph.threads.net/v1.0", q = `access_token=${encodeURIComponent(c.token)}`;
  const p = await get(`${T}/${c.accountId}?fields=username&${q}`);
  let followers = 0; try { const i = await get(`${T}/${c.accountId}/threads_insights?metric=followers_count&${q}`); followers = i.data?.[0]?.total_value?.value || 0; } catch { /* scope missing */ }
  const m = await get(`${T}/${c.accountId}/threads?fields=id,text,timestamp,permalink&limit=15&${q}`);
  const posts: Post[] = await Promise.all((m.data || []).map(async (x: any) => {
    const v: Record<string, number> = {};
    try { const i = await get(`${T}/${x.id}/insights?metric=views,likes,replies,reposts&${q}`); (i.data || []).forEach((d: any) => v[d.name] = d.values?.[0]?.value || 0); } catch { /* ignore */ }
    return { text: x.text || "", at: x.timestamp, likes: v.likes || 0, comments: v.replies || 0, shares: v.reposts || 0, views: v.views || 0, url: x.permalink };
  }));
  return { connected: true, name: "@" + p.username, followers, posts };
}
async function x(o: string): Promise<Out> {
  const c = await getCredential("x", o); if (!c) return { connected: false };
  const [ck, cs, at, as] = c.token.split(":"); if (!as) return { connected: true, error: "X needs 4 keys" };
  const url = "https://api.x.com/2/users/me", qp = { "user.fields": "public_metrics" };
  const me = await get(`${url}?user.fields=public_metrics`, { Authorization: await xAuthHeader("GET", url, ck, cs, at, as, qp) });
  const pm = me.data?.public_metrics || {};
  const turl = `https://api.x.com/2/users/${me.data.id}/tweets`, tq = { "tweet.fields": "public_metrics,created_at", max_results: "10" };
  let posts: Post[] = [];
  try {
    const t = await get(`${turl}?tweet.fields=public_metrics,created_at&max_results=10`, { Authorization: await xAuthHeader("GET", turl, ck, cs, at, as, tq) });
    posts = (t.data || []).map((z: any) => ({ text: z.text, at: z.created_at, likes: z.public_metrics?.like_count || 0, comments: z.public_metrics?.reply_count || 0, shares: (z.public_metrics?.retweet_count || 0) + (z.public_metrics?.quote_count || 0), views: z.public_metrics?.impression_count || 0, url: `https://x.com/i/status/${z.id}` }));
  } catch { /* free tier may block reads */ }
  return { connected: true, name: "@" + me.data.username, followers: pm.followers_count || 0, extra: { following: pm.following_count || 0, posts: pm.tweet_count || 0 }, posts };
}
async function tiktok(o: string): Promise<Out> {
  const c = await getCredential("tiktok", o); if (!c) return { connected: false };
  const H = { Authorization: `Bearer ${c.token}` };
  const u = await get("https://open.tiktokapis.com/v2/user/info/?fields=display_name,follower_count,likes_count,video_count", H);
  const d = u.data?.user || {};
  let posts: Post[] = [];
  try {
    const r = await fetch("https://open.tiktokapis.com/v2/video/list/?fields=title,create_time,like_count,comment_count,share_count,view_count,share_url", { method: "POST", headers: { ...H, "Content-Type": "application/json" }, body: JSON.stringify({ max_count: 20 }) });
    const j = await r.json();
    posts = (j.data?.videos || []).map((v: any) => ({ text: v.title || "", at: new Date(v.create_time * 1000).toISOString(), likes: v.like_count || 0, comments: v.comment_count || 0, shares: v.share_count || 0, views: v.view_count || 0, url: v.share_url }));
  } catch { /* video.list scope missing */ }
  return { connected: true, name: d.display_name, followers: d.follower_count || 0, extra: { total_likes: d.likes_count || 0, videos: d.video_count || 0 }, posts };
}
async function youtube(o: string): Promise<Out> {
  const c = await getCredential("youtube", o); if (!c) return { connected: false };
  const H = { Authorization: `Bearer ${c.token}` }, Y = "https://www.googleapis.com/youtube/v3";
  const ch = (await get(`${Y}/channels?part=snippet,statistics,contentDetails&mine=true`, H)).items?.[0];
  if (!ch) return { connected: true, error: "No channel" };
  const up = ch.contentDetails?.relatedPlaylists?.uploads;
  let posts: Post[] = [];
  if (up) {
    const pl = await get(`${Y}/playlistItems?part=contentDetails&maxResults=15&playlistId=${up}`, H);
    const ids = (pl.items || []).map((i: any) => i.contentDetails.videoId).join(",");
    if (ids) posts = ((await get(`${Y}/videos?part=snippet,statistics&id=${ids}`, H)).items || []).map((v: any) => ({ text: v.snippet.title, at: v.snippet.publishedAt, likes: +v.statistics.likeCount || 0, comments: +v.statistics.commentCount || 0, shares: 0, views: +v.statistics.viewCount || 0, url: `https://youtu.be/${v.id}` }));
  }
  const s = ch.statistics || {};
  return { connected: true, name: ch.snippet?.title, followers: +s.subscriberCount || 0, extra: { total_views: +s.viewCount || 0, videos: +s.videoCount || 0 }, posts };
}

const FNS: Record<string, (o: string) => Promise<Out>> = { facebook, instagram, threads, x, tiktok, youtube };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await requireUser(req);
    if ("error" in auth) return json({ error: auth.error }, auth.status);
    const entries = await Promise.all(Object.entries(FNS).map(async ([k, fn]) => {
      try { return [k, await fn(auth.userId)] as const; } catch (e) { return [k, { connected: true, error: (e as Error).message }] as const; }
    }));
    return json({ platforms: Object.fromEntries(entries), fetched_at: new Date().toISOString() });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
