import { useState } from "react";
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
  Layers,
  Gift,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import tradingViewBanner from "@/assets/tradingview-banner.jpg";

type ToolId =
  | "lightpaper"
  | "crm"
  | "image-creator"
  | "summary"
  | "sentiment"
  | "translate"
  | "document"
  | "automation"
  | "perks";

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
}

const PERKS: Perk[] = [
  {
    name: "Flippa",
    description: "Buy & sell digital businesses, apps and online assets.",
    badge: "Marketplace",
    href: "https://flippa.com/",
    accent: "from-emerald-500 to-lime-600",
    glow: "hsl(140 80% 45%)",
  },
  {
    name: "Regus Office Spaces",
    description: "Discounted private offices and coworking in 3,000+ locations.",
    badge: "Workspace",
    href: "https://www.regus.com/",
    accent: "from-blue-600 to-indigo-700",
    glow: "hsl(220 80% 55%)",
  },
  {
    name: "TradingView",
    description: "Track markets and analyze charts — official affiliate link.",
    badge: "Finance",
    href: "https://www.tradingview.com/?aff_id=162505",
    accent: "from-blue-500 to-cyan-500",
    glow: "hsl(200 85% 55%)",
  },
  {
    name: "PitchPerfecter",
    description: "AI-powered pitch deck coaching for founders.",
    badge: "Fundraising",
    href: "https://pitchperfecter.ai/",
    accent: "from-purple-500 to-fuchsia-600",
    glow: "hsl(290 80% 60%)",
  },
  {
    name: "Pump",
    description: "Save up to 60% on AWS costs with automated optimization.",
    badge: "Cloud Savings",
    href: "https://www.pump.co/",
    accent: "from-orange-500 to-red-500",
    glow: "hsl(15 85% 55%)",
  },
  {
    name: "HeyBoss",
    description: "AI agent that builds your website, app or store in minutes.",
    badge: "Builder",
    href: "https://www.heyboss.xyz/",
    accent: "from-rose-500 to-pink-600",
    glow: "hsl(340 80% 60%)",
  },
  {
    name: "LivePlan",
    description: "Business planning, forecasting and pitch tools for startups.",
    badge: "Planning",
    href: "https://www.liveplan.com/",
    accent: "from-teal-500 to-emerald-600",
    glow: "hsl(170 75% 45%)",
  },
  {
    name: "Folk CRM",
    description: "The CRM that feels like a personal network — clean & fast.",
    badge: "CRM",
    href: "https://www.folk.app/",
    accent: "from-violet-500 to-indigo-600",
    glow: "hsl(260 80% 65%)",
  },
  {
    name: "Hostinger",
    description: "Affordable hosting, domains and VPS for early-stage builds.",
    badge: "Hosting",
    href: "https://www.hostinger.com/",
    accent: "from-indigo-500 to-purple-600",
    glow: "hsl(250 75% 60%)",
  },
  {
    name: "Working Advantage",
    description: "Use code STARTUPPERKS for exclusive lifestyle benefits.",
    badge: "Lifestyle",
    href: "https://www.workingadvantage.com/?tab=h",
    accent: "from-amber-500 to-orange-500",
    glow: "hsl(35 95% 55%)",
  },
  {
    name: "GitHub for Startups",
    description: "Free GitHub Enterprise + Advanced Security for eligible startups.",
    badge: "Developer",
    href: "https://github.com/enterprise/startups",
    accent: "from-slate-700 to-slate-900",
    glow: "hsl(220 15% 35%)",
  },
  {
    name: "MongoDB for Startups",
    description: "Up to $5,000 in Atlas credits + expert technical advice.",
    badge: "Database",
    href: "https://www.mongodb.com/startups",
    accent: "from-green-600 to-emerald-700",
    glow: "hsl(150 80% 40%)",
  },
  {
    name: "GitHub Marketing Team",
    description: "Co-marketing support and visibility through GitHub channels.",
    badge: "Marketing",
    href: "mailto:startups@github.com",
    accent: "from-zinc-700 to-neutral-900",
    glow: "hsl(0 0% 30%)",
  },
  {
    name: "10 Credits on Lovable",
    description: "Bonus credits to ship your next idea on Lovable.",
    badge: "AI Credits",
    href: "https://lovable.dev/",
    accent: "from-pink-500 via-fuchsia-500 to-violet-500",
    glow: "hsl(310 85% 60%)",
  },
];

export default function AIFeaturesHub() {
  const [openTool, setOpenTool] = useState<ToolId | null>(null);
  const [lightPaperTab, setLightPaperTab] = useState("document");
  const [summaryText, setSummaryText] = useState("");
  const [translationText, setTranslationText] = useState("");

  const close = () => setOpenTool(null);

  const sizeClass: Record<DeskTool["size"], string> = {
    lg: "lg:col-span-2 lg:row-span-2 min-h-[280px]",
    md: "lg:col-span-2 min-h-[200px]",
    sm: "min-h-[180px]",
  };

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
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/30 to-emerald-500/30 border border-primary/30 flex items-center justify-center shadow-[0_0_30px_hsl(var(--primary)/0.35)]">
            <Layers className="h-7 w-7 text-primary" />
          </div>
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

      {/* ── Bento desk grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TOOLS.map((tool) => (
          <ToolCard
            key={tool.id}
            tool={tool}
            sizeClass={sizeClass[tool.size]}
            onOpen={() => setOpenTool(tool.id)}
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

      {/* ── Founder Perks ────────────────────────────────── */}
      <PerksDialog open={openTool === "perks"} onClose={close} />
    </div>
  );
}

/* ───────────────────────── Perks Dialog ───────────────────────── */
const PERK_CATEGORIES = [
  "Electronics", "Appliances", "Hotels", "Movie Tickets",
  "Theme Parks", "Rental Cars", "Gift Cards", "Fitness",
  "Groceries", "Travel",
];

const PARTNER_PERKS = [
  {
    name: "TradingView",
    description: "Track markets, analyze charts & follow tickers in real-time.",
    href: "https://www.tradingview.com/?aff_id=162505",
    accent: "from-blue-500/15 to-blue-600/10 border-blue-500/30",
    tag: "Affiliate link",
  },
  {
    name: "HSBC Innovation Banking",
    description: "Free banking services tailored for venture-backed startups.",
    href: "mailto:safi.keshvargar@us.hsbc.com",
    accent: "from-red-500/15 to-red-600/10 border-red-500/30",
    tag: "Direct intro",
  },
  {
    name: "Working Advantage",
    description: "Exclusive marketplace — use the code below to unlock perks.",
    href: "https://www.workingadvantage.com/?tab=h",
    accent: "from-amber-500/15 to-orange-500/10 border-amber-500/30",
    tag: "Referral code",
  },
];

function PerksDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const code = "STARTUPPERKS";

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Referral code copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="tech-card border-0 !transition-none max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-amber-500" /> Founder Perks
          </DialogTitle>
          <DialogDescription>
            Exclusive partner benefits, referral links and savings for founders, mentors & advisors.
          </DialogDescription>
        </DialogHeader>

        {/* Referral code card */}
        <div className="rounded-xl p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Working Advantage referral code
              </p>
              <p className="text-2xl font-bold tracking-wider text-amber-600 dark:text-amber-400">
                {code}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={copyCode} className="gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy code"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Enter this code when signing up at workingadvantage.com to unlock all benefits.
          </p>
        </div>

        {/* Partner perks */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Featured partner perks</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {PARTNER_PERKS.map((p) => (
              <a
                key={p.name}
                href={p.href}
                target={p.href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className={cn(
                  "group flex flex-col gap-2 p-4 rounded-xl bg-gradient-to-br border transition-all hover:-translate-y-0.5 hover:shadow-lg",
                  p.accent,
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{p.name}</span>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">{p.description}</p>
                <Badge variant="outline" className="self-start text-[10px] uppercase tracking-wider">
                  {p.tag}
                </Badge>
              </a>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Available benefit categories</p>
          <div className="flex flex-wrap gap-2">
            {PERK_CATEGORIES.map((c) => (
              <Badge key={c} variant="secondary" className="text-xs">
                {c}
              </Badge>
            ))}
          </div>
        </div>

        {/* TradingView banner */}
        <a
          href="https://www.tradingview.com/?aff_id=162505"
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl overflow-hidden border border-border hover:opacity-90 transition-opacity"
        >
          <img src={tradingViewBanner} alt="TradingView official partner" className="w-full h-auto" />
        </a>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-2"
            onClick={() => window.open("https://www.workingadvantage.com/?tab=h", "_blank")}
          >
            <ExternalLink className="h-4 w-4" />
            Access your perks
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => window.open("mailto:customerservice@workingadvantage.com", "_blank")}
          >
            Contact support
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


/* ───────────────────────── Tool card ───────────────────────── */
function ToolCard({
  tool,
  sizeClass,
  onOpen,
}: {
  tool: DeskTool;
  sizeClass: string;
  onOpen: () => void;
}) {
  const Icon = tool.icon;
  return (
    <button
      onClick={onOpen}
      className={cn(
        "group relative text-left tech-card border-0 rounded-2xl p-5 overflow-hidden transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-[0_18px_50px_-12px_var(--tool-glow,hsl(var(--primary)/0.45))]",
        "focus:outline-none focus:ring-2 focus:ring-primary/50",
        sizeClass,
      )}
      style={{ ["--tool-glow" as never]: tool.glow }}
    >
      {/* Ambient gradient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-30 blur-3xl transition-opacity duration-500 group-hover:opacity-60"
        style={{ background: `radial-gradient(circle, ${tool.glow} 0%, transparent 70%)` }}
      />
      {/* Subtle grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06] group-hover:opacity-[0.12] transition-opacity"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      {/* Animated border sweep */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: `linear-gradient(120deg, transparent 30%, ${tool.glow}33 50%, transparent 70%)`,
        }}
      />

      <div className="relative h-full flex flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-3">
          <div
            className={cn(
              "h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg shrink-0",
              tool.accent,
            )}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
          {tool.badge && (
            <span className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full bg-background/60 border border-border/50 text-muted-foreground">
              {tool.badge}
            </span>
          )}
        </div>

        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-semibold leading-tight">{tool.title}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
            {tool.tagline}
          </p>

          {tool.size !== "sm" && (
            <ul className="mt-3 space-y-1">
              {tool.capabilities.map((c) => (
                <li key={c} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className="h-1 w-1 rounded-full"
                    style={{ backgroundColor: tool.glow }}
                  />
                  <span className="truncate">{c}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground/80">
            Tap to open
          </span>
          <div
            className={cn(
              "h-8 w-8 rounded-full bg-gradient-to-br flex items-center justify-center text-white shadow-md transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
              tool.accent,
            )}
          >
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </button>
  );
}
