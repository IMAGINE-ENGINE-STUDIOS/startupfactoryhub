import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Search, 
  Plus, 
  Users, 
  Briefcase,
  ChevronRight,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CohortStartup {
  id: string;
  company?: {
    id: string;
    name: string;
    logo_url: string | null;
    industry: string | null;
  };
  mentor_assignments?: {
    id: string;
    mentor_id: string;
    focus_area: string | null;
    status: string;
  }[];
  advisor_assignments?: {
    id: string;
    advisor_id: string;
    expertise_area: string | null;
    status: string;
  }[];
}

interface Profile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface MentorAdvisorAssignmentProps {
  startups: CohortStartup[];
  onAssignMentor: (cohortStartupId: string, mentorId: string, focusArea?: string) => Promise<void>;
  onAssignAdvisor: (cohortStartupId: string, advisorId: string, expertiseArea?: string) => Promise<void>;
  onRemoveMentor?: (assignmentId: string) => Promise<void>;
  onRemoveAdvisor?: (assignmentId: string) => Promise<void>;
}

export const MentorAdvisorAssignment = ({
  startups,
  onAssignMentor,
  onAssignAdvisor,
  onRemoveMentor,
  onRemoveAdvisor
}: MentorAdvisorAssignmentProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mentors, setMentors] = useState<Profile[]>([]);
  const [advisors, setAdvisors] = useState<Profile[]>([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedStartup, setSelectedStartup] = useState<CohortStartup | null>(null);
  const [assignType, setAssignType] = useState<'mentor' | 'advisor'>('mentor');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [focusArea, setFocusArea] = useState('');
  const [loading, setLoading] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [assignmentToRemove, setAssignmentToRemove] = useState<{ id: string; type: 'mentor' | 'advisor' } | null>(null);

  const handleRemoveClick = (e: React.MouseEvent, assignmentId: string, type: 'mentor' | 'advisor') => {
    e.stopPropagation();
    setAssignmentToRemove({ id: assignmentId, type });
    setRemoveDialogOpen(true);
  };

  const confirmRemove = async () => {
    if (!assignmentToRemove) return;
    
    try {
      if (assignmentToRemove.type === 'mentor' && onRemoveMentor) {
        await onRemoveMentor(assignmentToRemove.id);
      } else if (assignmentToRemove.type === 'advisor' && onRemoveAdvisor) {
        await onRemoveAdvisor(assignmentToRemove.id);
      }
    } catch (error) {
      console.error('Error removing assignment:', error);
    } finally {
      setRemoveDialogOpen(false);
      setAssignmentToRemove(null);
    }
  };

  useEffect(() => {
    fetchMentorsAndAdvisors();
  }, []);

  const fetchMentorsAndAdvisors = async () => {
    try {
      // Fetch mentors
      const { data: mentorRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'mentor');

      if (mentorRoles) {
        const mentorIds = mentorRoles.map(r => r.user_id);
        const { data: mentorProfiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url, bio')
          .in('user_id', mentorIds);
        
        setMentors(mentorProfiles || []);
      }

      // Fetch advisors
      const { data: advisorRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'advisor');

      if (advisorRoles) {
        const advisorIds = advisorRoles.map(r => r.user_id);
        const { data: advisorProfiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url, bio')
          .in('user_id', advisorIds);
        
        setAdvisors(advisorProfiles || []);
      }
    } catch (error) {
      console.error('Error fetching mentors/advisors:', error);
    }
  };

  const filteredStartups = startups.filter(startup => {
    return !searchQuery || 
      startup.company?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleAssign = async () => {
    if (!selectedStartup || !selectedUserId) return;

    setLoading(true);
    try {
      if (assignType === 'mentor') {
        await onAssignMentor(selectedStartup.id, selectedUserId, focusArea || undefined);
      } else {
        await onAssignAdvisor(selectedStartup.id, selectedUserId, focusArea || undefined);
      }
      setAssignDialogOpen(false);
      setSelectedUserId('');
      setFocusArea('');
    } catch (error) {
      console.error('Error assigning:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAssignDialog = (startup: CohortStartup, type: 'mentor' | 'advisor') => {
    setSelectedStartup(startup);
    setAssignType(type);
    setAssignDialogOpen(true);
  };

  const getProfileById = (userId: string) => {
    return [...mentors, ...advisors].find(p => p.user_id === userId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Mentor & Advisor Assignments</h2>
          <p className="text-muted-foreground">
            {mentors.length} mentors and {advisors.length} advisors available
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search startups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-[250px]"
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="tech-card border-0">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mentors.length}</p>
              <p className="text-sm text-muted-foreground">Available Mentors</p>
            </div>
          </CardContent>
        </Card>

        <Card className="tech-card border-0">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{advisors.length}</p>
              <p className="text-sm text-muted-foreground">Available Advisors</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Startups with Assignments */}
      <div className="space-y-4">
        {filteredStartups.map((startup) => (
          <Card 
            key={startup.id}
            className="tech-card border-0"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={startup.company?.logo_url || undefined} />
                    <AvatarFallback className="bg-emerald-500/20 text-emerald-400">
                      {startup.company?.name?.charAt(0) || 'S'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{startup.company?.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {startup.company?.industry || 'Technology'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Mentors Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      Assigned Mentors
                    </h4>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openAssignDialog(startup, 'mentor')}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {startup.mentor_assignments?.filter(a => a.status === 'active').map((assignment) => {
                      const profile = getProfileById(assignment.mentor_id);
                      return (
                        <div 
                          key={assignment.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/50 group/item"
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={profile?.avatar_url || undefined} />
                            <AvatarFallback className="bg-blue-500/20 text-blue-400 text-xs">
                              {profile?.full_name?.charAt(0) || 'M'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {profile?.full_name || 'Unknown'}
                            </p>
                            {assignment.focus_area && (
                              <Badge variant="outline" className="text-xs mt-1">
                                {assignment.focus_area}
                              </Badge>
                            )}
                          </div>
                          {onRemoveMentor && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover/item:opacity-100"
                              onClick={(e) => handleRemoveClick(e, assignment.id, 'mentor')}
                            >
                              <X className="h-3 w-3 text-destructive" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                    {(!startup.mentor_assignments || startup.mentor_assignments.filter(a => a.status === 'active').length === 0) && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No mentors assigned
                      </p>
                    )}
                  </div>
                </div>

                {/* Advisors Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-purple-500" />
                      Assigned Advisors
                    </h4>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openAssignDialog(startup, 'advisor')}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {startup.advisor_assignments?.filter(a => a.status === 'active').map((assignment) => {
                      const profile = getProfileById(assignment.advisor_id);
                      return (
                        <div 
                          key={assignment.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/50 group/item"
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={profile?.avatar_url || undefined} />
                            <AvatarFallback className="bg-purple-500/20 text-purple-400 text-xs">
                              {profile?.full_name?.charAt(0) || 'A'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {profile?.full_name || 'Unknown'}
                            </p>
                            {assignment.expertise_area && (
                              <Badge variant="outline" className="text-xs mt-1">
                                {assignment.expertise_area}
                              </Badge>
                            )}
                          </div>
                          {onRemoveAdvisor && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover/item:opacity-100"
                              onClick={(e) => handleRemoveClick(e, assignment.id, 'advisor')}
                            >
                              <X className="h-3 w-3 text-destructive" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                    {(!startup.advisor_assignments || startup.advisor_assignments.filter(a => a.status === 'active').length === 0) && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No advisors assigned
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredStartups.length === 0 && (
        <Card className="tech-card border-0">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Startups in Program</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Accept applications to add startups and start assigning mentors and advisors.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Assignment Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="tech-card border-0 !transition-none">
          <DialogHeader>
            <DialogTitle>
              Assign {assignType === 'mentor' ? 'Mentor' : 'Advisor'} to {selectedStartup?.company?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Select {assignType === 'mentor' ? 'Mentor' : 'Advisor'}</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder={`Choose a ${assignType}`} />
                </SelectTrigger>
                <SelectContent>
                  {(assignType === 'mentor' ? mentors : advisors).map((profile) => (
                    <SelectItem key={profile.user_id} value={profile.user_id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={profile.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {profile.full_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        {profile.full_name || 'Unknown'}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{assignType === 'mentor' ? 'Focus Area' : 'Expertise Area'}</Label>
              <Input
                value={focusArea}
                onChange={(e) => setFocusArea(e.target.value)}
                placeholder={assignType === 'mentor' ? 'e.g., Product, Sales, Fundraising' : 'e.g., Legal, Finance, Marketing'}
                className="mt-1.5"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssign}
              disabled={!selectedUserId || loading}
              className="bg-gradient-to-r from-emerald-500 to-teal-500"
            >
              {loading ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent className="tech-card border-0 !transition-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the {assignmentToRemove?.type} from this startup. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove} className="bg-destructive hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
