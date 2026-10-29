// SOCIALITE → API tab: create/revoke personal API keys, 7-day request log,
// full endpoint reference and the downloadable SDK (public/sdk/socialite.js).
// Keys are created server-side (socialite-api-keys) and shown only once.
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const BASE = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/socialite-api/v1`;
type Key = { id: string; name: string; prefix: string; scopes: string[]; last_used_at: string | null; revoked_at: string | null; created_at: string };

const ENDPOINTS: [string, string, string, string][] = [
  ["GET", "/me", "read", "Your plan, status, credits, key permissions and storage (used MB, included MB, this month's storage fee)"],
  ["GET", "/usage", "read", "This month's posts, emails, texts, WhatsApp, Genius, API calls and API data (MB), plus storage"],
  ["GET", "/contacts?limit=50&offset=0", "read", "List your contacts, page by page (up to 1,000 per page — no limit on how many you store)"],
  ["POST", "/contacts", "write", "Add up to 10,000 contacts per call: { contacts: [{ name, email?, phone? }] }"],
  ["DELETE", "/contacts/:id", "write", "Delete one contact"],
  ["POST", "/posts", "send", "Publish now or schedule: { text, platforms[], media?[], send_at?, timezone? }"],
  ["POST", "/messages", "send", "Email / SMS / WhatsApp your contacts: { channel, contact_ids[], subject?, message, send_at?, timezone? }"],
  ["GET", "/knowledge?limit=200&offset=0", "read", "List your Genius knowledge page by page (no limit on items stored)"],
  ["POST", "/knowledge", "write", "Teach Genius: { kind: face|scenario|wording|prohibited_words|prohibited_imagery|pitch|logic|pipeline|note, title, content?, active? }"],
  ["PATCH", "/knowledge/:id", "write", "Edit or switch a knowledge item on/off"],
  ["DELETE", "/knowledge/:id", "write", "Delete a knowledge item (and its picture)"],
  ["GET", "/books?limit=50&offset=0", "read", "List your Flip Builder V3 books"],
  ["GET", "/books/:id", "read", "One book with its pages and reader settings"],
  ["PATCH", "/books/:id", "write", "Rename, publish/unpublish, or change reader controls: { title?, published?, theme?: { showArrows, sideArrows, arrowsOnly, keyboard, curl, pageCounter, shareButton, studyButton, showTabs, showCorners, turnSpeed, autoplay } }"],
  ["GET", "/scheduled", "read", "List scheduled sends"],
  ["DELETE", "/scheduled/:id", "write", "Cancel a pending scheduled send"],
];

const ERRORS: [string, string][] = [
  ["401", "Key missing, wrong or revoked"], ["402", "Plan allowance or credits used up, or an API / storage fee could not be paid"], ["403", "Key lacks the permission"],
  ["404", "Unknown endpoint"], ["413", "Body over 2 MB — split it into several calls"], ["422", "Invalid fields (details in error)"], ["429", "Over your requests-per-minute limit (see X-RateLimit-Limit) — wait Retry-After seconds"],
];

const card = "rounded-2xl border border-white/10 bg-white/[0.03] p-6";
const code = "block whitespace-pre overflow-x-auto rounded-xl bg-black/50 border border-white/10 p-4 text-[12px] leading-relaxed text-white/85 font-mono";

export default function SocialiteApi() {
  const [keys, setKeys] = useState<Key[]>([]);
  const [reqs, setReqs] = useState<{ method: string; path: string; status: number; created_at: string }[]>([]);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>(["read"]);
  const [fresh, setFresh] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const call = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("socialite-api-keys", { body });
    if (error || data?.error) throw new Error(data?.error || "Request failed");
    return data;
  };
  const load = async () => {
    try {
      const [a, b] = await Promise.all([call({ action: "list" }), call({ action: "stats" })]);
      setKeys(a.keys); setReqs(b.requests);
    } catch (e) { setMsg((e as Error).message); }
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name.trim()) return setMsg("Give the key a name");
    setBusy(true); setMsg("");
    try { const r = await call({ action: "create", name, scopes }); setFresh(r.key); setName(""); load(); }
    catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  };
  const revoke = async (id: string) => { if (!confirm("Revoke this key? Apps using it stop working immediately.")) return; await call({ action: "revoke", id }); load(); };

  const sdkUse = `import { Socialite } from "./socialite.js";

const s = new Socialite(process.env.SOCIALITE_API_KEY);

// 1. Add contacts
const { data } = await s.contacts.create([{ name: "Ana", email: "ana@example.com", phone: "+15551234567" }]);

// 2. Publish a post now
await s.posts.create({ text: "Summer is here", platforms: ["facebook", "instagram"], media: ["https://…/photo.jpg"] });

// 3. Schedule a text for tomorrow 10:00 New York time
await s.messages.send({ channel: "sms", contact_ids: [data[0].id], message: "Hi Ana!",
  send_at: "2026-10-02T10:00:00-04:00", timezone: "America/New_York" });

// 4. Check usage
console.log(await s.usage());`;

  const curl = `curl ${BASE}/me \\
  -H "Authorization: Bearer sk_live_YOUR_KEY"`;

  return (
    <div className="space-y-6 text-white">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">SOCIALITE API</h2>
        <p className="text-sm text-white/60 mt-1">Connect your own apps to SOCIALITE. Each key only reaches your own contacts, posts and sends, and every call uses your plan and credits.</p>
      </div>

      <section className={card}>
        <h3 className="font-semibold mb-3">Your keys</h3>
        {fresh && (
          <div className="mb-4 rounded-xl border border-amber-400/40 bg-amber-400/10 p-4">
            <p className="text-sm font-medium">Copy this key now — it will never be shown again.</p>
            <div className="mt-2 flex gap-2">
              <code className="flex-1 break-all rounded-lg bg-black/50 px-3 py-2 text-xs font-mono">{fresh}</code>
              <button className="rounded-lg bg-white/10 px-3 text-sm hover:bg-white/20" onClick={() => navigator.clipboard.writeText(fresh)}>Copy</button>
              <button className="rounded-lg px-3 text-sm text-white/60" onClick={() => setFresh(null)}>Done</button>
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Key name, e.g. My shop"
            className="flex-1 min-w-[200px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm" />
          {["read", "write", "send"].map((s) => (
            <label key={s} className="flex items-center gap-1.5 text-sm text-white/80">
              <input type="checkbox" checked={scopes.includes(s)} onChange={(e) => setScopes(e.target.checked ? [...scopes, s] : scopes.filter((x) => x !== s))} />{s}
            </label>
          ))}
          <button disabled={busy || !scopes.length} onClick={create} className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-40">Create key</button>
        </div>
        {msg && <p className="mt-2 text-sm text-amber-300">{msg}</p>}
        <div className="mt-4 divide-y divide-white/5">
          {keys.length === 0 && <p className="text-sm text-white/50 py-3">No keys yet.</p>}
          {keys.map((k) => (
            <div key={k.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
              <span className="font-medium">{k.name}</span>
              <code className="text-white/50 font-mono">{k.prefix}…</code>
              <span className="text-white/50">{k.scopes.join(" · ")}</span>
              <span className="text-white/40 ml-auto">{k.revoked_at ? "Revoked" : k.last_used_at ? `Last used ${new Date(k.last_used_at).toLocaleString()}` : "Never used"}</span>
              {!k.revoked_at && <button onClick={() => revoke(k.id)} className="rounded-lg border border-white/15 px-3 py-1 hover:bg-white/10">Revoke</button>}
            </div>
          ))}
        </div>
      </section>

      <section className={card}>
        <h3 className="font-semibold mb-1">Quick start</h3>
        <ol className="list-decimal pl-5 text-sm text-white/70 space-y-1 mb-4">
          <li>Create a key above and store it on your server as <code>SOCIALITE_API_KEY</code>. Never put it in a web page.</li>
          <li>Download the SDK — one file, no installs, works with Node 18+, Deno and Bun.</li>
          <li>Copy the example below and run it with <code>node app.mjs</code>.</li>
        </ol>
        <a href="/sdk/socialite.js" download className="inline-block rounded-lg bg-white px-4 py-2 text-sm font-medium text-black">Download SDK (socialite.js)</a>
        <code className={`${code} mt-4`}>{sdkUse}</code>
        <p className="text-sm text-white/60 mt-4 mb-2">Or call it directly:</p>
        <code className={code}>{curl}</code>
      </section>

      <section className={card}>
        <h3 className="font-semibold mb-1">Reference</h3>
        <p className="text-xs text-white/50 mb-3 break-all">Base URL: {BASE}</p>
        <table className="w-full text-sm">
          <thead className="text-left text-white/50"><tr><th className="py-2">Method</th><th>Path</th><th>Needs</th><th>What it does</th></tr></thead>
          <tbody className="divide-y divide-white/5">
            {ENDPOINTS.map(([m, p, s, d]) => (
              <tr key={m + p}><td className="py-2 font-mono text-xs">{m}</td><td className="font-mono text-xs">{p}</td><td className="text-white/60">{s}</td><td className="text-white/75">{d}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="text-sm text-white/60 mt-4">Platforms: facebook, instagram, x, youtube, tiktok, threads, linkedin (uses the accounts you connected in Accounts). Leave out <code>send_at</code> to send now; add an ISO time to schedule.</p>
        <h4 className="font-medium mt-5 mb-2">Errors</h4>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
          {ERRORS.map(([c, d]) => <div key={c}><span className="font-mono text-white/90">{c}</span> <span className="text-white/60">{d}</span></div>)}
        </div>
        <p className="text-xs text-white/50 mt-2">Every error is JSON: <code>{`{ "error": "message" }`}</code>. The SDK retries 429 and server errors automatically.</p>
      </section>

      <section className={card}>
        <h3 className="font-semibold mb-2">Security</h3>
        <ul className="text-sm text-white/70 list-disc pl-5 space-y-1">
          <li>Keys are stored only as a one-way fingerprint — nobody, including us, can read them back.</li>
          <li>Each key has its own permissions (read, write, send) and can be revoked instantly.</li>
          <li>Requests per minute per key are set by your provider (shown in the X-RateLimit-Limit header), 2 MB per request, strict checks on every field.</li>
          <li>Pricing: depending on your provider's settings, API calls, data moved through the API and data you store may be free, included in your plan, or paid with credits (per call, per MB, per GB a month or a flat monthly fee). Check GET /me and GET /usage, or Plan &amp; billing.</li>
          <li>A key only sees its owner's own data. Nothing else is reachable.</li>
        </ul>
      </section>

      <section className={card}>
        <h3 className="font-semibold mb-3">Last 7 days</h3>
        {reqs.length === 0 ? <p className="text-sm text-white/50">No API calls yet.</p> : (
          <div className="max-h-72 overflow-y-auto divide-y divide-white/5 text-xs font-mono">
            {reqs.map((r, i) => (
              <div key={i} className="flex gap-4 py-1.5"><span className="text-white/40 w-40">{new Date(r.created_at).toLocaleString()}</span><span className="w-14">{r.method}</span><span className="flex-1">{r.path}</span><span className={r.status < 400 ? "text-emerald-300" : "text-amber-300"}>{r.status}</span></div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
