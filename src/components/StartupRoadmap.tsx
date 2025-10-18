import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, Lock, Lightbulb, FileText, Users, TrendingUp, DollarSign, Plus, X, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRoadmapProgress } from '@/hooks/useRoadmapProgress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

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
  const [isAddStepOpen, setIsAddStepOpen] = useState(false);
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newStepDescription, setNewStepDescription] = useState('');
  const roadmapProgress = useRoadmapProgress();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadUserProgress();
    }
  }, [user]);

  const loadUserProgress = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('roadmap_progress')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error loading progress:', error);
      return;
    }

    const progressMap = new Map(data?.map(p => [p.step_id, p.completed]) || []);
    const customStepsData = data?.filter(p => p.step_id.startsWith('custom-')) || [];
    
    // Load custom steps from database
    const customSteps: RoadmapStep[] = customStepsData.map(customStep => {
      const notes = customStep.notes ? JSON.parse(customStep.notes) : {};
      return {
        id: customStep.step_id,
        title: notes.title || 'Custom Step',
        description: notes.description || 'Custom step for your journey',
        stage: 'growth',
        completed: customStep.completed || false,
        locked: false,
        resources: [],
        icon: Circle
      };
    });
    
    const updatedSteps = roadmapSteps.map((step, index) => {
      const completed = progressMap.get(step.id) || false;
      const prevCompleted = index === 0 || progressMap.get(roadmapSteps[index - 1].id) || false;
      
      return {
        ...step,
        completed,
        locked: index === 0 ? false : !prevCompleted
      };
    });
    
    setSteps([...updatedSteps, ...customSteps]);
  };

  const completeStep = async (stepId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('roadmap_progress')
      .upsert({
        user_id: user.id,
        step_id: stepId,
        completed: true,
        completed_at: new Date().toISOString()
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save progress. Please try again.",
        variant: "destructive",
      });
      return;
    }

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

    toast({
      title: "Step Completed!",
      description: "Great progress! You've unlocked the next step.",
    });
  };

  const uncompleteStep = async (stepId: string) => {
    if (!user) return;

    const currentIndex = steps.findIndex(step => step.id === stepId);
    const subsequentStepIds = steps.slice(currentIndex).map(s => s.id);

    // Update ALL affected steps in database
    const { error } = await supabase
      .from('roadmap_progress')
      .update({
        completed: false,
        completed_at: null
      })
      .eq('user_id', user.id)
      .in('step_id', subsequentStepIds);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update progress. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Update local state
    const updatedSteps = steps.map((step, i) => {
      if (i >= currentIndex) {
        return { ...step, completed: false, locked: i !== currentIndex };
      }
      return step;
    });

    setSteps(updatedSteps);

    toast({
      title: "Step Unmarked",
      description: "Progress has been reset for this step and all subsequent steps.",
    });
  };

  const addCustomStep = async () => {
    if (!user || !newStepTitle.trim()) {
      toast({
        title: "Error",
        description: "Please provide a title for your custom step.",
        variant: "destructive",
      });
      return;
    }

    const customStepId = `custom-${Date.now()}`;
    const newStep: RoadmapStep = {
      id: customStepId,
      title: newStepTitle,
      description: newStepDescription || 'Custom step for your journey',
      stage: 'growth',
      completed: false,
      locked: false,
      resources: [],
      icon: Circle
    };

    const { error } = await supabase
      .from('roadmap_progress')
      .insert({
        user_id: user.id,
        step_id: customStepId,
        completed: false,
        notes: JSON.stringify({ title: newStepTitle, description: newStepDescription })
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create custom step. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setSteps([...steps, newStep]);
    setNewStepTitle('');
    setNewStepDescription('');
    setIsAddStepOpen(false);

    toast({
      title: "Custom Step Added!",
      description: "Your custom step has been added to your journey.",
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
            <span>Progress Overview</span>
            <Badge variant="secondary">{roadmapProgress.percentage}% Complete</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={roadmapProgress.percentage} className="h-3 mb-4" />
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
                          <>
                            <Badge variant="default" className="bg-green-500">
                              ✓ Completed
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => uncompleteStep(step.id)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <RotateCcw className="w-4 h-4 mr-1" />
                              Undo
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {/* Add Custom Step Card */}
        <Card className="tech-card border-0 border-dashed border-2 border-primary/20 hover:border-primary/40 transition-colors">
          <CardContent className="p-6">
            <Dialog open={isAddStepOpen} onOpenChange={setIsAddStepOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full h-full min-h-[120px] flex flex-col items-center justify-center gap-2 hover:bg-primary/5"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Plus className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-foreground">Add Custom Step</p>
                    <p className="text-sm text-muted-foreground">Create your own milestone</p>
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Custom Step</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="step-title">Step Title *</Label>
                    <Input
                      id="step-title"
                      placeholder="e.g., Hire First Employee"
                      value={newStepTitle}
                      onChange={(e) => setNewStepTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="step-description">Description</Label>
                    <Textarea
                      id="step-description"
                      placeholder="Describe what this step involves..."
                      value={newStepDescription}
                      onChange={(e) => setNewStepDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsAddStepOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={addCustomStep}>
                      Add Step
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}