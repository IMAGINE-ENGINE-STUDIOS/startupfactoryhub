import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import AIAssistant from "./AIAssistant";
import { Sparkles, Bot, FileText, Languages, TrendingUp } from "lucide-react";

export default function AIQuickActions() {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Tools
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm mb-3">Quick AI Actions</h4>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2"
              onClick={() => setIsAssistantOpen(true)}
            >
              <Bot className="h-4 w-4" />
              Chat with AI Assistant
            </Button>

            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2"
            >
              <FileText className="h-4 w-4" />
              Summarize Content
            </Button>

            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2"
            >
              <Languages className="h-4 w-4" />
              Translate
            </Button>

            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Analyze Sentiment
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <AIAssistant isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
    </>
  );
}
