import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Network, BarChart3, AlertTriangle, FileText } from "lucide-react";
import BayesForgeNetworkGraph from "./BayesForgeNetworkGraph";
import BayesForgeSimulation from "./BayesForgeSimulation";
import BayesForgeRiskPanel from "./BayesForgeRiskPanel";
import BayesForgeReport from "./BayesForgeReport";

interface BayesForgeResult {
  network: { nodes: any[]; edges: any[] };
  simulation: any;
  risk: any;
  logic: any;
}

export default function BayesForgeEngine() {
  const { toast } = useToast();
  const [idea, setIdea] = useState("");
  const [domain, setDomain] = useState("");
  const [region, setRegion] = useState("");
  const [constraints, setConstraints] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BayesForgeResult | null>(null);
  const [activeTab, setActiveTab] = useState("model");

  const runAnalysis = async () => {
    if (!idea.trim()) {
      toast({ title: "Error", description: "Please enter a startup idea", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("bayesforge-analyze", {
        body: { idea, domain, region, constraints },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResult(data);
      setActiveTab("model");
      toast({ title: "Analysis Complete", description: "BayesForge model generated successfully" });
    } catch (err: any) {
      console.error("BayesForge error:", err);
      toast({ title: "Error", description: err.message || "Failed to run analysis", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
      {/* Input Panel */}
      <div className="w-full lg:w-80 shrink-0 space-y-4">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Startup Idea *</label>
            <Textarea
              placeholder="Describe your startup idea..."
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Market Domain</label>
            <Input placeholder="e.g., FinTech, HealthTech, CleanEnergy" value={domain} onChange={(e) => setDomain(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Geographic Region</label>
            <Input placeholder="e.g., North America, Sub-Saharan Africa" value={region} onChange={(e) => setRegion(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Constraints / Risk Factors</label>
            <Textarea
              placeholder="Regulatory limits, budget cap, technical constraints..."
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <Button onClick={runAnalysis} disabled={isLoading || !idea.trim()} className="w-full" size="lg">
          {isLoading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</>
          ) : (
            "Run BayesForge Analysis"
          )}
        </Button>
      </div>

      {/* Results Panel */}
      <div className="flex-1 min-h-0 overflow-auto">
        {!result && !isLoading && (
          <div className="h-full flex items-center justify-center text-center p-8">
            <div className="space-y-3 max-w-md">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center mx-auto">
                <Network className="h-8 w-8 text-indigo-500" />
              </div>
              <h3 className="text-lg font-semibold">Ready to Analyze</h3>
              <p className="text-sm text-muted-foreground">
                Enter your startup idea and parameters, then run the analysis to generate a probabilistic model, simulation, and risk assessment.
              </p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <div>
                <h3 className="font-semibold">Building Bayesian Network...</h3>
                <p className="text-sm text-muted-foreground">Modeling variables, running simulations, assessing risks</p>
              </div>
            </div>
          </div>
        )}

        {result && !isLoading && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="w-full justify-start shrink-0">
              <TabsTrigger value="model" className="gap-2"><Network className="h-4 w-4" />Model</TabsTrigger>
              <TabsTrigger value="simulation" className="gap-2"><BarChart3 className="h-4 w-4" />Simulation</TabsTrigger>
              <TabsTrigger value="risk" className="gap-2"><AlertTriangle className="h-4 w-4" />Risk</TabsTrigger>
              <TabsTrigger value="report" className="gap-2"><FileText className="h-4 w-4" />Report</TabsTrigger>
            </TabsList>
            <div className="flex-1 overflow-auto mt-4">
              <TabsContent value="model" className="mt-0">
                <BayesForgeNetworkGraph nodes={result.network.nodes} edges={result.network.edges} />
              </TabsContent>
              <TabsContent value="simulation" className="mt-0">
                <BayesForgeSimulation data={result.simulation} />
              </TabsContent>
              <TabsContent value="risk" className="mt-0">
                <BayesForgeRiskPanel data={result.risk} />
              </TabsContent>
              <TabsContent value="report" className="mt-0">
                <BayesForgeReport data={result} idea={idea} domain={domain} region={region} />
              </TabsContent>
            </div>
          </Tabs>
        )}
      </div>
    </div>
  );
}
