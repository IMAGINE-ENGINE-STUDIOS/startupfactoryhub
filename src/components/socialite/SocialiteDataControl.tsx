/**
 * SOCIALITE → Data Control (every user, own data only; RLS enforces it).
 * Export everything (browser + cloud), clear this browser, delete contacts,
 * cancel waiting sends, remove connected social keys, and a full reset.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;
const card = "rounded-[18px] border border-zinc-800 bg-[#161617] p-5";
const btn = "px-4 py-2 rounded-full text-[12px] font-semibold transition disabled:opacity-40 shrink-0";
const localKeys = () => Object.keys(localStorage).filter((k) => k.startsWith("pf_"));

export default function SocialiteDataControl({ isOwner, toast, onLocalCleared }: { isOwner: boolean; toast: (m: string, t?: "success" | "error") => void; onLocalCleared: () => void }) {
  const [uid, setUid] = useState<string | null>(null);
  const [counts, setCounts] = useState({ contacts: 0, waiting: 0, keys: 0, usage: 0 });
  const [busy, setBusy] = useState("");

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    const id = u.user?.id ?? null; setUid(id);
    if (!id) return;
    const [c, w, k, us] = await Promise.all([
      db.from("socialite_contacts").select("id", { count: "exact", head: true }).eq("owner_id", id),
      db.from("socialite_scheduled").select("id", { count: "exact", head: true }).eq("created_by", id).eq("status", "pending"),
      supabase.functions.invoke("socialite-credentials", { body: { action: "status" } }),
      db.from("socialite_usage").select("id", { count: "exact", head: true }).eq("user_id", id),
    ]);
    const keys = ((k.data as any)?.accounts ?? []).length;
    setCounts({ contacts: c.count ?? 0, waiting: w.count ?? 0, keys, usage: us.count ?? 0 });
  };
  useEffect(() => { load(); }, []);

  const act = async (key: string, question: string, fn: () => Promise<void>, done: string) => {
    if (question && !confirm(question)) return;
    setBusy(key);
    try { await fn(); toast(done); await load(); } catch (e) { toast((e as Error).message, "error"); } finally { setBusy(""); }
  };

  const exportAll = () => act("export", "", async () => {
    const local = Object.fromEntries(localKeys().filter((k) => !k.endsWith("_token")).map((k) => [k, localStorage.getItem(k)]));
    const [contacts, scheduled, usage, ledger, sub] = await Promise.all([
      db.from("socialite_contacts").select("*").eq("owner_id", uid),
      db.from("socialite_scheduled").select("*").eq("created_by", uid).limit(5000),
      db.from("socialite_usage").select("*").eq("user_id", uid).limit(10000),
      db.from("socialite_credit_ledger").select("*").eq("user_id", uid),
      db.from("socialite_subscriptions").select("plan_id,status,trial_ends_at,current_period_end,ai_addon").eq("user_id", uid).maybeSingle(),
    ]);
    const data = { exportedAt: new Date().toISOString(), browser: local, contacts: contacts.data, scheduled: scheduled.data, usage: usage.data, credits: ledger.data, subscription: sub.data, note: "Social media keys are never exported." };
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    a.download = `socialite-export-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }, "Your data was downloaded");

  const items = [
    { k: "export", title: "Download all my data", desc: "Posts, settings, contacts, timed sends, usage and credit history as one file", label: "Download", run: exportAll, primary: true },
    { k: "cache", title: "Clear this browser", desc: `Removes SOCIALITE's saved copy on this computer (${localKeys().length} items). Your cloud data stays.${isOwner ? " Your posts and settings reload from the cloud." : ""}`, label: "Clear",
      run: () => act("cache", "Clear SOCIALITE data saved in this browser?", async () => { localKeys().forEach((k) => localStorage.removeItem(k)); onLocalCleared(); }, "This browser was cleared") },
    { k: "waiting", title: "Cancel all waiting sends", desc: `${counts.waiting} scheduled posts, emails or texts that haven't gone out`, label: "Cancel all",
      run: () => act("waiting", `Cancel ${counts.waiting} waiting sends?`, async () => { const { error } = await db.from("socialite_scheduled").update({ status: "cancelled" }).eq("created_by", uid).eq("status", "pending"); if (error) throw error; }, "Waiting sends cancelled") },
    { k: "contacts", title: "Delete my contacts", desc: `${counts.contacts} uploaded contacts`, label: "Delete",
      run: () => act("contacts", `Delete all ${counts.contacts} contacts? This can't be undone.`, async () => { const { error } = await db.from("socialite_contacts").delete().eq("owner_id", uid); if (error) throw error; }, "Contacts deleted") },
    { k: "keys", title: "Disconnect all social accounts", desc: `${counts.keys} connected accounts — their saved keys are erased`, label: "Disconnect",
      run: () => act("keys", "Erase every saved social media key?", async () => { await Promise.all(["facebook", "instagram", "threads", "x", "tiktok", "youtube"].map((platform) => supabase.functions.invoke("socialite-credentials", { body: { action: "remove", platform } }))); }, "Accounts disconnected") },
    { k: "reset", title: "Full reset", desc: "Clears this browser, cancels waiting sends, deletes contacts and disconnects accounts. Plan, credits and billing history are kept.", label: "Reset everything",
      run: () => act("reset", "Reset everything? Contacts and keys are erased for good.", async () => {
        if (!confirm("Last check: really reset everything?")) throw new Error("Reset stopped");
        await db.from("socialite_scheduled").update({ status: "cancelled" }).eq("created_by", uid).eq("status", "pending");
        await db.from("socialite_contacts").delete().eq("owner_id", uid);
        await Promise.all(["facebook", "instagram", "threads", "x", "tiktok", "youtube"].map((platform) => supabase.functions.invoke("socialite-credentials", { body: { action: "remove", platform } })));
        localKeys().forEach((k) => localStorage.removeItem(k)); onLocalCleared();
      }, "Everything was reset") },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-[760px] space-y-5">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Data Control</h1>
        <p className="text-[12px] text-zinc-500 mt-1">Your data, your choice. Everything here only touches your own account.</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[["Contacts", counts.contacts], ["Waiting sends", counts.waiting], ["Connected accounts", counts.keys], ["Usage records", counts.usage]].map(([k, v]) => (
          <div key={k as string} className={card}><div className="text-[11px] text-zinc-500">{k}</div><div className="text-[20px] font-semibold mono">{v}</div></div>
        ))}
      </div>
      <div className="space-y-3">
        {items.map((it) => (
          <div key={it.k} className={`${card} flex items-center gap-4`}>
            <div className="flex-1"><div className="text-[13px] font-medium">{it.title}</div><div className="text-[11.5px] text-zinc-500 mt-0.5">{it.desc}</div></div>
            <button disabled={!uid || !!busy} onClick={it.run} className={`${btn} ${it.primary ? "bg-white text-black" : "bg-zinc-900 border border-zinc-800 text-zinc-200 hover:bg-zinc-800"}`}>{busy === it.k ? "Working…" : it.label}</button>
          </div>
        ))}
      </div>
      <div className="text-[11px] text-zinc-500">To close your SOCIALITE account completely, cancel your plan in Plan & billing, run Full reset, then contact info@startupfactoryhub.com.</div>
    </div>
  );
}
