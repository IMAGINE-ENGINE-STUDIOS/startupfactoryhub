import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, FileText, TrendingUp, Languages, Image, Workflow, Sparkles, Kanban } from "lucide-react";
import CRMBoard from "@/components/CRMBoard";
import AIAssistant from "@/components/AIAssistant";
import AISummaryCard from "@/components/AISummaryCard";
import AITranslator from "@/components/AITranslator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import TaskAutomation from "@/components/TaskAutomation";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import GuestPrompt from "@/components/GuestPrompt";

const Tools = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("chatbot");

  // AI Assistant state
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

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

    if (imageUrl.toLowerCase().endsWith('.pdf')) {
      toast({
        title: "Error",
        description: "PDF analysis is not supported yet. Please use image files (JPG, PNG, etc.)",
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <GuestPrompt
            feature="AI Tools"
            description="Sign in to access powerful AI tools including chatbot, summarization, translation, and automation features."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-shrink-0">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AI-Powered Tools
            </h1>
          </div>
          <p className="text-muted-foreground">
            Enhance your productivity with intelligent automation and insights
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 h-full flex flex-col">
          {/* CRM Board Section */}
          <div className="mb-6 flex-shrink-0">
            <Card className="tech-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Kanban className="h-5 w-5 text-primary" />
                  CRM Board
                </CardTitle>
                <CardDescription>
                  Manage your leads, contacts, and deals in one place
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CRMBoard />
              </CardContent>
            </Card>
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="tech-card border-0 grid w-full grid-cols-2 lg:grid-cols-6 h-auto flex-shrink-0 mb-4">
              <TabsTrigger value="chatbot" className="gap-2 py-3">
                <Bot className="h-4 w-4" />
                <span className="hidden sm:inline">Assistant</span>
              </TabsTrigger>
              <TabsTrigger value="summary" className="gap-2 py-3">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Summary</span>
              </TabsTrigger>
              <TabsTrigger value="sentiment" className="gap-2 py-3">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Sentiment</span>
              </TabsTrigger>
              <TabsTrigger value="translate" className="gap-2 py-3">
                <Languages className="h-4 w-4" />
                <span className="hidden sm:inline">Translate</span>
              </TabsTrigger>
              <TabsTrigger value="document" className="gap-2 py-3">
                <Image className="h-4 w-4" />
                <span className="hidden sm:inline">Document</span>
              </TabsTrigger>
              <TabsTrigger value="automation" className="gap-2 py-3">
                <Workflow className="h-4 w-4" />
                <span className="hidden sm:inline">Automation</span>
              </TabsTrigger>
            </TabsList>

            {/* AI Chatbot */}
            <TabsContent value="chatbot" className="flex-1 overflow-y-auto">
            <Card className="tech-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  AI Assistant
                </CardTitle>
                <CardDescription>
                  Get instant help with business advice, mentorship, and learning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setIsAssistantOpen(true)} size="lg" className="w-full">
                  Open AI Assistant
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

            {/* Text Summarizer */}
            <TabsContent value="summary" className="flex-1 overflow-y-auto">
            <Card className="tech-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Smart Summaries
                </CardTitle>
                <CardDescription>
                  Automatically condense long content into key takeaways
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Text to Summarize</label>
                  <Textarea
                    placeholder="Enter a long text that you want to summarize..."
                    value={summaryText}
                    onChange={(e) => setSummaryText(e.target.value)}
                    rows={8}
                    className="resize-none"
                  />
                </div>
                {summaryText && (
                  <AISummaryCard
                    text={summaryText}
                    sourceType="demo"
                    sourceId={"demo-" + Date.now()}
                    title="Summary"
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

            {/* Sentiment Analyzer */}
            <TabsContent value="sentiment" className="flex-1 overflow-y-auto">
            <Card className="tech-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Sentiment Analysis
                </CardTitle>
                <CardDescription>
                  Understand feedback and communications at scale
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <Card className="tech-card border-0 border-primary/20 bg-muted/50">
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
              </CardContent>
            </Card>
          </TabsContent>

            {/* Translator */}
            <TabsContent value="translate" className="flex-1 overflow-y-auto">
            <Card className="tech-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="h-5 w-5 text-primary" />
                  AI Translator
                </CardTitle>
                <CardDescription>
                  Communicate globally with instant translations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Text to Translate</label>
                  <Textarea
                    placeholder="Enter text in any language..."
                    value={translationText}
                    onChange={(e) => setTranslationText(e.target.value)}
                    rows={8}
                    className="resize-none"
                  />
                </div>
                {translationText && (
                  <AITranslator text={translationText} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

            {/* Document Analyzer */}
            <TabsContent value="document" className="flex-1 overflow-y-auto">
            <Card className="tech-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5 text-primary" />
                  Document Analysis
                </CardTitle>
                <CardDescription>
                  Extract insights from images and documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Image/Document URL</label>
                  <Input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter a publicly accessible image URL (JPG, PNG, WEBP). PDFs are not supported.
                  </p>
                </div>

                {imageUrl && (
                  <div className="border rounded-lg overflow-hidden bg-muted">
                    <img
                      src={imageUrl}
                      alt="Document to analyze"
                      className="w-full h-auto max-h-96 object-contain"
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
                  size="lg"
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
                  <Card className="tech-card border-0 border-primary/20 bg-muted/50">
                    <CardHeader>
                      <CardTitle className="text-base">Analysis Result</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{documentResult.analysis}</p>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

            {/* Task Automation */}
            <TabsContent value="automation" className="flex-1 overflow-y-auto">
              <TaskAutomation />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* AI Assistant Dialog */}
      <AIAssistant isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
    </div>
  );
};

export default Tools;
