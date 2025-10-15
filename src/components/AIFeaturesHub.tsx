import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AIFeaturesDemo from "./AIFeaturesDemo";
import { 
  FileText, 
  TrendingUp, 
  Languages, 
  Image, 
  Workflow,
  Sparkles 
} from "lucide-react";

export default function AIFeaturesHub() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const features = [
    {
      id: 'summarizer',
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
      id: 'translator',
      title: 'AI Translator',
      description: 'Communicate globally with instant translations',
      icon: Languages,
      color: 'text-orange-500'
    },
    {
      id: 'vision',
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
                onClick={() => {
                  setSelectedFeature(feature.id);
                  setIsDemoOpen(true);
                }}
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
      
      <Dialog open={isDemoOpen} onOpenChange={setIsDemoOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {features.find(f => f.id === selectedFeature)?.title || 'AI Feature'}
            </DialogTitle>
            <DialogDescription>
              {features.find(f => f.id === selectedFeature)?.description}
            </DialogDescription>
          </DialogHeader>
          <AIFeaturesDemo initialTab={selectedFeature || 'summary'} />
        </DialogContent>
      </Dialog>
    </>
  );
}
