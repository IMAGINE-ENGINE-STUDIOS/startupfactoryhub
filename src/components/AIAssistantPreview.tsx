import { Button } from "@/components/ui/button";
import { Bot, ArrowRight, CheckCircle, TrendingUp } from "lucide-react";
const AIAssistantPreview = () => {
  return <section className="py-20 relative">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center mb-6">
              <Bot className="w-8 h-8 text-ocean-primary mr-3" />
              <span className="text-ocean-primary font-semibold tracking-wide uppercase text-sm">
                AI Assistant
              </span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-foreground">Your Smart</span><br />
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Startup Companion
              </span>
            </h2>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Our AI assistant analyzes your startup's progress and suggests actionable next steps, 
              turning any resource into clear milestones for your journey.
            </p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-ocean-primary mr-3" />
                <span>Personalized roadmap generation</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-ocean-primary mr-3" />
                <span>Smart resource recommendations</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-ocean-primary mr-3" />
                <span>Progress tracking and insights</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-ocean-primary mr-3" />
                <span>Automated milestone creation</span>
              </div>
            </div>
            
            <Button variant="hero" size="xl" className="group">
              Try AI Assistant
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          
          
        </div>
      </div>
    </section>;
};
export default AIAssistantPreview;