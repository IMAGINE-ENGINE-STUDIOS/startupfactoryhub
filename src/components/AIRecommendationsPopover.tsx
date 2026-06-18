import { useState, useEffect } from "react";
import { Brain, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Recommendation {
  title: string;
  description: string;
  action?: string;
  type?: string;
}

interface Props {
  className?: string;
  "data-tour"?: string;
}

export default function AIRecommendationsPopover({
  className,
  ...rest
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [context, setContext] = useState<{
    stage?: string;
    industry?: string;
    company?: string;
  }>({});
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchRecommendations = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      const { data: companyData } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      setContext({
        stage: companyData?.stage,
        industry: companyData?.industry,
        company: companyData?.name,
      });

      const { data, error } = await supabase.functions.invoke(
        "generate-recommendations",
        {
          body: {
            user_id: user.id,
            role: "startup",
            context: {
              company_name: companyData?.name,
              industry: companyData?.industry,
              stage: companyData?.stage,
              description: companyData?.description,
              location: profileData?.location,
            },
          },
        }
      );

      if (error) throw error;
      if (data?.recommendations) {
        setRecommendations(data.recommendations);
      }
    } catch (err) {
      console.error("AI recs error:", err);
      toast({
        title: "Unable to fetch recommendations",
        description: "We'll try again shortly.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && user && recommendations.length === 0 && !loading) {
      fetchRecommendations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          data-tour={rest["data-tour"] ?? "ai-recommendations-button"}
          className={cn(
            "h-9 w-9 rounded-xl bg-[var(--gradient-card)] backdrop-blur-3xl border border-[hsl(var(--border)_/_0.3)] shadow-[var(--shadow-card)] text-muted-foreground hover:bg-primary/10 hover:border-[hsl(var(--primary)_/_0.2)] hover:text-foreground hover:shadow-[var(--pulse-glow)] hover:scale-105 transition-all duration-300",
            className
          )}
          title="AI Recommendations"
        >
          <Brain className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[calc(100vw-2rem)] sm:w-96 p-0 bg-background border-border backdrop-blur-none"
      >
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                AI Recommendations
              </h3>
              <p className="text-[10px] text-muted-foreground">
                {context.stage || context.industry
                  ? `For ${context.company ?? "your venture"}${
                      context.stage ? ` · ${context.stage}` : ""
                    }${context.industry ? ` · ${context.industry}` : ""}`
                  : "Personalized for your profile"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={fetchRecommendations}
            disabled={loading}
            title="Refresh"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", loading && "animate-spin")}
            />
          </Button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-2">
          {loading && recommendations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mb-2" />
              <p className="text-xs">Analyzing your profile…</p>
            </div>
          )}

          {!loading && recommendations.length === 0 && (
            <div className="text-center py-8 text-xs text-muted-foreground">
              Complete your profile and company info to get personalized
              recommendations.
            </div>
          )}

          {recommendations.map((rec, i) => (
            <div
              key={i}
              className="p-3 rounded-lg border border-border bg-card hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start gap-2">
                <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="h-3 w-3 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-foreground mb-1">
                    {rec.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {rec.description}
                  </p>
                  {rec.action && (
                    <p className="text-[10px] text-primary mt-1.5 font-medium">
                      → {rec.action}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
