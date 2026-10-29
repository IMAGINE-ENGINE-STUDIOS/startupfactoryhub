/** Autopilot — evergreen auto-posting for SOCIALITE.
 *  Standing order: every day, at the chosen local times, post from the
 *  owner's media library (a shuffle-bag: every item once before any repeats)
 *  to the chosen platforms, with captions rotated from templates. The feed
 *  slots rotate Reel → Carousel → Photo (shifting one slot per day), and
 *  1–4 Stories a day post on top. Reels are .mp4 files rendered by the
 *  Reel Factory and uploaded into the same library.
 *  Photos live in the public `socialite-autopost` bucket under
 *  <uid>/<Project>/<file>; uploads are downscaled in the browser first.
 *  The server scheduler (socialite-scheduler, every 5 min) keeps the queue
 *  filled and sends on the normal path — this page can stay closed. */
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import TimezoneSelect from "./TimezoneSelect";
import { getSavedTz } from "@/lib/socialite/sendTime";

const BUCKET = "socialite-autopost";

export const DEFAULT_TEMPLATES = [
  "From dirt to dive-in ready. {project} — designed and built by Startup Factory Hub. DM us for a free design consult.",
  "Same yard. Completely different life. {project}, a Startup Factory Hub backyard. Your staycation starts at home — free consult, link in bio.",
  "Your backyard, but better. {project} by Startup Factory Hub. Comment 'POOL' and we'll send ideas for yours.",
  "Florida lives outside. Build for it. {project} — another Startup Factory Hub build in Central Florida. Save this for your backyard mood board.",
  "Plot twist: it's your backyard. {project}, designed and built by Startup Factory Hub. Tag who you'd invite first.",
  "Pool Build Diary: the details nobody sees once the water's in — the steel, the plumbing, the finish work. {project} by Startup Factory Hub. Follow along for the next stage.",
  "3 things nobody tells you before building a pool in Florida: permits and HOA approval take time, a screen enclosure changes your whole budget picture, and hurricane season shapes the schedule. We handle all of it. {project} — Startup Factory Hub. DM us for a free design consult.",
  "Why they chose us, in one frame: honest numbers, a design that fits the home, and a crew that treats the yard like their own. {project} — Startup Factory Hub.",
  "What a real Florida pool project includes: design, permitting, dig, steel, plumbing, shell, finish, and the first swim. {project} by Startup Factory Hub — this is what the journey looks like. Free consult at startupfactoryhub.com",
  "Orlando summers were made for this. {project} — built for sunshine, designed for you, by Startup Factory Hub. Comment 'POOL' and we'll send ideas.",
  "Golden hour at {project}. Built for cannonballs, cocktails, and quiet mornings alike — Startup Factory Hub. Your turn: free design consult, link in bio.",
  "Where summer never ends. {project}, a Startup Factory Hub backyard in Central Florida. Dig it. Dream it. Dive in. Start at startupfactoryhub.com",
];

export const DEFAULT_TAGSETS = [
  "#CentralFloridaPools #OrlandoPoolBuilder #FloridaBackyard #PoolBuild #BackyardGoals #LakelandFL #WinterHavenFL #StartupFactoryHub",
  "#CentralFloridaPools #OrlandoPoolBuilder #FloridaBackyard #BackyardGoals #LuxuryPools #PoolDesign #StartupFactoryHub #Staycation",
  "#PoolBuild #FloridaBackyard #OrlandoPoolBuilder #CentralFloridaPools #OutdoorLiving #DreamBackyard #StartupFactoryHub #PoolGoals",
];

type Cfg = {
  active: boolean;
  platforms: string[];
  times: string[];
  timezone: string;
  templates: string[];
  hashtag_sets: string[];
  story_count: number;
};

const clampStoryCount = (n: unknown) => Math.min(4, Math.max(1, Math.floor(Number(n) || 2)));

/** Feed formats rotate one slot per day: slot i on day d is FEED_FORMATS[(d + i) % 3] — mirrors _shared/socialiteAutopilot.ts. */
const FEED_FORMATS = ["Reel", "Carousel", "Photo"] as const;
const STORY_TIMES = ["07:00", "12:00", "17:00", "21:00"];
const daySerialIn = (tz: string) => {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date()).split("-").map(Number);
    return Math.floor(Date.UTC(parts[0], parts[1] - 1, parts[2]) / 86400000);
  } catch { return Math.floor(Date.now() / 86400000); }
};

const sanitizeFolder = (s: string) =>
  (s || "Portfolio").replace(/[^\w &'-]+/g, "").replace(/\s+/g, " ").trim() || "Portfolio";

async function downscale(file: File): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp)$/i.test(file.type) || file.size < 900_000) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1920 / Math.max(bmp.width, bmp.height));
    if (scale >= 1) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.82));
    return blob ?? file;
  } catch {
    return file;
  }
}

export default function SocialiteAutopilot() {
  const [uid, setUid] = useState<string | null>(null);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [cfg, setCfg] = useState<Cfg>({
    active: false,
    platforms: ["facebook", "instagram"],
    times: ["07:00", "12:30", "18:30"],
    timezone: getSavedTz(),
    templates: DEFAULT_TEMPLATES,
    hashtag_sets: DEFAULT_TAGSETS,
    story_count: 2,
  });
  const [mediaCount, setMediaCount] = useState<number | null>(null);
  const [reelCount, setReelCount] = useState<number | null>(null);
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);

  const countMedia = useCallback(async (owner: string) => {
    let count = 0, reels = 0;
    const walk = async (path: string) => {
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await (supabase as any).storage.from(BUCKET).list(path, { limit: 1000, offset });
        if (error || !data?.length) break;
        for (const item of data) {
          if (item.id) {
            if (/\.(jpe?g|png|webp)$/i.test(item.name)) count++;
            else if (/\.(mp4|mov)$/i.test(item.name)) reels++;
          }
          else await walk(`${path}/${item.name}`);
        }
        if (data.length < 1000) break;
      }
    };
    await walk(owner);
    setMediaCount(count);
    setReelCount(reels);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const id = u?.user?.id ?? null;
      setUid(id);
      if (!id) return;
      const { data, error } = await (supabase as any).from("socialite_autopilot").select("*").eq("owner_id", id).maybeSingle();
      if (error) { setSetupNeeded(true); return; }
      if (data) {
        setCfg({
          active: !!data.active,
          platforms: data.platforms ?? ["facebook", "instagram"],
          times: data.times ?? ["07:00", "12:30", "18:30"],
          timezone: data.timezone ?? getSavedTz(),
          templates: data.templates?.length ? data.templates : DEFAULT_TEMPLATES,
          hashtag_sets: data.hashtag_sets?.length ? data.hashtag_sets : DEFAULT_TAGSETS,
          story_count: clampStoryCount(data.story_count),
        });
      }
      countMedia(id);
    })();
  }, [countMedia]);

  const upload = async (files: FileList | null) => {
    if (!files?.length || !uid) return;
    const list = Array.from(files).filter((f) => /^image\//i.test(f.type) || /^video\/(mp4|quicktime|webm)$/i.test(f.type));
    if (!list.length) { setNote("No image or video files in that selection."); return; }
    let done = 0, failed = 0;
    for (const f of list) {
      setBusy(`Uploading ${done + 1} of ${list.length}…`);
      const rel = (f as any).webkitRelativePath as string | undefined;
      const folder = sanitizeFolder(rel && rel.includes("/") ? rel.split("/")[0] : "Portfolio");
      const isVideo = /^video\//i.test(f.type);
      const stem = f.name.replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-").slice(0, 60) || (isVideo ? "reel" : "photo");
      // Photos are downscaled to posting size; reels upload exactly as rendered.
      const blob = isVideo ? f : await downscale(f);
      const ext = isVideo ? (f.name.match(/\.(mp4|mov|webm)$/i)?.[1].toLowerCase() ?? "mp4") : "jpg";
      const contentType = isVideo ? f.type : "image/jpeg";
      const key = (suffix = "") => `${uid}/${folder}/${stem}${suffix}.${ext}`;
      const { error } = await (supabase as any).storage.from(BUCKET)
        .upload(key(), blob, { contentType, upsert: false });
      if (error) {
        const retry = await (supabase as any).storage.from(BUCKET)
          .upload(key(`-${Date.now()}`), blob, { contentType, upsert: false });
        retry.error ? failed++ : done++;
      } else done++;
    }
    setBusy("");
    setNote(`Uploaded ${done} file${done === 1 ? "" : "s"}${failed ? `, ${failed} failed` : ""}. New media joins the rotation automatically.`);
    countMedia(uid);
  };

  const save = async () => {
    if (!uid) return;
    setBusy("Saving…");
    const { error } = await (supabase as any).from("socialite_autopilot").upsert({
      owner_id: uid,
      active: cfg.active,
      platforms: cfg.platforms,
      times: cfg.times.filter(Boolean),
      timezone: cfg.timezone,
      templates: cfg.templates.filter((t) => t.trim()),
      hashtag_sets: cfg.hashtag_sets.filter((t) => t.trim()),
      story_count: clampStoryCount(cfg.story_count),
      updated_at: new Date().toISOString(),
    }, { onConflict: "owner_id" });
    setBusy("");
    setNote(error ? `Could not save: ${error.message}` : cfg.active ? "Autopilot is ON. Your next posts are being queued — see Timed sends below." : "Saved. Autopilot is off.");
  };

  if (setupNeeded) {
    return (
      <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 text-[13px] text-amber-200">
        Autopilot setup is one step away: the <span className="mono">socialite_autopilot</span> table is not in this database yet.
        Run the migration <span className="mono">supabase/migrations/20261019180000_a1b2c3d4-autopilot.sql</span> (in the repo) in the Supabase SQL editor, then reload this page.
      </div>
    );
  }

  const togglePlatform = (p: string) =>
    setCfg((c) => ({ ...c, platforms: c.platforms.includes(p) ? c.platforms.filter((x) => x !== p) : [...c.platforms, p] }));

  return (
    <div className="rounded-2xl border border-zinc-800 p-5 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-zinc-100">Autopilot — daily portfolio posts</h3>
          <p className="text-[12.5px] text-zinc-500 max-w-[560px]">
            Posts your portfolio to Facebook and Instagram every day at your times — randomized,
            every item once before any repeats, captions rotated for you. Runs on the server with this page closed.
          </p>
        </div>
        <button
          onClick={() => setCfg((c) => ({ ...c, active: !c.active }))}
          aria-pressed={cfg.active}
          className={`px-4 py-2 rounded-full text-[12.5px] font-semibold ${cfg.active ? "bg-emerald-500 text-emerald-950" : "bg-zinc-800 text-zinc-300"}`}
        >
          {cfg.active ? "ON" : "OFF"}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["facebook", "instagram"] as const).map((p) => (
          <button key={p} onClick={() => togglePlatform(p)} aria-pressed={cfg.platforms.includes(p)}
            className={`px-3.5 py-2 rounded-full text-[12.5px] capitalize ${cfg.platforms.includes(p) ? "bg-zinc-100 text-zinc-900" : "bg-zinc-900 text-zinc-400 border border-zinc-800"}`}>
            {p}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-zinc-800" />
        {cfg.times.map((t, i) => (
          <input key={i} type="time" value={t} aria-label={`Post time ${i + 1}`}
            onChange={(e) => setCfg((c) => ({ ...c, times: c.times.map((x, j) => (j === i ? e.target.value : x)) }))}
            className="bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1.5 text-[12.5px] text-zinc-200" />
        ))}
        <TimezoneSelect value={cfg.timezone} onChange={(tz) => setCfg((c) => ({ ...c, timezone: tz }))} />
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[13px] text-zinc-300">Daily format mix</div>
            <p className="text-[11.5px] text-zinc-500 max-w-[560px]">
              Your {cfg.times.length} feed slots rotate Reel → Carousel → Photo, shifting one slot every day.
              Today: {cfg.times.map((t, i) => `${FEED_FORMATS[(daySerialIn(cfg.timezone) + i) % 3]} ${t}`).join(" · ")}.
              Carousels group 3–5 photos from one project; a slot falls back to a photo until reels are in the library.
            </p>
          </div>
          <label className="flex items-center gap-2 text-[12.5px] text-zinc-400">
            Stories per day
            <input type="number" min={1} max={4} step={1} value={cfg.story_count} aria-label="Stories per day"
              onChange={(e) => setCfg((c) => ({ ...c, story_count: clampStoryCount(e.target.value) }))}
              className="w-16 bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1.5 text-[12.5px] text-zinc-200" />
          </label>
        </div>
        <p className="text-[11.5px] text-zinc-500">Stories post at {STORY_TIMES.slice(0, clampStoryCount(cfg.story_count)).join(", ")} — the first {clampStoryCount(cfg.story_count)} of 07:00, 12:00, 17:00, 21:00.</p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-[13px] text-zinc-300">
            Media library: <span className="font-semibold text-zinc-100">{mediaCount === null ? "…" : mediaCount}</span> photos
            · <span className="font-semibold text-zinc-100">{reelCount === null ? "…" : reelCount}</span> reels
            <span className="text-zinc-500"> — uploaded once, posted in random order. Project folder names appear in captions. Reels (.mp4) upload as rendered.</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => fileRef.current?.click()} className="px-3.5 py-2 rounded-full bg-zinc-100 text-zinc-900 text-[12.5px] font-semibold">Add photos</button>
            <button onClick={() => folderRef.current?.click()} className="px-3.5 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-[12.5px]">Add a project folder</button>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*,video/mp4,video/quicktime,video/webm" multiple className="hidden" onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
        <input ref={folderRef} type="file" accept="image/*,video/mp4,video/quicktime,video/webm" multiple className="hidden"
          {...({ webkitdirectory: "" } as any)}
          onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
        <p className="text-[11.5px] text-zinc-500">Tip: use “Add a project folder” with a folder named after the project (e.g. “The Solstice”) — big photos are shrunk to posting size automatically before upload.</p>
      </div>

      <details className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <summary className="text-[13px] text-zinc-300 cursor-pointer">Captions & hashtags (rotated automatically)</summary>
        <div className="mt-3 space-y-3">
          <label className="block text-[11.5px] text-zinc-500">One caption per line. {"{project}"} becomes the photo's project folder name.</label>
          <textarea value={cfg.templates.join("\n")} rows={8} onChange={(e) => setCfg((c) => ({ ...c, templates: e.target.value.split("\n") }))}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-[12.5px] text-zinc-200" />
          <label className="block text-[11.5px] text-zinc-500">One hashtag set per line.</label>
          <textarea value={cfg.hashtag_sets.join("\n")} rows={3} onChange={(e) => setCfg((c) => ({ ...c, hashtag_sets: e.target.value.split("\n") }))}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-[12.5px] text-zinc-200" />
        </div>
      </details>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={!!busy} className="px-5 py-2.5 rounded-full bg-zinc-100 text-zinc-900 text-[13px] font-semibold disabled:opacity-50">
          {busy || "Save autopilot"}
        </button>
        {note && <span className="text-[12.5px] text-zinc-400">{note}</span>}
      </div>
    </div>
  );
}
