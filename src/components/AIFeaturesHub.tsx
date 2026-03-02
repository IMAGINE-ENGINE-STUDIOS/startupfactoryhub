import { useState, useEffect } from "react";
import geniusAiLogo from "@/assets/genius-ai-logo.png";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import AISummaryCard from "./AISummaryCard";
import AITranslator from "./AITranslator";
import TaskAutomation from "./TaskAutomation";
import SFHImageCreator from "./SFHImageCreator";
import SentimentAnalyzer from "./SentimentAnalyzer";
import DocumentAnalyzer from "./DocumentAnalyzer";
import { LightPaperDocument } from "./lightpaper/LightPaperDocument";
import { LightPaperSpreadsheet } from "./lightpaper/LightPaperSpreadsheet";
import { LightPaperPresentation } from "./lightpaper/LightPaperPresentation";
import { LightPaperProject } from "@/hooks/useLightPaperProjects";
import CRMBoard from "./CRMBoard";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  FileText, 
  TrendingUp, 
  Languages, 
  Image, 
  Workflow,
  Wand2,
  Sparkles,
  Table,
  Presentation,
  ChevronDown,
  ChevronUp,
  Kanban,
  Bot,
  Maximize2,
  X
} from "lucide-react";

export default function AIFeaturesHub() {
  const isMobile = useIsMobile();
  
  // CRM collapsible state - persisted in localStorage
  const [isCRMOpen, setIsCRMOpen] = useState(() => {
    const saved = localStorage.getItem('tools-crm-open');
    if (saved !== null) return JSON.parse(saved);
    return !isMobile; // Default: collapsed on mobile, open on desktop
  });

  // AI Tools collapsible state - persisted in localStorage
  const [isAIToolsOpen, setIsAIToolsOpen] = useState(() => {
    const saved = localStorage.getItem('tools-ai-open');
    if (saved !== null) return JSON.parse(saved);
    return !isMobile; // Default: collapsed on mobile, open on desktop
  });

  // LightPaper collapsible state - persisted in localStorage
  const [isLightPaperOpen, setIsLightPaperOpen] = useState(() => {
    const saved = localStorage.getItem('tools-lightpaper-open');
    if (saved !== null) return JSON.parse(saved);
    return !isMobile; // Default: collapsed on mobile, open on desktop
  });

  // LightPaper fullscreen state
  const [isLightPaperFullscreen, setIsLightPaperFullscreen] = useState(false);

  const [openDialogs, setOpenDialogs] = useState<Record<string, boolean>>({
    summary: false,
    sentiment: false,
    translate: false,
    document: false,
    automation: false,
    'image-creator': false
  });
  const [lightPaperTab, setLightPaperTab] = useState("document");
  const [selectedProject, setSelectedProject] = useState<LightPaperProject | null>(null);

  // Persist CRM state
  useEffect(() => {
    localStorage.setItem('tools-crm-open', JSON.stringify(isCRMOpen));
  }, [isCRMOpen]);

  // Persist AI Tools state
  useEffect(() => {
    localStorage.setItem('tools-ai-open', JSON.stringify(isAIToolsOpen));
  }, [isAIToolsOpen]);

  // Persist LightPaper state
  useEffect(() => {
    localStorage.setItem('tools-lightpaper-open', JSON.stringify(isLightPaperOpen));
  }, [isLightPaperOpen]);

  const openDialog = (featureId: string) => {
    setOpenDialogs({ ...openDialogs, [featureId]: true });
  };

  const closeDialog = (featureId: string) => {
    setOpenDialogs({ ...openDialogs, [featureId]: false });
  };

  const aiTools = [
    {
      id: 'summary',
      title: 'Smart Summary',
      description: 'Condense long content into key takeaways',
      icon: FileText,
      gradient: 'from-purple-500 to-violet-600'
    },
    {
      id: 'sentiment',
      title: 'Sentiment Analysis',
      description: 'Understand feedback at scale',
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-teal-600'
    },
    {
      id: 'translate',
      title: 'AI Translator',
      description: 'Communicate globally with translations',
      icon: Languages,
      gradient: 'from-orange-500 to-amber-600'
    },
    {
      id: 'document',
      title: 'Document Analysis',
      description: 'Extract insights from documents',
      icon: Image,
      gradient: 'from-pink-500 to-rose-600'
    },
    {
      id: 'automation',
      title: 'Task Automation',
      description: 'Automate repetitive workflows',
      icon: Workflow,
      gradient: 'from-cyan-500 to-blue-600'
    },
    {
      id: 'image-creator',
      title: 'Imaginaly',
      description: 'Generate & edit stunning AI images from text prompts',
      icon: Wand2,
      gradient: 'from-emerald-500 to-teal-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Collapsible LightPaper Professional Workspace */}
      <Collapsible open={isLightPaperOpen} onOpenChange={setIsLightPaperOpen}>
        <Card className="tech-card border-0">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/20 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl">LightPaper Workspace</CardTitle>
                    <CardDescription className="text-sm">
                      Documents, spreadsheets, and presentations
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 hidden sm:flex"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsLightPaperFullscreen(true);
                    }}
                  >
                    <Maximize2 className="h-4 w-4" />
                    <span className="hidden md:inline">Fullscreen</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-2">
                    {isLightPaperOpen ? (
                      <>
                        <span className="hidden sm:inline text-sm text-muted-foreground">Collapse</span>
                        <ChevronUp className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        <span className="hidden sm:inline text-sm text-muted-foreground">Expand</span>
                        <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="flex justify-end mb-4">
                <div className="flex border rounded-lg p-1 bg-muted/30">
                  <Button 
                    variant={lightPaperTab === "document" ? "secondary" : "ghost"} 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => setLightPaperTab("document")}
                    title="Document"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={lightPaperTab === "spreadsheet" ? "secondary" : "ghost"} 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => setLightPaperTab("spreadsheet")}
                    title="Spreadsheet"
                  >
                    <Table className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={lightPaperTab === "presentation" ? "secondary" : "ghost"} 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => setLightPaperTab("presentation")}
                    title="Presentation"
                  >
                    <Presentation className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Tabs value={lightPaperTab} onValueChange={setLightPaperTab} className="w-full">
                <TabsContent value="document" className="mt-0">
                  <LightPaperDocument selectedProject={selectedProject} />
                </TabsContent>
                <TabsContent value="spreadsheet" className="mt-0">
                  <LightPaperSpreadsheet />
                </TabsContent>
                <TabsContent value="presentation" className="mt-0">
                  <LightPaperPresentation />
                </TabsContent>
              </Tabs>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Collapsible CRM Board Section */}
      <Collapsible open={isCRMOpen} onOpenChange={setIsCRMOpen}>
        <Card className="tech-card border-0">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/20 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <Kanban className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl">CRM Board</CardTitle>
                    <CardDescription className="text-sm">
                      Manage your client pipeline and deals
                    </CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="gap-2">
                  {isCRMOpen ? (
                    <>
                      <span className="hidden sm:inline text-sm text-muted-foreground">Collapse</span>
                      <ChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline text-sm text-muted-foreground">Expand</span>
                      <ChevronDown className="h-4 w-4" />
                    </>
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

      {/* Collapsible AI Tools Section */}
      <Collapsible open={isAIToolsOpen} onOpenChange={setIsAIToolsOpen}>
        <Card className="tech-card border-0">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/20 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl">AI Tools</CardTitle>
                    <CardDescription className="text-sm">
                      Smart summaries, translation, and automation
                    </CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="gap-2">
                  {isAIToolsOpen ? (
                    <>
                      <span className="hidden sm:inline text-sm text-muted-foreground">Collapse</span>
                      <ChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline text-sm text-muted-foreground">Expand</span>
                      <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {aiTools.map((tool) => (
                  <Card
                    key={tool.id}
                    className="tech-card border-0 cursor-pointer group"
                    onClick={() => openDialog(tool.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center shadow-lg`}>
                          <tool.icon className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{tool.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {tool.description}
                          </p>
                        </div>
                        <Button 
                          size="lg" 
                          className="w-full mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDialog(tool.id);
                          }}
                        >
                          Open Tool
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* LightPaper Fullscreen Dialog */}
      <Dialog open={isLightPaperFullscreen} onOpenChange={setIsLightPaperFullscreen}>
        <DialogContent className="tech-card border-0 !transition-none max-w-[95vw] w-full h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-lg sm:text-xl">LightPaper Workspace</DialogTitle>
                  <DialogDescription className="text-sm">
                    Documents, spreadsheets, and presentations
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex border rounded-lg p-1 bg-muted/30">
                  <Button 
                    variant={lightPaperTab === "document" ? "secondary" : "ghost"} 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => setLightPaperTab("document")}
                    title="Document"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={lightPaperTab === "spreadsheet" ? "secondary" : "ghost"} 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => setLightPaperTab("spreadsheet")}
                    title="Spreadsheet"
                  >
                    <Table className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={lightPaperTab === "presentation" ? "secondary" : "ghost"} 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => setLightPaperTab("presentation")}
                    title="Presentation"
                  >
                    <Presentation className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <Tabs value={lightPaperTab} onValueChange={setLightPaperTab} className="w-full h-full">
              <TabsContent value="document" className="mt-0 h-full">
                <LightPaperDocument selectedProject={selectedProject} />
              </TabsContent>
              <TabsContent value="spreadsheet" className="mt-0 h-full">
                <LightPaperSpreadsheet />
              </TabsContent>
              <TabsContent value="presentation" className="mt-0 h-full">
                <LightPaperPresentation />
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Individual dialogs for each feature */}
      <SummaryDialog 
        open={openDialogs.summary} 
        onOpenChange={(open) => !open && closeDialog('summary')} 
      />
      <SentimentDialog 
        open={openDialogs.sentiment} 
        onOpenChange={(open) => !open && closeDialog('sentiment')} 
      />
      <TranslateDialog 
        open={openDialogs.translate} 
        onOpenChange={(open) => !open && closeDialog('translate')} 
      />
      <DocumentDialog 
        open={openDialogs.document} 
        onOpenChange={(open) => !open && closeDialog('document')} 
      />
      <AutomationDialog 
        open={openDialogs.automation} 
        onOpenChange={(open) => !open && closeDialog('automation')} 
      />
      <ImageCreatorDialog 
        open={openDialogs['image-creator']} 
        onOpenChange={(open) => !open && closeDialog('image-creator')} 
      />
    </div>
  );
}

// Individual dialog components
function SummaryDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [summaryText, setSummaryText] = useState("");
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="tech-card border-0 !transition-none max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-500" />
            Smart Summaries
          </DialogTitle>
          <DialogDescription>
            Automatically condense long content into key takeaways
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
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
              sourceId={crypto.randomUUID()}
              title="Summary"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SentimentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="tech-card border-0 !transition-none max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Sentiment Analysis
          </DialogTitle>
          <DialogDescription>
            Understand feedback and communications at scale
          </DialogDescription>
        </DialogHeader>
        <SentimentAnalyzer />
      </DialogContent>
    </Dialog>
  );
}

function TranslateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [translationText, setTranslationText] = useState("");
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="tech-card border-0 !transition-none max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-orange-500" />
            AI Translator
          </DialogTitle>
          <DialogDescription>
            Communicate globally with instant translations
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DocumentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="tech-card border-0 !transition-none max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5 text-pink-500" />
            Document Analysis
          </DialogTitle>
          <DialogDescription>
            Extract insights from images and documents
          </DialogDescription>
        </DialogHeader>
        <DocumentAnalyzer />
      </DialogContent>
    </Dialog>
  );
}

function AutomationDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="tech-card border-0 !transition-none max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5 text-cyan-500" />
            Task Automation
          </DialogTitle>
          <DialogDescription>
            Automate workflows and repetitive tasks
          </DialogDescription>
        </DialogHeader>
        <TaskAutomation />
      </DialogContent>
    </Dialog>
  );
}

function ImageCreatorDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="tech-card border-0 !transition-none max-w-[95vw] w-full h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <img src={geniusAiLogo} alt="Imaginaly" className="h-5 w-5 object-contain" />
            Imaginaly
          </DialogTitle>
          <DialogDescription>
            Generate & edit stunning AI images from text prompts
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-hidden">
          <SFHImageCreator />
        </div>
      </DialogContent>
    </Dialog>
  );
}
