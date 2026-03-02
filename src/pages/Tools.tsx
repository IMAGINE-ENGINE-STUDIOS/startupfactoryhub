import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, FileText, TrendingUp, Languages, Image, Sparkles, Kanban, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import GuestPrompt from "@/components/GuestPrompt";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";

const Tools = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // CRM collapsible state - persisted in localStorage
  const [isCRMOpen, setIsCRMOpen] = useState(() => {
    const saved = localStorage.getItem('tools-crm-open');
    if (saved !== null) return JSON.parse(saved);
    return !isMobile; // Default: collapsed on mobile, open on desktop
  });

  // Dialog states for each tool
  const [openDialog, setOpenDialog] = useState<string | null>(null);

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

  // Persist CRM state
  useEffect(() => {
    localStorage.setItem('tools-crm-open', JSON.stringify(isCRMOpen));
  }, [isCRMOpen]);

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

  // AI Tools configuration
  const aiTools = [
    {
      id: "assistant",
      title: "AI Assistant",
      description: "Get instant help with business advice, mentorship, and learning",
      icon: Bot,
      color: "from-blue-500/20 to-cyan-500/20",
      iconColor: "text-blue-500",
    },
    {
      id: "summary",
      title: "Smart Summary",
      description: "Condense long content into key takeaways automatically",
      icon: FileText,
      color: "from-emerald-500/20 to-green-500/20",
      iconColor: "text-emerald-500",
    },
    {
      id: "sentiment",
      title: "Sentiment Analysis",
      description: "Understand feedback and communications at scale",
      icon: TrendingUp,
      color: "from-amber-500/20 to-yellow-500/20",
      iconColor: "text-amber-500",
    },
    {
      id: "translate",
      title: "AI Translator",
      description: "Communicate globally with instant translations",
      icon: Languages,
      color: "from-purple-500/20 to-pink-500/20",
      iconColor: "text-purple-500",
    },
    {
      id: "document",
      title: "Document Analysis",
      description: "Extract insights from images and documents",
      icon: Image,
      color: "from-rose-500/20 to-red-500/20",
      iconColor: "text-rose-500",
    },
  ];

  const handleToolClick = (toolId: string) => {
    if (toolId === "assistant") {
      setIsAssistantOpen(true);
    } else {
      setOpenDialog(toolId);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 tech-card border-0 p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AI-Powered Tools
            </h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            Enhance your productivity with intelligent automation and insights
          </p>
        </div>

        {/* Collapsible CRM Board Section */}
        <Collapsible open={isCRMOpen} onOpenChange={setIsCRMOpen} className="mb-6">
          <Card className="tech-card border-0">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-accent/5 transition-colors rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
                      <Kanban className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg sm:text-xl">CRM Board</CardTitle>
                      <CardDescription className="text-sm">
                        Manage your leads, contacts, and deals in one place
                      </CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    {isCRMOpen ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <CRMBoard />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* AI Tools Grid */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold">AI Tools</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiTools.map((tool) => (
              <Card
                key={tool.id}
                className="tech-card border-0 cursor-pointer group"
                onClick={() => handleToolClick(tool.id)}
              >
                <CardContent className="p-6 flex flex-col h-full min-h-[180px]">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${tool.color} w-fit mb-4`}>
                    <tool.icon className={`h-8 w-8 sm:h-10 sm:w-10 ${tool.iconColor}`} />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">{tool.title}</h3>
                  <p className="text-muted-foreground text-sm flex-1">{tool.description}</p>
                  <Button 
                    variant="ghost" 
                    className="mt-4 w-full justify-between group-hover:bg-primary/10"
                  >
                    Open Tool
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* AI Assistant Dialog */}
      <AIAssistant isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />

      {/* Summary Dialog */}
      <Dialog open={openDialog === "summary"} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="tech-card border-0 !transition-none max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-500" />
              Smart Summary
            </DialogTitle>
            <DialogDescription>
              Automatically condense long content into key takeaways
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Text to Summarize</label>
              <Textarea
                placeholder="Enter a long text that you want to summarize..."
                value={summaryText}
                onChange={(e) => setSummaryText(e.target.value)}
                rows={8}
                className="resize-none tech-card border-0"
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
          </div>
        </DialogContent>
      </Dialog>

      {/* Sentiment Dialog */}
      <Dialog open={openDialog === "sentiment"} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="tech-card border-0 !transition-none max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              Sentiment Analysis
            </DialogTitle>
            <DialogDescription>
              Understand feedback and communications at scale
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Text to Analyze</label>
              <Textarea
                placeholder="Enter text to analyze sentiment (e.g., customer feedback, reviews)..."
                value={sentimentText}
                onChange={(e) => setSentimentText(e.target.value)}
                rows={6}
                className="resize-none tech-card border-0"
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
              <Card className="tech-card border-0">
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
        </DialogContent>
      </Dialog>

      {/* Translate Dialog */}
      <Dialog open={openDialog === "translate"} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="tech-card border-0 !transition-none max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-purple-500" />
              AI Translator
            </DialogTitle>
            <DialogDescription>
              Communicate globally with instant translations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Text to Translate</label>
              <Textarea
                placeholder="Enter text in any language..."
                value={translationText}
                onChange={(e) => setTranslationText(e.target.value)}
                rows={6}
                className="resize-none tech-card border-0"
              />
            </div>
            {translationText && (
              <AITranslator text={translationText} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Dialog */}
      <Dialog open={openDialog === "document"} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent className="tech-card border-0 !transition-none max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Image className="h-5 w-5 text-rose-500" />
              Document Analysis
            </DialogTitle>
            <DialogDescription>
              Extract insights from images and documents
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Image/Document URL</label>
              <Input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="tech-card border-0"
              />
              <p className="text-xs text-muted-foreground">
                Enter a publicly accessible image URL (JPG, PNG, WEBP). PDFs are not supported.
              </p>
            </div>

            {imageUrl && (
              <div className="tech-card border-0 rounded-lg overflow-hidden">
                <img
                  src={imageUrl}
                  alt="Document to analyze"
                  className="max-w-full h-auto max-h-48 mx-auto object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text y="50" x="10" fill="gray">Invalid URL</text></svg>';
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
              <Card className="tech-card border-0">
                <CardHeader>
                  <CardTitle className="text-base">Analysis Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {typeof documentResult === 'object' && documentResult.analysis ? (
                      <p className="whitespace-pre-wrap">{documentResult.analysis}</p>
                    ) : (
                      <p className="whitespace-pre-wrap">{JSON.stringify(documentResult, null, 2)}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Tools;
