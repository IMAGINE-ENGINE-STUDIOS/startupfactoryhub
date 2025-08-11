import { Button } from "@/components/ui/button";
import { Bot, ArrowRight, CheckCircle, TrendingUp } from "lucide-react";

const AIAssistantPreview = () => {
  return (
    <section className="py-20 relative">
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
          
          <div className="glass-morphism p-8 rounded-xl">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <div className="bg-ocean-surface rounded-lg p-4">
                    <p className="text-sm">
                      "Based on your fintech startup profile, I recommend focusing on these 3 milestones this month:"
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 ml-14">
                <div className="glass-morphism p-4 rounded-lg border-l-4 border-ocean-primary">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Regulatory Compliance</span>
                    <TrendingUp className="w-4 h-4 text-ocean-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">Connect with compliance experts and review financial regulations</p>
                </div>
                
                <div className="glass-morphism p-4 rounded-lg border-l-4 border-ocean-secondary">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">MVP Testing</span>
                    <TrendingUp className="w-4 h-4 text-ocean-secondary" />
                  </div>
                  <p className="text-sm text-muted-foreground">Launch beta with 50 users and gather feedback</p>
                </div>
                
                <div className="glass-morphism p-4 rounded-lg border-l-4 border-accent">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Investor Outreach</span>
                    <TrendingUp className="w-4 h-4 text-accent" />
                  </div>
                  <p className="text-sm text-muted-foreground">Connect with 5 relevant VCs through our network</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIAssistantPreview;