import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
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
} from "lucide-react";
import BayesForgeNetworkGraph from "./BayesForgeNetworkGraph";
import BayesForgeSimulation from "./BayesForgeSimulation";
import BayesForgeRiskPanel from "./BayesForgeRiskPanel";
import BayesForgeReport from "./BayesForgeReport";
import type { BayesForgeState } from "@/hooks/useBayesForgeState";
import { cn } from "@/lib/utils";

interface Props {
  state: BayesForgeState;
}

export default function BayesForgeEngine({ state }: Props) {
  const {
    idea, setIdea, domain, setDomain, region, setRegion,
    constraints, setConstraints, isLoading, result, activeTab, setActiveTab,
    companyContext, includeCompanyData, setIncludeCompanyData,
    fieldsAutoFilled, runAnalysis,
  } = state;

  return (
    <div className="relative">
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

      <div className="flex flex-col lg:flex-row gap-5 h-full min-h-0">
        {/* Input Panel — Progressive single-bar console */}
        <div className="w-full lg:w-[380px] shrink-0 animate-fade-in">
          <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-background/80 to-background/40 p-4 sm:p-5 backdrop-blur-xl shadow-[0_0_40px_-15px_hsl(var(--primary)/0.4)] overflow-hidden">
            {/* Corner accents */}
            <div className="absolute top-0 left-0 h-8 w-8 border-l-2 border-t-2 border-violet-400/60 rounded-tl-2xl pointer-events-none" />
            <div className="absolute top-0 right-0 h-8 w-8 border-r-2 border-t-2 border-cyan-400/60 rounded-tr-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 h-8 w-8 border-l-2 border-b-2 border-cyan-400/60 rounded-bl-2xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 h-8 w-8 border-r-2 border-b-2 border-violet-400/60 rounded-br-2xl pointer-events-none" />

            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
              <Zap className="h-4 w-4 text-violet-400" />
              <span className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
                Input Vector
              </span>
              {idea.trim().length > 0 && (
                <span className="ml-auto text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Idea captured
                </span>
              )}
            </div>

            {/* Step 1 — Big idea bar (always visible) */}
            <div className="space-y-2">
              <label className="text-xs font-medium flex items-center gap-1.5 text-foreground/90">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_hsl(263_70%_60%)]" />
                What's your startup idea? <span className="text-violet-400">*</span>
              </label>
              <div className="relative">
                <Textarea
                  placeholder="Describe your startup idea in one sentence or a paragraph..."
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  rows={idea.trim().length > 0 ? 4 : 3}
                  autoFocus
                  className="resize-none border-white/10 bg-background/40 focus-visible:ring-violet-400/50 focus-visible:border-violet-400/60 transition-all text-sm pr-10"
                />
                <Sparkles className="absolute right-3 top-3 h-4 w-4 text-violet-400/60 pointer-events-none" />
              </div>
              {!idea.trim() && (
                <p className="text-[11px] text-muted-foreground/80 italic">
                  Tip: type your idea — extra parameters will appear automatically.
                </p>
              )}
            </div>

            {/* Steps 2-4 — slide in once an idea is entered */}
            <div
              className={cn(
                "grid transition-[grid-template-rows,opacity,margin] duration-500 ease-out overflow-hidden",
                idea.trim().length > 0
                  ? "grid-rows-[1fr] opacity-100 mt-4"
                  : "grid-rows-[0fr] opacity-0 mt-0"
              )}
            >
              <div className="min-h-0">
                <div className="space-y-3.5 animate-fade-in">
                  <div>
                    <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5 text-foreground/90">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_hsl(190_90%_55%)]" />
                      Market Domain
                      <span className="ml-auto text-[10px] text-muted-foreground/60">optional</span>
                    </label>
                    <Input
                      placeholder="e.g., FinTech, HealthTech, CleanEnergy"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className="border-white/10 bg-background/40 focus-visible:ring-cyan-400/50 focus-visible:border-cyan-400/60 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5 text-foreground/90">
                      <Globe className="h-3 w-3 text-emerald-400" />
                      Geographic Region
                      <span className="ml-auto text-[10px] text-muted-foreground/60">optional</span>
                    </label>
                    <Input
                      placeholder="e.g., North America, Sub-Saharan Africa"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="border-white/10 bg-background/40 focus-visible:ring-emerald-400/50 focus-visible:border-emerald-400/60 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1.5 flex items-center gap-1.5 text-foreground/90">
                      <AlertTriangle className="h-3 w-3 text-amber-400" />
                      Constraints / Risk Factors
                      <span className="ml-auto text-[10px] text-muted-foreground/60">optional</span>
                    </label>
                    <Textarea
                      placeholder="Regulatory limits, budget cap, technical constraints..."
                      value={constraints}
                      onChange={(e) => setConstraints(e.target.value)}
                      rows={2}
                      className="resize-none border-white/10 bg-background/40 focus-visible:ring-amber-400/50 focus-visible:border-amber-400/60 transition-all"
                    />
                  </div>

                  {companyContext && (
                    <div className="flex items-start gap-2.5 p-3 rounded-xl border border-violet-400/30 bg-gradient-to-br from-violet-500/10 to-indigo-500/5 backdrop-blur">
                      <Checkbox
                        id="include-company"
                        checked={includeCompanyData}
                        onCheckedChange={(checked) => setIncludeCompanyData(checked === true)}
                        className="mt-0.5 border-violet-400/50 data-[state=checked]:bg-violet-500 data-[state=checked]:border-violet-500"
                      />
                      <label htmlFor="include-company" className="text-xs leading-relaxed cursor-pointer flex-1">
                        <span className="flex items-center gap-1.5 font-semibold text-sm mb-0.5">
                          <Building2 className="h-3.5 w-3.5 text-violet-400" />
                          Include my company data
                        </span>
                        <span className="text-muted-foreground">
                          Enrich analysis with {companyContext.name}'s profile, funding history & platform market data
                        </span>
                      </label>
                    </div>
                  )}

                  {fieldsAutoFilled && companyContext && (
                    <p className="text-[11px] text-violet-300/80 italic flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3" />
                      Fields auto-filled from your company profile
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Button
              onClick={runAnalysis}
              disabled={isLoading || !idea.trim()}
              className={cn(
                "mt-5 w-full h-12 text-sm font-semibold tracking-wide relative overflow-hidden group",
                "bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500 hover:from-indigo-600 hover:via-violet-600 hover:to-cyan-600",
                "shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all duration-300",
                "border-0 text-white"
              )}
              size="lg"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</>
              ) : (
                <><Activity className="mr-2 h-4 w-4" />Run Flow Analysis</>
              )}
            </Button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="flex-1 min-h-0 min-w-0 animate-fade-in">
          <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-background/80 to-background/40 backdrop-blur-xl shadow-[0_0_40px_-15px_hsl(var(--primary)/0.4)] overflow-hidden h-full min-h-[500px]">
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
              {result && (
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Inference Complete
                </span>
              )}
            </div>

            <div className="p-4 sm:p-6 overflow-auto">
              {!result && !isLoading && (
                <div className="min-h-[420px] flex items-center justify-center text-center p-8">
                  <div className="space-y-4 max-w-md animate-fade-in">
                    <div className="relative mx-auto w-fit">
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 blur-2xl opacity-60 animate-pulse" />
                      <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500/30 via-violet-500/30 to-cyan-500/30 border border-violet-400/40 flex items-center justify-center backdrop-blur">
                        <Network className="h-10 w-10 text-violet-300" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                        Ready to Analyze
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                        Enter your startup idea and parameters, then run the analysis to generate a probabilistic model, simulation, and risk assessment.
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2 max-w-xs mx-auto">
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
                </div>
              )}

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

              {result && !isLoading && (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col animate-fade-in">
                  <TabsList className="w-full justify-start shrink-0 bg-background/50 border border-white/10 p-1 h-auto flex-wrap gap-1">
                    {[
                      { value: "model", icon: Network, label: "Model" },
                      { value: "simulation", icon: BarChart3, label: "Simulation" },
                      { value: "risk", icon: AlertTriangle, label: "Risk" },
                      { value: "report", icon: FileText, label: "Report" },
                    ].map(({ value, icon: Icon, label }) => (
                      <TabsTrigger
                        key={value}
                        value={value}
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
                  </div>
                </Tabs>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
