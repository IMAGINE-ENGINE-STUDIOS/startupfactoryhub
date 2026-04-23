import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Network,
  BarChart3,
  AlertTriangle,
  FileText,
  Building2,
  Sparkles,
  Cpu,
  Zap,
  Globe,
  Activity,
  ArrowUp,
  Check,
  SkipForward,
  RotateCcw,
  MessageSquare,
  StickyNote,
  History,
} from "lucide-react";
import BayesForgeNetworkGraph from "./BayesForgeNetworkGraph";
import BayesForgeSimulation from "./BayesForgeSimulation";
import BayesForgeRiskPanel from "./BayesForgeRiskPanel";
import BayesForgeReport from "./BayesForgeReport";
import FlowInvestigatePanel from "./FlowInvestigatePanel";
import FlowNotesPanel from "./FlowNotesPanel";
import FlowHistoryPanel from "./FlowHistoryPanel";
import FlowRoadmap from "./FlowRoadmap";
import FlowQuickAskBar from "./FlowQuickAskBar";
import { useFlowSession } from "@/hooks/useFlowSession";
import type { BayesForgeState } from "@/hooks/useBayesForgeState";
import { cn } from "@/lib/utils";

interface Props {
  state: BayesForgeState;
  sourceSelector?: React.ReactNode;
}

export default function BayesForgeEngine({ state, sourceSelector }: Props) {
  const {
    idea, setIdea, domain, setDomain, region, setRegion,
    constraints, setConstraints, isLoading, result, activeTab, setActiveTab,
    companyContext, includeCompanyData, setIncludeCompanyData,
    fieldsAutoFilled, runAnalysis, restoreResult, clearResult,
  } = state;

  // ===== Conversational queue state =====
  type StepKey = "idea" | "domain" | "region" | "constraints";
  const STEPS: { key: StepKey; label: string; placeholder: string; required?: boolean; accent: "violet" | "cyan" | "emerald" | "amber" }[] = [
    { key: "idea", label: "What's your startup idea?", placeholder: "Describe your startup idea in one sentence…", required: true, accent: "violet" },
    { key: "domain", label: "Which market domain?", placeholder: "e.g., FinTech, HealthTech, CleanEnergy", accent: "cyan" },
    { key: "region", label: "Geographic region?", placeholder: "e.g., North America, Sub-Saharan Africa", accent: "emerald" },
    { key: "constraints", label: "Any constraints or risks?", placeholder: "Regulatory limits, budget cap, technical constraints…", accent: "amber" },
  ];

  const valueFor = (k: StepKey) =>
    k === "idea" ? idea : k === "domain" ? domain : k === "region" ? region : constraints;
  const setValueFor = (k: StepKey, v: string) => {
    if (k === "idea") setIdea(v);
    else if (k === "domain") setDomain(v);
    else if (k === "region") setRegion(v);
    else setConstraints(v);
  };

  const initialStepIndex = (() => {
    if (!idea.trim()) return 0;
    if (!domain.trim()) return 1;
    if (!region.trim()) return 2;
    if (!constraints.trim()) return 3;
    return 4;
  })();

  const [stepIndex, setStepIndex] = useState<number>(initialStepIndex);
  const [draft, setDraft] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const isReady = stepIndex >= STEPS.length;
  const currentStep = !isReady ? STEPS[stepIndex] : null;

  useEffect(() => {
    if (!isReady) {
      inputRef.current?.focus();
      setDraft(valueFor(STEPS[stepIndex].key));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  const submitStep = () => {
    if (!currentStep) return;
    const trimmed = draft.trim();
    if (currentStep.required && !trimmed) return;
    setValueFor(currentStep.key, trimmed);
    setDraft("");
    setStepIndex((i) => i + 1);
  };

  const skipStep = () => {
    if (!currentStep || currentStep.required) return;
    setValueFor(currentStep.key, "");
    setDraft("");
    setStepIndex((i) => i + 1);
  };

  const editStep = (i: number) => {
    setStepIndex(i);
  };

  const resetQueue = () => {
    clearResult();
    setIdea(""); setDomain(""); setRegion(""); setConstraints("");
    setDraft(""); setStepIndex(0);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitStep();
    }
  };

  const accentMap: Record<string, { ring: string; border: string; dot: string; glow: string; text: string; bg: string }> = {
    violet: { ring: "focus-visible:ring-violet-400/60", border: "border-violet-400/40", dot: "bg-violet-400", glow: "shadow-[0_0_28px_-6px_hsl(263_70%_60%)]", text: "text-violet-300", bg: "from-violet-500/10" },
    cyan: { ring: "focus-visible:ring-cyan-400/60", border: "border-cyan-400/40", dot: "bg-cyan-400", glow: "shadow-[0_0_28px_-6px_hsl(190_90%_55%)]", text: "text-cyan-300", bg: "from-cyan-500/10" },
    emerald: { ring: "focus-visible:ring-emerald-400/60", border: "border-emerald-400/40", dot: "bg-emerald-400", glow: "shadow-[0_0_28px_-6px_hsl(150_80%_50%)]", text: "text-emerald-300", bg: "from-emerald-500/10" },
    amber: { ring: "focus-visible:ring-amber-400/60", border: "border-amber-400/40", dot: "bg-amber-400", glow: "shadow-[0_0_28px_-6px_hsl(40_90%_55%)]", text: "text-amber-300", bg: "from-amber-500/10" },
  };

  const accent = currentStep ? accentMap[currentStep.accent] : accentMap.violet;

  // Persistent investigation session (Q&A, notes, history)
  const flowApi = useFlowSession({ result, idea, domain, region, constraints });

  return (
    <div className="relative" data-tour="flow-engine">
      {/* Ambient background: animated aurora + grid */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-2xl">
        <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,hsl(var(--primary)/0.25)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary)/0.25)_1px,transparent_1px)] [background-size:42px_42px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)]" />
        <div className="absolute -top-32 -left-24 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-violet-500/25 blur-3xl animate-pulse [animation-delay:1.2s]" />
        <div className="absolute top-1/3 right-1/3 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl animate-pulse [animation-delay:.6s]" />
      </div>

      {/* FLOW Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 blur-md opacity-70 animate-pulse" />
            <div className="relative h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Cpu className="h-5 w-5 text-white" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-300 bg-clip-text text-transparent">
                FLOW
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-violet-400/40 bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-violet-300">
                <Sparkles className="h-3 w-3" /> Reasoning Engine
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Probabilistic startup modeling · Bayesian inference · AI risk simulation
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-mono uppercase tracking-wider">Engine online</span>
        </div>
      </div>

      {/* Single full-width Results / Console panel */}
      <div className="w-full animate-fade-in">
        <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-background/80 to-background/40 backdrop-blur-xl shadow-[0_0_40px_-15px_hsl(var(--primary)/0.4)] overflow-hidden h-full min-h-[560px]">
          {/* HUD top bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-background/40">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-400/60" />
                <span className="h-2 w-2 rounded-full bg-amber-400/60" />
                <span className="h-2 w-2 rounded-full bg-emerald-400/60" />
              </div>
              <span className="ml-2 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                flow://output
              </span>
            </div>
            <div className="flex items-center gap-3">
              {!isReady && !isLoading && (
                <span className="text-[10px] font-mono uppercase tracking-wider text-violet-300 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
                  Step {stepIndex + 1} / {STEPS.length}
                </span>
              )}
              {isReady && !result && (
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Step {STEPS.length} / {STEPS.length}
                </span>
              )}
              {result && (
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Inference Complete
                </span>
              )}
              {sourceSelector}
            </div>
          </div>

          <div className="p-4 sm:p-6 overflow-auto">
            {/* ========== EMPTY STATE: Ready widget + Chat queue input ========== */}
            {!result && !isLoading && (
              <div className="flex flex-col items-center gap-6 py-6 animate-fade-in">
                {/* Ready to Analyze widget */}
                <div className="text-center max-w-md">
                  <div className="relative mx-auto w-fit">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 blur-2xl opacity-60 animate-pulse" />
                    <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500/30 via-violet-500/30 to-cyan-500/30 border border-violet-400/40 flex items-center justify-center backdrop-blur">
                      <Network className="h-10 w-10 text-violet-300" />
                    </div>
                  </div>
                  <h3 className="mt-4 text-xl font-bold bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                    Ready to Analyze
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    Answer a few quick prompts below. Press <kbd className="px-1.5 py-0.5 rounded border border-white/15 bg-background/60 text-[10px] font-mono">Enter</kbd> to advance.
                  </p>
                  <div className="mt-4 grid grid-cols-3 gap-2 max-w-xs mx-auto">
                    {[
                      { icon: Network, label: "Bayesian" },
                      { icon: BarChart3, label: "Simulation" },
                      { icon: AlertTriangle, label: "Risk" },
                    ].map(({ icon: Icon, label }) => (
                      <div
                        key={label}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg border border-white/10 bg-background/40"
                      >
                        <Icon className="h-4 w-4 text-violet-400" />
                        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ========== Chat queue input bar ========== */}
                <div className="w-full max-w-2xl space-y-3">
                  {/* Captured answers (history) */}
                  {STEPS.slice(0, stepIndex).map((s, i) => {
                    const v = valueFor(s.key);
                    const a = accentMap[s.accent];
                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => editStep(i)}
                        className="w-full text-left group flex items-start gap-3 p-3 rounded-xl border border-white/10 bg-background/40 hover:bg-background/60 hover:border-white/20 transition-all animate-fade-in"
                      >
                        <span className={cn("mt-1 h-6 w-6 rounded-full flex items-center justify-center shrink-0", a.bg, "bg-gradient-to-br to-transparent border", a.border)}>
                          <Check className={cn("h-3.5 w-3.5", a.text)} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{s.label}</div>
                          <div className="text-sm text-foreground/90 truncate">
                            {v || <span className="italic text-muted-foreground/70">— skipped —</span>}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground/60 group-hover:text-violet-300 transition-colors">edit</span>
                      </button>
                    );
                  })}

                  {/* Current question */}
                  {!isReady && currentStep && (
                    <div className={cn("relative rounded-2xl border bg-background/50 backdrop-blur-xl overflow-hidden animate-fade-in", accent.border, accent.glow)}>
                      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
                        <span className={cn("h-2 w-2 rounded-full animate-pulse", accent.dot)} />
                        <span className={cn("text-xs font-mono uppercase tracking-wider", accent.text)}>
                          {currentStep.label}
                        </span>
                        {currentStep.required ? (
                          <span className="text-[10px] font-mono text-rose-300">required</span>
                        ) : (
                          <span className="text-[10px] font-mono text-muted-foreground/60">optional · press Enter to skip</span>
                        )}
                        <span className="ml-auto text-[10px] font-mono text-muted-foreground/60">
                          {stepIndex + 1}/{STEPS.length}
                        </span>
                      </div>
                      <div className="flex items-end gap-2 px-3 pb-3">
                        <Input
                          ref={inputRef}
                          placeholder={currentStep.placeholder}
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={onKeyDown}
                          autoFocus
                          className={cn(
                            "flex-1 h-12 text-base bg-background/60 border-white/10 transition-all",
                            accent.ring
                          )}
                        />
                        {!currentStep.required && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={skipStep}
                            className="h-12 w-12 shrink-0 text-muted-foreground hover:text-foreground"
                            title="Skip"
                          >
                            <SkipForward className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          onClick={submitStep}
                          disabled={currentStep.required && !draft.trim()}
                          className="h-12 w-12 shrink-0 p-0 bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-500 hover:from-indigo-600 hover:via-violet-600 hover:to-cyan-600 text-white shadow-lg shadow-violet-500/30 disabled:opacity-40"
                          title="Send"
                        >
                          <ArrowUp className="h-5 w-5" />
                        </Button>
                      </div>
                      {/* Progress bar */}
                      <div className="h-0.5 bg-white/5">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-400 transition-all duration-500"
                          style={{ width: `${((stepIndex + (draft ? 0.5 : 0)) / STEPS.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Ready to launch */}
                  {isReady && (
                    <div className="rounded-2xl border border-violet-400/40 bg-gradient-to-br from-violet-500/10 via-indigo-500/5 to-cyan-500/10 p-4 sm:p-5 backdrop-blur-xl shadow-[0_0_40px_-10px_hsl(263_70%_60%)] animate-fade-in space-y-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-violet-300" />
                        <span className="text-xs font-mono uppercase tracking-wider text-violet-200">
                          All inputs captured · ready to run
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={resetQueue}
                          className="ml-auto h-7 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                        >
                          <RotateCcw className="h-3 w-3" /> Reset
                        </Button>
                      </div>

                      {companyContext && (
                        <label className="flex items-start gap-2.5 p-3 rounded-xl border border-violet-400/30 bg-background/40 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={includeCompanyData}
                            onChange={(e) => setIncludeCompanyData(e.target.checked)}
                            className="mt-1 h-4 w-4 accent-violet-500"
                          />
                          <span className="text-xs leading-relaxed flex-1">
                            <span className="flex items-center gap-1.5 font-semibold text-sm mb-0.5">
                              <Building2 className="h-3.5 w-3.5 text-violet-400" />
                              Include my company data
                            </span>
                            <span className="text-muted-foreground">
                              Enrich analysis with {companyContext.name}'s profile, funding history & platform market data
                            </span>
                          </span>
                        </label>
                      )}

                      {fieldsAutoFilled && companyContext && (
                        <p className="text-[11px] text-violet-300/80 italic flex items-center gap-1.5">
                          <Sparkles className="h-3 w-3" />
                          Fields auto-filled from your company profile
                        </p>
                      )}

                      <Button
                        onClick={runAnalysis}
                        disabled={isLoading || !idea.trim()}
                        className={cn(
                          "w-full h-12 text-sm font-semibold tracking-wide relative overflow-hidden group",
                          "bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500 hover:from-indigo-600 hover:via-violet-600 hover:to-cyan-600",
                          "shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all duration-300",
                          "border-0 text-white"
                        )}
                        size="lg"
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        <Activity className="mr-2 h-4 w-4" />
                        Run Flow Analysis
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========== LOADING ========== */}
            {isLoading && (
              <div className="min-h-[420px] flex items-center justify-center">
                <div className="text-center space-y-5 animate-fade-in">
                  <div className="relative mx-auto h-20 w-20">
                    <div className="absolute inset-0 rounded-full border-2 border-violet-400/20" />
                    <div className="absolute inset-0 rounded-full border-t-2 border-violet-400 animate-spin" />
                    <div className="absolute inset-2 rounded-full border-2 border-cyan-400/20" />
                    <div className="absolute inset-2 rounded-full border-b-2 border-cyan-400 animate-spin [animation-direction:reverse] [animation-duration:1.2s]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Cpu className="h-7 w-7 text-violet-300" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                      Building Bayesian Network...
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Modeling variables · Running simulations · Assessing risks
                    </p>
                    <div className="mt-4 flex justify-center gap-1.5">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <span
                          key={i}
                          className="h-1.5 w-8 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 opacity-30 animate-pulse"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========== RESULT ========== */}
            {result && !isLoading && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col animate-fade-in">
                <TabsList
                  data-tour="flow-tabs"
                  className="w-full justify-start shrink-0 bg-background/50 border border-white/10 p-1 h-auto flex-wrap gap-1"
                >
                  {[
                    { value: "model", icon: Network, label: "Model" },
                    { value: "simulation", icon: BarChart3, label: "Simulation" },
                    { value: "risk", icon: AlertTriangle, label: "Risk" },
                    { value: "report", icon: FileText, label: "Report" },
                    { value: "investigate", icon: MessageSquare, label: "Investigate" },
                    { value: "notes", icon: StickyNote, label: "Notes" },
                    { value: "history", icon: History, label: "History" },
                  ].map(({ value, icon: Icon, label }) => (
                    <TabsTrigger
                      key={value}
                      value={value}
                      data-tour={`flow-tab-${value}`}
                      className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500/20 data-[state=active]:to-cyan-500/20 data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_15px_-5px_hsl(263_70%_60%)] data-[state=active]:border data-[state=active]:border-violet-400/30 transition-all"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
                <div className="flex-1 overflow-auto mt-4 pr-1">
                  <TabsContent value="model" className="mt-0 animate-fade-in">
                    <BayesForgeNetworkGraph nodes={result.network.nodes} edges={result.network.edges} />
                  </TabsContent>
                  <TabsContent value="simulation" className="mt-0 animate-fade-in">
                    <BayesForgeSimulation data={result.simulation} />
                  </TabsContent>
                  <TabsContent value="risk" className="mt-0 animate-fade-in">
                    <BayesForgeRiskPanel data={result.risk} />
                  </TabsContent>
                  <TabsContent value="report" className="mt-0 animate-fade-in">
                    <BayesForgeReport data={result} idea={idea} domain={domain} region={region} />
                  </TabsContent>
                  <TabsContent value="investigate" className="mt-0 animate-fade-in h-full">
                    <FlowInvestigatePanel api={flowApi} />
                  </TabsContent>
                  <TabsContent value="notes" className="mt-0 animate-fade-in">
                    <FlowNotesPanel api={flowApi} />
                  </TabsContent>
                  <TabsContent value="history" className="mt-0 animate-fade-in">
                    <FlowHistoryPanel
                      api={flowApi}
                      onOpen={async (id) => {
                        const session = await flowApi.loadSession(id);
                        if (!session) return;
                        restoreResult({
                          idea: session.idea,
                          domain: session.domain,
                          region: session.region,
                          constraints: session.constraints,
                          result: session.result,
                          activeTab: "model",
                        });
                        setActiveTab("model");
                      }}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            )}

            {/* ========== EMPTY-STATE History access ========== */}
            {!result && !isLoading && flowApi.sessions.length > 0 && (
              <div className="mt-6 max-w-2xl mx-auto">
                <FlowHistoryPanel
                  api={flowApi}
                  onOpen={async (id) => {
                    const session = await flowApi.loadSession(id);
                    if (!session) return;
                    restoreResult({
                      idea: session.idea,
                      domain: session.domain,
                      region: session.region,
                      constraints: session.constraints,
                      result: session.result,
                      activeTab: "model",
                    });
                    setActiveTab("model");
                  }}
                />
              </div>
            )}

            {/* ========== Bottom: Gamified Roadmap (always visible while a session is active) ========== */}
            {result && !isLoading && (
              <div className="mt-4 animate-fade-in">
                <FlowRoadmap
                  api={flowApi}
                  onJump={() => setActiveTab("investigate")}
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={resetQueue}
                    className="text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">New Flow</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
