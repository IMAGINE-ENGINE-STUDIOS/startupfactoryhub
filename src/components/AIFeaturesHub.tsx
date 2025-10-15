import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import AISummaryCard from "./AISummaryCard";
import AITranslator from "./AITranslator";
import TaskAutomation from "./TaskAutomation";
import SentimentAnalyzer from "./SentimentAnalyzer";
import DocumentAnalyzer from "./DocumentAnalyzer";
import { 
  FileText, 
  TrendingUp, 
  Languages, 
  Image, 
  Workflow,
  Sparkles 
} from "lucide-react";

export default function AIFeaturesHub() {
  const [openDialogs, setOpenDialogs] = useState<Record<string, boolean>>({
    summary: false,
    sentiment: false,
    translate: false,
    document: false,
    automation: false
  });

  const openDialog = (featureId: string) => {
    setOpenDialogs({ ...openDialogs, [featureId]: true });
  };

  const closeDialog = (featureId: string) => {
    setOpenDialogs({ ...openDialogs, [featureId]: false });
  };

  const features = [
    {
      id: 'summary',
      title: 'Smart Summaries',
      description: 'Automatically condense long content into key takeaways',
      icon: FileText,
      color: 'text-purple-500'
    },
    {
      id: 'sentiment',
      title: 'Sentiment Analysis',
      description: 'Understand feedback and communications at scale',
      icon: TrendingUp,
      color: 'text-green-500'
    },
    {
      id: 'translate',
      title: 'AI Translator',
      description: 'Communicate globally with instant translations',
      icon: Languages,
      color: 'text-orange-500'
    },
    {
      id: 'document',
      title: 'Document Analysis',
      description: 'Extract insights from images and documents',
      icon: Image,
      color: 'text-pink-500'
    },
    {
      id: 'automation',
      title: 'Task Automation',
      description: 'Automate workflows and repetitive tasks',
      icon: Workflow,
      color: 'text-cyan-500'
    }
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI-Powered Features
          </CardTitle>
          <CardDescription>
            Enhance your workflow with intelligent automation and insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature) => (
              <Card 
                key={feature.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openDialog(feature.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-muted ${feature.color}`}>
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      
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
    </>
  );
}

// Individual dialog components
function SummaryDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [summaryText, setSummaryText] = useState("");
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
