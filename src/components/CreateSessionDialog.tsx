import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface CreateSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionCreated: () => void;
}

interface MentorOption {
  user_id: string;
  full_name: string;
  expertise_areas: string[];
}

export default function CreateSessionDialog({ open, onOpenChange, onSessionCreated }: CreateSessionDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mentors, setMentors] = useState<MentorOption[]>([]);
  const [loadingMentors, setLoadingMentors] = useState(true);
  
  const [formData, setFormData] = useState({
    mentor_id: '',
    scheduled_at: '',
    duration_minutes: '60',
    topic: '',
    description: '',
  });

  useEffect(() => {
    if (open) {
      fetchMentors();
    }
  }, [open]);

  const fetchMentors = async () => {
    try {
      setLoadingMentors(true);
      
      // Fetch mentors and advisors with availability
      const { data: mentorData, error: mentorError } = await supabase
        .from('mentor_profiles')
        .select(`
          user_id,
          expertise_areas
        `)
        .eq('is_accepting_mentees', true);

      if (mentorError) throw mentorError;

      // Get user roles to find advisors
      const { data: advisorRoles, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'advisor');

      if (roleError) throw roleError;

      // Combine mentor and advisor user IDs
      const mentorIds = mentorData?.map(m => m.user_id) || [];
      const advisorIds = advisorRoles?.map(r => r.user_id) || [];
      const allIds = [...new Set([...mentorIds, ...advisorIds])];

      // Check which mentors have availability set
      const { data: availabilityData } = await supabase
        .from('mentor_availability')
        .select('mentor_id')
        .in('mentor_id', allIds);

      const mentorsWithAvailability = new Set(availabilityData?.map(a => a.mentor_id) || []);

      // Fetch profile details
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', allIds);

      if (profileError) throw profileError;

      // Combine data - only show mentors with availability
      const mentorOptions: MentorOption[] = profiles
        ?.filter(profile => mentorsWithAvailability.has(profile.user_id))
        .map(profile => {
          const mentorProfile = mentorData?.find(m => m.user_id === profile.user_id);
          return {
            user_id: profile.user_id,
            full_name: profile.full_name || 'Unknown',
            expertise_areas: mentorProfile?.expertise_areas || [],
          };
        }) || [];

      setMentors(mentorOptions);
    } catch (error) {
      console.error('Error fetching mentors:', error);
      toast({
        title: 'Error',
        description: 'Failed to load mentors and advisors',
        variant: 'destructive',
      });
    } finally {
      setLoadingMentors(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      setLoading(true);

      // Generate Daily.co room URL
      const sessionId = crypto.randomUUID();
      const meetingLink = `https://startup-platform.daily.co/${sessionId}`;

      const { error } = await supabase
        .from('mentoring_sessions')
        .insert({
          mentor_id: formData.mentor_id,
          mentee_id: user.id,
          scheduled_at: formData.scheduled_at,
          duration_minutes: parseInt(formData.duration_minutes),
          topic: formData.topic,
          description: formData.description,
          meeting_link: meetingLink,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: 'Session Scheduled!',
        description: 'Your mentoring session has been requested.',
      });

      onSessionCreated();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        mentor_id: '',
        scheduled_at: '',
        duration_minutes: '60',
        topic: '',
        description: '',
      });
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: 'Error',
        description: 'Failed to schedule session',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Mentoring Session</DialogTitle>
          <DialogDescription>
            Request a session with a mentor or advisor
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mentor">Mentor/Advisor</Label>
            {loadingMentors ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <Select
                value={formData.mentor_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, mentor_id: value }))}
                required
              >
                <SelectTrigger id="mentor">
                  <SelectValue placeholder="Select a mentor or advisor" />
                </SelectTrigger>
                <SelectContent>
                  {mentors.map((mentor) => (
                    <SelectItem key={mentor.user_id} value={mentor.user_id}>
                      {mentor.full_name}
                      {mentor.expertise_areas.length > 0 && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({mentor.expertise_areas.slice(0, 2).join(', ')})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              value={formData.topic}
              onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
              placeholder="e.g., Pitch Deck Review"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduled_at">Date & Time</Label>
            <Input
              id="scheduled_at"
              type="datetime-local"
              value={formData.scheduled_at}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduled_at: e.target.value }))}
              min={new Date().toISOString().slice(0, 16)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Only times matching the mentor's availability can be selected
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Select
              value={formData.duration_minutes}
              onValueChange={(value) => setFormData(prev => ({ ...prev, duration_minutes: value }))}
            >
              <SelectTrigger id="duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
                <SelectItem value="90">90 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="What would you like to discuss?"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Schedule Session
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
