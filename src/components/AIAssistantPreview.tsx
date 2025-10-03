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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            AI-Powered Tools
          </CardTitle>
          <CardDescription>
            Boost your productivity with intelligent features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {features.map((feature, idx) => (
            <Button
              key={idx}
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={feature.action}
            >
              <span className="text-primary">{feature.icon}</span>
              <div className="text-left">
                <div className="font-medium">{feature.title}</div>
                <div className="text-xs text-muted-foreground">{feature.description}</div>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>

      <AIAssistant isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
    </>
  );
}