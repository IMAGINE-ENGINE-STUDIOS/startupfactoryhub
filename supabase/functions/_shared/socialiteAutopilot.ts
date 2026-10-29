// SOCIALITE Autopilot — evergreen auto-posting.
//
// Each active row in `socialite_autopilot` describes one owner's standing
// order: post to these platforms, at these local times, every day, drawing
// media at random (shuffle-bag: every item once before any repeats) from
// the public `socialite-autopost` bucket under <owner>/<Project>/<file>,
// with captions rotated through the owner's templates + hashtag sets.
//
// Format upgrade: the daily feed slots no longer post only single photos.
// The 3 slots rotate Reel → Carousel → Photo, shifting one slot per day
// (slot i on day d takes FEED_FORMATS[(d + i) % 3]), so every day carries
// one of each and no two days run the same lineup. Carousels group 3–5
// photos from the same project folder; reels are .mp4/.mov files rendered
// by the Reel Factory and uploaded into the same bucket. On top of the
// feed slots, `story_count` (1–4, default 2) Story slots post separately
// at fixed times. If the media a format needs is not in the bucket yet,
// the slot degrades gracefully (reel → carousel → photo) and the row is
// stamped with the format that actually went out (payload.format).
//
// The scheduler calls topUpAutopilots() on every run (pg_cron, 5 min). It
// keeps the next ~36 hours of `socialite_scheduled` rows filled; sending,
// Shield checks, metering and history all happen on the normal send path,
// untouched. Nothing here posts directly.

const BUCKET = "socialite-autopost";
const PUBLIC_BASE = () => `${Deno.env.get("SUPABASE_URL")!}/storage/v1/object/public/${BUCKET}`;

const shuffle = <T>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** Offset (ms) of `tz` from UTC at instant `d` — same method as the client sendTime lib. */
function tzOffset(d: Date, tz: string) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
      .formatToParts(d).map((x) => [x.type, x.value]),
  );
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - d.getTime();
}

/** The UTC instant of wall-clock `hh:mm` on the local date `addDays` from now, in `tz`. */
function slotInstant(hhmm: string, addDays: number, tz: string, now: Date): Date {
  const localNow = new Date(now.getTime() + tzOffset(now, tz));
  const y = localNow.getUTCFullYear(), mo = localNow.getUTCMonth(), d = localNow.getUTCDate() + addDays;
  const [h, mi] = hhmm.split(":").map((n) => parseInt(n, 10) || 0);
  const guess = Date.UTC(y, mo, d, h, mi);
  // Recompute the offset at the guessed instant (DST-safe), then correct once.
  const off = tzOffset(new Date(guess), tz);
  return new Date(guess - off);
}

/** Days since the Unix epoch of the local date of `at` in `tz` — the rotation seed. */
function daySerial(at: Date, tz: string): number {
  const s = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(at); // YYYY-MM-DD in tz
  const [y, m, d] = s.split("-").map((n) => parseInt(n, 10) || 0);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400_000);
}

export type AutopilotFormat = "photo" | "carousel" | "reel" | "story";
/** Feed-slot rotation: slot i on day d posts FEED_FORMATS[(d + i) % 3]. */
const FEED_FORMATS: AutopilotFormat[] = ["reel", "carousel", "photo"];
/** Candidate story times (local); the first `story_count` of them post each day. */
const STORY_TIMES = ["07:00", "12:00", "17:00", "21:00"];
const clampStoryCount = (n: unknown) => Math.min(4, Math.max(1, Math.floor(Number(n) || 2)));

const VIDEO_RE = /\.(mp4|mov)$/i;
const MEDIA_RE = /\.(jpe?g|png|webp|mp4|mov)$/i;
const isVideoKey = (k: string) => VIDEO_RE.test(k);

/** Recursively list every object key under `prefix` in the autopost bucket. */
async function listMedia(db: any, prefix: string): Promise<string[]> {
  const keys: string[] = [];
  const walk = async (path: string) => {
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await db.storage.from(BUCKET).list(path, { limit: 1000, offset });
      if (error || !data?.length) break;
      for (const item of data) {
        const full = path ? `${path}/${item.name}` : item.name;
        if (item.id) keys.push(full);
        else await walk(full);
      }
      if (data.length < 1000) break;
    }
  };
  await walk(prefix);
  return keys.filter((k) => MEDIA_RE.test(k));
}

const projectOf = (key: string, owner: string) => {
  const parts = key.split("/");
  const rel = parts[0] === owner ? parts.slice(1) : parts;
  return rel.length > 1 ? rel[0].replace(/[-_]+/g, " ").trim() : "";
};

const urlOf = (key: string) => `${PUBLIC_BASE()}/${key.split("/").map(encodeURIComponent).join("/")}`;

/** Reconciles a persisted shuffle-bag with the current pool: deleted items
 *  drop out, fresh uploads join the current cycle, used items stay used. */
function syncBag(poolKeys: string[], usedIn: unknown, bagIn: unknown) {
  const inPool = new Set(poolKeys);
  const used: string[] = (Array.isArray(usedIn) ? usedIn : []).filter((k: string) => inPool.has(k));
  const bag: string[] = (Array.isArray(bagIn) ? bagIn : []).filter((k: string) => inPool.has(k) && !used.includes(k));
  for (const k of poolKeys) if (!used.includes(k) && !bag.includes(k)) bag.push(k);
  return { used, bag };
}

export async function topUpAutopilots(db: any) {
  const { data: configs } = await db.from("socialite_autopilot").select("*").eq("active", true);
  for (const cfg of configs ?? []) {
    try { await topUpOne(db, cfg); } catch { /* one owner's autopilot must never break the send loop */ }
  }
}

type Slot = { at: Date; hhmm: string; story: boolean };

async function topUpOne(db: any, cfg: any) {
  const owner = String(cfg.owner_id);
  const platforms: string[] = cfg.platforms ?? [];
  const times: string[] = (cfg.times ?? []).filter((t: string) => /^\d{2}:\d{2}$/.test(t));
  const templates: string[] = (cfg.templates ?? []).filter((t: string) => t?.trim());
  const tagSets: string[] = (cfg.hashtag_sets ?? []).filter((t: string) => t?.trim());
  if (!platforms.length || !times.length || !templates.length) return;
  const tz = cfg.timezone || "America/New_York";
  const storyCount = clampStoryCount(cfg.story_count);
  const now = new Date();
  const horizon = new Date(now.getTime() + 36 * 3600_000);

  // Which slots in [now, horizon] already have a pending autopilot row?
  // Feed rows and story rows cover their own slot families — told apart by
  // payload.format (rows queued before the format upgrade have none: feed).
  const { data: pending } = await db.from("socialite_scheduled")
    .select("send_at, payload").eq("created_by", owner).eq("kind", "post").eq("status", "pending")
    .filter("payload->>autopilot", "eq", "true")
    .gte("send_at", now.toISOString()).lte("send_at", horizon.toISOString());
  const coveredFeed = (pending ?? []).filter((r: any) => r.payload?.format !== "story").map((r: any) => new Date(r.send_at).getTime());
  const coveredStory = (pending ?? []).filter((r: any) => r.payload?.format === "story").map((r: any) => new Date(r.send_at).getTime());

  const feedSlots: Slot[] = [];
  const storySlots: Slot[] = [];
  for (const addDays of [0, 1]) {
    for (const t of times) {
      const at = slotInstant(t, addDays, tz, now);
      if (at > now && at <= horizon) feedSlots.push({ at, hhmm: t, story: false });
    }
    for (const t of STORY_TIMES.slice(0, storyCount)) {
      const at = slotInstant(t, addDays, tz, now);
      if (at > now && at <= horizon) storySlots.push({ at, hhmm: t, story: true });
    }
  }
  // Kickoff: an owner who just switched Autopilot on (empty queue) gets a
  // first post ~10 minutes out instead of waiting for the next daily slot.
  // At most one kickoff per local day, remembered in state.
  const state0: any = { ...(cfg.state ?? {}) };
  const todayKey = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(now);
  if (!coveredFeed.length && !coveredStory.length && state0.kickoffFor !== todayKey) {
    feedSlots.push({ at: new Date(now.getTime() + 10 * 60_000), hhmm: times[0], story: false });
    state0.kickoffFor = todayKey;
    cfg.state = state0;
  }
  const near = (list: number[], at: Date) => list.some((c) => Math.abs(c - at.getTime()) < 4 * 60_000);
  const missing = [
    ...feedSlots.filter((s) => !near(coveredFeed, s.at)),
    ...storySlots.filter((s) => !near(coveredStory, s.at)),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());
  if (!missing.length) return;

  // Media shuffle-bags, persisted on the config row so restarts keep the
  // rotation. Photos keep the original state keys (used/bag); reels get a
  // parallel pair (reelUsed/reelBag). The pools are re-listed every run:
  // uploads added later join the current cycle, deleted files drop out,
  // and every item posts once before any item repeats.
  const state: any = { ...(cfg.state ?? {}) };
  const pool: string[] = await listMedia(db, owner);
  const photoPool = pool.filter((k) => !isVideoKey(k));
  const reelPool = pool.filter(isVideoKey);
  if (!pool.length) return; // no media uploaded yet — nothing to post
  const photos = syncBag(photoPool, state.used, state.bag);
  const reels = syncBag(reelPool, state.reelUsed, state.reelBag);
  state.tidx = state.tidx ?? 0; state.hidx = state.hidx ?? 0;

  const drawFrom = (which: "photo" | "reel"): string | null => {
    const poolK = which === "photo" ? photoPool : reelPool;
    const S = which === "photo" ? photos : reels;
    if (!poolK.length) return null;
    if (!S.bag.length) { S.used = []; S.bag = shuffle(poolK); }
    const key = S.bag.pop();
    if (!key) return null;
    S.used.push(key);
    return key;
  };

  /** 3–5 photos from one project folder, drawn from the photo bag. */
  const drawCarousel = (): string[] | null => {
    const byProject = new Map<string, string[]>();
    for (const k of photos.bag) {
      const pr = projectOf(k, owner) || "Portfolio";
      byProject.set(pr, [...(byProject.get(pr) ?? []), k]);
    }
    const best = [...byProject.values()].filter((a) => a.length >= 3).sort((a, b) => b.length - a.length)[0];
    if (!best) return null;
    const take = best.slice(0, 5);
    const taken = new Set(take);
    photos.bag = photos.bag.filter((k) => !taken.has(k));
    photos.used.push(...take);
    return take;
  };

  for (const slot of missing) {
    let format: AutopilotFormat = "photo";
    let keys: string[] = [];
    if (slot.story) {
      const k = drawFrom("photo"); // stories draw photos: a photo works as a Story on both FB and IG
      if (!k) continue;
      keys = [k]; format = "story";
    } else {
      const slotIdx = Math.max(0, times.indexOf(slot.hhmm));
      const want = FEED_FORMATS[(daySerial(slot.at, tz) + slotIdx) % FEED_FORMATS.length];
      const order = [want, ...FEED_FORMATS.filter((f) => f !== want)];
      for (const f of order) {
        if (f === "reel") { const k = drawFrom("reel"); if (k) { keys = [k]; format = "reel"; break; } }
        else if (f === "carousel") { const c = drawCarousel(); if (c) { keys = c; format = "carousel"; break; } }
        else { const k = drawFrom("photo"); if (k) { keys = [k]; format = "photo"; break; } }
      }
      if (!keys.length) continue; // no media of any kind left for this slot
    }
    const project = projectOf(keys[0], owner);
    const tpl = templates[state.tidx % templates.length]; state.tidx++;
    const tags = tagSets.length ? tagSets[state.hidx % tagSets.length] : ""; state.hidx++;
    // Stories keep the rotated caption text on the row even though neither
    // platform displays it: Shield's duplicate block reads the text, and the
    // Timed sends history stays readable. The publisher ignores it for stories.
    const text = `${tpl.replaceAll("{project}", project || "a Florida backyard")}${tags ? `\n\n${tags}` : ""}`;
    const media = keys.map(urlOf);
    const { error } = await db.from("socialite_scheduled").insert({
      kind: "post", created_by: owner, send_at: slot.at.toISOString(), timezone: tz,
      payload: { text, platforms, media, autopilot: true, format, project },
    });
  }
  state.used = photos.used; state.bag = photos.bag;
  state.reelUsed = reels.used; state.reelBag = reels.bag;
  await db.from("socialite_autopilot").update({ state, updated_at: new Date().toISOString() }).eq("id", cfg.id);
}
