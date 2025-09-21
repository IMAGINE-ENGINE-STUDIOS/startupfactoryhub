import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, Lock, Lightbulb, FileText, Users, TrendingUp, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface RoadmapStep {
  id: string;
  title: string;
  description: string;
  stage: 'idea' | 'research' | 'mvp' | 'validation' | 'launch' | 'growth';
  completed: boolean;
  locked: boolean;
  resources: string[];
  icon: any;
}

const roadmapSteps: RoadmapStep[] = [
  {
    id: '1',
    title: 'Idea Validation',
    description: 'Validate your startup idea with market research and customer interviews',
    stage: 'idea',
    completed: false,
    locked: false,
    resources: ['Business Model Canvas', 'Customer Interview Guide', 'Market Research Templates'],
    icon: Lightbulb
  },
  {
    id: '2',
    title: 'Market Research',
    description: 'Deep dive into your target market, competitors, and industry trends',
    stage: 'research',
    completed: false,
    locked: true,
    resources: ['Competitor Analysis Framework', 'Market Size Calculator', 'Industry Reports'],
    icon: FileText
  },
  {
    id: '3',
    title: 'MVP Development',
    description: 'Build your minimum viable product and test core features',
    stage: 'mvp',
    completed: false,
    locked: true,
    resources: ['MVP Planning Guide', 'Tech Stack Recommendations', 'Development Roadmap'],
    icon: Circle
  },
  {
    id: '4',
    title: 'User Validation',
    description: 'Test your MVP with real users and gather feedback',
    stage: 'validation',
    completed: false,
    locked: true,
    resources: ['User Testing Scripts', 'Feedback Collection Tools', 'Analytics Setup'],
    icon: Users
  },
  {
    id: '5',
    title: 'Product Launch',
    description: 'Launch your product to the market with a comprehensive go-to-market strategy',
    stage: 'launch',
    completed: false,
    locked: true,
    resources: ['Launch Checklist', 'Marketing Strategies', 'PR Templates'],
    icon: TrendingUp
  },
  {
    id: '6',
    title: 'Growth & Funding',
    description: 'Scale your startup and secure funding for growth',
    stage: 'growth',
    completed: false,
    locked: true,
    resources: ['Pitch Deck Template', 'Investor Database', 'Growth Hacking Strategies'],
    icon: DollarSign
  }
];

export default function StartupRoadmap() {
  const [steps, setSteps] = useState<RoadmapStep[]>(roadmapSteps);
  const [currentStage, setCurrentStage] = useState<string>('idea');
  const [overallProgress, setOverallProgress] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadUserProgress();
    }
  }, [user]);

  const loadUserProgress = async () => {
    // In a real app, this would fetch from the database
    // For now, we'll simulate some progress
    const updatedSteps = steps.map((step, index) => {
      if (index === 0) {
        return { ...step, completed: true, locked: false };
      } else if (index === 1) {
        return { ...step, locked: false };
      }
      return step;
    });
    
    setSteps(updatedSteps);
    calculateProgress(updatedSteps);
  };

  const calculateProgress = (stepList: RoadmapStep[]) => {
    const completedSteps = stepList.filter(step => step.completed).length;
    const progress = (completedSteps / stepList.length) * 100;
    setOverallProgress(progress);
  };

  const completeStep = async (stepId: string) => {
    const updatedSteps = steps.map(step => {
      if (step.id === stepId) {
        return { ...step, completed: true };
      }
      return step;
    });

    // Unlock next step
    const currentIndex = steps.findIndex(step => step.id === stepId);
    if (currentIndex < steps.length - 1) {
      updatedSteps[currentIndex + 1].locked = false;
    }

    setSteps(updatedSteps);
    calculateProgress(updatedSteps);

    toast({
      title: "Step Completed!",
      description: "Great progress! You've unlocked the next step.",
    });
  };

  const getStageColor = (stage: string) => {
    const colors = {
      idea: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600',
      research: 'bg-blue-500/10 border-blue-500/20 text-blue-600',
      mvp: 'bg-purple-500/10 border-purple-500/20 text-purple-600',
      validation: 'bg-green-500/10 border-green-500/20 text-green-600',
      launch: 'bg-orange-500/10 border-orange-500/20 text-orange-600',
      growth: 'bg-red-500/10 border-red-500/20 text-red-600'
    };
    return colors[stage as keyof typeof colors] || colors.idea;
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card className="tech-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Startup Journey</span>
            <Badge variant="secondary">{Math.round(overallProgress)}% Complete</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={overallProgress} className="h-3 mb-4" />
          <p className="text-sm text-muted-foreground">
            Follow our proven algorithm to build your startup step by step. Each stage unlocks new resources and opportunities.
          </p>
        </CardContent>
      </Card>

      {/* Roadmap Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <Card 
              key={step.id} 
              className={`tech-card border-0 ${step.completed ? 'ring-2 ring-primary/20' : ''} ${
                step.locked ? 'opacity-60' : 'hover:scale-[1.02] transition-transform'
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                    step.completed ? 'bg-primary text-primary-foreground' : 
                    step.locked ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
                  }`}>
                    {step.completed ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : step.locked ? (
                      <Lock className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                      <Badge className={getStageColor(step.stage)} variant="outline">
                        {step.stage.charAt(0).toUpperCase() + step.stage.slice(1)}
                      </Badge>
                    </div>
                    
                    <p className="text-muted-foreground mb-4">{step.description}</p>
                    
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-2">Resources Available:</h4>
                        <div className="flex flex-wrap gap-2">
                          {step.resources.map((resource, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {resource}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={step.locked}
                        onClick={() => {
                          toast({
                            title: "Resource Access",
                            description: `Opening resources for ${step.title}`,
                          });
                        }}
                      >
                        View Resources
                      </Button>
                        {!step.completed && !step.locked && (
                          <Button 
                            size="sm" 
                            onClick={() => completeStep(step.id)}
                            className="pulse-primary"
                          >
                            Mark Complete
                          </Button>
                        )}
                        {step.completed && (
                          <Badge variant="default" className="bg-green-500">
                            ✓ Completed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}