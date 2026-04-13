import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface BayesForgeResult {
  network: { nodes: any[]; edges: any[] };
  simulation: any;
  risk: any;
  logic: any;
}

export interface CompanyContext {
  name: string;
  industry: string | null;
  stage: string | null;
  funding_amount: number | null;
  team_size: number | null;
  founded_year: number | null;
  location: string | null;
  looking_for: string[] | null;
  description: string | null;
  investments: { amount: number; status: string }[];
}

export function useBayesForgeState() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [idea, setIdea] = useState("");
  const [domain, setDomain] = useState("");
  const [region, setRegion] = useState("");
  const [constraints, setConstraints] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BayesForgeResult | null>(null);
  const [activeTab, setActiveTab] = useState("model");
  const [companyContext, setCompanyContext] = useState<CompanyContext | null>(null);
  const [includeCompanyData, setIncludeCompanyData] = useState(true);
  const [fieldsAutoFilled, setFieldsAutoFilled] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchCompanyData = async () => {
      const { data: companies } = await supabase
        .from("companies")
        .select("name, industry, stage, funding_amount, team_size, founded_year, location, looking_for, description, id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1);

      if (!companies || companies.length === 0) return;
      const company = companies[0];

      const { data: investments } = await supabase
        .from("investments")
        .select("amount, status")
        .eq("company_id", company.id);

      const ctx: CompanyContext = {
        name: company.name,
        industry: company.industry,
        stage: company.stage,
        funding_amount: company.funding_amount,
        team_size: company.team_size,
        founded_year: company.founded_year,
        location: company.location,
        looking_for: company.looking_for,
        description: company.description,
        investments: investments || [],
      };
      setCompanyContext(ctx);

      if (!idea && company.description) setIdea(company.description);
      if (!domain && company.industry) setDomain(company.industry);
      if (!region && company.location) setRegion(company.location);
      setFieldsAutoFilled(true);
    };
    fetchCompanyData();
  }, [user]);

  const runAnalysis = async () => {
    if (!idea.trim()) {
      toast({ title: "Error", description: "Please enter a startup idea", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const body: any = { idea, domain, region, constraints };
      if (includeCompanyData && companyContext) body.companyContext = companyContext;

      const { data, error } = await supabase.functions.invoke("bayesforge-analyze", { body });
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

  return {
    idea, setIdea, domain, setDomain, region, setRegion,
    constraints, setConstraints, isLoading, result, activeTab, setActiveTab,
    companyContext, includeCompanyData, setIncludeCompanyData,
    fieldsAutoFilled, runAnalysis,
  };
}

export type BayesForgeState = ReturnType<typeof useBayesForgeState>;
