import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  CheckCircle, 
  Circle, 
  Clock, 
  AlertCircle,
  Calendar,
  ExternalLink,
  ChevronRight,
  Target,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';

interface Milestone {
  id: string;
  milestone_name: string;
  description: string | null;
  target_date: string | null;
  completed_date: string | null;
  status: string;
  evidence_url: string | null;
  order_index: number | null;
}

interface CohortStartup {
  id: string;
  cohort_id: string;
  company_id: string;
  current_stage: string;
  progress_percentage: number;
  company?: {
    id: string;
    name: string;
    description: string | null;
    industry: string | null;
    stage: string | null;
    logo_url: string | null;
  };
  milestones?: Milestone[];
}

interface StartupJourneyTrackerProps {
  startups: CohortStartup[];
  onAddMilestone: (cohortStartupId: string, milestone: any) => Promise<void>;
  onUpdateMilestone: (milestoneId: string, updates: any) => Promise<void>;
}

const DEFAULT_MILESTONES = [
  { name: 'Onboarding Complete', description: 'Complete initial accelerator onboarding' },
  { name: 'Mentor Assigned', description: 'Get matched with a dedicated mentor' },
  { name: 'Product Milestone', description: 'Achieve key product development goal' },
  { name: 'First Customer', description: 'Acquire first paying customer' },
  { name: 'Pitch Practice', description: 'Complete pitch deck preparation' },
  { name: 'Demo Day Ready', description: 'Finalize demo day presentation' },
];

export const StartupJourneyTracker = ({
  startups,
  onAddMilestone,
  onUpdateMilestone
}: StartupJourneyTrackerProps) => {
  const [selectedStartup, setSelectedStartup] = useState<CohortStartup | null>(null);
  const [addMilestoneOpen, setAddMilestoneOpen] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    milestone_name: '',
    description: '',
    target_date: ''
  });

  const getMilestoneStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'in_progress': return <Clock className="w-5 h-5 text-amber-500" />;
      case 'blocked': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const handleAddMilestone = async () => {
    if (!selectedStartup || !newMilestone.milestone_name) return;

    await onAddMilestone(selectedStartup.id, {
      milestone_name: newMilestone.milestone_name,
      description: newMilestone.description || null,
      target_date: newMilestone.target_date || null,
      status: 'pending',
      order_index: (selectedStartup.milestones?.length || 0) + 1
    });

    setNewMilestone({ milestone_name: '', description: '', target_date: '' });
    setAddMilestoneOpen(false);
  };

  const handleCompleteMilestone = async (milestoneId: string) => {
    await onUpdateMilestone(milestoneId, {
      status: 'completed',
      completed_date: new Date().toISOString().split('T')[0]
    });
  };

  const calculateProgress = (milestones: Milestone[] = []) => {
    if (milestones.length === 0) return 0;
    const completed = milestones.filter(m => m.status === 'completed').length;
    return Math.round((completed / milestones.length) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Startup Journey Tracker</h2>
        <p className="text-muted-foreground">Track and manage startup progress through the program</p>
      </div>

      {/* Startups Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {startups.map((startup) => {
          const progress = calculateProgress(startup.milestones);
          
          return (
            <Card 
              key={startup.id}
              className="tech-card border-0 hover:border-emerald-500/30 transition-all duration-300"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={startup.company?.logo_url || undefined} />
                      <AvatarFallback className="bg-emerald-500/20 text-emerald-400">
                        {startup.company?.name?.charAt(0) || 'S'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{startup.company?.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {startup.company?.industry || 'Tech'}
                        </Badge>
                        <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">
                          {startup.current_stage}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedStartup(startup)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Journey Progress</span>
                    <span className="font-semibold text-emerald-400">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* Milestones Preview */}
                <div className="space-y-2">
                  {startup.milestones?.slice(0, 3).map((milestone) => (
                    <div 
                      key={milestone.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-background/50"
                    >
                      {getMilestoneStatusIcon(milestone.status)}
                      <span className={`text-sm flex-1 ${
                        milestone.status === 'completed' ? 'line-through text-muted-foreground' : ''
                      }`}>
                        {milestone.milestone_name}
                      </span>
                      {milestone.target_date && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(milestone.target_date), 'MMM d')}
                        </span>
                      )}
                    </div>
                  ))}
                  {(startup.milestones?.length || 0) > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{(startup.milestones?.length || 0) - 3} more milestones
                    </p>
                  )}
                  {(!startup.milestones || startup.milestones.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No milestones yet. Click to add some.
                    </p>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedStartup(startup);
                      setAddMilestoneOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Milestone
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedStartup(startup)}
                  >
                    View All
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {startups.length === 0 && (
        <Card className="tech-card border-0">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
              <Target className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Startups in Program</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Accept applications to add startups to your program and start tracking their journey.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Detailed Startup View Dialog */}
      <Dialog open={!!selectedStartup && !addMilestoneOpen} onOpenChange={() => setSelectedStartup(null)}>
        <DialogContent className="tech-card border-0 max-w-2xl max-h-[80vh] overflow-y-auto !transition-none">
          {selectedStartup && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={selectedStartup.company?.logo_url || undefined} />
                    <AvatarFallback className="bg-emerald-500/20 text-emerald-400">
                      {selectedStartup.company?.name?.charAt(0) || 'S'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle>{selectedStartup.company?.name}</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                      {selectedStartup.company?.description?.slice(0, 100)}...
                    </p>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Progress Overview */}
                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Overall Progress</span>
                    <span className="text-2xl font-bold text-emerald-400">
                      {calculateProgress(selectedStartup.milestones)}%
                    </span>
                  </div>
                  <Progress value={calculateProgress(selectedStartup.milestones)} className="h-3" />
                </div>

                {/* All Milestones */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Milestones</h3>
                    <Button 
                      size="sm"
                      onClick={() => setAddMilestoneOpen(true)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {selectedStartup.milestones?.map((milestone, index) => (
                      <div 
                        key={milestone.id}
                        className="flex items-start gap-4 p-4 rounded-lg border border-border/50 bg-background/50"
                      >
                        <div className="flex flex-col items-center">
                          {getMilestoneStatusIcon(milestone.status)}
                          {index < (selectedStartup.milestones?.length || 0) - 1 && (
                            <div className="w-0.5 h-8 bg-border mt-2" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className={`font-medium ${
                                milestone.status === 'completed' ? 'line-through text-muted-foreground' : ''
                              }`}>
                                {milestone.milestone_name}
                              </h4>
                              {milestone.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {milestone.description}
                                </p>
                              )}
                            </div>
                            {milestone.status !== 'completed' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleCompleteMilestone(milestone.id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Complete
                              </Button>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            {milestone.target_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Target: {format(new Date(milestone.target_date), 'MMM d, yyyy')}
                              </span>
                            )}
                            {milestone.completed_date && (
                              <span className="flex items-center gap-1 text-emerald-400">
                                <CheckCircle className="w-3 h-3" />
                                Completed: {format(new Date(milestone.completed_date), 'MMM d, yyyy')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {(!selectedStartup.milestones || selectedStartup.milestones.length === 0) && (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">No milestones defined yet</p>
                        <Button onClick={() => setAddMilestoneOpen(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add First Milestone
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Milestone Dialog */}
      <Dialog open={addMilestoneOpen} onOpenChange={setAddMilestoneOpen}>
        <DialogContent className="tech-card border-0 !transition-none">
          <DialogHeader>
            <DialogTitle>Add Milestone</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Milestone Name</Label>
              <Input
                value={newMilestone.milestone_name}
                onChange={(e) => setNewMilestone(prev => ({ ...prev, milestone_name: e.target.value }))}
                placeholder="e.g., First Customer Acquired"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={newMilestone.description}
                onChange={(e) => setNewMilestone(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what needs to be achieved..."
                className="mt-1.5"
                rows={3}
              />
            </div>

            <div>
              <Label>Target Date</Label>
              <Input
                type="date"
                value={newMilestone.target_date}
                onChange={(e) => setNewMilestone(prev => ({ ...prev, target_date: e.target.value }))}
                className="mt-1.5"
              />
            </div>

            {/* Quick Templates */}
            <div>
              <Label className="mb-2 block">Quick Templates</Label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_MILESTONES.map((template) => (
                  <Badge
                    key={template.name}
                    variant="outline"
                    className="cursor-pointer hover:bg-emerald-500/10 hover:border-emerald-500/30"
                    onClick={() => setNewMilestone(prev => ({
                      ...prev,
                      milestone_name: template.name,
                      description: template.description
                    }))}
                  >
                    {template.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMilestoneOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddMilestone}
              className="bg-gradient-to-r from-emerald-500 to-teal-500"
            >
              Add Milestone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
