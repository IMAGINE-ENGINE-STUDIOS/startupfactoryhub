import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  TrendingUp, 
  Languages, 
  Image, 
  Loader2,
  CheckCircle,
  XCircle
} from "lucide-react";
import AISummaryCard from "./AISummaryCard";
import AITranslator from "./AITranslator";

export default function AIFeaturesDemo() {
  const { toast } = useToast();
  
  // Sentiment Analysis State
  const [sentimentText, setSentimentText] = useState("");
  const [sentimentResult, setSentimentResult] = useState<any>(null);
  const [isSentimentLoading, setIsSentimentLoading] = useState(false);
  
  // Document Analysis State
  const [imageUrl, setImageUrl] = useState("");
  const [documentResult, setDocumentResult] = useState<any>(null);
  const [isDocumentLoading, setIsDocumentLoading] = useState(false);
  
  // Summary State
  const [summaryText, setSummaryText] = useState("");
  
  // Translation State
  const [translationText, setTranslationText] = useState("");

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

  const analyzeDocument = async () => {
    if (!imageUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter an image URL",
        variant: "destructive",
      });
      return;
    }

    setIsDocumentLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-vision-analyzer', {
        body: { 
          imageUrl,
          analysisType: 'document'
        }
      });

      if (error) throw error;
      setDocumentResult(data);
      
      toast({
        title: "Analysis Complete",
        description: "Document analyzed successfully",
      });
    } catch (error: any) {
      console.error('Error analyzing document:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to analyze document",
        variant: "destructive",
      });
    } finally {
      setIsDocumentLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>AI Features Demo</CardTitle>
        <CardDescription>
          Test all AI-powered features with your own content
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary" className="gap-2">
              <FileText className="h-4 w-4" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="sentiment" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Sentiment
            </TabsTrigger>
            <TabsTrigger value="translate" className="gap-2">
              <Languages className="h-4 w-4" />
              Translate
            </TabsTrigger>
            <TabsTrigger value="document" className="gap-2">
              <Image className="h-4 w-4" />
              Document
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Text to Summarize</label>
              <Textarea
                placeholder="Enter a long text that you want to summarize..."
                value={summaryText}
                onChange={(e) => setSummaryText(e.target.value)}
                rows={6}
              />
            </div>
            {summaryText && (
              <AISummaryCard 
                text={summaryText}
                sourceType="demo"
                sourceId={"demo-" + Date.now()}
                title="Demo Summary"
              />
            )}
          </TabsContent>

          <TabsContent value="sentiment" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Text to Analyze</label>
              <Textarea
                placeholder="Enter text to analyze sentiment (e.g., customer feedback, reviews)..."
                value={sentimentText}
                onChange={(e) => setSentimentText(e.target.value)}
                rows={6}
              />
            </div>
            <Button 
              onClick={analyzeSentiment} 
              disabled={isSentimentLoading || !sentimentText.trim()}
              className="w-full"
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
              <Card className="border-primary/20">
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
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          sentimentResult.sentiment === 'positive' ? 'bg-green-500' :
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
                          className="px-2 py-1 bg-muted rounded-md text-xs"
                        >
                          {emotion}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Urgency:</span>
                    <span className={`font-medium ${
                      sentimentResult.urgency === 'high' ? 'text-red-500' :
                      sentimentResult.urgency === 'medium' ? 'text-yellow-500' : 'text-green-500'
                    }`}>
                      {sentimentResult.urgency.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Category:</span>
                    <span className="font-medium">{sentimentResult.category}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="translate" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Text to Translate</label>
              <Textarea
                placeholder="Enter text in any language..."
                value={translationText}
                onChange={(e) => setTranslationText(e.target.value)}
                rows={6}
              />
            </div>
            {translationText && (
              <AITranslator text={translationText} />
            )}
          </TabsContent>

          <TabsContent value="document" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Image/Document URL</label>
              <Input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter a publicly accessible image or document URL
              </p>
            </div>
            
            {imageUrl && (
              <div className="border rounded-lg overflow-hidden">
                <img 
                  src={imageUrl} 
                  alt="Document to analyze" 
                  className="w-full h-auto max-h-64 object-contain bg-muted"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            
            <Button 
              onClick={analyzeDocument} 
              disabled={isDocumentLoading || !imageUrl.trim()}
              className="w-full"
            >
              {isDocumentLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze Document'
              )}
            </Button>

            {documentResult && (
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="text-base">Analysis Result</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{documentResult.analysis}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
