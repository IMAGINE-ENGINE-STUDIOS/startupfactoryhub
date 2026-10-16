/**
 * Investor Data Room (/data-room) — same Startup Factory Hub design as /onepager.
 * Approved investors (data_room_access) and admins can view; only admins upload.
 * Credits: Imagine Engine Studios Corp.
 */
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Lock, FileText, Upload, Trash2, UserPlus, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePageSeo } from "@/hooks/usePageSeo";
import { WEBSITE_PARTNERS } from "@/config/partners";
import sfhLogo from "@/assets/sfh-main-logo.png.asset.json";

const G = "#39ff88";
const CY = "#22d3ee";
const MONO = "'JetBrains Mono', ui-monospace, monospace";
const SERIF = "'Playfair Display', Georgia, serif";
const box = { border: "1px solid rgba(57,255,136,0.22)", background: "rgba(8,20,14,0.75)", borderRadius: 10 } as const;
const input = { background: "#03120a", border: "1px solid rgba(57,255,136,0.3)", color: "#d6e7dc", borderRadius: 6, padding: "8px 10px", fontSize: 13 } as const;

const CATEGORIES = [
  "Startup contracts",
  "Financials & projections",
  "Cap table & round terms",
  "Legal & corporate",
  "Traction & metrics",
  "Partnership agreements",
  "Product & technology",
];

const CORE = [
  { title: "Investor pitch deck", desc: "Full company presentation", href: "/deck" },
  { title: "Investor one-pager", desc: "Seed round summary, downloadable as PDF", href: "/onepager" },
  { title: "APEX partnership proposal", desc: "Accelerator-at-scale brochure", href: "/apex" },
  { title: "Startup Factory overview", desc: "Program, offer and team", href: "/startup-factory" },
];

interface Doc { id: string; category: string; title: string; description: string | null; file_path: string | null; external_url: string | null; created_at: string; }
const db = supabase as any;

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.22em", color: G, textTransform: "uppercase", marginBottom: 8 }}>{children}</div>
);

export default function InvestorDataRoom() {
  usePageSeo({ title: "Investor Data Room — Startup Factory Hub", description: "Private due diligence room for Startup Factory Hub investors.", path: "/data-room" });
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [access, setAccess] = useState<{ email: string }[]>([]);
  const [form, setForm] = useState({ category: CATEGORIES[0], title: "", description: "", url: "" });
  const [file, setFile] = useState<File | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    if (!user) { setAllowed(false); return; }
    const [{ data: ok }, { data: admin }] = await Promise.all([
      db.rpc("can_view_data_room"),
      db.rpc("has_role", { _user_id: user.id, _role: "admin" }),
    ]);
    setAllowed(!!ok); setIsAdmin(!!admin);
    if (ok) {
      const { data } = await db.from("data_room_documents").select("*").order("created_at", { ascending: false });
      setDocs(data ?? []);
    }
    if (admin) {
      const { data } = await db.from("data_room_access").select("email").order("granted_at", { ascending: false });
      setAccess(data ?? []);
    }
  }, [user]);
  useEffect(() => { void load(); }, [load]);

  const openDoc = async (d: Doc) => {
    if (d.external_url) return window.open(d.external_url, "_blank", "noopener,noreferrer");
    if (!d.file_path) return;
    const { data } = await supabase.storage.from("data-room").createSignedUrl(d.file_path, 600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const addDoc = async () => {
    if (!form.title.trim() || (!file && !form.url.trim())) { setMsg("Add a title and a file or link."); return; }
    setBusy(true); setMsg("");
    let file_path: string | null = null;
    if (file) {
      file_path = `${form.category.replace(/\W+/g, "-").toLowerCase()}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
      const { error } = await supabase.storage.from("data-room").upload(file_path, file);
      if (error) { setBusy(false); setMsg(error.message); return; }
    }
    const url = form.url.trim();
    const { error } = await db.from("data_room_documents").insert({
      category: form.category, title: form.title.trim(), description: form.description.trim() || null,
      file_path, external_url: file ? null : (/^https?:\/\//i.test(url) ? url : `https://${url}`), created_by: user?.id,
    });
    setBusy(false);
    if (error) return setMsg(error.message);
    setForm({ ...form, title: "", description: "", url: "" }); setFile(null); setMsg("Document added.");
    void load();
  };

  const removeDoc = async (d: Doc) => {
    if (!confirm(`Remove "${d.title}"?`)) return;
    if (d.file_path) await supabase.storage.from("data-room").remove([d.file_path]);
    await db.from("data_room_documents").delete().eq("id", d.id);
    void load();
  };

  const grant = async () => {
    const e = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(e)) return setMsg("Enter a valid email.");
    const { error } = await db.from("data_room_access").upsert({ email: e });
    if (error) return setMsg(error.message);
    setEmail(""); setMsg(`${e} can now open the data room.`); void load();
  };
  const revoke = async (e: string) => { await db.from("data_room_access").delete().eq("email", e); void load(); };

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: "radial-gradient(ellipse at 90% 0%, rgba(57,255,136,0.12), transparent 50%), radial-gradient(ellipse at 0% 100%, rgba(34,211,238,0.08), transparent 45%), #020805", color: "#d6e7dc", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ opacity: 0.08, backgroundImage: "linear-gradient(rgba(57,255,136,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(57,255,136,0.5) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      <div className="relative mx-auto flex flex-col gap-6" style={{ maxWidth: 1040 }}>
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3">
            <img src={sfhLogo.url} alt="Startup Factory Hub" style={{ height: 34, width: "auto" }} />
            <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.2em", color: "#e8fff0" }}>STARTUP FACTORY HUB</span>
          </Link>
          <div className="flex items-center gap-2" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.18em", color: G }}>
            <span style={{ width: 7, height: 7, borderRadius: 9, background: G, boxShadow: `0 0 8px ${G}` }} /> DATA ROOM / CONFIDENTIAL
          </div>
        </header>

        <section>
          <Eyebrow>SFH://INVESTORS/DATA_ROOM</Eyebrow>
          <h1 style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 44, lineHeight: 1.05, color: "#f2fff6" }}>
            Investor <span style={{ color: G }}>Data Room</span>
          </h1>
          <p style={{ maxWidth: 640, marginTop: 10, fontSize: 15, color: "#a9c4b3" }}>
            One secure place for due diligence: the deck, the one-pager, our partner network, accelerator startup contracts and company documents.
          </p>
        </section>

        {allowed === null ? (
          <div style={{ ...box, padding: 24, fontFamily: MONO, fontSize: 12, color: G }}>LOADING…</div>
        ) : !allowed ? (
          <div style={{ ...box, padding: 28 }} className="flex flex-col items-start gap-3">
            <Lock className="h-6 w-6" style={{ color: G }} />
            <h2 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 700, color: "#f2fff6" }}>Access by invitation</h2>
            <p style={{ fontSize: 14, color: "#a9c4b3", maxWidth: 560 }}>
              {user ? "Your account hasn't been approved for the data room yet. Contact the Startup Factory Hub team to request access." : "Sign in with the email address the Startup Factory Hub team approved for you."}
            </p>
            {!user && (
              <Link to="/auth?redirect=/data-room" className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold" style={{ background: G, color: "#02130a", fontFamily: MONO }}>
                Sign in <ArrowUpRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        ) : (
          <>
            <section>
              <Eyebrow>[01] CORE MATERIALS</Eyebrow>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {CORE.map((c) => (
                  <Link key={c.href} to={c.href} target="_blank" style={{ ...box, padding: 16 }} className="flex flex-col gap-1 transition hover:brightness-125">
                    <div className="flex items-center justify-between"><FileText className="h-4 w-4" style={{ color: CY }} /><ArrowUpRight className="h-4 w-4" style={{ color: G }} /></div>
                    <div style={{ fontWeight: 700, color: "#f2fff6", fontSize: 15, marginTop: 6 }}>{c.title}</div>
                    <div style={{ fontSize: 12.5, color: "#8fb09c" }}>{c.desc}</div>
                  </Link>
                ))}
              </div>
            </section>

            <section>
              <Eyebrow>[02] PARTNER NETWORK · {WEBSITE_PARTNERS.length} PARTNERS</Eyebrow>
              <div style={{ ...box, padding: 16 }} className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-3">
                {WEBSITE_PARTNERS.map((p) => (
                  <div key={p.name} className="flex flex-col items-center gap-1.5 text-center">
                    <div className="flex h-12 w-full items-center justify-center rounded-md p-1.5" style={{ background: "rgba(255,255,255,0.92)" }}>
                      <img src={p.logo} alt={p.name} loading="lazy" className="max-h-full max-w-full object-contain" />
                    </div>
                    <span style={{ fontSize: 10, color: "#a9c4b3", lineHeight: 1.2 }}>{p.name}</span>
                    <span style={{ fontFamily: MONO, fontSize: 8.5, color: G, letterSpacing: "0.1em" }}>{p.tier.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </section>

            {CATEGORIES.map((cat, i) => {
              const list = docs.filter((d) => d.category === cat);
              return (
                <section key={cat}>
                  <Eyebrow>[{String(i + 3).padStart(2, "0")}] {cat}</Eyebrow>
                  <div style={{ ...box, padding: list.length ? 6 : 16 }}>
                    {list.length === 0 ? (
                      <div style={{ fontSize: 13, color: "#6f8f7c" }}>No documents yet.</div>
                    ) : list.map((d) => (
                      <div key={d.id} className="flex items-center gap-3 rounded-md px-3 py-2.5 hover:bg-white/5">
                        {d.external_url ? <Link2 className="h-4 w-4 shrink-0" style={{ color: CY }} /> : <FileText className="h-4 w-4 shrink-0" style={{ color: CY }} />}
                        <button onClick={() => openDoc(d)} className="flex-1 min-w-0 text-left">
                          <div style={{ fontWeight: 600, color: "#f2fff6", fontSize: 14 }} className="truncate">{d.title}</div>
                          {d.description && <div style={{ fontSize: 12, color: "#8fb09c" }} className="truncate">{d.description}</div>}
                        </button>
                        <span style={{ fontFamily: MONO, fontSize: 10, color: "#6f8f7c" }}>{new Date(d.created_at).toLocaleDateString()}</span>
                        {isAdmin && <button onClick={() => removeDoc(d)} aria-label="Remove"><Trash2 className="h-4 w-4" style={{ color: "#ff6b8a" }} /></button>}
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}

            {isAdmin && (
              <section className="grid gap-4 lg:grid-cols-2">
                <div style={{ ...box, padding: 18 }} className="flex flex-col gap-2.5">
                  <Eyebrow>ADMIN // ADD DOCUMENT</Eyebrow>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={input}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={input} />
                  <input placeholder="Short description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={input} />
                  <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} style={{ ...input, padding: 6 }} />
                  <input placeholder="…or an external link (Docsend, Drive)" value={form.url} disabled={!!file} onChange={(e) => setForm({ ...form, url: e.target.value })} style={input} />
                  <button onClick={addDoc} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60" style={{ background: G, color: "#02130a", fontFamily: MONO }}>
                    <Upload className="h-4 w-4" /> {busy ? "Uploading…" : "Add to data room"}
                  </button>
                </div>
                <div style={{ ...box, padding: 18 }} className="flex flex-col gap-2.5">
                  <Eyebrow>ADMIN // INVESTOR ACCESS</Eyebrow>
                  <div className="flex gap-2">
                    <input placeholder="investor@email.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ ...input, flex: 1 }} />
                    <button onClick={grant} className="inline-flex items-center gap-1.5 rounded-md px-3 text-sm font-semibold" style={{ background: CY, color: "#02130a", fontFamily: MONO }}>
                      <UserPlus className="h-4 w-4" /> Grant
                    </button>
                  </div>
                  <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
                    {access.length === 0 && <div style={{ fontSize: 12.5, color: "#6f8f7c" }}>No investors approved yet.</div>}
                    {access.map((a) => (
                      <div key={a.email} className="flex items-center justify-between rounded px-2 py-1.5" style={{ background: "rgba(57,255,136,0.05)" }}>
                        <span style={{ fontSize: 13 }}>{a.email}</span>
                        <button onClick={() => revoke(a.email)} style={{ fontFamily: MONO, fontSize: 10, color: "#ff6b8a" }}>REVOKE</button>
                      </div>
                    ))}
                  </div>
                </div>
                {msg && <div className="lg:col-span-2" style={{ fontFamily: MONO, fontSize: 11, color: G }}>{msg}</div>}
              </section>
            )}
          </>
        )}

        <footer style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: "0.16em", color: "#5d7d6a" }} className="pt-4 border-t border-white/10">
          CONFIDENTIAL · STARTUP FACTORY HUB · BUILT BY IMAGINE ENGINE STUDIOS CORP
        </footer>
      </div>
    </div>
  );
}
