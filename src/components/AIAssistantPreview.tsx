import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Sparkles, TrendingUp, Zap } from "lucide-react";
import AIAssistant from "./AIAssistant";

interface AIFeature {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: () => void;
}

export default function AIAssistantPreview() {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const features: AIFeature[] = [
    {
      icon: <Bot className="h-5 w-5" />,
      title: "AI Assistant",
      description: "Get instant help and advice",
      action: () => setIsAssistantOpen(true)
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: "Smart Analytics",
      description: "AI-powered insights",
      action: () => setIsAssistantOpen(true)
    },
    {
      icon: <Sparkles className="h-5 w-5" />,
      title: "Auto Summaries",
      description: "Condense long content",
      action: () => setIsAssistantOpen(true)
    }
  ];

  return (
    <>
      <Card className="tech-card">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            AI-Powered Tools
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Boost your productivity with intelligent features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3">
          {features.map((feature, idx) => (
            <Button
              key={idx}
              variant="outline"
              className="w-full justify-start gap-2 sm:gap-3 h-auto py-2 sm:py-3"
              onClick={feature.action}
            >
              <span className="text-primary flex-shrink-0">{feature.icon}</span>
              <div className="text-left flex-1 min-w-0">
                <div className="font-medium text-sm sm:text-base truncate">{feature.title}</div>
                <div className="text-xs text-muted-foreground truncate">{feature.description}</div>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>

      <AIAssistant isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
    </>
  );
}