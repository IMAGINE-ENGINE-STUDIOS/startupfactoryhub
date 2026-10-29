/**
 * SOCIALITE Shield UI.
 *  - useShieldPreview(): debounced dry-run check of a draft (posts/messages).
 *  - ShieldNotice: calm warning/blocked cards with "why" and "how to fix".
 *  - shieldFromError(): reads the 422 shield body from an edge function error.
 *  - SocialiteShieldPanel: user's own status, rules and last 30 days.
 *  - SocialiteShieldAdmin: flagged users + decisions + adjustable limits.
 * Rules themselves live server-side in supabase/functions/_shared/socialiteShield.ts.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Finding = { rule: string; message: string; fix: string; severe?: boolean };
export type Shield = { ok: boolean; blocks: Finding[]; warnings: Finding[]; text?: string; status?: string };
const card = "rounded-[18px] border border-zinc-800 bg-[#161617]";
const pill = "px-3 py-1.5 rounded-full text-[12px] font-medium border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-white hover:text-black transition disabled:opacity-40";

export async function shieldFromError(error: any): Promise<Shield | null> {
  try { const j = await error?.context?.json?.(); return j?.shield ?? null; } catch { return null; }
}

export function useShieldPreview(kind: "post" | "email" | "sms" | "whatsapp", draft: { text?: string; subject?: string; platforms?: string[]; recipients?: number; timezone?: string; scheduled?: boolean }, enabled = true) {
  const [res, setRes] = useState<Shield | null>(null);
  const key = JSON.stringify(draft);
  useEffect(() => {
    if (!enabled || !(draft.text || draft.subject)) { setRes(null); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase.functions.invoke("socialite-shield", { body: { action: "preview", kind, ...draft } });
      if (data && Array.isArray(data.blocks)) setRes(data);
    }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, key, enabled]);
  return res;
}

export function ShieldNotice({ shield }: { shield: Shield | null }) {
  if (!shield) return null;
  const warn = shield.warnings.filter(w => w.rule !== "opt_out");
  if (!shield.blocks.length && !warn.length) return null;
  return (
    <div className="space-y-2">
      {shield.blocks.map((b, i) => (
        <div key={"b" + i} className="rounded-xl border border-zinc-600 bg-zinc-900 px-3 py-2">
          <div className="text-[12px] font-semibold text-zinc-100">Shield · can't send: {b.message}</div>
          <div className="text-[11px] text-zinc-400">How to fix: {b.fix}</div>
        </div>
      ))}
      {warn.map((w, i) => (
        <div key={"w" + i} className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2">
          <div className="text-[12px] font-semibold text-amber-200">Shield · heads up: {w.message}</div>
          <div className="text-[11px] text-amber-100/70">How to fix: {w.fix}</div>
        </div>
      ))}
    </div>
  );
}

export function ShieldStatusBanner() {
  const [s, setS] = useState<{ status: string; note: string | null } | null>(null);
  useEffect(() => { supabase.functions.invoke("socialite-shield", { body: { action: "mine" } }).then(({ data }) => data && setS(data)); }, []);
  if (!s || s.status === "normal") return null;
  return (
    <div className="mx-4 lg:mx-8 mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-[13px] text-amber-100">
      {s.status === "suspended" ? "Sending is paused on your account by the SOCIALITE team." : "Your sending limits are reduced for now."}
      {s.note ? ` ${s.note}` : ""} Open Shield to see why.
    </div>
  );
}

export function SocialiteShieldPanel() {
  const [d, setD] = useState<any>(null);
  useEffect(() => { supabase.functions.invoke("socialite-shield", { body: { action: "mine" } }).then(({ data }) => setD(data)); }, []);
  const c = d?.config;
  return (
    <div className="p-4 lg:p-8 space-y-5">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-zinc-100">Shield</h1>
        <p className="text-[13px] text-zinc-500">Rules that keep your accounts safe from platform spam blocks. Every post and send is checked automatically.</p>
      </div>
      <div className={`${card} p-5`}>
        <div className="text-[12px] text-zinc-500">Your status</div>
        <div className="text-[18px] font-semibold text-zinc-100 capitalize">{d?.status ?? "…"}</div>
        {d?.note && <div className="text-[12px] text-zinc-400 mt-1">{d.note}</div>}
      </div>
      {c && (
        <div className={`${card} p-5 grid md:grid-cols-2 gap-4 text-[13px] text-zinc-300`}>
          <div><div className="font-semibold text-zinc-100 mb-1">Posts per day</div>{Object.entries(c.dailyCaps).map(([k, v]) => <div key={k} className="capitalize">{k}: {String(v)}</div>)}<div className="mt-1 text-zinc-500">At least {c.minGapMinutes} min between posts on the same platform. No repeated posts within 24h.</div></div>
          <div><div className="font-semibold text-zinc-100 mb-1">Hashtags per post</div>{Object.entries(c.hashtagCaps).map(([k, v]) => <div key={k} className="capitalize">{k}: {String(v)}</div>)}<div className="mt-1 text-zinc-500">Max {c.maxMentions} @mentions. No link shorteners.</div></div>
          <div><div className="font-semibold text-zinc-100 mb-1">Messages</div><div>Per send: email {c.batchCaps.email}, SMS {c.batchCaps.sms}, WhatsApp {c.batchCaps.whatsapp}</div><div>Per hour: email {c.hourlyCaps.email}, SMS {c.hourlyCaps.sms}, WhatsApp {c.hourlyCaps.whatsapp}</div><div className="text-zinc-500">Texts get "Reply STOP to opt out". No texts {c.quietStart}:00–{c.quietEnd}:00. If over 20% of a send fails, sending pauses 1 hour.</div></div>
          <div><div className="font-semibold text-zinc-100 mb-1">Banned phrases</div><div className="text-zinc-400">{c.bannedPhrases.join(" · ")}</div></div>
        </div>
      )}
      <div className={`${card} p-5`}>
        <div className="font-semibold text-zinc-100 mb-2 text-[14px]">Last 30 days</div>
        {!d?.events?.length ? <div className="text-[13px] text-zinc-500">Nothing to report — all clear.</div> :
          <div className="divide-y divide-zinc-800">{d.events.map((e: any, i: number) => (
            <div key={i} className="py-2 flex justify-between gap-3 text-[13px]">
              <span className={e.level === "block" ? "text-zinc-100" : "text-amber-200"}>{e.level === "block" ? "Stopped" : e.level === "notice" ? "Notice" : "Warning"} · {e.message}</span>
              <span className="text-zinc-500 shrink-0">{new Date(e.created_at).toLocaleString()}</span>
            </div>))}</div>}
      </div>
    </div>
  );
}

export function SocialiteShieldAdmin() {
  const [d, setD] = useState<any>(null);
  const [busy, setBusy] = useState("");
  const [cfg, setCfg] = useState("");
  const load = () => supabase.functions.invoke("socialite-shield", { body: { action: "flags" } }).then(({ data }) => { setD(data); if (data?.config) setCfg(JSON.stringify(data.config, null, 2)); });
  useEffect(() => { load(); }, []);
  const decide = async (f: any, decision: string) => {
    const note = decision === "warn" || decision === "suspend" || decision === "restrict" ? prompt("Note for the user (optional)") ?? undefined : undefined;
    setBusy(f.id); await supabase.functions.invoke("socialite-shield", { body: { action: "decide", flag_id: f.id, owner_id: f.owner_id, decision, note } }); setBusy(""); load();
  };
  const save = async () => {
    try { const config = JSON.parse(cfg); setBusy("cfg"); await supabase.functions.invoke("socialite-shield", { body: { action: "rules", config } }); setBusy(""); load(); }
    catch { alert("The rules text isn't valid. Check commas and quotes."); }
  };
  return (
    <div className="space-y-5">
      <div className={`${card} p-5`}>
        <div className="font-semibold text-zinc-100 text-[14px] mb-3">Flagged users</div>
        {!d ? <div className="text-[13px] text-zinc-500">Loading…</div> : !d.flags?.length ? <div className="text-[13px] text-zinc-500">No flags. Everyone is following the rules.</div> :
          <div className="space-y-3">{d.flags.map((f: any) => (
            <div key={f.id} className="rounded-xl border border-zinc-800 p-3 space-y-2">
              <div className="flex flex-wrap justify-between gap-2">
                <div className="text-[13px] text-zinc-100 font-medium">{f.user?.email ?? f.owner_id} <span className="text-zinc-500 font-normal">· {f.severity} · {f.block_count} blocks · now {f.user_status}</span></div>
                <div className="text-[12px] text-zinc-500">{new Date(f.created_at).toLocaleString()} · {f.status}{f.decision ? ` (${f.decision})` : ""}</div>
              </div>
              <div className="text-[12px] text-zinc-400">{f.reason}</div>
              {f.recent?.length > 0 && <ul className="text-[11px] text-zinc-500 list-disc pl-4">{f.recent.map((e: any, i: number) => <li key={i}>{e.action}: {e.message}</li>)}</ul>}
              <div className="flex flex-wrap gap-1.5">
                {["dismiss", "warn", "restrict", "suspend", "restore"].map(k => <button key={k} disabled={busy === f.id} onClick={() => decide(f, k)} className={pill}>{k[0].toUpperCase() + k.slice(1)}</button>)}
              </div>
            </div>))}</div>}
      </div>
      <div className={`${card} p-5 space-y-2`}>
        <div className="font-semibold text-zinc-100 text-[14px]">Rule settings</div>
        <p className="text-[12px] text-zinc-500">Change limits, banned phrases, or set "enabled": false to turn Shield off. Applies to the app, schedules and the API.</p>
        <textarea value={cfg} onChange={e => setCfg(e.target.value)} rows={14} className="w-full rounded-xl bg-zinc-950 border border-zinc-800 p-3 font-mono text-[12px] text-zinc-200" />
        <button onClick={save} disabled={busy === "cfg"} className={pill}>Save rules</button>
      </div>
    </div>
  );
}
