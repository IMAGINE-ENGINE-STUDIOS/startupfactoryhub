import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, Lock, Lightbulb, FileText, Users, TrendingUp, DollarSign, Plus, X, RotateCcw, ChevronDown, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRoadmapProgress } from '@/hooks/useRoadmapProgress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import TRLTracker from '@/components/TRLTracker';
import RoadmapChecklist, { ChecklistItem } from '@/components/RoadmapChecklist';
import JourneyCompletionDialog from '@/components/JourneyCompletionDialog';

interface RoadmapStep {
  id: string;
  title: string;
  description: string;
  stage: 'idea' | 'research' | 'mvp' | 'validation' | 'launch' | 'growth';
  completed: boolean;
  locked: boolean;
  resources: string[];
  icon: any;
  checklist?: ChecklistItem[];
  trlLevel?: number;
  defaultChecklist?: ChecklistItem[];
}

interface StepNotes {
  title?: string;
  description?: string;
  checklist?: ChecklistItem[];
  trl_level?: number;
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
    icon: Lightbulb,
    defaultChecklist: [
      { id: 'iv-1', text: 'Define problem statement', completed: false },
      { id: 'iv-2', text: 'Identify target audience', completed: false },
      { id: 'iv-3', text: 'Conduct customer interviews (min 10)', completed: false },
      { id: 'iv-4', text: 'Validate problem-solution fit', completed: false },
    ]
  },
  {
    id: '2',
    title: 'Market Research',
    description: 'Deep dive into your target market, competitors, and industry trends',
    stage: 'research',
    completed: false,
    locked: true,
    resources: ['Competitor Analysis Framework', 'Market Size Calculator', 'Industry Reports'],
    icon: FileText,
    defaultChecklist: [
      { id: 'mr-1', text: 'Analyze top 5 competitors', completed: false },
      { id: 'mr-2', text: 'Calculate Total Addressable Market (TAM)', completed: false },
      { id: 'mr-3', text: 'Define unique value proposition', completed: false },
      { id: 'mr-4', text: 'Create buyer personas', completed: false },
    ]
  },
  {
    id: '3',
    title: 'MVP Development',
    description: 'Build your minimum viable product and test core features',
    stage: 'mvp',
    completed: false,
    locked: true,
    resources: ['MVP Planning Guide', 'Tech Stack Recommendations', 'Development Roadmap'],
    icon: Circle,
    defaultChecklist: [
      { id: 'mvp-1', text: 'Define core features', completed: false },
      { id: 'mvp-2', text: 'Choose technology stack', completed: false },
      { id: 'mvp-3', text: 'Build working prototype', completed: false },
      { id: 'mvp-4', text: 'Conduct internal testing', completed: false },
    ],
    trlLevel: 0
  },
  {
    id: '4',
    title: 'User Validation',
    description: 'Test your MVP with real users and gather feedback',
    stage: 'validation',
    completed: false,
    locked: true,
    resources: ['User Testing Scripts', 'Feedback Collection Tools', 'Analytics Setup'],
    icon: Users,
    defaultChecklist: [
      { id: 'uv-1', text: 'Recruit beta testers', completed: false },
      { id: 'uv-2', text: 'Conduct usability testing', completed: false },
      { id: 'uv-3', text: 'Gather user feedback', completed: false },
      { id: 'uv-4', text: 'Iterate based on feedback', completed: false },
    ]
  },
  {
    id: '5',
    title: 'Product Launch',
    description: 'Launch your product to the market with a comprehensive go-to-market strategy',
    stage: 'launch',
    completed: false,
    locked: true,
    resources: ['Launch Checklist', 'Marketing Strategies', 'PR Templates'],
    icon: TrendingUp,
    defaultChecklist: [
      { id: 'pl-1', text: 'Finalize marketing materials', completed: false },
      { id: 'pl-2', text: 'Set up analytics tracking', completed: false },
      { id: 'pl-3', text: 'Launch on Product Hunt', completed: false },
      { id: 'pl-4', text: 'Announce on social media', completed: false },
    ]
  },
  {
    id: '6',
    title: 'Growth & Funding',
    description: 'Scale your startup and secure funding for accelerated growth',
    stage: 'growth',
    completed: false,
    locked: true,
    resources: ['Pitch Deck Template', 'Investor Database', 'Cap Table Management'],
    icon: TrendingUp,
    defaultChecklist: [
      { id: 'gf-1', text: 'Create investor pitch deck', completed: false },
      { id: 'gf-2', text: 'Build 3-year financial model', completed: false },
      { id: 'gf-3', text: 'Identify target investors (VCs/Angels)', completed: false },
      { id: 'gf-4', text: 'Schedule investor meetings', completed: false },
      { id: 'gf-5', text: 'Complete due diligence process', completed: false },
    ]
  }
];

export default function StartupRoadmap() {
  const [steps, setSteps] = useState<RoadmapStep[]>(roadmapSteps);
  const [currentStage, setCurrentStage] = useState<string>('idea');
  const [isAddStepOpen, setIsAddStepOpen] = useState(false);
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newStepDescription, setNewStepDescription] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set(['1']));
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const roadmapProgress = useRoadmapProgress(refreshTrigger);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadUserProgress();
    }
  }, [user]);

  // Auto-show journey completion dialog only once
  useEffect(() => {
    const standardSteps = steps.filter(step => {
      const stepNum = parseInt(step.id);
      return !isNaN(stepNum) && stepNum >= 1 && stepNum <= 6;
    });
    
    const allCompleted = standardSteps.length > 0 && standardSteps.every(step => step.completed);
    const hasAutoShown = localStorage.getItem('roadmap_journey_auto_shown');
    
    // Auto-show dialog only once when journey is first completed
    if (allCompleted && hasAutoShown !== 'true') {
      setShowCompletionDialog(true);
      localStorage.setItem('roadmap_journey_auto_shown', 'true');
    }
  }, [steps]);

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

    const progressMap = new Map(data?.map(p => [p.step_id, p]) || []);
    const customStepsData = data?.filter(p => p.step_id.startsWith('custom-')) || [];
    
    // Load custom steps from database
    const customSteps: RoadmapStep[] = customStepsData.map(customStep => {
      const notes: StepNotes = customStep.notes ? JSON.parse(customStep.notes) : {};
      return {
        id: customStep.step_id,
        title: notes.title || 'Custom Step',
        description: notes.description || 'Custom step for your journey',
        stage: 'growth',
        completed: customStep.completed || false,
        locked: false,
        resources: [],
        icon: Circle,
        checklist: notes.checklist || []
      };
    });
    
    const updatedSteps = roadmapSteps.map((step, index) => {
      const progressData = progressMap.get(step.id);
      const completed = progressData?.completed || false;
      const prevCompleted = index === 0 || progressMap.get(roadmapSteps[index - 1].id)?.completed || false;
      
      // Parse notes for checklist and TRL data
      let checklist = step.defaultChecklist || [];
      let trlLevel = step.trlLevel || 0;
      
      if (progressData?.notes) {
        try {
          const notes: StepNotes = JSON.parse(progressData.notes);
          if (notes.checklist && notes.checklist.length > 0) {
            checklist = notes.checklist;
          }
          if (notes.trl_level !== undefined) {
            trlLevel = notes.trl_level;
          }
        } catch (e) {
          console.error('Error parsing notes:', e);
        }
      }
      
      return {
        ...step,
        completed,
        locked: index === 0 ? false : !prevCompleted,
        checklist,
        trlLevel
      };
    });
    
    setSteps([...updatedSteps, ...customSteps]);
  };

  const completeStep = async (stepId: string) => {
    if (!user) return;

    try {
      // First check if record exists
      const { data: existing } = await supabase
        .from('roadmap_progress')
        .select('id, completed')
        .eq('user_id', user.id)
        .eq('step_id', stepId)
        .maybeSingle();

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('roadmap_progress')
          .update({
            completed: true,
            completed_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) {
          console.error('Error updating step:', error);
          toast({
            title: "Error",
            description: "Failed to save progress. Please try again.",
            variant: "destructive",
          });
          return;
        }
      } else {
        // Insert new record
        const { error } = await supabase
          .from('roadmap_progress')
          .insert({
            user_id: user.id,
            step_id: stepId,
            completed: true,
            completed_at: new Date().toISOString()
          });

        if (error) {
          console.error('Error inserting step:', error);
          toast({
            title: "Error",
            description: "Failed to save progress. Please try again.",
            variant: "destructive",
          });
          return;
        }
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

      // Force progress refresh
      setRefreshTrigger(prev => prev + 1);

      toast({
        title: "Step Completed!",
        description: "Great progress! You've unlocked the next step.",
      });
    } catch (error) {
      console.error('Unexpected error completing step:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const uncompleteStep = async (stepId: string) => {
    if (!user) return;

    try {
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
        console.error('Error uncompleting step:', error);
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

    // Force progress refresh
    setRefreshTrigger(prev => prev + 1);

    toast({
      title: "Step Unmarked",
      description: "Progress has been reset for this step and all subsequent steps.",
    });
    } catch (error) {
      console.error('Unexpected error uncompleting step:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
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

    try {
      const customStepId = `custom-${Date.now()}`;
      const newStep: RoadmapStep = {
        id: customStepId,
        title: newStepTitle,
        description: newStepDescription || 'Custom step for your journey',
        stage: 'growth',
        completed: false,
        locked: false,
        resources: [],
        icon: Circle,
        checklist: []
      };

      const notes: StepNotes = {
        title: newStepTitle,
        description: newStepDescription,
        checklist: []
      };

      const { error } = await supabase
        .from('roadmap_progress')
        .insert({
          user_id: user.id,
          step_id: customStepId,
          completed: false,
          notes: JSON.stringify(notes)
        });

      if (error) {
        console.error('Error creating custom step:', error);
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

    // Force progress refresh
    setRefreshTrigger(prev => prev + 1);

    toast({
      title: "Custom Step Added!",
      description: "Your custom step has been added to your journey.",
    });
    } catch (error) {
      console.error('Unexpected error adding custom step:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const updateStepChecklist = async (stepId: string, checklist: ChecklistItem[]) => {
    if (!user) return;

    try {
      const step = steps.find(s => s.id === stepId);
      if (!step) return;

      // Get existing notes
      const { data: existing } = await supabase
        .from('roadmap_progress')
        .select('notes')
        .eq('user_id', user.id)
        .eq('step_id', stepId)
        .maybeSingle();

      const existingNotes: StepNotes = existing?.notes ? JSON.parse(existing.notes) : {};
      const updatedNotes: StepNotes = {
        ...existingNotes,
        checklist
      };

      // Upsert the progress with updated checklist
      const { error } = await supabase
        .from('roadmap_progress')
        .upsert({
          user_id: user.id,
          step_id: stepId,
          completed: step.completed,
          notes: JSON.stringify(updatedNotes)
        }, {
          onConflict: 'user_id,step_id'
        });

      if (error) throw error;

      // Update local state
      setSteps(steps.map(s => 
        s.id === stepId ? { ...s, checklist } : s
      ));
    } catch (error) {
      console.error('Error updating checklist:', error);
      toast({
        title: "Error",
        description: "Failed to update checklist.",
        variant: "destructive",
      });
    }
  };

  const updateTRLLevel = async (stepId: string, trlLevel: number) => {
    if (!user) return;

    try {
      const step = steps.find(s => s.id === stepId);
      if (!step) return;

      // Get existing notes
      const { data: existing } = await supabase
        .from('roadmap_progress')
        .select('notes')
        .eq('user_id', user.id)
        .eq('step_id', stepId)
        .maybeSingle();

      const existingNotes: StepNotes = existing?.notes ? JSON.parse(existing.notes) : {};
      const updatedNotes: StepNotes = {
        ...existingNotes,
        trl_level: trlLevel
      };

      // Upsert the progress with updated TRL
      const { error } = await supabase
        .from('roadmap_progress')
        .upsert({
          user_id: user.id,
          step_id: stepId,
          completed: step.completed,
          notes: JSON.stringify(updatedNotes)
        }, {
          onConflict: 'user_id,step_id'
        });

      if (error) throw error;

      // Update local state
      setSteps(steps.map(s => 
        s.id === stepId ? { ...s, trlLevel } : s
      ));

      toast({
        title: "TRL Updated",
        description: `Technology Readiness Level set to ${trlLevel}`,
      });
    } catch (error) {
      console.error('Error updating TRL:', error);
      toast({
        title: "Error",
        description: "Failed to update TRL level.",
        variant: "destructive",
      });
    }
  };


  const toggleStepExpanded = (stepId: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const shareJourneyCompletion = async () => {
    if (!user) return;
    
    const standardSteps = steps.filter(s => {
      const num = parseInt(s.id);
      return !isNaN(num) && num >= 1 && num <= 6;
    });
    
    const completedSteps = standardSteps.filter(s => s.completed).length;
    const totalSteps = standardSteps.length;
    
    // Validate that journey is actually complete
    if (completedSteps !== totalSteps) {
      toast({
        title: "Journey not complete",
        description: "Complete all 6 steps to share your journey!",
        variant: "destructive"
      });
      return;
    }
    
    // Track share count
    const shareCount = (parseInt(localStorage.getItem('journey_share_count') || '0')) + 1;
    
    const journeyData = {
      completed_steps: completedSteps,
      total_steps: totalSteps,
      completion_date: new Date().toISOString(),
      milestone: 'full_journey_complete',
      share_count: shareCount
    };
    
    const { error } = await supabase
      .from('feed_posts')
      .insert({
        user_id: user.id,
        content: "🎉 I just completed my entire startup journey on Startup Factory Hub! From idea validation to growth & funding. Excited for what's next! #StartupJourney #Milestone",
        post_type: 'journey_completion',
        internship_data: journeyData,
      });
    
    if (error) {
      console.error('Error posting to community:', error);
      toast({
        title: "Error sharing",
        description: "Could not post to community feed. Please try again.",
        variant: "destructive"
      });
    } else {
      // Increment share count
      localStorage.setItem('journey_share_count', shareCount.toString());
      
      toast({
        title: "🎉 Journey shared!",
        description: `Your achievement has been posted to the community feed${shareCount > 1 ? ` (shared ${shareCount} times)` : ''}`,
      });
      setShowCompletionDialog(false);
    }
  };

  const handleResetProgress = async () => {
    if (!user) return;
    
    const { error } = await supabase
      .from('roadmap_progress')
      .delete()
      .eq('user_id', user.id);
    
    if (error) {
      toast({
        title: "Error resetting progress",
        description: "Could not reset progress. Please try again.",
        variant: "destructive"
      });
    } else {
      // Clear localStorage
      localStorage.removeItem('roadmap_journey_auto_shown');
      localStorage.removeItem('journey_share_count');
      
      // Reload progress
      setRefreshTrigger(prev => prev + 1);
      
      toast({
        title: "Progress reset",
        description: "Your journey has been reset. Start fresh!",
      });
    }
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
    <div className="space-y-4 md:space-y-6 pb-20 md:pb-6">
      {/* Progress Overview */}
      <Card className="tech-card border-0 animate-fade-in">
        <CardHeader className="pb-3">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-base sm:text-lg">Progress Overview</span>
            <Badge variant="secondary" className="animate-scale-in w-fit">
              {roadmapProgress.percentage}% Complete
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 space-y-4">
          <Progress 
            value={roadmapProgress.percentage} 
            className="h-2 sm:h-3 transition-all duration-700 ease-out" 
          />
          <p className="text-xs sm:text-sm text-muted-foreground">
            {roadmapProgress.completedSteps} of {roadmapProgress.totalSteps} steps completed. 
            Follow our proven algorithm to build your startup step by step.
          </p>
          
          {/* Share Journey Completion Button - shown when all 6 standard steps are complete */}
          {roadmapProgress.percentage === 100 && (
            <div className="space-y-2 pt-2">
              <Button
                onClick={() => setShowCompletionDialog(true)}
                className="w-full gap-2 bg-gradient-to-r from-yellow-500 via-pink-500 to-purple-500 hover:from-yellow-600 hover:via-pink-600 hover:to-purple-600 text-white"
                size="lg"
              >
                <Trophy className="w-5 h-5" />
                🎉 Share Your Journey Completion
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Reset Journey Progress
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reset Journey Progress?</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground">
                    This will reset all your progress and allow you to start fresh. Your previous achievements will remain in the community feed.
                  </p>
                  <div className="flex gap-2 justify-end mt-4">
                    <Button variant="outline" onClick={() => {}}>Cancel</Button>
                    <Button variant="destructive" onClick={handleResetProgress}>
                      Reset All Progress
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Roadmap Steps */}
      <div className="space-y-3 md:space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isExpanded = expandedSteps.has(step.id);
          
          return (
            <Collapsible
              key={step.id}
              open={isExpanded}
              onOpenChange={() => toggleStepExpanded(step.id)}
            >
              <Card 
                className={`tech-card border-0 ${step.completed ? 'ring-2 ring-primary/20' : ''} ${
                  step.locked ? 'opacity-60' : 'transition-all'
                }`}
              >
                <CardContent className="p-4 sm:p-6">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-start gap-3 sm:gap-4 cursor-pointer">
                      <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${
                        step.completed ? 'bg-primary text-primary-foreground' : 
                        step.locked ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
                      }`}>
                        {step.completed ? (
                          <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                        ) : step.locked ? (
                          <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
                        ) : (
                          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base sm:text-lg font-semibold text-foreground">{step.title}</h3>
                            {step.completed && (
                              <Badge variant="default" className="bg-green-500">
                                ✓
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`${getStageColor(step.stage)} w-fit`} variant="outline">
                              {step.stage.charAt(0).toUpperCase() + step.stage.slice(1)}
                            </Badge>
                            <ChevronDown 
                              className={`w-5 h-5 text-muted-foreground transition-transform ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="mt-4">
                    <div className="ml-0 sm:ml-16 space-y-3">
                      <p className="text-sm sm:text-base text-muted-foreground">{step.description}</p>
                      
                      {/* Checklist */}
                      {step.checklist && step.checklist.length > 0 && (
                        <RoadmapChecklist
                          items={step.checklist}
                          onItemsUpdate={(items) => updateStepChecklist(step.id, items)}
                          disabled={step.locked}
                        />
                      )}

                      {/* TRL Tracker for MVP Development step */}
                      {step.id === '3' && (
                        <TRLTracker
                          currentLevel={step.trlLevel || 0}
                          onLevelUpdate={(level) => updateTRLLevel(step.id, level)}
                          disabled={step.locked}
                        />
                      )}

                      <div>
                        <h4 className="text-xs sm:text-sm font-medium text-foreground mb-2">Resources Available:</h4>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {step.resources.map((resource, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {resource}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={step.locked}
                          className="text-xs sm:text-sm h-8 sm:h-9"
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
                            className="pulse-primary text-xs sm:text-sm h-8 sm:h-9"
                          >
                            Mark Complete
                          </Button>
                        )}
                        {step.completed && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => uncompleteStep(step.id)}
                            className="text-muted-foreground hover:text-foreground text-xs sm:text-sm h-8 sm:h-9"
                          >
                            <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            Undo
                          </Button>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </CardContent>
              </Card>
            </Collapsible>
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

      {/* Journey Completion Dialog */}
      <JourneyCompletionDialog
        open={showCompletionDialog}
        onOpenChange={setShowCompletionDialog}
        onShare={shareJourneyCompletion}
        totalSteps={steps.filter(s => !isNaN(parseInt(s.id)) && parseInt(s.id) <= 6).length}
      />
    </div>
  );
}