import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import {
  Building2,
  Users,
  DollarSign,
  ExternalLink,
  Calendar,
  Target,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Video,
  Globe,
  Loader2
} from 'lucide-react';

interface Milestone {
  id: string;
  title: string;
  description?: string;
  status: string;
  target_date?: string;
  completed_date?: string;
  evidence_url?: string;
}

interface CohortStartup {
  id: string;
  cohort_id: string;
  company_id: string;
  joined_at: string;
  current_stage: string;
  progress_percentage: number;
  funding_received: number | null;
  equity_given: number | null;
  graduation_date: string | null;
  notes: string | null;
  company?: {
    id: string;
    name: string;
    description: string | null;
    industry: string | null;
    stage: string | null;
    logo_url: string | null;
    user_id: string;
    website: string | null;
    pitch_deck_url: string | null;
    funding_amount: number | null;
    team_size: number | null;
    founded_year: number | null;
    location: string | null;
  };
  mentor_assignments?: any[];
  advisor_assignments?: any[];
  milestones?: Milestone[];
}

interface StartupDetailDialogProps {
  startup: CohortStartup | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddMilestone: (cohortStartupId: string, milestone: any) => Promise<void>;
  onUpdateMilestone: (milestoneId: string, updates: any) => Promise<void>;
  cohortName?: string;
}

export const StartupDetailDialog = ({
  startup,
  open,
  onOpenChange,
  onAddMilestone,
  onUpdateMilestone,
  cohortName
}: StartupDetailDialogProps) => {
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDesc, setNewMilestoneDesc] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');
  const [saving, setSaving] = useState(false);

  if (!startup) return null;

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'onboarding': return 'bg-blue-500/20 text-blue-400';
      case 'active': return 'bg-emerald-500/20 text-emerald-400';
      case 'graduated': return 'bg-purple-500/20 text-purple-400';
      case 'dropped': return 'bg-red-500/20 text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getMilestoneStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'blocked': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Target className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const handleAddMilestone = async () => {
    if (!newMilestoneTitle.trim()) return;
    
    setSaving(true);
    try {
      await onAddMilestone(startup.id, {
        title: newMilestoneTitle,
        description: newMilestoneDesc || null,
        target_date: newMilestoneDate || null,
        status: 'pending'
      });
      setNewMilestoneTitle('');
      setNewMilestoneDesc('');
      setNewMilestoneDate('');
      setShowAddMilestone(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteMilestone = async (milestone: Milestone) => {
    await onUpdateMilestone(milestone.id, {
      status: 'completed',
      completed_date: new Date().toISOString()
    });
  };

  const milestones = startup.milestones || [];
  const completedMilestones = milestones.filter(m => m.status === 'completed').length;
  const milestoneProgress = milestones.length > 0 ? (completedMilestones / milestones.length) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] glass-morphism">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={startup.company?.logo_url || undefined} />
              <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-xl">
                {startup.company?.name?.charAt(0) || 'S'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-2xl">{startup.company?.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getStageColor(startup.current_stage)}>
                  {startup.current_stage}
                </Badge>
                {cohortName && (
                  <Badge variant="outline">{cohortName}</Badge>
                )}
                {startup.company?.industry && (
                  <Badge variant="secondary">{startup.company.industry}</Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{startup.progress_percentage}%</p>
              <p className="text-sm text-muted-foreground">Progress</p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            {/* Description */}
            {startup.company?.description && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">About</h4>
                <p className="text-foreground">{startup.company.description}</p>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="tech-card border-0">
                <CardContent className="p-4 flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Joined</p>
                    <p className="font-medium">{format(new Date(startup.joined_at), 'MMM d, yyyy')}</p>
                  </div>
                </CardContent>
              </Card>
              {startup.funding_received && (
                <Card className="tech-card border-0">
                  <CardContent className="p-4 flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-emerald-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Funding</p>
                      <p className="font-medium">${(startup.funding_received / 1000).toFixed(0)}K</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              <Card className="tech-card border-0">
                <CardContent className="p-4 flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Mentors</p>
                    <p className="font-medium">{startup.mentor_assignments?.length || 0}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="tech-card border-0">
                <CardContent className="p-4 flex items-center gap-3">
                  <Target className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Milestones</p>
                    <p className="font-medium">{completedMilestones}/{milestones.length}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-2">
              {startup.company?.website && (
                <Button variant="outline" size="sm" asChild>
                  <a href={startup.company.website} target="_blank" rel="noopener noreferrer">
                    <Globe className="w-4 h-4 mr-2" />
                    Website
                  </a>
                </Button>
              )}
              {startup.company?.pitch_deck_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={startup.company.pitch_deck_url} target="_blank" rel="noopener noreferrer">
                    <FileText className="w-4 h-4 mr-2" />
                    Pitch Deck
                  </a>
                </Button>
              )}
            </div>

            {/* Journey Milestones */}
            <Card className="tech-card border-0">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Journey Milestones
                  </CardTitle>
                  <Button size="sm" onClick={() => setShowAddMilestone(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Milestone
                  </Button>
                </div>
                {milestones.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Overall Progress</span>
                      <span className="font-medium">{milestoneProgress.toFixed(0)}%</span>
                    </div>
                    <Progress value={milestoneProgress} className="h-2" />
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Add Milestone Form */}
                {showAddMilestone && (
                  <Card className="border-dashed border-emerald-500/30 bg-emerald-500/5">
                    <CardContent className="p-4 space-y-3">
                      <Input
                        placeholder="Milestone title..."
                        value={newMilestoneTitle}
                        onChange={(e) => setNewMilestoneTitle(e.target.value)}
                      />
                      <Textarea
                        placeholder="Description (optional)..."
                        value={newMilestoneDesc}
                        onChange={(e) => setNewMilestoneDesc(e.target.value)}
                        rows={2}
                      />
                      <div className="flex items-center gap-3">
                        <Input
                          type="date"
                          value={newMilestoneDate}
                          onChange={(e) => setNewMilestoneDate(e.target.value)}
                          className="w-40"
                        />
                        <div className="flex-1" />
                        <Button variant="outline" size="sm" onClick={() => setShowAddMilestone(false)}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleAddMilestone} disabled={saving || !newMilestoneTitle.trim()}>
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Milestone List */}
                {milestones.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No milestones yet. Add custom milestones to track progress.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {milestones.map((milestone) => (
                      <div 
                        key={milestone.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          milestone.status === 'completed' 
                            ? 'bg-emerald-500/5 border-emerald-500/20' 
                            : 'bg-background/50 border-border/50'
                        }`}
                      >
                        {getMilestoneStatusIcon(milestone.status)}
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${milestone.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                            {milestone.title}
                          </p>
                          {milestone.description && (
                            <p className="text-sm text-muted-foreground truncate">{milestone.description}</p>
                          )}
                        </div>
                        {milestone.target_date && milestone.status !== 'completed' && (
                          <Badge variant="outline" className="text-xs">
                            Due: {format(new Date(milestone.target_date), 'MMM d')}
                          </Badge>
                        )}
                        {milestone.status !== 'completed' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleCompleteMilestone(milestone)}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            {startup.notes && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Notes</h4>
                <p className="text-foreground bg-background/50 p-3 rounded-lg">{startup.notes}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};