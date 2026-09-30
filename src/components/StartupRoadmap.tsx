import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, Lock, Lightbulb, FileText, Users, TrendingUp, Plus, RotateCcw, ChevronDown, Trophy, Trash2, Building2, MapPin, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { JourneyResourcesDialog } from '@/components/JourneyResourcesDialog';
import { JourneyStep } from '@/hooks/useResources';

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

interface AcceleratorProgram {
  id: string;
  cohort_name: string;
  accelerator_name: string;
  accelerator_logo: string | null;
  progress_percentage: number;
  current_stage: string;
  joined_at: string;
  mentor_assignments: {
    mentor_id: string;
    mentor_name: string;
    mentor_avatar: string | null;
    focus_area: string | null;
  }[];
  advisor_assignments: {
    advisor_id: string;
    advisor_name: string;
    advisor_avatar: string | null;
    expertise_area: string | null;
  }[];
  milestones: {
    id: string;
    milestone_name: string;
    status: string;
    target_date: string | null;
  }[];
}

export default function StartupRoadmap() {
  const [steps, setSteps] = useState<RoadmapStep[]>(roadmapSteps);
  const [currentStage, setCurrentStage] = useState<string>('idea');
  const [isAddStepOpen, setIsAddStepOpen] = useState(false);
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newStepDescription, setNewStepDescription] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set(['1']));
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [acceleratorPrograms, setAcceleratorPrograms] = useState<AcceleratorProgram[]>([]);
  const [loadingAccelerators, setLoadingAccelerators] = useState(false);
  const [acceleratorExpanded, setAcceleratorExpanded] = useState(true);
  const [resourcesDialogOpen, setResourcesDialogOpen] = useState(false);
  const [selectedStepForResources, setSelectedStepForResources] = useState<{ step: JourneyStep; title: string } | null>(null);
  const roadmapProgress = useRoadmapProgress(refreshTrigger);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadUserProgress();
      fetchAcceleratorPrograms();
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

  const fetchAcceleratorPrograms = async () => {
    if (!user) return;

    setLoadingAccelerators(true);
    try {
      // Get user's company
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!company) {
        setLoadingAccelerators(false);
        return;
      }

      // Get cohort startups for this company
      const { data: cohortStartups, error } = await supabase
        .from('cohort_startups')
        .select(`
          id,
          current_stage,
          progress_percentage,
          joined_at,
          cohort_id
        `)
        .eq('company_id', company.id);

      if (error) throw error;

      if (!cohortStartups || cohortStartups.length === 0) {
        setAcceleratorPrograms([]);
        setLoadingAccelerators(false);
        return;
      }

      const programs: AcceleratorProgram[] = [];

      for (const cs of cohortStartups) {
        // Get cohort and accelerator info
        const { data: cohort } = await supabase
          .from('accelerator_cohorts')
          .select(`
            name,
            accelerator_id
          `)
          .eq('id', cs.cohort_id)
          .single();

        if (!cohort) continue;

        const { data: accelerator } = await supabase
          .from('accelerator_profiles')
          .select('organization_name, logo_url')
          .eq('id', cohort.accelerator_id)
          .single();

        // Get mentor assignments
        const { data: mentorAssignments } = await supabase
          .from('startup_mentor_assignments')
          .select('mentor_id, focus_area')
          .eq('cohort_startup_id', cs.id)
          .eq('status', 'active');

        // Get advisor assignments
        const { data: advisorAssignments } = await supabase
          .from('startup_advisor_assignments')
          .select('advisor_id, expertise_area')
          .eq('cohort_startup_id', cs.id)
          .eq('status', 'active');

        // Fetch mentor profiles
        const mentorProfiles = [];
        if (mentorAssignments && mentorAssignments.length > 0) {
          const mentorIds = mentorAssignments.map(m => m.mentor_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, full_name, avatar_url')
            .in('user_id', mentorIds);

          for (const ma of mentorAssignments) {
            const profile = profiles?.find(p => p.user_id === ma.mentor_id);
            mentorProfiles.push({
              mentor_id: ma.mentor_id,
              mentor_name: profile?.full_name || 'Unknown',
              mentor_avatar: profile?.avatar_url,
              focus_area: ma.focus_area
            });
          }
        }

        // Fetch advisor profiles
        const advisorProfiles = [];
        if (advisorAssignments && advisorAssignments.length > 0) {
          const advisorIds = advisorAssignments.map(a => a.advisor_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, full_name, avatar_url')
            .in('user_id', advisorIds);

          for (const aa of advisorAssignments) {
            const profile = profiles?.find(p => p.user_id === aa.advisor_id);
            advisorProfiles.push({
              advisor_id: aa.advisor_id,
              advisor_name: profile?.full_name || 'Unknown',
              advisor_avatar: profile?.avatar_url,
              expertise_area: aa.expertise_area
            });
          }
        }

        // Get milestones
        const { data: milestones } = await supabase
          .from('startup_journey_milestones')
          .select('id, milestone_name, status, target_date')
          .eq('cohort_startup_id', cs.id)
          .order('target_date', { ascending: true });

        programs.push({
          id: cs.id,
          cohort_name: cohort.name,
          accelerator_name: accelerator?.organization_name || 'Unknown',
          accelerator_logo: accelerator?.logo_url,
          progress_percentage: cs.progress_percentage || 0,
          current_stage: cs.current_stage || 'onboarding',
          joined_at: cs.joined_at || '',
          mentor_assignments: mentorProfiles,
          advisor_assignments: advisorProfiles,
          milestones: milestones || []
        });
      }

      setAcceleratorPrograms(programs);
    } catch (error) {
      console.error('Error fetching accelerator programs:', error);
    } finally {
      setLoadingAccelerators(false);
    }
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

  const deleteCustomStep = async (stepId: string) => {
    if (!user) return;
    
    // Only allow deleting custom steps
    if (!stepId.startsWith('custom-')) {
      toast({
        title: "Cannot delete",
        description: "Only custom steps can be deleted.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('roadmap_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('step_id', stepId);

      if (error) throw error;

      // Remove from local state
      setSteps(steps.filter(s => s.id !== stepId));
      
      // Force progress refresh
      setRefreshTrigger(prev => prev + 1);

      toast({
        title: "Step Deleted",
        description: "Your custom step has been removed.",
      });
    } catch (error) {
      console.error('Error deleting custom step:', error);
      toast({
        title: "Error",
        description: "Failed to delete custom step. Please try again.",
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


  // Standard 6-step journey (ids 1-6); custom + accelerator handled separately
  const standardSteps = steps.filter((s) => {
    const n = parseInt(s.id);
    return !isNaN(n) && n >= 1 && n <= 6;
  });
  const customSteps = steps.filter((s) => s.id.startsWith('custom-'));

  const [activeStepId, setActiveStepId] = useState<string>(standardSteps[0]?.id || '1');
  useEffect(() => {
    // Auto-focus first incomplete unlocked step on first load
    const focus = standardSteps.find((s) => !s.completed && !s.locked);
    if (focus) setActiveStepId(focus.id);
    else if (standardSteps[0]) setActiveStepId(standardSteps[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps.length]);

  const allSteps = [...standardSteps, ...customSteps];
  const activeStep = allSteps.find((s) => s.id === activeStepId) || standardSteps[0];
  const ActiveIcon = activeStep?.icon || Circle;
  const completedCount = standardSteps.filter((s) => s.completed).length;
  const isJourneyComplete = completedCount === standardSteps.length && standardSteps.length > 0;

  return (
    <div className="pb-20 md:pb-6 animate-fade-in">
      <div className="tech-card border-0 overflow-hidden">
        <div className="flex flex-col gap-5 border-b border-border/50 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Startup Journey</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold leading-tight tracking-normal">
              {isJourneyComplete
                ? 'Journey complete — what is next?'
                : activeStep
                  ? activeStep.title
                  : 'Begin your startup journey'}
            </h2>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {roadmapProgress.completedSteps} of {roadmapProgress.totalSteps} milestones cleared
              {acceleratorPrograms.length > 0 && ` · ${acceleratorPrograms.length} accelerator program${acceleratorPrograms.length > 1 ? 's' : ''}`}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="mr-auto sm:mr-2 text-right">
              <p className="text-xl font-semibold tabular-nums">{roadmapProgress.percentage}%</p>
              <p className="text-xs text-muted-foreground">complete</p>
            </div>
            {isJourneyComplete && (
              <Button
                size="sm"
                onClick={() => setShowCompletionDialog(true)}
                className="gap-1.5"
              >
                <Trophy className="h-3.5 w-3.5" />
                Share
              </Button>
            )}
            <Dialog open={isAddStepOpen} onOpenChange={setIsAddStepOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Step
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Custom Step</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
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
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddStepOpen(false)}>Cancel</Button>
                    <Button onClick={addCustomStep}>Add Step</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
          <Progress value={roadmapProgress.percentage} className="h-1" />
          <div className="flex gap-1 overflow-x-auto pb-1">
          {allSteps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = step.id === activeStepId;
            return (
                <Button
                  key={step.id}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => !step.locked && setActiveStepId(step.id)}
                  disabled={step.locked}
                  className={cn(
                    'h-9 shrink-0 gap-2 rounded-md px-3 text-xs',
                    isActive && 'bg-primary/10 text-primary',
                    step.completed && !isActive && 'text-foreground',
                    step.locked && 'opacity-40 cursor-not-allowed',
                  )}
                >
                  {step.completed ? <CheckCircle className="h-4 w-4" /> : step.locked ? <Lock className="h-3.5 w-3.5" /> : <Icon className="h-4 w-4" />}
                  <span>{idx + 1}. {step.title}</span>
                </Button>
            );
          })}
          </div>
        </div>

      {activeStep && (
        <div
          key={activeStep.id}
          className="p-4 sm:p-6 space-y-5 animate-fade-in"
        >
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'w-10 h-10 rounded-md flex items-center justify-center shrink-0',
                activeStep.completed
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-primary/10 text-primary',
              )}
            >
              {activeStep.completed ? <CheckCircle className="w-5 h-5" /> : <ActiveIcon className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={cn('text-xs', getStageColor(activeStep.stage))}>
                  {activeStep.stage.charAt(0).toUpperCase() + activeStep.stage.slice(1)}
                </Badge>
                {activeStep.completed && (
                  <Badge className="bg-primary text-primary-foreground border-0 text-xs gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Done
                  </Badge>
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-semibold">{activeStep.title}</h3>
              <p className="text-sm text-muted-foreground">{activeStep.description}</p>
            </div>
          </div>

          {/* Checklist */}
          {activeStep.checklist && activeStep.checklist.length > 0 && (
            <RoadmapChecklist
              items={activeStep.checklist}
              onItemsUpdate={(items) => updateStepChecklist(activeStep.id, items)}
              disabled={activeStep.locked}
            />
          )}

          {/* TRL Tracker for MVP step */}
          {activeStep.id === '3' && (
            <TRLTracker
              currentLevel={activeStep.trlLevel || 0}
              onLevelUpdate={(level) => updateTRLLevel(activeStep.id, level)}
              disabled={activeStep.locked}
            />
          )}

          {/* Resources */}
          {activeStep.resources.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Resources</h4>
              <div className="flex flex-wrap gap-1.5">
                {activeStep.resources.map((r, i) => (
                  <Badge key={i} variant="secondary" className="text-xs font-normal">
                    {r}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
            <Button
              size="sm"
              variant="outline"
              disabled={activeStep.locked}
              onClick={() => {
                setSelectedStepForResources({ step: activeStep.stage as JourneyStep, title: activeStep.title });
                setResourcesDialogOpen(true);
              }}
              className="gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5" />
              View Resources
            </Button>
            {!activeStep.completed && !activeStep.locked && (
              <Button
                size="sm"
                onClick={() => completeStep(activeStep.id)}
                className="gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Mark Complete
              </Button>
            )}
            {activeStep.completed && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => uncompleteStep(activeStep.id)}
                className="gap-1.5 text-muted-foreground"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Undo
              </Button>
            )}
            {activeStep.id.startsWith('custom-') && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="ghost" className="gap-1.5 text-destructive hover:text-destructive ml-auto">
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Custom Step?</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground">
                    Are you sure you want to delete "{activeStep.title}"? This cannot be undone.
                  </p>
                  <div className="flex gap-2 justify-end mt-4">
                    <Button variant="destructive" onClick={() => deleteCustomStep(activeStep.id)}>
                      Delete Step
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            {isJourneyComplete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleResetProgress}
                className="gap-1.5 text-muted-foreground ml-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset journey
              </Button>
            )}
          </div>
        </div>
      )}

      </div>

      {/* ── Accelerator Program Journeys ─────────────────────────────── */}
      {acceleratorPrograms.length > 0 && (
        <Collapsible open={acceleratorExpanded} onOpenChange={setAcceleratorExpanded} className="mt-4">
          <div className="border-t border-border/50 px-1 py-4">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Accelerator Programs</h3>
                    <p className="text-xs text-muted-foreground">
                      {acceleratorPrograms.length} active program{acceleratorPrograms.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    'w-4 h-4 text-muted-foreground transition-transform',
                    acceleratorExpanded && 'rotate-180',
                  )}
                />
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-4 divide-y divide-border/50 border-y border-border/50">
              {acceleratorPrograms.map((program) => (
                <div
                  key={program.id}
                  className="py-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={program.accelerator_logo || undefined} />
                        <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-xs">
                          {program.accelerator_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm truncate">{program.cohort_name}</h4>
                        <p className="text-xs text-muted-foreground truncate">{program.accelerator_name}</p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs capitalize',
                        program.current_stage === 'active' && 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
                        program.current_stage === 'onboarding' && 'bg-blue-500/10 text-blue-500 border-blue-500/30',
                        program.current_stage === 'graduated' && 'bg-purple-500/10 text-purple-500 border-purple-500/30',
                      )}
                    >
                      {program.current_stage}
                    </Badge>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium tabular-nums">{program.progress_percentage}%</span>
                    </div>
                    <Progress value={program.progress_percentage} className="h-1.5" />
                  </div>

                  {(program.mentor_assignments.length > 0 || program.advisor_assignments.length > 0) && (
                    <div className="flex flex-wrap gap-1.5">
                      {program.mentor_assignments.map((m) => (
                        <div
                          key={m.mentor_id}
                          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20"
                        >
                          <Avatar className="w-4 h-4">
                            <AvatarImage src={m.mentor_avatar || undefined} />
                            <AvatarFallback className="text-[8px] bg-blue-500/20 text-blue-400">
                              {m.mentor_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[10px] font-medium">{m.mentor_name}</span>
                        </div>
                      ))}
                      {program.advisor_assignments.map((a) => (
                        <div
                          key={a.advisor_id}
                          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20"
                        >
                          <Avatar className="w-4 h-4">
                            <AvatarImage src={a.advisor_avatar || undefined} />
                            <AvatarFallback className="text-[8px] bg-purple-500/20 text-purple-400">
                              {a.advisor_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[10px] font-medium">{a.advisor_name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {program.milestones.length > 0 && (
                    <div className="space-y-1.5">
                      {program.milestones.slice(0, 3).map((m) => (
                        <div key={m.id} className="flex items-center gap-2 text-xs">
                          {m.status === 'completed' ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <Circle
                              className={cn(
                                'w-3.5 h-3.5 shrink-0',
                                m.status === 'in_progress' ? 'text-blue-500' : 'text-muted-foreground',
                              )}
                            />
                          )}
                          <span
                            className={cn(
                              'flex-1 truncate',
                              m.status === 'completed' && 'line-through text-muted-foreground',
                            )}
                          >
                            {m.milestone_name}
                          </span>
                          {m.target_date && (
                            <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                              {new Date(m.target_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ))}
                      {program.milestones.length > 3 && (
                        <p className="text-[10px] text-muted-foreground text-center pt-1">
                          +{program.milestones.length - 3} more
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}

      {/* Journey Completion Dialog */}
      <JourneyCompletionDialog
        open={showCompletionDialog}
        onOpenChange={setShowCompletionDialog}
        onShare={shareJourneyCompletion}
        totalSteps={standardSteps.length}
      />

      {/* Journey Resources Dialog */}
      {selectedStepForResources && (
        <JourneyResourcesDialog
          open={resourcesDialogOpen}
          onOpenChange={setResourcesDialogOpen}
          journeyStep={selectedStepForResources.step}
          stepTitle={selectedStepForResources.title}
        />
      )}
    </div>
  );
}