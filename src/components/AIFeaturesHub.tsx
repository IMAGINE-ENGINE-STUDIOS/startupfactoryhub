import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AIAssistant from "./AIAssistant";
import AIFeaturesDemo from "./AIFeaturesDemo";
import { 
  Bot, 
  FileText, 
  TrendingUp, 
  Languages, 
  Image, 
  Workflow,
  Sparkles 
} from "lucide-react";

export default function AIFeaturesHub() {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  const [showAll, setShowAll] = useState(false);

  const features = [
    {
      id: 'chatbot',
      title: 'AI Assistant',
      description: 'Get instant help with business advice, mentorship, and learning',
      icon: Bot,
      action: () => setIsAssistantOpen(true),
      gradient: 'from-blue-500/10 to-blue-500/5',
      iconColor: 'text-blue-500'
    },
    {
      id: 'summarizer',
      title: 'Smart Summaries',
      description: 'Automatically condense long content into key takeaways',
      icon: FileText,
      action: () => setIsDemoOpen(true),
      gradient: 'from-purple-500/10 to-purple-500/5',
      iconColor: 'text-purple-500'
    },
    {
      id: 'sentiment',
      title: 'Sentiment Analysis',
      description: 'Understand feedback and communications at scale',
      icon: TrendingUp,
      action: () => setIsDemoOpen(true),
      gradient: 'from-green-500/10 to-green-500/5',
      iconColor: 'text-green-500'
    },
    {
      id: 'translator',
      title: 'AI Translator',
      description: 'Communicate globally with instant translations',
      icon: Languages,
      action: () => setIsDemoOpen(true),
      gradient: 'from-orange-500/10 to-orange-500/5',
      iconColor: 'text-orange-500'
    },
    {
      id: 'vision',
      title: 'Document Analysis',
      description: 'Extract insights from images and documents',
      icon: Image,
      action: () => setIsDemoOpen(true),
      gradient: 'from-pink-500/10 to-pink-500/5',
      iconColor: 'text-pink-500'
    },
    {
      id: 'automation',
      title: 'Task Automation',
      description: 'Automate workflows and repetitive tasks',
      icon: Workflow,
      action: () => setIsDemoOpen(true),
      gradient: 'from-cyan-500/10 to-cyan-500/5',
      iconColor: 'text-cyan-500'
    }
  ];

  const displayedFeatures = showAll ? features : features.slice(0, 3);

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              AI Features
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Intelligent tools to enhance your workflow
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {displayedFeatures.map((feature) => (
            <Card 
              key={feature.id} 
              className={`group hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50 bg-gradient-to-br ${feature.gradient}`}
              onClick={feature.action}
            >
              <CardHeader className="space-y-3">
                <div className={`w-12 h-12 rounded-xl bg-background flex items-center justify-center group-hover:scale-110 transition-transform ${feature.iconColor}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg mb-1">{feature.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {!showAll && (
          <Button 
            variant="outline" 
            onClick={() => setShowAll(true)}
            className="w-full"
          >
            View All AI Features ({features.length})
          </Button>
        )}

        {showAll && (
          <Button 
            variant="ghost" 
            onClick={() => setShowAll(false)}
            className="w-full"
          >
            Show Less
          </Button>
        )}
      </div>

      <AIAssistant isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
      
      <Dialog open={isDemoOpen} onOpenChange={setIsDemoOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Features Demo
            </DialogTitle>
            <DialogDescription>
              Try out all AI-powered features with your own content
            </DialogDescription>
          </DialogHeader>
          <AIFeaturesDemo />
        </DialogContent>
      </Dialog>
    </>
  );
}
