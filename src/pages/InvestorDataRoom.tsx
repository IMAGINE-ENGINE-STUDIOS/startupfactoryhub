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
  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">{children}</div>
);

export default function InvestorDataRoom() {
  usePageSeo({ title: "Investor Data Room — Startup Factory Hub", description: "Private due diligence room for Startup Factory Hub investors.", path: "/data-room" });
  return <DataRoomContent />;
}

/** Data room body; `embedded` renders it inside a profile tab. Credits: Imagine Engine Studios Corp. */
export function DataRoomContent({ embedded = false }: { embedded?: boolean }) {
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

  const field = "w-full rounded-md border border-border bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary";
  return (
    <div className={embedded ? "space-y-6" : "min-h-screen bg-background py-8 px-4"}>
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        {!embedded && (
          <header className="flex flex-wrap items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-3">
              <img src={sfhLogo.url} alt="Startup Factory Hub" className="h-9 w-auto" />
              <span className="text-sm font-semibold tracking-wide text-foreground">Startup Factory Hub</span>
            </Link>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Lock className="h-3.5 w-3.5" /> Confidential
            </span>
          </header>
        )}

        <section className="tech-card border-0 rounded-2xl p-6">
          <Eyebrow>Investors · Data Room</Eyebrow>
          <h1 className={embedded ? "text-2xl font-bold text-foreground" : "text-4xl font-bold text-foreground"}>
            Investor <span className="text-primary">Data Room</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            One secure place for due diligence: the deck, the one-pager, our partner network, accelerator startup contracts and company documents.
          </p>
        </section>

        {allowed === null ? (
          <div className="tech-card border-0 rounded-2xl p-6 text-sm text-muted-foreground">Loading…</div>
        ) : !allowed ? (
          <div className="tech-card border-0 rounded-2xl p-6 flex flex-col items-start gap-3">
            <Lock className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Access by invitation</h2>
            <p className="max-w-xl text-sm text-muted-foreground">
              {user ? "Your account hasn't been approved for the data room yet. Contact the Startup Factory Hub team to request access." : "Sign in with the email address the Startup Factory Hub team approved for you."}
            </p>
            {!user && (
              <Link to="/auth?redirect=/data-room" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                Sign in <ArrowUpRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        ) : (
          <>
            <section>
              <Eyebrow>Core materials</Eyebrow>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {CORE.map((c) => (
                  <Link key={c.href} to={c.href} target="_blank" className="tech-card border-0 rounded-xl p-4 flex flex-col gap-1 transition hover:bg-primary/5">
                    <div className="flex items-center justify-between"><FileText className="h-4 w-4 text-primary" /><ArrowUpRight className="h-4 w-4 text-muted-foreground" /></div>
                    <div className="mt-1.5 text-sm font-semibold text-foreground">{c.title}</div>
                    <div className="text-xs text-muted-foreground">{c.desc}</div>
                  </Link>
                ))}
              </div>
            </section>

            <section>
              <Eyebrow>Partner network · {WEBSITE_PARTNERS.length} partners</Eyebrow>
              <div className="tech-card border-0 rounded-xl p-4 grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-3">
                {WEBSITE_PARTNERS.map((p) => (
                  <div key={p.name} className="flex flex-col items-center gap-1.5 text-center">
                    <div className="flex h-12 w-full items-center justify-center rounded-md bg-foreground/90 p-1.5">
                      <img src={p.logo} alt={p.name} loading="lazy" className="max-h-full max-w-full object-contain" />
                    </div>
                    <span className="text-[10px] leading-tight text-muted-foreground">{p.name}</span>
                    <span className="text-[9px] uppercase tracking-wider text-primary">{p.tier}</span>
                  </div>
                ))}
              </div>
            </section>

            {CATEGORIES.map((cat) => {
              const list = docs.filter((d) => d.category === cat);
              return (
                <section key={cat}>
                  <Eyebrow>{cat}</Eyebrow>
                  <div className={"tech-card border-0 rounded-xl " + (list.length ? "p-1.5" : "p-4")}>
                    {list.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No documents yet.</div>
                    ) : list.map((d) => (
                      <div key={d.id} className="flex items-center gap-3 rounded-md px-3 py-2.5 hover:bg-muted/40">
                        {d.external_url ? <Link2 className="h-4 w-4 shrink-0 text-primary" /> : <FileText className="h-4 w-4 shrink-0 text-primary" />}
                        <button onClick={() => openDoc(d)} className="flex-1 min-w-0 text-left">
                          <div className="truncate text-sm font-medium text-foreground">{d.title}</div>
                          {d.description && <div className="truncate text-xs text-muted-foreground">{d.description}</div>}
                        </button>
                        <span className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</span>
                        {isAdmin && <button onClick={() => removeDoc(d)} aria-label="Remove"><Trash2 className="h-4 w-4 text-destructive" /></button>}
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}

            {isAdmin && (
              <section className="grid gap-4 lg:grid-cols-2">
                <div className="tech-card border-0 rounded-xl p-5 flex flex-col gap-2.5">
                  <Eyebrow>Admin · Add document</Eyebrow>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={field}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={field} />
                  <input placeholder="Short description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={field} />
                  <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className={field} />
                  <input placeholder="…or an external link (Docsend, Drive)" value={form.url} disabled={!!file} onChange={(e) => setForm({ ...form, url: e.target.value })} className={field} />
                  <button onClick={addDoc} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                    <Upload className="h-4 w-4" /> {busy ? "Uploading…" : "Add to data room"}
                  </button>
                </div>
                <div className="tech-card border-0 rounded-xl p-5 flex flex-col gap-2.5">
                  <Eyebrow>Admin · Investor access</Eyebrow>
                  <div className="flex gap-2">
                    <input placeholder="investor@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
                    <button onClick={grant} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground">
                      <UserPlus className="h-4 w-4" /> Grant
                    </button>
                  </div>
                  <div className="flex max-h-56 flex-col gap-1 overflow-y-auto">
                    {access.length === 0 && <div className="text-sm text-muted-foreground">No investors approved yet.</div>}
                    {access.map((a) => (
                      <div key={a.email} className="flex items-center justify-between rounded-md bg-muted/40 px-2 py-1.5">
                        <span className="text-sm text-foreground">{a.email}</span>
                        <button onClick={() => revoke(a.email)} className="text-xs font-medium text-destructive">Revoke</button>
                      </div>
                    ))}
                  </div>
                </div>
                {msg && <div className="lg:col-span-2 text-sm text-primary">{msg}</div>}
              </section>
            )}
          </>
        )}

        {!embedded && (
          <footer className="border-t border-border pt-4 text-xs text-muted-foreground">
            Confidential · Startup Factory Hub · Built by Imagine Engine Studios Corp
          </footer>
        )}
      </div>
    </div>
  );
}
