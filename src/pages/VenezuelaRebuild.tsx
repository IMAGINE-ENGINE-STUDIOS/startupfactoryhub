import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Heart, Globe, MapPin, Users, Building2, Loader2, ExternalLink, ArrowUpRight, Orbit,
} from "lucide-react";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
  description: string | null;
  industry: string | null;
  location: string | null;
  logo_url: string | null;
  website: string | null;
  team_size: number | null;
  user_id: string;
  funding_amount: number | null;
}

interface DonationAgg {
  company_id: string;
  total_cents: number;
  donors: number;
}

const DEFAULT_GOAL_CENTS = 5_000_000;
const PRESETS = [25, 50, 100, 250, 500];

/* ───────────── Animated cosmos backdrop ───────────── */
const Starfield = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      c.width = c.offsetWidth * dpr;
      c.height = c.offsetHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);
    const stars = Array.from({ length: 180 }, () => ({
      x: Math.random(), y: Math.random(),
      z: Math.random() * 0.8 + 0.2,
      tw: Math.random() * Math.PI * 2,
    }));
    const shooting: { x: number; y: number; vx: number; vy: number; life: number }[] = [];
    let t = 0;
    const draw = () => {
      t += 0.01;
      ctx.clearRect(0, 0, c.width, c.height);
      // nebula glow
      const g = ctx.createRadialGradient(c.width * 0.7, c.height * 0.3, 0, c.width * 0.7, c.height * 0.3, c.width * 0.6);
      g.addColorStop(0, "rgba(244,114,182,0.10)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, c.width, c.height);
      const g2 = ctx.createRadialGradient(c.width * 0.2, c.height * 0.8, 0, c.width * 0.2, c.height * 0.8, c.width * 0.6);
      g2.addColorStop(0, "rgba(56,189,248,0.10)");
      g2.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g2; ctx.fillRect(0, 0, c.width, c.height);
      // stars
      for (const s of stars) {
        const a = 0.4 + Math.sin(t * 2 + s.tw) * 0.4;
        ctx.fillStyle = `rgba(255,255,255,${a * s.z})`;
        const r = s.z * 1.6 * dpr;
        ctx.beginPath();
        ctx.arc(s.x * c.width, s.y * c.height, r, 0, Math.PI * 2);
        ctx.fill();
      }
      // shooting stars
      if (Math.random() < 0.012) {
        shooting.push({
          x: Math.random() * c.width, y: Math.random() * c.height * 0.5,
          vx: -6 * dpr, vy: 3 * dpr, life: 1,
        });
      }
      for (let i = shooting.length - 1; i >= 0; i--) {
        const s = shooting[i];
        ctx.strokeStyle = `rgba(255,255,255,${s.life})`;
        ctx.lineWidth = 1.2 * dpr;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * 6, s.y - s.vy * 6);
        ctx.stroke();
        s.x += s.vx; s.y += s.vy; s.life -= 0.02;
        if (s.life <= 0) shooting.splice(i, 1);
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
};

const VenezuelaRebuild = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [donations, setDonations] = useState<Record<string, DonationAgg>>({});
  const [loading, setLoading] = useState(true);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [amount, setAmount] = useState<number>(50);
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [message, setMessage] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    document.title = "Rebuild Initiative · Orbital Founders Program";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Direct-to-founder capital for the rebuild generation. Glass, light, and orbit.");
  }, []);

  useEffect(() => {
    const status = searchParams.get("donation");
    const sid = searchParams.get("session_id");
    if (status === "success" && sid) {
      supabase.functions.invoke("verify-venezuela-donation", { body: { session_id: sid } });
      toast.success("Transmission received. Capital is in orbit toward the founder.");
      setSearchParams({});
    } else if (status === "cancelled") {
      toast.info("Transmission aborted.");
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const fetchData = async () => {
    setLoading(true);
    const { data: profiles } = await supabase
      .from("profiles").select("user_id").eq("venezuela_rebuild", true);
    const userIds = (profiles ?? []).map((p) => p.user_id);
    if (!userIds.length) { setCompanies([]); setLoading(false); return; }
    const { data: comps } = await supabase
      .from("companies")
      .select("id, name, description, industry, location, logo_url, website, team_size, user_id, funding_amount")
      .in("user_id", userIds)
      .order("created_at", { ascending: false });
    setCompanies(comps ?? []);
    const { data: dons } = await supabase
      .from("venezuela_rebuild_donations")
      .select("company_id, amount_cents").eq("status", "completed");
    const agg: Record<string, DonationAgg> = {};
    (dons ?? []).forEach((d) => {
      if (!agg[d.company_id]) agg[d.company_id] = { company_id: d.company_id, total_cents: 0, donors: 0 };
      agg[d.company_id].total_cents += d.amount_cents;
      agg[d.company_id].donors += 1;
    });
    setDonations(agg);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const totals = useMemo(() => {
    const total = Object.values(donations).reduce((s, d) => s + d.total_cents, 0);
    const donors = Object.values(donations).reduce((s, d) => s + d.donors, 0);
    return { totalUsd: total / 100, donors };
  }, [donations]);

  const openDonate = (c: Company) => { setActiveCompany(c); setAmount(50); setMessage(""); };

  const handleDonate = async () => {
    if (!activeCompany) return;
    if (!donorName.trim()) return toast.error("Please enter your name");
    if (amount < 1) return toast.error("Minimum is $1");
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-venezuela-donation", {
        body: {
          company_id: activeCompany.id,
          amount_cents: Math.round(amount * 100),
          donor_name: donorName.trim(),
          donor_email: donorEmail.trim() || undefined,
          message: message.trim() || undefined,
        },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
      else throw new Error("No checkout URL received");
    } catch (e: any) {
      toast.error(e?.message || "Transmission failed");
      setProcessing(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05060d] text-white">
      {/* Cosmos */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#0b1230_0%,#05060d_45%,#000_100%)]" />
        <Starfield />
        {/* slow orbital ring */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[180vmin] h-[180vmin] rounded-full border border-white/[0.04] animate-[spin_180s_linear_infinite]" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vmin] h-[120vmin] rounded-full border border-white/[0.05] animate-[spin_120s_linear_infinite_reverse]" />
      </div>

      {/* Hero */}
      <header className="relative">
        <div className="container mx-auto px-6 pt-20 pb-12 sm:pt-28 sm:pb-16">
          <div className="flex items-center gap-2 text-[11px] tracking-[0.4em] uppercase text-white/50 mb-6">
            <Orbit className="w-3.5 h-3.5" /> Rebuild · Orbital Capital Program
          </div>
          <h1 className="text-5xl sm:text-7xl font-extralight tracking-tight leading-[0.95] max-w-4xl">
            Capital, in orbit,<br />
            <span className="font-light bg-gradient-to-r from-white via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent">
              around the founders rebuilding a country.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-white/60 text-base sm:text-lg font-light leading-relaxed">
            Every dollar is a transmission. Direct-to-founder, accounted for in light,
            settled in glass — no intermediaries between the signal and the work.
          </p>

          {/* Stat constellation */}
          <div className="mt-12 grid grid-cols-3 gap-3 sm:gap-5 max-w-2xl">
            <GlassStat label="Capital orbiting" value={`$${totals.totalUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} accent="from-cyan-300/30 to-cyan-300/0" />
            <GlassStat label="Founders" value={String(companies.length)} accent="from-fuchsia-300/30 to-fuchsia-300/0" />
            <GlassStat label="Signals received" value={String(totals.donors)} accent="from-amber-200/30 to-amber-200/0" />
          </div>
        </div>
      </header>

      {/* Grid */}
      <main className="container mx-auto px-6 pb-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-[10px] tracking-[0.4em] uppercase text-white/40 mb-2">Constellation</div>
            <h2 className="text-2xl sm:text-3xl font-light">Active founders in orbit</h2>
          </div>
          <span className="text-xs text-white/40 tracking-widest uppercase">{companies.length} bodies</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-7 h-7 animate-spin text-white/40" />
          </div>
        ) : companies.length === 0 ? (
          <div className="rounded-3xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-xl py-20 text-center text-white/50">
            <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
            No founders are currently in this orbit.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {companies.map((c) => {
              const raised = donations[c.id]?.total_cents ?? 0;
              const donors = donations[c.id]?.donors ?? 0;
              const pct = Math.min(100, (raised / DEFAULT_GOAL_CENTS) * 100);
              return (
                <article
                  key={c.id}
                  className="group relative rounded-3xl overflow-hidden border border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-white/[0.02] backdrop-blur-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)] transition-all duration-500 hover:border-white/20 hover:-translate-y-1"
                >
                  {/* hover aurora */}
                  <div className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(circle_at_var(--x,50%)_0%,rgba(244,114,182,0.18),transparent_60%)]" />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_40%,rgba(255,255,255,0.06)_50%,transparent_60%)] -translate-x-full group-hover:translate-x-full transition-transform duration-[1400ms]" />

                  <div className="relative p-6 flex flex-col h-full">
                    <div className="flex items-start gap-4 mb-5">
                      <div className="relative">
                        <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-cyan-400/40 via-fuchsia-400/40 to-amber-300/40 blur opacity-60 group-hover:opacity-100 transition-opacity" />
                        <Avatar className="relative h-14 w-14 ring-1 ring-white/20">
                          <AvatarImage src={c.logo_url ?? undefined} alt={c.name} />
                          <AvatarFallback className="bg-white/[0.06] text-white font-light">
                            {c.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-light text-xl leading-tight truncate text-white">{c.name}</h3>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {c.industry && (
                            <span className="text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-white/70">{c.industry}</span>
                          )}
                          <span className="text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full bg-fuchsia-400/10 border border-fuchsia-300/20 text-fuchsia-200">In orbit</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-white/60 font-light leading-relaxed line-clamp-3 mb-5 min-h-[3.8rem]">
                      {c.description || "A founder transmitting from the rebuild frontier — building infrastructure for what comes next."}
                    </p>

                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-white/45 mb-6">
                      {c.location && <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{c.location}</span>}
                      {c.team_size != null && <span className="flex items-center gap-1.5"><Users className="w-3 h-3" />{c.team_size}</span>}
                      {c.website && (
                        <a href={c.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors">
                          <Globe className="w-3 h-3" /> signal <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>

                    {/* Orbit progress */}
                    <div className="mt-auto space-y-4">
                      <div>
                        <div className="flex items-baseline justify-between mb-2">
                          <span className="text-xl font-light tracking-tight">
                            ${(raised / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                          <span className="text-[10px] tracking-widest uppercase text-white/40">
                            of ${(DEFAULT_GOAL_CENTS / 100 / 1000).toFixed(0)}k · {donors} {donors === 1 ? "signal" : "signals"}
                          </span>
                        </div>
                        <div className="relative h-[3px] w-full rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-300 via-fuchsia-300 to-amber-200 shadow-[0_0_12px_rgba(244,114,182,0.7)] transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => openDonate(c)}
                        className="group/btn relative w-full overflow-hidden rounded-full border border-white/15 bg-white/[0.04] backdrop-blur-xl py-3 text-sm font-light tracking-wide transition-all hover:bg-white/[0.08] hover:border-white/30"
                      >
                        <span className="relative z-10 inline-flex items-center justify-center gap-2 text-white">
                          Transmit capital
                          <ArrowUpRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                        </span>
                        <span className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-700 bg-gradient-to-r from-cyan-400/20 via-fuchsia-400/20 to-amber-300/20" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Donate dialog */}
      <Dialog open={!!activeCompany} onOpenChange={(o) => !o && setActiveCompany(null)}>
        <DialogContent className="sm:max-w-md border border-white/10 bg-[#0a0c1a]/95 backdrop-blur-2xl text-white shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-light text-xl">
              <Heart className="w-4 h-4 text-fuchsia-300" />
              Transmit to {activeCompany?.name}
            </DialogTitle>
            <DialogDescription className="text-white/50 font-light">
              Direct-to-founder via Stripe Connect. 20% sustains the orbit.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            <div>
              <label className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-2 block">Amount · USD</label>
              <div className="grid grid-cols-5 gap-1.5 mb-2">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setAmount(p)}
                    className={`rounded-full py-2 text-xs font-light border transition-all ${
                      amount === p
                        ? "bg-white text-black border-white"
                        : "bg-white/[0.04] border-white/10 text-white/70 hover:border-white/30"
                    }`}
                  >
                    ${p}
                  </button>
                ))}
              </div>
              <Input
                type="number" min={1} value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/30"
                placeholder="Custom amount"
              />
            </div>

            <div>
              <label className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-2 block">Your name</label>
              <Input value={donorName} onChange={(e) => setDonorName(e.target.value)} placeholder="—"
                className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/30" />
            </div>
            <div>
              <label className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-2 block">Email · optional</label>
              <Input type="email" value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)} placeholder="—"
                className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/30" />
            </div>
            <div>
              <label className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-2 block">Message · optional</label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2}
                placeholder="Leave a transmission…"
                className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/30" />
            </div>

            <Button
              onClick={handleDonate}
              disabled={processing}
              className="w-full rounded-full bg-white text-black hover:bg-white/90 font-light tracking-wide py-6"
            >
              {processing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Routing through orbit…</>
              ) : (
                <>Transmit ${amount} <ArrowUpRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const GlassStat = ({ label, value, accent }: { label: string; value: string; accent: string }) => (
  <div className="relative rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 overflow-hidden">
    <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${accent} blur-2xl`} />
    <div className="relative text-3xl font-extralight tracking-tight">{value}</div>
    <div className="relative text-[10px] tracking-[0.3em] uppercase text-white/40 mt-2">{label}</div>
  </div>
);

export default VenezuelaRebuild;
