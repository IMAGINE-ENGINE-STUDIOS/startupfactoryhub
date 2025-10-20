import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface BookPitchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investorId: string;
  investorName: string;
  companyId: string;
  companyName: string;
}

interface AvailabilitySlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export default function BookPitchDialog({
  open,
  onOpenChange,
  investorId,
  investorName,
  companyId,
  companyName
}: BookPitchDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [date, setDate] = useState<Date>();
  const [timeSlot, setTimeSlot] = useState<string>('');
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && investorId) {
      fetchAvailability();
    }
  }, [open, investorId]);

  useEffect(() => {
    if (date) {
      generateAvailableSlots();
    }
  }, [date, availability]);

  const fetchAvailability = async () => {
    const { data } = await supabase
      .from('investor_availability')
      .select('*')
      .eq('investor_id', investorId)
      .eq('is_available', true);

    if (data) {
      setAvailability(data);
    }
  };

  const generateAvailableSlots = () => {
    if (!date) return;

    const dayOfWeek = date.getDay();
    const dayAvailability = availability.filter(a => a.day_of_week === dayOfWeek);

    const slots: string[] = [];
    dayAvailability.forEach(slot => {
      const [startHour, startMinute] = slot.start_time.split(':').map(Number);
      const [endHour, endMinute] = slot.end_time.split(':').map(Number);

      let currentHour = startHour;
      let currentMinute = startMinute;

      while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
        const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
        slots.push(timeString);

        currentMinute += 30;
        if (currentMinute >= 60) {
          currentHour += 1;
          currentMinute = 0;
        }
      }
    });

    setAvailableSlots(slots);
  };

  const handleBookPitch = async () => {
    if (!user || !date || !timeSlot) return;

    setLoading(true);
    try {
      const [hours, minutes] = timeSlot.split(':').map(Number);
      const scheduledDate = new Date(date);
      scheduledDate.setHours(hours, minutes, 0, 0);

      // Generate Jitsi Meet room URL for video conferencing
      const meetingId = `pitch-${crypto.randomUUID()}`;
      const meetingLink = `https://meet.jit.si/${meetingId}`;

      // Create pitch meeting
      const { error: pitchError } = await supabase
        .from('pitch_meetings')
        .insert({
          startup_id: user.id,
          investor_id: investorId,
          company_id: companyId,
          scheduled_date: scheduledDate.toISOString(),
          duration_minutes: 30,
          status: 'scheduled',
          meeting_link: meetingLink
        });

      if (pitchError) throw pitchError;

      // Send notification to investor
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      await supabase
        .from('notifications')
        .insert({
          user_id: investorId,
          type: 'pitch_meeting_scheduled',
          title: 'New Pitch Meeting Scheduled',
          message: `${profile?.full_name || 'A startup'} from ${companyName} has scheduled a pitch meeting with you`,
          data: {
            startup_id: user.id,
            company_id: companyId,
            company_name: companyName,
            scheduled_date: scheduledDate.toISOString()
          }
        });

      toast({
        title: "Pitch Meeting Booked!",
        description: `Your pitch with ${investorName} is scheduled for ${format(scheduledDate, 'PPP p')}`,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error booking pitch:', error);
      toast({
        title: "Error",
        description: "Failed to book pitch meeting. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Book Pitch Meeting with {investorName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Select Date</label>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={(date) => date < new Date() || date < new Date(new Date().setHours(0, 0, 0, 0))}
              initialFocus
              className={cn("border rounded-md pointer-events-auto")}
            />
          </div>

          {date && availableSlots.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Select Time (30 minute slots)
              </label>
              <Select value={timeSlot} onValueChange={setTimeSlot}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a time" />
                </SelectTrigger>
                <SelectContent>
                  {availableSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {date && availableSlots.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No availability for this date</p>
              <p className="text-sm">Please select a different date</p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <Button
              className="flex-1"
              size="lg"
              onClick={handleBookPitch}
              disabled={!date || !timeSlot || loading}
            >
              {loading ? 'Booking...' : 'Confirm Booking'}
            </Button>
            <Button variant="outline" size="lg" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
