/**
 * Public external share view of the Investor Data Room (/data-room/shared/:token).
 * Read-only; documents come from the data-room-shared function with short-lived signed URLs.
 * Credits: Imagine Engine Studios Corp.
 */
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowUpRight, Lock, FileText, Link2, MapPin, Rocket, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

interface SharedDoc {
  id: string;
  category: string;
  title: string;
  description: string | null;
  external_url: string | null;
  signedUrl: string | null;
  created_at: string;
}

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">{children}</div>
);

export default function SharedDataRoom() {
  usePageSeo({ title: "Investor Data Room — Startup Factory Hub", description: "Private due diligence room for Startup Factory Hub investors.", path: "/data-room" });
  const { token = "" } = useParams();
  const [docs, setDocs] = useState<SharedDoc[] | null>(null);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.functions.invoke("data-room-shared", { body: { token } });
      if (cancelled) return;
      if (error || !data?.documents) setInvalid(true);
      else setDocs(data.documents as SharedDoc[]);
    })();
    return () => { cancelled = true; };
  }, [token]);

  const openDoc = (d: SharedDoc) => {
    const url = d.external_url || d.signedUrl;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3">
            <img src={sfhLogo.url} alt="Startup Factory Hub" className="h-9 w-auto" />
            <span className="text-sm font-semibold tracking-wide text-foreground">Startup Factory Hub</span>
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Lock className="h-3.5 w-3.5" /> Confidential
          </span>
        </header>

        <section className="tech-card border-0 rounded-2xl p-6">
          <Eyebrow>Investors · Data Room</Eyebrow>
          <h1 className="text-4xl font-bold text-foreground">
            Investor <span className="text-primary">Data Room</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            One secure place for due diligence: the deck, the one-pager, our partner network, accelerator startup contracts and company documents.
          </p>
        </section>

        <section className="tech-card border-0 rounded-2xl overflow-hidden">
          <div className="h-24 sm:h-32" style={{ background: "linear-gradient(120deg,#06251c 0%,#0a3b2e 45%,#083344 100%)" }} />
          <div className="px-6 pb-6">
            <div className="-mt-10 flex flex-wrap items-end gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-2 shadow-lg ring-1 ring-border">
                <img src="https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/7f591579-b346-4234-a52b-c8d8e38a6f9f/logo.png" alt="Startup Factory Hub logo" className="max-h-full max-w-full object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-bold text-foreground">Startup Factory Hub</h2>
                <p className="text-sm text-muted-foreground">Deep tech, aerospace and quantum accelerator</p>
              </div>
              <a href="https://startupfactoryhub.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">
                <Globe className="h-3.5 w-3.5" /> startupfactoryhub.com
              </a>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 font-medium text-primary"><MapPin className="h-3.5 w-3.5" /> Orlando, Florida</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 font-medium text-primary"><Rocket className="h-3.5 w-3.5" /> AI venture builder &amp; accelerator</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">Raising a $1.5M seed round</span>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Startup Factory Hub is an AI-powered venture builder and accelerator for deep tech, aerospace and quantum startups.
              This data room is shared by the Startup Factory Hub team for investor due diligence.
            </p>
          </div>
        </section>

        {invalid ? (
          <div className="tech-card border-0 rounded-2xl p-6 flex flex-col items-start gap-3">
            <Lock className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">This link is no longer active</h2>
            <p className="max-w-xl text-sm text-muted-foreground">
              The share link you opened is invalid or has been revoked. Contact the Startup Factory Hub team for a new one.
            </p>
          </div>
        ) : docs === null ? (
          <div className="tech-card border-0 rounded-2xl p-6 text-sm text-muted-foreground">Loading…</div>
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
              <Eyebrow>Partners and Collaborators · {WEBSITE_PARTNERS.length} partners</Eyebrow>
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
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        )}

        <footer className="border-t border-border pt-4 text-xs text-muted-foreground">
          Confidential · Startup Factory Hub · Built by Imagine Engine Studios Corp
        </footer>
      </div>
    </div>
  );
}
