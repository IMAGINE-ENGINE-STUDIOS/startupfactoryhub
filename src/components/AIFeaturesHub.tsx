import { useState, useEffect } from "react";
import geniusAiLogo from "@/assets/imaginaly-logo.png";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import AISummaryCard from "./AISummaryCard";
import AITranslator from "./AITranslator";
import TaskAutomation from "./TaskAutomation";
import SFHImageCreator from "./SFHImageCreator";
import SentimentAnalyzer from "./SentimentAnalyzer";
import DocumentAnalyzer from "./DocumentAnalyzer";
import CRMBoard from "./CRMBoard";
import { LightPaperDocument } from "./lightpaper/LightPaperDocument";
import { LightPaperSpreadsheet } from "./lightpaper/LightPaperSpreadsheet";
import { LightPaperPresentation } from "./lightpaper/LightPaperPresentation";
import {
  FileText,
  TrendingUp,
  Languages,
  Image as ImageIcon,
  Workflow,
  Wand2,
  Sparkles,
  Table,
  Presentation,
  Kanban,
  ArrowUpRight,
  Gift,
  ExternalLink,
  GripVertical,
  ChevronDown,
  Pin,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ───────── Persistent ordering + expansion (localStorage) ───────── */
function useOrderedList<T extends string>(storageKey: string, defaultOrder: T[]) {
  const [order, setOrder] = useState<T[]>(() => {
    if (typeof window === "undefined") return defaultOrder;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return defaultOrder;
      const saved = JSON.parse(raw) as T[];
      const known = new Set(defaultOrder);
      const filtered = saved.filter((id) => known.has(id));
      const missing = defaultOrder.filter((id) => !filtered.includes(id));
      return [...filtered, ...missing];
    } catch {
      return defaultOrder;
    }
  });

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(order)); } catch { /* ignore */ }
  }, [order, storageKey]);

  const move = (fromId: T, toId: T) => {
    if (fromId === toId) return;
    setOrder((cur) => {
      const next = [...cur];
      const from = next.indexOf(fromId);
      const to = next.indexOf(toId);
      if (from < 0 || to < 0) return cur;
      next.splice(from, 1);
      next.splice(to, 0, fromId);
      return next;
    });
  };
  const pinTop = (id: T) => setOrder((cur) => [id, ...cur.filter((x) => x !== id)]);
  const reset = () => setOrder(defaultOrder);
  return { order, move, pinTop, reset };
}

function useExpanded(storageKey: string) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
    } catch { return new Set(); }
  });
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify([...expanded])); } catch { /* ignore */ }
  }, [expanded, storageKey]);
  const toggle = (id: string) =>
    setExpanded((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  return { expanded, toggle };
}

type ToolId =
  | "lightpaper"
  | "crm"
  | "image-creator"
  | "summary"
  | "sentiment"
  | "translate"
  | "document"
  | "automation";

interface DeskTool {
  id: ToolId;
  title: string;
  tagline: string;
  capabilities: string[];
  icon: React.ComponentType<{ className?: string }>;
  accent: string; // tailwind gradient e.g. "from-violet-500 to-indigo-600"
  glow: string; // hsl color for ambient glow
  badge?: string;
  size: "lg" | "md" | "sm";
}

const TOOLS: DeskTool[] = [
  {
    id: "lightpaper",
    title: "LightPaper Workspace",
    tagline: "Docs · Sheets · Slides — one elegant surface.",
    capabilities: [
      "Write structured documents",
      "Crunch numbers in spreadsheets",
      "Build presentation decks",
    ],
    icon: FileText,
    accent: "from-primary via-emerald-400 to-teal-500",
    glow: "hsl(var(--primary))",
    badge: "Productivity",
    size: "lg",
  },
  {
    id: "crm",
    title: "CRM Board",
    tagline: "Track deals, contacts and pipeline like a sales pro.",
    capabilities: [
      "Drag-and-drop deal pipeline",
      "Contact & task management",
      "Stage value rollups",
    ],
    icon: Kanban,
    accent: "from-emerald-500 via-teal-500 to-cyan-500",
    glow: "hsl(160 80% 45%)",
    badge: "Revenue",
    size: "lg",
  },
  {
    id: "image-creator",
    title: "Imaginaly",
    tagline: "Generate and edit cinematic visuals from text.",
    capabilities: [
      "Text-to-image generation",
      "In-place image editing",
      "Brand-ready exports",
    ],
    icon: Wand2,
    accent: "from-fuchsia-500 via-pink-500 to-rose-500",
    glow: "hsl(330 80% 60%)",
    badge: "Creative",
    size: "md",
  },
  {
    id: "summary",
    title: "Smart Summary",
    tagline: "Long content → sharp takeaways in seconds.",
    capabilities: ["Article condensing", "Meeting notes", "Insight extraction"],
    icon: FileText,
    accent: "from-violet-500 to-indigo-600",
    glow: "hsl(260 80% 65%)",
    size: "sm",
  },
  {
    id: "sentiment",
    title: "Sentiment Analysis",
    tagline: "Read the room across reviews and feedback.",
    capabilities: ["Emotion scoring", "Trend signals", "Bulk analysis"],
    icon: TrendingUp,
    accent: "from-emerald-500 to-teal-600",
    glow: "hsl(160 80% 45%)",
    size: "sm",
  },
  {
    id: "translate",
    title: "AI Translator",
    tagline: "Speak to the world in 50+ languages.",
    capabilities: ["Context-aware translation", "Tone preservation", "Bulk text"],
    icon: Languages,
    accent: "from-orange-500 to-amber-600",
    glow: "hsl(30 90% 55%)",
    size: "sm",
  },
  {
    id: "document",
    title: "Document Analysis",
    tagline: "Pull insights out of any PDF or image.",
    capabilities: ["OCR & extraction", "Smart Q&A", "Key data points"],
    icon: ImageIcon,
    accent: "from-pink-500 to-rose-600",
    glow: "hsl(340 82% 60%)",
    size: "sm",
  },
  {
    id: "automation",
    title: "Task Automation",
    tagline: "Wire up repetitive work into flows.",
    capabilities: ["Trigger → action chains", "No-code editor", "Scheduled runs"],
    icon: Workflow,
    accent: "from-cyan-500 to-blue-600",
    glow: "hsl(200 85% 55%)",
    size: "sm",
  },
];

interface Perk {
  name: string;
  description: string;
  badge: string;
  href: string;
  accent: string;
  glow: string;
  domain: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}

const PERKS: Perk[] = [
  {
    name: "Flippa",
    description: "Buy & sell digital businesses, apps and online assets.",
    badge: "Marketplace",
    href: "https://flippa.com/",
    accent: "from-emerald-500 to-lime-600",
    glow: "hsl(140 80% 45%)",
    domain: "flippa.com",
  },
  {
    name: "Regus Office Spaces",
    description: "Discounted private offices and coworking in 3,000+ locations.",
    badge: "Workspace",
    href: "https://www.regus.com/",
    accent: "from-blue-600 to-indigo-700",
    glow: "hsl(220 80% 55%)",
    domain: "regus.com",
  },
  {
    name: "TradingView",
    description: "Track markets and analyze charts — official affiliate link.",
    badge: "Finance",
    href: "https://www.tradingview.com/?aff_id=162505",
    accent: "from-blue-500 to-cyan-500",
    glow: "hsl(200 85% 55%)",
    domain: "tradingview.com",
  },
  {
    name: "PitchPerfecter",
    description: "AI-powered pitch deck coaching for founders.",
    badge: "Fundraising",
    href: "https://pitchperfecter.ai/",
    accent: "from-purple-500 to-fuchsia-600",
    glow: "hsl(290 80% 60%)",
    domain: "pitchperfecter.ai",
  },
  {
    name: "Pump",
    description: "Save up to 60% on AWS costs with automated optimization.",
    badge: "Cloud Savings",
    href: "https://www.pump.co/",
    accent: "from-orange-500 to-red-500",
    glow: "hsl(15 85% 55%)",
    domain: "pump.co",
  },
  {
    name: "HeyBoss",
    description: "AI agent that builds your website, app or store in minutes.",
    badge: "Builder",
    href: "https://www.heyboss.xyz/",
    accent: "from-rose-500 to-pink-600",
    glow: "hsl(340 80% 60%)",
    domain: "heyboss.xyz",
  },
  {
    name: "LivePlan",
    description: "Business planning, forecasting and pitch tools for startups.",
    badge: "Planning",
    href: "https://pas.go2cloud.org/aff_c?offer_id=2&aff_id=9605",
    accent: "from-teal-500 to-emerald-600",
    glow: "hsl(170 75% 45%)",
    domain: "liveplan.com",
  },
  {
    name: "Folk CRM",
    description: "The CRM that feels like a personal network — clean & fast.",
    badge: "CRM",
    href: "https://www.folk.app/",
    accent: "from-violet-500 to-indigo-600",
    glow: "hsl(260 80% 65%)",
    domain: "folk.app",
  },
  {
    name: "Hostinger",
    description: "Affordable hosting, domains and VPS for early-stage builds.",
    badge: "Hosting",
    href: "https://www.hostinger.com/",
    accent: "from-indigo-500 to-purple-600",
    glow: "hsl(250 75% 60%)",
    domain: "hostinger.com",
  },
  {
    name: "Working Advantage",
    description: "Use code STARTUPPERKS for exclusive lifestyle benefits.",
    badge: "Lifestyle",
    href: "https://www.workingadvantage.com/?tab=h",
    accent: "from-amber-500 to-orange-500",
    glow: "hsl(35 95% 55%)",
    domain: "workingadvantage.com",
  },
  {
    name: "GitHub for Startups",
    description: "Free GitHub Enterprise + Advanced Security for eligible startups. Includes co-marketing support and visibility through GitHub channels.",
    badge: "Developer",
    href: "https://resources.github.com/startups/?pid=ImagineEngineStudios",
    accent: "from-slate-700 to-slate-900",
    glow: "hsl(220 15% 35%)",
    domain: "github.com",
  },
  {
    name: "HubSpot for Startups",
    description: "Up to 75% off HubSpot's CRM, Marketing, Sales and Service hubs for eligible startups. Sign up with our partner code or book a 1:1 demo.",
    badge: "CRM",
    href: "https://app.hubspot.com/signup-hubspot/hubspot-for-startups?partner-code=oM6XbSiB9yc5&program=startups",
    secondaryHref: "https://meetings.hubspot.com/brie-perry/demo",
    secondaryLabel: "Book demo",
    accent: "from-orange-500 to-amber-600",
    glow: "hsl(25 95% 55%)",
    domain: "hubspot.com",
  },
  {
    name: "MongoDB for Startups",
    description: "Up to $5,000 in Atlas credits + expert technical advice.",
    badge: "Database",
    href: "https://www.mongodb.com/startups",
    accent: "from-green-600 to-emerald-700",
    glow: "hsl(150 80% 40%)",
    domain: "mongodb.com",
  },
  {
    name: "10 Credits on Lovable",
    description: "Bonus credits to ship your next idea on Lovable.",
    badge: "AI Credits",
    href: "https://lovable.dev/",
    accent: "from-pink-500 via-fuchsia-500 to-violet-500",
    glow: "hsl(310 85% 60%)",
    domain: "lovable.dev",
  },
];

export default function AIFeaturesHub() {
  const [openTool, setOpenTool] = useState<ToolId | null>(null);
  const [lightPaperTab, setLightPaperTab] = useState("document");
  const [summaryText, setSummaryText] = useState("");
  const [translationText, setTranslationText] = useState("");

  // Persistent ordering / expansion
  const toolsOrderHook = useOrderedList<ToolId>(
    "aiHub.toolsOrder.v1",
    TOOLS.map((t) => t.id),
  );
  const perksOrderHook = useOrderedList<string>(
    "aiHub.perksOrder.v1",
    PERKS.map((p) => p.name),
  );
  const toolsExpand = useExpanded("aiHub.toolsExpanded.v1");
  const perksExpand = useExpanded("aiHub.perksExpanded.v1");

  const [dragTool, setDragTool] = useState<ToolId | null>(null);
  const [dragPerk, setDragPerk] = useState<string | null>(null);

  const orderedTools = toolsOrderHook.order
    .map((id) => TOOLS.find((t) => t.id === id))
    .filter(Boolean) as DeskTool[];
  const orderedPerks = perksOrderHook.order
    .map((name) => PERKS.find((p) => p.name === name))
    .filter(Boolean) as Perk[];

  const close = () => setOpenTool(null);


  return (
    <div className="space-y-6">
      {/* ── Desk header ─────────────────────────────────────────── */}
      <div className="relative tech-card border-0 rounded-2xl p-5 sm:p-6 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, hsl(160 80% 45%) 0%, transparent 70%)" }}
        />
        <div className="relative flex items-start sm:items-center gap-4 flex-col sm:flex-row">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Founder Workstation
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold mt-0.5">Your Tools Desk</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Every utility you need, arranged like a workbench. Tap a tool to open it.
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-end text-right shrink-0">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Tools available
            </span>
            <span className="text-2xl font-bold tabular-nums bg-gradient-to-br from-primary to-emerald-400 bg-clip-text text-transparent">
              {TOOLS.length}
            </span>
          </div>
        </div>
      </div>

      {/* ── Bento desk grid (draggable & expandable) ─────────── */}
      <div className="flex items-center justify-between mb-1 px-1">
        <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/80">
          Drag to reorder · click to expand · pin favourites
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-[10px] uppercase tracking-wider gap-1.5"
          onClick={() => { toolsOrderHook.reset(); toolsExpand.toggle("__noop__"); toolsExpand.toggle("__noop__"); }}
        >
          <RotateCcw className="h-3 w-3" /> Reset
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {orderedTools.map((tool) => (
          <ToolCard
            key={tool.id}
            tool={tool}
            expanded={toolsExpand.expanded.has(tool.id)}
            isDragging={dragTool === tool.id}
            onOpen={() => setOpenTool(tool.id)}
            onToggleExpand={() => toolsExpand.toggle(tool.id)}
            onPinTop={() => toolsOrderHook.pinTop(tool.id)}
            onDragStart={() => setDragTool(tool.id)}
            onDragEnd={() => setDragTool(null)}
            onDropOn={() => { if (dragTool) toolsOrderHook.move(dragTool, tool.id); setDragTool(null); }}
          />
        ))}
      </div>


      {/* ── LightPaper fullscreen ─────────────────────────────── */}
      <Dialog open={openTool === "lightpaper"} onOpenChange={(o) => !o && close()}>
        <DialogContent className="tech-card border-0 !transition-none max-w-[95vw] w-full h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-lg sm:text-xl">LightPaper Workspace</DialogTitle>
                  <DialogDescription className="text-sm">
                    Documents, spreadsheets, and presentations
                  </DialogDescription>
                </div>
              </div>
              <div className="flex border rounded-lg p-1 bg-muted/30">
                {([
                  ["document", FileText, "Document"],
                  ["spreadsheet", Table, "Spreadsheet"],
                  ["presentation", Presentation, "Presentation"],
                ] as const).map(([key, Icon, title]) => (
                  <Button
                    key={key}
                    variant={lightPaperTab === key ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setLightPaperTab(key)}
                    title={title}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <Tabs value={lightPaperTab} onValueChange={setLightPaperTab} className="w-full h-full">
              <TabsContent value="document" className="mt-0 h-full">
                <LightPaperDocument selectedProject={null} />
              </TabsContent>
              <TabsContent value="spreadsheet" className="mt-0 h-full">
                <LightPaperSpreadsheet />
              </TabsContent>
              <TabsContent value="presentation" className="mt-0 h-full">
                <LightPaperPresentation />
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── CRM fullscreen ─────────────────────────────────────── */}
      <Dialog open={openTool === "crm"} onOpenChange={(o) => !o && close()}>
        <DialogContent className="tech-card border-0 !transition-none max-w-[95vw] w-full h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                <Kanban className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl">CRM Board</DialogTitle>
                <DialogDescription className="text-sm">
                  Pipeline, deals and contacts — drag, drop, close.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto pr-1">
            <CRMBoard />
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Imaginaly fullscreen ─────────────────────────────── */}
      <Dialog open={openTool === "image-creator"} onOpenChange={(o) => !o && close()}>
        <DialogContent className="tech-card border-0 !transition-none max-w-[95vw] w-full h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <img src={geniusAiLogo} alt="Imaginaly" className="h-5 w-5 object-contain" />
              Imaginaly
            </DialogTitle>
            <DialogDescription>
              Generate & edit stunning AI images from text prompts
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-hidden">
            <SFHImageCreator />
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Summary ─────────────────────────────────────────── */}
      <Dialog open={openTool === "summary"} onOpenChange={(o) => !o && close()}>
        <DialogContent className="tech-card border-0 !transition-none max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-violet-400" /> Smart Summaries
            </DialogTitle>
            <DialogDescription>Condense long content into key takeaways</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <label className="text-sm font-medium">Text to summarize</label>
            <Textarea
              placeholder="Paste a long article or transcript…"
              value={summaryText}
              onChange={(e) => setSummaryText(e.target.value)}
              rows={8}
              className="resize-none"
            />
            {summaryText && (
              <AISummaryCard
                text={summaryText}
                sourceType="demo"
                sourceId={crypto.randomUUID()}
                title="Summary"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Sentiment ───────────────────────────────────────── */}
      <Dialog open={openTool === "sentiment"} onOpenChange={(o) => !o && close()}>
        <DialogContent className="tech-card border-0 !transition-none max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" /> Sentiment Analysis
            </DialogTitle>
            <DialogDescription>Understand feedback at scale</DialogDescription>
          </DialogHeader>
          <SentimentAnalyzer />
        </DialogContent>
      </Dialog>

      {/* ── Translator ─────────────────────────────────────── */}
      <Dialog open={openTool === "translate"} onOpenChange={(o) => !o && close()}>
        <DialogContent className="tech-card border-0 !transition-none max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-orange-400" /> AI Translator
            </DialogTitle>
            <DialogDescription>Communicate globally with instant translations</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <label className="text-sm font-medium">Text to translate</label>
            <Textarea
              placeholder="Enter text in any language…"
              value={translationText}
              onChange={(e) => setTranslationText(e.target.value)}
              rows={8}
              className="resize-none"
            />
            {translationText && <AITranslator text={translationText} />}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Document ───────────────────────────────────────── */}
      <Dialog open={openTool === "document"} onOpenChange={(o) => !o && close()}>
        <DialogContent className="tech-card border-0 !transition-none max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-pink-400" /> Document Analysis
            </DialogTitle>
            <DialogDescription>Extract insights from images and documents</DialogDescription>
          </DialogHeader>
          <DocumentAnalyzer />
        </DialogContent>
      </Dialog>

      {/* ── Automation ────────────────────────────────────── */}
      <Dialog open={openTool === "automation"} onOpenChange={(o) => !o && close()}>
        <DialogContent className="tech-card border-0 !transition-none max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5 text-cyan-400" /> Task Automation
            </DialogTitle>
            <DialogDescription>Automate workflows and repetitive tasks</DialogDescription>
          </DialogHeader>
          <TaskAutomation />
        </DialogContent>
      </Dialog>

      {/* ── Founder Perks mosaic (draggable & expandable) ───── */}
      <div className="pt-2">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Gift className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Founder Perks
          </h3>
          <span className="text-xs text-muted-foreground/70">
            · {PERKS.length} partners · drag to reorder · click to expand
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-[10px] uppercase tracking-wider gap-1.5 ml-auto"
            onClick={() => perksOrderHook.reset()}
          >
            <RotateCcw className="h-3 w-3" /> Reset order
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {orderedPerks.map((perk) => (
            <PerkCard
              key={perk.name}
              perk={perk}
              expanded={perksExpand.expanded.has(perk.name)}
              isDragging={dragPerk === perk.name}
              onToggleExpand={() => perksExpand.toggle(perk.name)}
              onPinTop={() => perksOrderHook.pinTop(perk.name)}
              onDragStart={() => setDragPerk(perk.name)}
              onDragEnd={() => setDragPerk(null)}
              onDropOn={() => { if (dragPerk) perksOrderHook.move(dragPerk, perk.name); setDragPerk(null); }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}



/* ───────────────────────── Shared interactive shell ───────────────────────── */
interface CardShellProps {
  expanded: boolean;
  isDragging: boolean;
  onToggleExpand: () => void;
  onPinTop: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDropOn: () => void;
}

/* ───────────────────────── Perk card ───────────────────────── */
function PerkCard({
  perk,
  expanded,
  isDragging,
  onToggleExpand,
  onPinTop,
  onDragStart,
  onDragEnd,
  onDropOn,
}: { perk: Perk } & CardShellProps) {
  const isExternal = perk.href.startsWith("http");
  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(); }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
      onDrop={(e) => { e.preventDefault(); onDropOn(); }}
      className={cn(
        "group relative tech-card border-0 rounded-2xl p-5 overflow-hidden transition-all duration-300 flex flex-col",
        "hover:-translate-y-1 hover:shadow-[0_18px_50px_-12px_var(--perk-glow,hsl(var(--primary)/0.45))]",
        expanded ? "sm:col-span-2 lg:col-span-2 min-h-[260px]" : "min-h-[200px]",
        isDragging && "opacity-50 scale-[0.98]",
      )}
      style={{ ["--perk-glow" as never]: perk.glow }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-30 blur-3xl transition-opacity duration-500 group-hover:opacity-60"
        style={{ background: `radial-gradient(circle, ${perk.glow} 0%, transparent 70%)` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06] group-hover:opacity-[0.12] transition-opacity"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Drag handle + actions */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onPinTop(); }}
          title="Pin to top"
          className="h-7 w-7 rounded-md bg-background/60 backdrop-blur border border-border/50 flex items-center justify-center hover:bg-background"
        >
          <Pin className="h-3.5 w-3.5" />
        </button>
        <div
          title="Drag to reorder"
          className="h-7 w-7 rounded-md bg-background/60 backdrop-blur border border-border/50 flex items-center justify-center cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </div>
      </div>

      <button
        type="button"
        onClick={onToggleExpand}
        className="relative flex-1 flex flex-col justify-between gap-4 text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center shadow-lg shrink-0 ring-1 ring-black/5 overflow-hidden p-1.5">
            <img
              src={`https://logo.clearbit.com/${perk.domain}`}
              alt={`${perk.name} logo`}
              loading="lazy"
              className="h-full w-full object-contain"
              onError={(e) => {
                const img = e.currentTarget;
                img.onerror = null;
                img.src = `https://www.google.com/s2/favicons?sz=128&domain=${perk.domain}`;
              }}
            />
          </div>
          <span className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center gap-1 mr-16">
            <Sparkles className="h-2.5 w-2.5" /> Partner
          </span>
        </div>
        <div className="min-w-0">
          <h4 className="text-base font-semibold leading-tight">{perk.name}</h4>
          <p className={cn(
            "text-xs text-muted-foreground mt-1",
            expanded ? "" : "line-clamp-3",
          )}>
            {perk.description}
          </p>

          {expanded && (
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-medium text-foreground">Category:</span> {perk.badge}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground break-all">
                <span className="font-medium text-foreground">Link:</span> {perk.href}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1">
            <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
            {expanded ? "Collapse" : "Expand"}
          </span>
          <div className="flex items-center gap-1.5">
            {perk.secondaryHref && (
              <a
                href={perk.secondaryHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="h-8 px-3 rounded-full border border-border/60 bg-background/60 hover:bg-background flex items-center gap-1.5 text-xs font-medium transition"
              >
                {perk.secondaryLabel ?? "More"} <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <a
              href={perk.href}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "h-8 px-3 rounded-full bg-gradient-to-br flex items-center gap-1.5 text-white text-xs font-medium shadow-md transition-transform duration-300 hover:translate-x-0.5 hover:-translate-y-0.5",
                perk.accent,
              )}
            >
              Visit <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </button>
    </div>
  );
}

/* ───────────────────────── Tool card ───────────────────────── */
function ToolCard({
  tool,
  expanded,
  isDragging,
  onOpen,
  onToggleExpand,
  onPinTop,
  onDragStart,
  onDragEnd,
  onDropOn,
}: { tool: DeskTool; onOpen: () => void } & CardShellProps) {
  const Icon = tool.icon;
  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(); }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
      onDrop={(e) => { e.preventDefault(); onDropOn(); }}
      className={cn(
        "group relative tech-card border-0 rounded-2xl p-5 overflow-hidden transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-[0_18px_50px_-12px_var(--tool-glow,hsl(var(--primary)/0.45))]",
        expanded ? "sm:col-span-2 lg:col-span-2 min-h-[280px]" : "min-h-[200px]",
        isDragging && "opacity-50 scale-[0.98]",
      )}
      style={{ ["--tool-glow" as never]: tool.glow }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-30 blur-3xl transition-opacity duration-500 group-hover:opacity-60"
        style={{ background: `radial-gradient(circle, ${tool.glow} 0%, transparent 70%)` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06] group-hover:opacity-[0.12] transition-opacity"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(120deg, transparent 30%, ${tool.glow}33 50%, transparent 70%)` }}
      />

      {/* Drag handle + actions */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onPinTop(); }}
          title="Pin to top"
          className="h-7 w-7 rounded-md bg-background/60 backdrop-blur border border-border/50 flex items-center justify-center hover:bg-background"
        >
          <Pin className="h-3.5 w-3.5" />
        </button>
        <div
          title="Drag to reorder"
          className="h-7 w-7 rounded-md bg-background/60 backdrop-blur border border-border/50 flex items-center justify-center cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </div>
      </div>

      <button
        type="button"
        onClick={onToggleExpand}
        className="relative h-full w-full text-left flex flex-col justify-between gap-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className={cn("h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg shrink-0", tool.accent)}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          {tool.badge && (
            <span className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full bg-background/60 border border-border/50 text-muted-foreground mr-16">
              {tool.badge}
            </span>
          )}
        </div>

        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-semibold leading-tight">{tool.title}</h3>
          <p className={cn("text-xs sm:text-sm text-muted-foreground mt-1", expanded ? "" : "line-clamp-2")}>
            {tool.tagline}
          </p>

          {expanded && (
            <ul className="mt-3 space-y-1.5">
              {tool.capabilities.map((c) => (
                <li key={c} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tool.glow }} />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between pt-1 gap-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1">
            <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
            {expanded ? "Collapse" : "Expand"}
          </span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onOpen(); }}
            className={cn(
              "h-8 px-3 rounded-full bg-gradient-to-br flex items-center gap-1.5 text-white text-xs font-medium shadow-md transition-transform duration-300 hover:translate-x-0.5 hover:-translate-y-0.5",
              tool.accent,
            )}
          >
            Open <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </button>
    </div>
  );
}

