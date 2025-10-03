import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { Smile, Frown, Meh, AlertCircle, Info } from "lucide-react";

interface AIInsightBadgeProps {
  text: string;
  contentType: string;
  contentId?: string;
  autoAnalyze?: boolean;
}

export default function AIInsightBadge({ 
  text, 
  contentType, 
  contentId,
  autoAnalyze = false 
}: AIInsightBadgeProps) {
  const [insight, setInsight] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (autoAnalyze && text && !insight) {
      analyzeSentiment();
    }
  }, [autoAnalyze, text]);

  const analyzeSentiment = async () => {
    if (!text || isLoading) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-sentiment-analyzer', {
        body: { 
          text,
          contentType,
          contentId
        }
      });

      if (error) throw error;
      setInsight(data.insight_data);
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!insight) return null;

  const getSentimentIcon = () => {
    switch (insight.sentiment) {
      case 'positive':
        return <Smile className="h-3 w-3" />;
      case 'negative':
        return <Frown className="h-3 w-3" />;
      default:
        return <Meh className="h-3 w-3" />;
    }
  };

  const getSentimentColor = () => {
    switch (insight.sentiment) {
      case 'positive':
        return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'negative':
        return 'bg-red-500/10 text-red-700 border-red-500/20';
      default:
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
    }
  };

  const getUrgencyColor = () => {
    switch (insight.urgency) {
      case 'high':
        return 'bg-red-500/10 text-red-700 border-red-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  return (
    <TooltipProvider>
      <div className="flex gap-2 flex-wrap">
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className={`gap-1 ${getSentimentColor()}`}>
              {getSentimentIcon()}
              {insight.sentiment}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-semibold">Sentiment Score: {(insight.score * 100).toFixed(0)}%</p>
              {insight.emotions && insight.emotions.length > 0 && (
                <p className="text-xs">Emotions: {insight.emotions.join(', ')}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        {insight.urgency !== 'low' && (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className={`gap-1 ${getUrgencyColor()}`}>
                <AlertCircle className="h-3 w-3" />
                {insight.urgency} urgency
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>This content requires {insight.urgency} priority attention</p>
            </TooltipContent>
          </Tooltip>
        )}

        {insight.category && (
          <Badge variant="outline" className="gap-1">
            <Info className="h-3 w-3" />
            {insight.category}
          </Badge>
        )}
      </div>
    </TooltipProvider>
  );
}
