import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Calendar, 
  Users, 
  DollarSign, 
  Settings,
  Play,
  Pause,
  CheckCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { CreateCohortDialog } from './CreateCohortDialog';

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

interface CohortManagementProps {
  cohorts: Cohort[];
  onCreateCohort: (cohort: Partial<Cohort>) => Promise<any>;
  onUpdateCohort: (cohortId: string, updates: Partial<Cohort>) => Promise<void>;
  onSelectCohort: (cohort: Cohort) => void;
}

export const CohortManagement = ({ 
  cohorts, 
  onCreateCohort, 
  onUpdateCohort,
  onSelectCohort 
}: CohortManagementProps) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

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
      case 'upcoming': return <Clock className="w-3 h-3" />;
      case 'applications_open': return <Play className="w-3 h-3" />;
      case 'in_progress': return <Pause className="w-3 h-3" />;
      case 'completed': return <CheckCircle className="w-3 h-3" />;
      default: return null;
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Cohort Management</h2>
          <p className="text-muted-foreground">Manage your accelerator programs and batches</p>
        </div>
        <Button 
          onClick={() => setCreateDialogOpen(true)}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Cohort
        </Button>
      </div>

      {/* Cohort Grid */}
      {cohorts.length === 0 ? (
        <Card className="glass-morphism border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Cohorts Yet</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Create your first cohort to start accepting applications from promising startups.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Cohort
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cohorts.map((cohort) => (
            <Card 
              key={cohort.id}
              className="glass-morphism border-border/50 hover:border-emerald-500/30 transition-all duration-300 cursor-pointer group"
              onClick={() => onSelectCohort(cohort)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg group-hover:text-emerald-400 transition-colors">
                      {cohort.name}
                    </CardTitle>
                    {cohort.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {cohort.description}
                      </p>
                    )}
                  </div>
                  <Badge className={`${getStatusColor(cohort.status)} flex items-center gap-1`}>
                    {getStatusIcon(cohort.status)}
                    {formatStatus(cohort.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Startups</span>
                    <span className="font-medium">{cohort.current_startups} / {cohort.max_startups}</span>
                  </div>
                  <Progress 
                    value={(cohort.current_startups / cohort.max_startups) * 100} 
                    className="h-2"
                  />
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {cohort.start_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{format(new Date(cohort.start_date), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  {cohort.funding_per_startup && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      <span>${(cohort.funding_per_startup / 1000).toFixed(0)}K</span>
                    </div>
                  )}
                </div>

                {/* Industries */}
                {cohort.focus_industries && cohort.focus_industries.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-2">
                    {cohort.focus_industries.slice(0, 3).map((industry) => (
                      <Badge 
                        key={industry} 
                        variant="outline" 
                        className="text-xs bg-background/50"
                      >
                        {industry}
                      </Badge>
                    ))}
                    {cohort.focus_industries.length > 3 && (
                      <Badge variant="outline" className="text-xs bg-background/50">
                        +{cohort.focus_industries.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCohort(cohort);
                    }}
                  >
                    View Details
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Open settings
                    }}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateCohortDialog 
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreateCohort={onCreateCohort}
      />
    </div>
  );
};
