// SOCIALITE Shield — one rule engine that keeps every post/send inside the
// platforms' anti-spam rules so our Meta/X/TikTok/YouTube/Threads/Twilio/Resend
// accounts never get blocked. Used by socialite-publish, socialite-send,
// socialite-scheduler, socialite-api and socialite-shield (preview).
//   check()   → { ok, blocks[], warnings[], text } (text may get STOP appended)
//   record()  → logs a successful action (feeds caps / duplicate detection)
//   failSpike → pauses a user for 1h when >20% of a send fails
// Blocks are logged to socialite_shield_events; repeat/severe ones raise a
// socialite_shield_flags row for the admin to decide. Config overrides live in
// socialite_shield_rules (id=1).config and merge over DEFAULTS.
import { admin } from "./socialiteVault.ts";

export type ShieldAction = "post" | "email" | "sms" | "whatsapp";
export type Finding = { rule: string; message: string; fix: string; severe?: boolean };
export type ShieldResult = { ok: boolean; blocks: Finding[]; warnings: Finding[]; text: string; status: string };

export const DEFAULTS = {
  enabled: true,
  dailyCaps: { instagram: 25, facebook: 25, x: 50, threads: 50, tiktok: 15, youtube: 6, linkedin: 20 } as Record<string, number>,
  minGapMinutes: 10,
  hashtagCaps: { instagram: 30, x: 5, tiktok: 10, threads: 10, facebook: 10, youtube: 15, linkedin: 5 } as Record<string, number>,
  maxMentions: 10,
  batchCaps: { email: 200, sms: 100, whatsapp: 100 } as Record<string, number>,
  hourlyCaps: { email: 500, sms: 200, whatsapp: 200 } as Record<string, number>,
  quietStart: 21, quietEnd: 8,
  flagAfterBlocks: 3,
  bannedPhrases: [
    "guaranteed income", "get rich quick", "make money fast", "double your money", "free crypto", "crypto giveaway",
    "send bitcoin", "buy followers", "free followers", "buy likes", "100% guaranteed", "risk free investment",
    "miracle cure", "lose 30 pounds", "act now or lose", "click here to claim", "you have won", "wire transfer now",
    "xxx", "escort", "buy guns", "fake reviews",
  ],
  shorteners: ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly", "cutt.ly", "rb.gy"],
};
export type ShieldConfig = typeof DEFAULTS;

export async function loadConfig(): Promise<ShieldConfig> {
  const { data } = await admin().from("socialite_shield_rules").select("config").eq("id", 1).maybeSingle();
  const c = (data?.config ?? {}) as Partial<ShieldConfig>;
  return { ...DEFAULTS, ...c, dailyCaps: { ...DEFAULTS.dailyCaps, ...(c.dailyCaps ?? {}) }, hashtagCaps: { ...DEFAULTS.hashtagCaps, ...(c.hashtagCaps ?? {}) }, batchCaps: { ...DEFAULTS.batchCaps, ...(c.batchCaps ?? {}) }, hourlyCaps: { ...DEFAULTS.hourlyCaps, ...(c.hourlyCaps ?? {}) } };
}

const norm = (s: string) => s.toLowerCase().replace(/https?:\/\/\S+/g, "").replace(/[^a-z0-9]+/g, " ").trim();
async function hash(s: string) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(norm(s)));
  return Array.from(new Uint8Array(b)).slice(0, 12).map((x) => x.toString(16).padStart(2, "0")).join("");
}
const hourIn = (tz: string) => { try { return Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: tz }).format(new Date())) % 24; } catch { return -1; } };

/** Rules shown to Genius so drafts already comply. */
export function rulesForGenius(c: ShieldConfig = DEFAULTS) {
  return `PLATFORM SAFETY RULES (always obey): never use these phrases: ${c.bannedPhrases.join(", ")}. Hashtag limits: ${Object.entries(c.hashtagCaps).map(([k, v]) => `${k} ${v}`).join(", ")}. Max ${c.maxMentions} @mentions. No link shorteners. No misleading claims, giveaways for follows, adult or weapon content. Every post must be original (no repeats). SMS/WhatsApp must end with "Reply STOP to opt out". No ALL-CAPS subjects.`;
}

export async function check(owner: string, isAdmin: boolean, action: ShieldAction, p: { text?: string; subject?: string; platforms?: string[]; recipients?: number; timezone?: string; scheduled?: boolean }): Promise<ShieldResult> {
  const c = await loadConfig();
  const db = admin();
  let text = String(p.text ?? "");
  const blocks: Finding[] = [], warnings: Finding[] = [];
  const { data: st } = await db.from("socialite_shield_status").select("status, note").eq("owner_id", owner).maybeSingle();
  const status = st?.status ?? "normal";
  if (!c.enabled) return { ok: true, blocks, warnings, text, status };
  if (status === "suspended") blocks.push({ rule: "suspended", message: "Sending is paused on your account by the SOCIALITE team." + (st?.note ? ` Note: ${st.note}` : ""), fix: "Contact support to restore sending." });
  const factor = status === "restricted" ? 0.5 : 1;
  const low = ` ${(text + " " + (p.subject ?? "")).toLowerCase()} `;

  for (const ph of c.bannedPhrases) if (ph && low.includes(ph.toLowerCase())) blocks.push({ rule: "banned_phrase", message: `Banned phrase: "${ph}".`, fix: "Remove or reword it — platforms treat it as spam.", severe: true });
  const links = text.match(/https?:\/\/[^\s]+/g) ?? [];
  if (links.some((l) => c.shorteners.some((s) => l.includes(`//${s}`) || l.includes(`.${s}`)))) blocks.push({ rule: "shortener", message: "Link shorteners are not allowed.", fix: "Use the full website link instead." });
  if (links.length && !norm(text)) warnings.push({ rule: "links_only", message: "This message is only a link.", fix: "Add a sentence explaining the link." });
  if (links.length > 3) warnings.push({ rule: "many_links", message: `${links.length} links in one message.`, fix: "Keep it to 1–2 links." });

  // Fail spike pause (set by failSpike()).
  const { count: paused } = await db.from("socialite_shield_events").select("id", { count: "exact", head: true }).eq("owner_id", owner).eq("rule", "fail_spike").gte("created_at", new Date(Date.now() - 3600_000).toISOString());
  if (paused) blocks.push({ rule: "fail_spike", message: "Your last send had many failed recipients, so sending is paused for 1 hour.", fix: "Clean your contact list (remove bad numbers/emails) and try again later." });

  const since24 = new Date(Date.now() - 86400_000).toISOString();
  const { data: recent } = await db.from("socialite_shield_events").select("action, details, created_at").eq("owner_id", owner).eq("level", "sent").gte("created_at", since24).order("created_at", { ascending: false }).limit(1000);
  const h = await hash(text);

  if (action === "post") {
    const tags = (text.match(/(^|\s)#[\p{L}\p{N}_]+/gu) ?? []).length;
    const mentions = (text.match(/(^|\s)@[\w.]+/g) ?? []).length;
    if (mentions > c.maxMentions) blocks.push({ rule: "mentions", message: `${mentions} @mentions (max ${c.maxMentions}).`, fix: "Tag fewer accounts — mass tagging is flagged as spam." });
    for (const pl of p.platforms ?? []) {
      const cap = Math.floor((c.dailyCaps[pl] ?? 25) * factor);
      const mine = (recent ?? []).filter((r: any) => r.action === "post" && (r.details?.platforms ?? []).includes(pl));
      if (!p.scheduled && mine.length >= cap) blocks.push({ rule: "daily_cap", message: `Daily ${pl} limit reached (${cap} posts).`, fix: "Schedule it for tomorrow." });
      if (!p.scheduled && mine[0] && Date.now() - new Date(mine[0].created_at).getTime() < c.minGapMinutes * 60_000) blocks.push({ rule: "min_gap", message: `You posted to ${pl} less than ${c.minGapMinutes} minutes ago.`, fix: `Wait ${c.minGapMinutes} minutes or schedule it.` });
      if (text && mine.some((r: any) => r.details?.hash === h)) blocks.push({ rule: "duplicate", message: `Same post already went to ${pl} in the last 24 hours.`, fix: "Change the wording — repeated posts get accounts blocked.", severe: (p.platforms ?? []).length > 2 });
      const hc = c.hashtagCaps[pl];
      if (hc && tags > hc) (pl === "instagram" ? blocks : warnings).push({ rule: "hashtags", message: `${tags} hashtags is over the ${pl} limit (${hc}).`, fix: `Use ${hc} or fewer.` });
    }
  } else {
    const n = p.recipients ?? 0;
    const batch = Math.floor((c.batchCaps[action] ?? 100) * factor);
    if (n > batch) blocks.push({ rule: "batch_cap", message: `${n} recipients is over the ${action} batch limit (${batch}).`, fix: "Split the list or schedule batches an hour apart." });
    const hour = Date.now() - 3600_000;
    const lastHour = (recent ?? []).filter((r: any) => r.action === action && new Date(r.created_at).getTime() > hour).reduce((s: number, r: any) => s + Number(r.details?.recipients ?? 0), 0);
    const hcap = Math.floor((c.hourlyCaps[action] ?? 200) * factor);
    if (!p.scheduled && lastHour + n > hcap) blocks.push({ rule: "hourly_cap", message: `Hourly ${action} limit (${hcap}) would be passed.`, fix: "Schedule it for later." });
    if ((recent ?? []).some((r: any) => r.action === action && r.details?.hash === h && Number(r.details?.recipients ?? 0) >= 20)) warnings.push({ rule: "duplicate", message: "You already sent this exact message today.", fix: "Personalize it so filters don't mark it as spam." });
    if (action === "email") {
      const subj = String(p.subject ?? "");
      if (subj.length > 6 && subj === subj.toUpperCase() && /[A-Z]/.test(subj)) warnings.push({ rule: "caps_subject", message: "Subject is all capital letters.", fix: "Write it in normal case." });
      if ((subj.match(/!/g) ?? []).length > 2) warnings.push({ rule: "exclaim", message: "Too many exclamation marks in the subject.", fix: "Use one at most." });
    } else {
      if (!/\bstop\b/i.test(text)) { text = `${text}\nReply STOP to opt out`; warnings.push({ rule: "opt_out", message: "Added \"Reply STOP to opt out\" — carriers require it.", fix: "Nothing to do." }); }
      if (p.timezone) { const hr = hourIn(p.timezone); if (!p.scheduled && hr >= 0 && (hr >= c.quietStart || hr < c.quietEnd)) blocks.push({ rule: "quiet_hours", message: `It's quiet hours (${c.quietStart}:00–${c.quietEnd}:00) in ${p.timezone}.`, fix: `Schedule it after ${c.quietEnd}:00 AM.` }); }
    }
  }
  if (isAdmin) for (const b of blocks.filter((x) => x.rule === "suspended")) blocks.splice(blocks.indexOf(b), 1);
  return { ok: blocks.length === 0, blocks, warnings, text, status };
}

/** Logs blocks/warnings and raises an admin flag when needed. */
export async function report(owner: string, isAdmin: boolean, action: ShieldAction, r: ShieldResult, via = "app") {
  const db = admin();
  const rows = [...r.blocks.map((f) => ({ ...f, level: "block" })), ...r.warnings.filter((w) => w.rule !== "opt_out").map((f) => ({ ...f, level: "warning" }))];
  if (!rows.length) return;
  await db.from("socialite_shield_events").insert(rows.map((f) => ({ owner_id: owner, action, level: f.level, rule: f.rule, message: f.message, details: { via } })));
  if (isAdmin || !r.blocks.length) return;
  const { count } = await db.from("socialite_shield_events").select("id", { count: "exact", head: true }).eq("owner_id", owner).eq("level", "block").gte("created_at", new Date(Date.now() - 86400_000).toISOString());
  const c = await loadConfig();
  const severe = r.blocks.some((b) => b.severe);
  if (!severe && (count ?? 0) < c.flagAfterBlocks) return;
  const reason = r.blocks.map((b) => b.message).join(" · ").slice(0, 500);
  const { data: open } = await db.from("socialite_shield_flags").select("id, block_count").eq("owner_id", owner).eq("status", "open").maybeSingle();
  if (open) await db.from("socialite_shield_flags").update({ block_count: (open.block_count ?? 1) + 1, reason, severity: severe ? "high" : "medium" }).eq("id", open.id);
  else {
    await db.from("socialite_shield_flags").insert({ owner_id: owner, reason, severity: severe ? "high" : "medium", block_count: count ?? 1 });
    const { data: admins } = await db.from("user_roles").select("user_id").eq("role", "admin");
    if (admins?.length) await db.from("notifications").insert(admins.map((a: any) => ({ recipient_id: a.user_id, recipient_type: "admin", title: "SOCIALITE Shield flag", message: `A user was flagged: ${reason.slice(0, 160)}`, type: "warning", related_entity_type: "socialite_shield_flag" }))).then(() => {}, () => {});
  }
}

/** Records a successful action so caps and duplicate checks can count it. */
export async function record(owner: string, action: ShieldAction, p: { text?: string; platforms?: string[]; recipients?: number }) {
  await admin().from("socialite_shield_events").insert({ owner_id: owner, action, level: "sent", rule: "sent", message: "ok", details: { platforms: p.platforms ?? [], recipients: p.recipients ?? 0, hash: await hash(String(p.text ?? "")) } });
}

/** Pauses a user's sending for 1 hour when a send fails a lot. */
export async function failSpike(owner: string, action: ShieldAction, sent: number, failed: number) {
  const total = sent + failed;
  if (total >= 5 && failed / total > 0.2) await admin().from("socialite_shield_events").insert({ owner_id: owner, action, level: "block", rule: "fail_spike", message: `${failed} of ${total} recipients failed — sending paused 1 hour.`, details: { sent, failed } });
}

/** Convenience: check + report. Returns the result. */
export async function guard(owner: string, isAdmin: boolean, action: ShieldAction, p: Parameters<typeof check>[3], via = "app") {
  const r = await check(owner, isAdmin, action, p);
  await report(owner, isAdmin, action, r, via);
  return r;
}
