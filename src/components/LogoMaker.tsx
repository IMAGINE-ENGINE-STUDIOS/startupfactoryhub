import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Sparkles, RefreshCw, Crown } from "lucide-react";

const LOGO_STYLES = [
  { id: "minimal", label: "Minimal", direction: "ultra-minimal flat vector logo, generous negative space, one simple geometric mark" },
  { id: "bold", label: "Bold & Geometric", direction: "bold geometric logo, strong shapes, confident modern sans-serif wordmark" },
  { id: "elegant", label: "Elegant", direction: "elegant premium logo, refined serif typography, thin lines, luxury feel" },
  { id: "tech", label: "Tech / Futuristic", direction: "futuristic technology logo, sleek gradient mark, sharp modern typography" },
  { id: "playful", label: "Playful", direction: "friendly playful logo, rounded shapes, cheerful modern typography" },
  { id: "vintage", label: "Vintage", direction: "vintage badge logo, classic lettering, timeless emblem style" },
] as const;

const PALETTES = [
  { id: "emerald", label: "Emerald & Gold", colors: "deep emerald green and gold" },
  { id: "navy", label: "Navy & Cyan", colors: "deep navy blue and bright cyan" },
  { id: "mono", label: "Black & White", colors: "black and white only" },
  { id: "sunset", label: "Sunset", colors: "warm orange, coral and magenta gradient" },
  { id: "violet", label: "Violet", colors: "rich violet and lavender" },
  { id: "custom", label: "My colors", colors: "" },
] as const;

const COMPOSITIONS = [
  "an icon mark above the company name",
  "a monogram built from the company's initials inside a simple shape",
  "an emblem / badge composition with the name inside it",
  "a clean wordmark with a small symbol on the left",
];

interface LogoVariant {
  url: string;
  composition: string;
}

export default function LogoMaker() {
  const { toast } = useToast();
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [tagline, setTagline] = useState("");
  const [styleId, setStyleId] = useState<string>("minimal");
  const [paletteId, setPaletteId] = useState<string>("emerald");
  const [customColors, setCustomColors] = useState("");
  const [darkBg, setDarkBg] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [variants, setVariants] = useState<LogoVariant[]>([]);
  const [limitHit, setLimitHit] = useState(false);
  const [engineLabel, setEngineLabel] = useState("");
  const [refiningIdx, setRefiningIdx] = useState<number | null>(null);
  const [refineTexts, setRefineTexts] = useState<Record<number, string>>({});

  // Concepts are paid work — they must survive the panel closing,
  // a refresh, anything. The function writes every concept to the
  // image_generation_usage ledger before it returns, so on mount
  // the latest four logo rows are restored as the current concepts
  // (live state from an in-panel generation always wins — the
  // restore only fills an empty panel). Proven necessary
  // 2026-11-14: generations succeeded server-side (12/12 HTTP 200)
  // while the hosting dialog closed and the in-memory results
  // were lost before the owner ever saw them.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid || cancelled) return;
      const { data: rows } = await supabase
        .from("image_generation_usage")
        .select("image_url, prompt, created_at")
        .eq("user_id", uid)
        .eq("style_preset", "logo")
        .order("created_at", { ascending: false })
        .limit(4);
      if (cancelled || !rows || rows.length === 0) return;
      const restored: LogoVariant[] = rows
        .slice()
        .reverse()
        .map((r: any) => {
          const m = /Composition: ([^.]+)\./.exec(r.prompt ?? "");
          return { url: r.image_url, composition: m ? m[1] : "logo concept" };
        })
        .filter((v: LogoVariant) => !!v.url);
      if (restored.length === 0) return;
      setVariants((prev) => (prev.length ? prev : restored));
      const nameMatch = /for the company "([^"]+)"/.exec(rows[0]?.prompt ?? "");
      if (nameMatch) setBusinessName((prev) => prev || nameMatch[1]);
      setEngineLabel((prev) => prev || "FLUX.1 [schnell] — open source (Apache-2.0), Cloudflare Workers AI");
    })();
    return () => { cancelled = true; };
  }, []);

  const buildPrompt = (composition: string) => {
    const style = LOGO_STYLES.find((s) => s.id === styleId) ?? LOGO_STYLES[0];
    const palette = PALETTES.find((p) => p.id === paletteId) ?? PALETTES[0];
    const colors = paletteId === "custom" ? (customColors.trim() || "a tasteful professional palette") : palette.colors;
    const bg = darkBg ? "on a solid very dark charcoal background" : "on a solid pure white background";
    return (
      `Professional logo design for the company "${businessName.trim()}", ` +
      `${industry.trim() ? `a ${industry.trim()} business. ` : "a modern business. "}` +
      `${style.direction}. Brand colors: ${colors}. Composition: ${composition}. ` +
      (tagline.trim() ? `Include the tagline "${tagline.trim()}" in smaller type under the name. ` : "") +
      `The company name must be spelled exactly "${businessName.trim()}". ` +
      `Flat vector-style logo presented ${bg}, centered, crisp clean edges, no photograph, no mockup, no watermark, no extra text.`
    );
  };

  const handleGenerate = async () => {
    if (!businessName.trim()) {
      toast({ title: "Business name needed", description: "Enter the name the logo is for.", variant: "destructive" });
      return;
    }
    setGenerating(true);
    setLimitHit(false);
    setVariants([]);
    setProgress(0);
    let made = 0;
    let limitSeen = false;
    let firstError: string | null = null;
    try {
      // All four concepts generate in parallel — one wait, not four.
      await Promise.all(COMPOSITIONS.map(async (composition, i) => {
        const { data, error } = await supabase.functions.invoke("generate-logo-image", {
          body: { prompt: buildPrompt(composition) },
        });
        // Only a real credit refusal shows the credits banner.
        // Every other failure shows the function's clean platform
        // message (founder policy, 2026-11-14) — never a raw
        // transport error like "Edge Function returned a non-2xx".
        if (data?.error === "limit_reached") { limitSeen = true; return; }
        if (error || data?.error) {
          let msg: string | null = data?.message ?? null;
          if (!msg && error) {
            try {
              const body = await (error as any)?.context?.json?.();
              if (body?.error === "limit_reached") { limitSeen = true; return; }
              if (typeof body?.message === "string" && body.message) msg = body.message;
            } catch { /* no readable body — clean fallback below */ }
          }
          firstError = firstError || msg
            || "Logo generation couldn't complete right now. You were not charged — please try again in a moment.";
          return;
        }
        if (data?.modelLabel) setEngineLabel(data.modelLabel);
        if (data?.imageUrl) {
          made++;
          setProgress(made);
          setVariants((prev) => {
            const next = [...prev];
            next[i] = { url: data.imageUrl, composition };
            return next;
          });
        }
      }));
      if (limitSeen && made < COMPOSITIONS.length) setLimitHit(true);
      if (made) toast({ title: "Logos ready", description: `${made} concepts generated — download the ones you like or refine one.` });
      else if (!limitSeen && firstError) throw new Error(firstError);
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message || "Something went wrong. Try again.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleRefine = async (idx: number) => {
    const refineText = refineTexts[idx] ?? "";
    if (!refineText.trim()) {
      toast({ title: "Describe the change", description: "e.g. “make the icon a rocket, thicker letters”.", variant: "destructive" });
      return;
    }
    setRefiningIdx(idx);
    try {
      // Refining regenerates the concept with the owner's note added
      // to the brief — the same open-source FLUX engine, never a
      // different model swapped in quietly.
      const { data, error } = await supabase.functions.invoke("generate-logo-image", {
        body: {
          prompt: buildPrompt(variants[idx].composition)
            + ` Refinement requested by the owner: ${refineText.trim()}. Apply this change while keeping the same composition and the exact spelling of the name.`,
        },
      });
      if (data?.error === "limit_reached") throw new Error("You're out of Global Credits — top up or upgrade to keep creating.");
      if (error) {
        let msg: string | null = null;
        try {
          const body = await (error as any)?.context?.json?.();
          if (body?.error === "limit_reached") throw new Error("You're out of Global Credits — top up or upgrade to keep creating.");
          if (typeof body?.message === "string" && body.message) msg = body.message;
        } catch (e) { if (e instanceof Error && e.message.startsWith("You're out of")) throw e; }
        throw new Error(msg || "Logo generation couldn't complete right now. You were not charged — please try again in a moment.");
      }
      if (data?.error) throw new Error(data.message || "Logo generation couldn't complete right now. You were not charged — please try again in a moment.");
      if (data?.modelLabel) setEngineLabel(data.modelLabel);
      setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, url: data.imageUrl } : v)));
      setRefineTexts((prev) => ({ ...prev, [idx]: "" }));
      toast({ title: "Logo refined", description: "Regenerated with your note added — the updated concept replaced the previous one." });
    } catch (err: any) {
      toast({ title: "Refine failed", description: err.message || "Something went wrong. Try again.", variant: "destructive" });
    } finally {
      setRefiningIdx(null);
    }
  };

  const handleDownload = (url: string, i: number) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `logo-${businessName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "concept"}-${i + 1}.jpg`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="h-full overflow-y-auto pr-1">
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5">
        {/* ── Brief ─────────────────────────────────────────── */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Business name *</label>
            <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Orbit Meals" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">What does it do?</label>
            <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. healthy meal delivery for offices" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Tagline (optional)</label>
            <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="e.g. Lunch, launched." className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Style</label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {LOGO_STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyleId(s.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${styleId === s.id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Colors</label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {PALETTES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPaletteId(p.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${paletteId === p.id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {paletteId === "custom" && (
              <Input value={customColors} onChange={(e) => setCustomColors(e.target.value)} placeholder="e.g. teal and sand" className="mt-2" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDarkBg(false)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${!darkBg ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
            >
              On white
            </button>
            <button
              type="button"
              onClick={() => setDarkBg(true)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${darkBg ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
            >
              On dark
            </button>
          </div>
          <Button onClick={handleGenerate} disabled={generating} className="w-full gap-2">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {generating ? `Designing… ${progress}/4` : "Generate 4 logo concepts"}
          </Button>
          {limitHit && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm flex gap-2">
              <Crown className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <span>You're out of Global Credits — each concept costs 1 Credit, like every AI action on the platform. <a href="/memberships" className="underline font-medium">Top up or upgrade</a>.</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Concepts are generated by FLUX.1 [schnell] — an open-source model (Apache-2.0) running on the platform's own Cloudflare account — at 1 Global Credit each. Download your favorite, or refine it: refining regenerates the concept with your note added.
          </p>
        </div>

        {/* ── Results ───────────────────────────────────────── */}
        <div>
          {variants.length === 0 && !generating && (
            <div className="h-full min-h-[300px] rounded-2xl border border-dashed border-border flex items-center justify-center text-center p-8">
              <p className="text-sm text-muted-foreground max-w-xs">
                Fill in the brief and generate — four logo concepts will appear here, each with a different composition.
              </p>
            </div>
          )}
          {generating && variants.length === 0 && (
            <div className="h-full min-h-[300px] rounded-2xl border border-dashed border-border flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {variants.map((v, i) => (
              <div key={i} className="rounded-2xl border border-border overflow-hidden bg-card">
                <img src={v.url} alt={`Logo concept ${i + 1}`} className="w-full aspect-square object-cover" />
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="text-[10px] capitalize">{v.composition.split(" ").slice(0, 3).join(" ")}…</Badge>
                    <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => handleDownload(v.url, i)}>
                      <Download className="h-3.5 w-3.5" /> Download
                    </Button>
                  </div>
                  <div className="flex gap-1.5">
                    <Input
                      value={refineTexts[i] ?? ""}
                      onChange={(e) => setRefineTexts((prev) => ({ ...prev, [i]: e.target.value }))}
                      placeholder="Refine: “bolder letters…”"
                      className="h-8 text-xs"
                    />
                    <Button size="sm" className="h-8 gap-1" disabled={refiningIdx === i || !(refineTexts[i] ?? "").trim()} onClick={() => handleRefine(i)}>
                      {refiningIdx === i ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                      Refine
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {engineLabel && variants.length > 0 && (
            <p className="text-[11px] text-muted-foreground mt-3">Generated by {engineLabel}.</p>
          )}
        </div>
      </div>
    </div>
  );
}
