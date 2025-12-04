import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { format, differenceInDays } from 'date-fns';
import {
  Calendar,
  Users,
  DollarSign,
  Edit,
  Save,
  X,
  Clock,
  Play,
  Pause,
  CheckCircle,
  Share2,
  ExternalLink,
  Percent,
  Target,
  Copy,
  Link
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Cohort {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  application_deadline: string | null;
  max_startups: number;
  current_startups: number;
  status: string;
  funding_per_startup: number | null;
  equity_percentage: number | null;
  focus_industries: string[] | null;
}

interface CohortDetailsDialogProps {
  cohort: Cohort | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateCohort: (cohortId: string, updates: Partial<Cohort>) => Promise<void>;
  onViewApplications?: () => void;
}

export const CohortDetailsDialog = ({
  cohort,
  open,
  onOpenChange,
  onUpdateCohort,
  onViewApplications
}: CohortDetailsDialogProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Edit state
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedMaxStartups, setEditedMaxStartups] = useState('');
  const [editedFunding, setEditedFunding] = useState('');
  const [editedEquity, setEditedEquity] = useState('');

  if (!cohort) return null;

  const applicationUrl = `${window.location.origin}/cohorts/${cohort.id}/apply`;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'applications_open': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'in_progress': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'completed': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming': return <Clock className="w-4 h-4" />;
      case 'applications_open': return <Play className="w-4 h-4" />;
      case 'in_progress': return <Pause className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const startEditing = () => {
    setEditedName(cohort.name);
    setEditedDescription(cohort.description || '');
    setEditedMaxStartups(cohort.max_startups.toString());
    setEditedFunding(cohort.funding_per_startup?.toString() || '');
    setEditedEquity(cohort.equity_percentage?.toString() || '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdateCohort(cohort.id, {
        name: editedName,
        description: editedDescription,
        max_startups: parseInt(editedMaxStartups) || cohort.max_startups,
        funding_per_startup: editedFunding ? parseInt(editedFunding) : null,
        equity_percentage: editedEquity ? parseFloat(editedEquity) : null,
      });
      setIsEditing(false);
      toast({ title: 'Cohort updated successfully' });
    } catch (error) {
      toast({ title: 'Failed to update cohort', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/cohort/${cohort.id}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copied to clipboard' });
  };

  const copyApplicationLink = () => {
    navigator.clipboard.writeText(applicationUrl);
    toast({ title: 'Application link copied!' });
  };

  const daysUntilDeadline = cohort.application_deadline 
    ? differenceInDays(new Date(cohort.application_deadline), new Date())
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl glass-morphism !transition-none">
        <DialogHeader className="!transition-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isEditing ? (
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="text-xl font-bold h-10"
                />
              ) : (
                <DialogTitle className="text-2xl">{cohort.name}</DialogTitle>
              )}
              <Badge className={`${getStatusColor(cohort.status)} flex items-center gap-1`}>
                {getStatusIcon(cohort.status)}
                {formatStatus(cohort.status)}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    <X className="w-4 h-4 mr-1" /> Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    <Save className="w-4 h-4 mr-1" /> {saving ? 'Saving...' : 'Save'}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-1" /> Share
                  </Button>
                  <Button variant="outline" size="sm" onClick={startEditing}>
                    <Edit className="w-4 h-4 mr-1" /> Edit
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Application Link */}
          <Card className="tech-card border-emerald-500/30 bg-emerald-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Link className="w-4 h-4 text-emerald-500" />
                <span className="font-medium">Application Link</span>
              </div>
              <div className="flex items-center gap-2">
                <Input 
                  value={applicationUrl} 
                  readOnly 
                  className="flex-1 text-sm bg-background/50"
                />
                <Button variant="outline" size="sm" onClick={copyApplicationLink}>
                  <Copy className="w-4 h-4 mr-1" /> Copy
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.open(applicationUrl, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Share this link with startups to accept applications from outside the platform.
              </p>
            </CardContent>
          </Card>

          {/* Description */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
            {isEditing ? (
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                rows={3}
                placeholder="Describe your cohort program..."
              />
            ) : (
              <p className="text-foreground">{cohort.description || 'No description provided.'}</p>
            )}
          </div>

          {/* Progress */}
          <Card className="tech-card border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Startup Capacity</span>
                <span className="font-bold">{cohort.current_startups} / {isEditing ? (
                  <Input 
                    type="number"
                    value={editedMaxStartups}
                    onChange={(e) => setEditedMaxStartups(e.target.value)}
                    className="w-16 h-6 inline-block text-center"
                  />
                ) : cohort.max_startups}</span>
              </div>
              <Progress value={(cohort.current_startups / cohort.max_startups) * 100} className="h-3" />
            </CardContent>
          </Card>

          {/* Deadline Countdown */}
          {cohort.application_deadline && daysUntilDeadline !== null && daysUntilDeadline > 0 && (
            <Card className="tech-card border-emerald-500/30 bg-emerald-500/5">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="font-medium">Application Deadline</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(cohort.application_deadline), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-500">{daysUntilDeadline}</p>
                  <p className="text-sm text-muted-foreground">days left</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cohort.start_date && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <p className="font-medium text-sm">{format(new Date(cohort.start_date), 'MMM d, yyyy')}</p>
                </div>
              </div>
            )}
            {cohort.end_date && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">End Date</p>
                  <p className="font-medium text-sm">{format(new Date(cohort.end_date), 'MMM d, yyyy')}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <div>
                <p className="text-xs text-muted-foreground">Funding</p>
                {isEditing ? (
                  <Input
                    type="number"
                    value={editedFunding}
                    onChange={(e) => setEditedFunding(e.target.value)}
                    className="h-6 w-20 text-sm"
                    placeholder="Amount"
                  />
                ) : (
                  <p className="font-medium text-sm">
                    {cohort.funding_per_startup ? `$${(cohort.funding_per_startup / 1000).toFixed(0)}K` : 'N/A'}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50">
              <Percent className="w-4 h-4 text-amber-500" />
              <div>
                <p className="text-xs text-muted-foreground">Equity</p>
                {isEditing ? (
                  <Input
                    type="number"
                    value={editedEquity}
                    onChange={(e) => setEditedEquity(e.target.value)}
                    className="h-6 w-16 text-sm"
                    placeholder="%"
                  />
                ) : (
                  <p className="font-medium text-sm">
                    {cohort.equity_percentage ? `${cohort.equity_percentage}%` : 'N/A'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Focus Industries */}
          {cohort.focus_industries && cohort.focus_industries.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Focus Industries</h4>
              <div className="flex flex-wrap gap-2">
                {cohort.focus_industries.map((industry) => (
                  <Badge key={industry} variant="outline" className="bg-background/50">
                    {industry}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-border/50">
            <Button 
              className="flex-1" 
              onClick={() => {
                onOpenChange(false);
                onViewApplications?.();
              }}
            >
              <Users className="w-4 h-4 mr-2" />
              View Applications
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};