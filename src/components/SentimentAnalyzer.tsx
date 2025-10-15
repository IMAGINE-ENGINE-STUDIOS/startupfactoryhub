import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, TrendingUp } from "lucide-react";

export default function SentimentAnalyzer() {
  const { toast } = useToast();
  const [sentimentText, setSentimentText] = useState("");
  const [sentimentResult, setSentimentResult] = useState<any>(null);
  const [isSentimentLoading, setIsSentimentLoading] = useState(false);

  const analyzeSentiment = async () => {
    if (!sentimentText.trim()) {
      toast({
        title: "Error",
        description: "Please enter text to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsSentimentLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-sentiment-analyzer', {
        body: {
          text: sentimentText,
          contentType: 'demo',
          contentId: 'demo-' + Date.now()
        }
      });

      if (error) throw error;
      setSentimentResult(data.insight_data);

      toast({
        title: "Analysis Complete",
        description: "Sentiment analyzed successfully",
      });
    } catch (error: any) {
      console.error('Error analyzing sentiment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to analyze sentiment",
        variant: "destructive",
      });
    } finally {
      setIsSentimentLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Text to Analyze</label>
        <Textarea
          placeholder="Enter text to analyze sentiment (e.g., customer feedback, reviews)..."
          value={sentimentText}
          onChange={(e) => setSentimentText(e.target.value)}
          rows={8}
          className="resize-none"
        />
      </div>
      <Button
        onClick={analyzeSentiment}
        disabled={isSentimentLoading || !sentimentText.trim()}
        className="w-full"
        size="lg"
      >
        {isSentimentLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          'Analyze Sentiment'
        )}
      </Button>

      {sentimentResult && (
        <Card className="border-primary/20 bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {sentimentResult.sentiment === 'positive' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : sentimentResult.sentiment === 'negative' ? (
                <XCircle className="h-5 w-5 text-red-500" />
              ) : (
                <TrendingUp className="h-5 w-5 text-yellow-500" />
              )}
              Sentiment: {sentimentResult.sentiment.toUpperCase()}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Score: {sentimentResult.score}</p>
              <div className="w-full bg-background rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${sentimentResult.sentiment === 'positive' ? 'bg-green-500' :
                      sentimentResult.sentiment === 'negative' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}
                  style={{ width: `${((sentimentResult.score + 1) / 2) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Emotions:</p>
              <div className="flex flex-wrap gap-2">
                {sentimentResult.emotions.map((emotion: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-background rounded-full text-sm"
                  >
                    {emotion}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Urgency</span>
                <p className={`font-medium ${sentimentResult.urgency === 'high' ? 'text-red-500' :
                    sentimentResult.urgency === 'medium' ? 'text-yellow-500' : 'text-green-500'
                  }`}>
                  {sentimentResult.urgency.toUpperCase()}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Category</span>
                <p className="font-medium">{sentimentResult.category}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
