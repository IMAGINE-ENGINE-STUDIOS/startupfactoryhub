import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Clock, Calendar, AlertCircle, Users } from 'lucide-react';
import { format, addDays, setHours, setMinutes, startOfWeek, parse } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CreateSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionCreated: () => void;
  preSelectedMentorId?: string;
}

interface MentorOption {
  user_id: string;
  full_name: string;
  expertise_areas: string[];
}

interface AvailabilitySlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface TimeSlot {
  datetime: Date;
  display: string;
  day: string;
}

export default function CreateSessionDialog({ open, onOpenChange, onSessionCreated, preSelectedMentorId }: CreateSessionDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mentors, setMentors] = useState<MentorOption[]>([]);
  const [loadingMentors, setLoadingMentors] = useState(true);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [manualDateTime, setManualDateTime] = useState('');
  const [useManualEntry, setUseManualEntry] = useState(false);
  const [bookedSessions, setBookedSessions] = useState<Date[]>([]);
  
  const [formData, setFormData] = useState({
    mentor_id: '',
    duration_minutes: '60',
    topic: '',
    description: '',
  });

  useEffect(() => {
    if (open) {
      fetchMentors();
    }
  }, [open]);

  // Pre-select mentor when provided
  useEffect(() => {
    if (preSelectedMentorId && open) {
      setFormData(prev => ({ ...prev, mentor_id: preSelectedMentorId }));
    }
  }, [preSelectedMentorId, open]);

  // Fetch availability and booked sessions when mentor changes
  useEffect(() => {
    if (formData.mentor_id) {
      fetchMentorAvailability(formData.mentor_id);
      fetchMentorBookedSessions(formData.mentor_id);
    } else {
      setAvailability([]);
      setAvailableTimeSlots([]);
      setBookedSessions([]);
      setSelectedDate('');
      setSelectedTime('');
    }
  }, [formData.mentor_id]);

  // Real-time sync for mentor's calendar
  useEffect(() => {
    if (!open || !formData.mentor_id) return;

    const channel = supabase
      .channel(`mentor-schedule-${formData.mentor_id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'mentor_availability',
        filter: `mentor_id=eq.${formData.mentor_id}`
      }, () => {
        fetchMentorAvailability(formData.mentor_id);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'mentoring_sessions',
        filter: `mentor_id=eq.${formData.mentor_id}`
      }, () => {
        fetchMentorBookedSessions(formData.mentor_id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, formData.mentor_id]);

  // Fetch booked sessions for conflict detection
  const fetchMentorBookedSessions = async (mentorId: string) => {
    try {
      const { data, error } = await supabase
        .from('mentoring_sessions')
        .select('scheduled_at, duration_minutes')
        .eq('mentor_id', mentorId)
        .in('status', ['scheduled', 'confirmed'])
        .gte('scheduled_at', new Date().toISOString());

      if (error) throw error;

      setBookedSessions(data?.map(s => new Date(s.scheduled_at)) || []);
    } catch (error) {
      console.error('Error fetching booked sessions:', error);
    }
  };

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
      let mentorOptions: MentorOption[] = profiles
        ?.filter(profile => mentorsWithAvailability.has(profile.user_id))
        .map(profile => {
          const mentorProfile = mentorData?.find(m => m.user_id === profile.user_id);
          return {
            user_id: profile.user_id,
            full_name: profile.full_name || 'Unknown',
            expertise_areas: mentorProfile?.expertise_areas || [],
          };
        }) || [];

      // If pre-selected mentor is not in the list, fetch their profile
      if (preSelectedMentorId && !mentorOptions.some(m => m.user_id === preSelectedMentorId)) {
        const { data: preSelectedProfile } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .eq('user_id', preSelectedMentorId)
          .maybeSingle();

        if (preSelectedProfile) {
          mentorOptions = [{
            user_id: preSelectedProfile.user_id,
            full_name: preSelectedProfile.full_name || 'Unknown',
            expertise_areas: [],
          }, ...mentorOptions];
        }
      }

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

  const fetchMentorAvailability = async (mentorId: string) => {
    try {
      setLoadingAvailability(true);
      
      const { data, error } = await supabase
        .from('mentor_availability')
        .select('*')
        .eq('mentor_id', mentorId)
        .eq('is_available', true)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;

      setAvailability(data || []);
      
      if (data && data.length > 0) {
        generateAvailableTimeSlots(data);
      } else {
        setAvailableTimeSlots([]);
      }
    } catch (error) {
      console.error('Error fetching mentor availability:', error);
      toast({
        title: 'Error',
        description: 'Failed to load mentor availability',
        variant: 'destructive',
      });
    } finally {
      setLoadingAvailability(false);
    }
  };

  const generateAvailableTimeSlots = (slots: AvailabilitySlot[], bookedTimes: Date[] = []) => {
    const timeSlots: TimeSlot[] = [];
    const today = new Date();
    const startWeek = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const daysToShow = 14; // Next 2 weeks

    for (let dayOffset = 0; dayOffset < daysToShow; dayOffset++) {
      const currentDate = addDays(startWeek, dayOffset);
      const dayOfWeek = currentDate.getDay();

      // Find availability slots for this day
      const daySlots = slots.filter(slot => slot.day_of_week === dayOfWeek);

      daySlots.forEach(slot => {
        const [startHour, startMin] = slot.start_time.split(':').map(Number);
        const [endHour, endMin] = slot.end_time.split(':').map(Number);

        // Generate hourly time slots within the availability window
        let currentHour = startHour;
        while (currentHour < endHour) {
          const slotTime = setMinutes(setHours(currentDate, currentHour), 0);
          
          // Check if slot conflicts with any booked session (within 1 hour)
          const isBooked = bookedTimes.some(
            bookedTime => Math.abs(slotTime.getTime() - bookedTime.getTime()) < 60 * 60 * 1000
          );
          
          // Only show future time slots that are not booked
          if (slotTime > today && !isBooked) {
            timeSlots.push({
              datetime: slotTime,
              display: format(slotTime, 'h:mm a'),
              day: format(slotTime, 'EEE, MMM d'),
            });
          }
          
          currentHour++;
        }
      });
    }

    setAvailableTimeSlots(timeSlots);
  };

  // Regenerate slots when booked sessions change
  useEffect(() => {
    if (availability.length > 0) {
      generateAvailableTimeSlots(availability, bookedSessions);
    }
  }, [bookedSessions, availability]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    let scheduledTime: Date;

    // Handle manual entry vs time slot selection
    if (useManualEntry && manualDateTime) {
      scheduledTime = new Date(manualDateTime);
      if (scheduledTime <= new Date()) {
        toast({
          title: 'Invalid Time',
          description: 'Please select a future date and time',
          variant: 'destructive',
        });
        return;
      }
    } else if (selectedDate && selectedTime) {
      const selectedSlot = availableTimeSlots.find(
        slot => format(slot.datetime, 'yyyy-MM-dd') === selectedDate && 
                format(slot.datetime, 'HH:mm') === selectedTime
      );
      if (!selectedSlot) {
        toast({
          title: 'Invalid Selection',
          description: 'The selected time slot is no longer available',
          variant: 'destructive',
        });
        return;
      }
      scheduledTime = selectedSlot.datetime;
    } else {
      toast({
        title: 'Missing Information',
        description: 'Please select a date and time',
        variant: 'destructive',
      });
      return;
    }

    // Double-check for conflicts before submitting
    const hasConflict = bookedSessions.some(
      bookedTime => Math.abs(scheduledTime.getTime() - bookedTime.getTime()) < 60 * 60 * 1000
    );

    if (hasConflict) {
      toast({
        title: 'Time Conflict',
        description: 'This time slot was just booked. Please select another time.',
        variant: 'destructive',
      });
      // Refresh booked sessions
      fetchMentorBookedSessions(formData.mentor_id);
      return;
    }

    try {
      setLoading(true);

      // Create Whereby room
      const { data: roomData, error: roomError } = await supabase.functions.invoke('create-whereby-room', {
        body: { 
          roomName: `sess-${Math.random().toString(36).substring(2, 10)}`,
          startDate: scheduledTime.toISOString()
        }
      });

      if (roomError) throw roomError;
      const meetingLink = roomData.roomUrl;

      const { error } = await supabase
        .from('mentoring_sessions')
        .insert({
          mentor_id: formData.mentor_id,
          mentee_id: user.id,
          scheduled_at: scheduledTime.toISOString(),
          duration_minutes: parseInt(formData.duration_minutes),
          topic: formData.topic,
          description: formData.description,
          meeting_link: meetingLink,
          status: 'scheduled',
          host_id: formData.mentor_id
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
        duration_minutes: '60',
        topic: '',
        description: '',
      });
      setSelectedDate('');
      setSelectedTime('');
      setManualDateTime('');
      setUseManualEntry(false);
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
            ) : preSelectedMentorId ? (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {mentors.find(m => m.user_id === preSelectedMentorId)?.full_name || 'Selected Mentor'}
                </span>
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

          {formData.mentor_id && (
            <div className="space-y-3">
              <Label>Available Time Slots</Label>
              {loadingAvailability ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : availableTimeSlots.length === 0 ? (
                <div>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This mentor hasn't set their availability yet. You can propose a meeting time manually.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="manual-datetime">Proposed Date & Time</Label>
                    <Input
                      id="manual-datetime"
                      type="datetime-local"
                      value={manualDateTime}
                      onChange={(e) => {
                        setManualDateTime(e.target.value);
                        setUseManualEntry(true);
                      }}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                </div>
              ) : (
                <>
                  {/* Group by date */}
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {Object.entries(
                      availableTimeSlots.reduce((acc, slot) => {
                        const dateKey = format(slot.datetime, 'yyyy-MM-dd');
                        if (!acc[dateKey]) acc[dateKey] = [];
                        acc[dateKey].push(slot);
                        return acc;
                      }, {} as Record<string, TimeSlot[]>)
                    ).map(([date, slots]) => (
                      <div key={date} className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Calendar className="h-4 w-4" />
                          {slots[0].day}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {slots.map((slot, idx) => (
                            <Badge
                              key={idx}
                              variant={
                                selectedDate === date && 
                                selectedTime === format(slot.datetime, 'HH:mm')
                                  ? 'default'
                                  : 'outline'
                              }
                              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                              onClick={() => {
                                setSelectedDate(date);
                                setSelectedTime(format(slot.datetime, 'HH:mm'));
                              }}
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              {slot.display}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {selectedDate && selectedTime && (
                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                      <p className="text-sm font-medium">Selected Time:</p>
                      <p className="text-sm text-muted-foreground">
                        {format(
                          availableTimeSlots.find(
                            slot => format(slot.datetime, 'yyyy-MM-dd') === selectedDate && 
                                    format(slot.datetime, 'HH:mm') === selectedTime
                          )?.datetime || new Date(),
                          'EEEE, MMMM d, yyyy \'at\' h:mm a'
                        )}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

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
