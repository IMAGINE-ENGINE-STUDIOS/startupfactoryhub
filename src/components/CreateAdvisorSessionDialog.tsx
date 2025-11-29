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
import { Loader2, Clock, Calendar, AlertCircle, Building2, Users, Globe } from 'lucide-react';
import { format, addDays, setHours, setMinutes, startOfWeek } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CreateAdvisorSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionCreated: () => void;
  preSelectedMenteeId?: string;
}

interface StartupOption {
  user_id: string;
  full_name: string;
  company_name: string | null;
  company_stage: string | null;
  is_mentee: boolean;
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

export default function CreateAdvisorSessionDialog({ 
  open, 
  onOpenChange, 
  onSessionCreated,
  preSelectedMenteeId 
}: CreateAdvisorSessionDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mentees, setMentees] = useState<StartupOption[]>([]);
  const [allStartups, setAllStartups] = useState<StartupOption[]>([]);
  const [loadingMentees, setLoadingMentees] = useState(true);
  const [loadingStartups, setLoadingStartups] = useState(true);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [manualDateTime, setManualDateTime] = useState('');
  const [startupSource, setStartupSource] = useState<'mentees' | 'all'>('all');
  
  const [formData, setFormData] = useState({
    startup_id: preSelectedMenteeId || '',
    duration_minutes: '60',
    topic: '',
    description: '',
  });

  useEffect(() => {
    if (open && user) {
      fetchMentees();
      fetchAllStartups();
      fetchMyAvailability();
    }
  }, [open, user]);

  useEffect(() => {
    if (preSelectedMenteeId) {
      setFormData(prev => ({ ...prev, startup_id: preSelectedMenteeId }));
    }
  }, [preSelectedMenteeId]);

  const fetchMentees = async () => {
    if (!user) return;
    
    try {
      setLoadingMentees(true);
      
      // Fetch active mentorship relationships where this user is the mentor
      const { data: relationships, error: relError } = await supabase
        .from('mentorship_relationships')
        .select(`
          mentee_id,
          mentee:profiles!mentorship_relationships_mentee_id_fkey (
            full_name,
            user_id
          )
        `)
        .eq('mentor_id', user.id)
        .eq('status', 'active');

      if (relError) throw relError;

      if (!relationships || relationships.length === 0) {
        setMentees([]);
        return;
      }

      // Get company info for each mentee
      const menteeOptions: StartupOption[] = await Promise.all(
        relationships.map(async (rel: any) => {
          const { data: company } = await supabase
            .from('companies')
            .select('name, stage')
            .eq('user_id', rel.mentee?.user_id)
            .maybeSingle();

          return {
            user_id: rel.mentee_id,
            full_name: rel.mentee?.full_name || 'Unknown',
            company_name: company?.name || null,
            company_stage: company?.stage || null,
            is_mentee: true,
          };
        })
      );

      setMentees(menteeOptions);
    } catch (error) {
      console.error('Error fetching mentees:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your mentees',
        variant: 'destructive',
      });
    } finally {
      setLoadingMentees(false);
    }
  };

  const fetchAllStartups = async () => {
    if (!user) return;
    
    try {
      setLoadingStartups(true);
      
      // Fetch all companies (startups) on the platform
      const { data: companies, error } = await supabase
        .from('companies')
        .select(`
          id,
          name,
          stage,
          user_id,
          profiles:user_id (
            full_name
          )
        `)
        .neq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;

      if (!companies || companies.length === 0) {
        setAllStartups([]);
        return;
      }

      const startupOptions: StartupOption[] = companies.map((company: any) => ({
        user_id: company.user_id,
        full_name: company.profiles?.full_name || 'Unknown Founder',
        company_name: company.name,
        company_stage: company.stage,
        is_mentee: false,
      }));

      setAllStartups(startupOptions);
    } catch (error) {
      console.error('Error fetching startups:', error);
      toast({
        title: 'Error',
        description: 'Failed to load startups',
        variant: 'destructive',
      });
    } finally {
      setLoadingStartups(false);
    }
  };

  const fetchMyAvailability = async () => {
    if (!user) return;
    
    try {
      setLoadingAvailability(true);
      
      const { data, error } = await supabase
        .from('mentor_availability')
        .select('*')
        .eq('mentor_id', user.id)
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
      console.error('Error fetching availability:', error);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const generateAvailableTimeSlots = (slots: AvailabilitySlot[]) => {
    const timeSlots: TimeSlot[] = [];
    const today = new Date();
    const startWeek = startOfWeek(today, { weekStartsOn: 1 });
    const daysToShow = 14;

    for (let dayOffset = 0; dayOffset < daysToShow; dayOffset++) {
      const currentDate = addDays(startWeek, dayOffset);
      const dayOfWeek = currentDate.getDay();

      const daySlots = slots.filter(slot => slot.day_of_week === dayOfWeek);

      daySlots.forEach(slot => {
        const [startHour] = slot.start_time.split(':').map(Number);
        const [endHour] = slot.end_time.split(':').map(Number);

        let currentHour = startHour;
        while (currentHour < endHour) {
          const slotTime = setMinutes(setHours(currentDate, currentHour), 0);
          
          if (slotTime > today) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    let scheduledAt: Date;

    if (availableTimeSlots.length === 0 && manualDateTime) {
      scheduledAt = new Date(manualDateTime);
    } else if (selectedDate && selectedTime) {
      const selectedSlot = availableTimeSlots.find(
        slot => format(slot.datetime, 'yyyy-MM-dd') === selectedDate && 
                format(slot.datetime, 'HH:mm') === selectedTime
      );
      if (!selectedSlot) {
        toast({
          title: 'Invalid Time',
          description: 'Please select a valid time slot',
          variant: 'destructive',
        });
        return;
      }
      scheduledAt = selectedSlot.datetime;
    } else {
      toast({
        title: 'Missing Information',
        description: 'Please select a date and time for the session',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      // Create Whereby room
      const { data: roomData, error: roomError } = await supabase.functions.invoke('create-whereby-room', {
        body: { 
          roomName: `adv-sess-${Math.random().toString(36).substring(2, 10)}`,
          startDate: scheduledAt.toISOString()
        }
      });

      if (roomError) throw roomError;
      const meetingLink = roomData.roomUrl;

      // Create the session with advisor as mentor and host
      const { error } = await supabase
        .from('mentoring_sessions')
        .insert({
          mentor_id: user.id,
          mentee_id: formData.startup_id,
          scheduled_at: scheduledAt.toISOString(),
          duration_minutes: parseInt(formData.duration_minutes),
          topic: formData.topic,
          description: formData.description,
          meeting_link: meetingLink,
          status: 'scheduled',
          host_id: user.id
        });

      if (error) throw error;

      // Get the selected startup info for notification
      const selectedStartup = startupSource === 'mentees' 
        ? mentees.find(m => m.user_id === formData.startup_id)
        : allStartups.find(s => s.user_id === formData.startup_id);

      // Send notification to startup
      await supabase
        .from('notifications')
        .insert({
          user_id: formData.startup_id,
          type: 'info',
          title: 'New Session Scheduled',
          message: `An advisor has scheduled a session with you: ${formData.topic || 'Advisory Session'}`,
          data: {
            scheduled_at: scheduledAt.toISOString(),
            mentor_id: user.id
          }
        });

      toast({
        title: 'Session Scheduled!',
        description: `Session with ${selectedStartup?.full_name || selectedStartup?.company_name || 'startup'} has been scheduled.`,
      });

      onSessionCreated();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        startup_id: '',
        duration_minutes: '60',
        topic: '',
        description: '',
      });
      setSelectedDate('');
      setSelectedTime('');
      setManualDateTime('');
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

  const currentStartups = startupSource === 'mentees' ? mentees : allStartups;
  const isLoadingStartups = startupSource === 'mentees' ? loadingMentees : loadingStartups;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Advisory Session</DialogTitle>
          <DialogDescription>
            Schedule a session with a startup from your network or the platform
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Select Startup From</Label>
            <Tabs value={startupSource} onValueChange={(v) => {
              setStartupSource(v as 'mentees' | 'all');
              setFormData(prev => ({ ...prev, startup_id: '' }));
            }}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  All Startups
                </TabsTrigger>
                <TabsTrigger value="mentees" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  My Mentees
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startup">Select {startupSource === 'mentees' ? 'Mentee' : 'Startup'}</Label>
            {isLoadingStartups ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : currentStartups.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {startupSource === 'mentees' 
                    ? "You don't have any active mentees yet. Switch to 'All Startups' to schedule with any startup on the platform."
                    : "No startups found on the platform yet."
                  }
                </AlertDescription>
              </Alert>
            ) : (
              <Select
                value={formData.startup_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, startup_id: value }))}
                required
              >
                <SelectTrigger id="startup">
                  <SelectValue placeholder={`Select a ${startupSource === 'mentees' ? 'mentee' : 'startup'}`} />
                </SelectTrigger>
                <SelectContent>
                  {currentStartups.map((startup) => (
                    <SelectItem key={startup.user_id} value={startup.user_id}>
                      <div className="flex items-center gap-2">
                        <span>{startup.full_name}</span>
                        {startup.company_name && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {startup.company_name}
                          </span>
                        )}
                        {startup.is_mentee && (
                          <Badge variant="secondary" className="text-xs">Mentee</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic">Session Topic</Label>
            <Input
              id="topic"
              value={formData.topic}
              onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
              placeholder="e.g., Business Strategy Review"
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Select Time Slot</Label>
            {loadingAvailability ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : availableTimeSlots.length === 0 ? (
              <div>
                <Alert className="mb-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You haven't set your availability yet. You can set it in the Calendar tab or enter a time manually.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <Label htmlFor="manual-datetime">Select Date & Time</Label>
                  <Input
                    id="manual-datetime"
                    type="datetime-local"
                    value={manualDateTime}
                    onChange={(e) => setManualDateTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3 max-h-[250px] overflow-y-auto">
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
            <Label htmlFor="description">Notes (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Any additional notes for the session"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || currentStartups.length === 0 || !formData.startup_id}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Schedule Session
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
