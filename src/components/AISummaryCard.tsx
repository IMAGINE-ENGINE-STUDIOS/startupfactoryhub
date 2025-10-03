import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AISummaryCardProps {
  text: string;
  sourceType: string;
  sourceId?: string;
  title?: string;
}

export default function AISummaryCard({ text, sourceType, sourceId, title }: AISummaryCardProps) {
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const generateSummary = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-text-summarizer', {
        body: { 
          text,
          sourceType,
          sourceId,
          keyPointsCount: 3
        }
      });

      if (error) throw error;
      setSummary(data);
      setIsExpanded(true);
    } catch (error: any) {
      console.error('Error generating summary:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!summary && !isLoading) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={generateSummary}
        className="gap-2"
      >
        <FileText className="h-4 w-4" />
        Generate AI Summary
      </Button>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Generating summary...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            AI Summary {title && `- ${title}`}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">{summary.summary_text}</p>
          </div>
          
          {summary.key_points && summary.key_points.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Key Takeaways:</h4>
              <ul className="space-y-2">
                {summary.key_points.map((point: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <Badge variant="secondary" className="mt-0.5">
                      {index + 1}
                    </Badge>
                    <span className="text-sm">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
