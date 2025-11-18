import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface InvestorBookPitchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startupId: string;
  startupName: string;
  companyId: string;
  companyName: string;
}

export default function InvestorBookPitchDialog({
  open,
  onOpenChange,
  startupId,
  startupName,
  companyId,
  companyName
}: InvestorBookPitchDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [date, setDate] = useState<Date>();
  const [timeSlot, setTimeSlot] = useState<string>('');
  const [duration, setDuration] = useState<number>(30);
  const [loading, setLoading] = useState(false);

  // Generate time slots from 9 AM to 5 PM in 30-minute intervals
  const generateTimeSlots = () => {
    const slots: string[] = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 17 && minute > 0) break; // Stop at 5:00 PM
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const handleSubmit = async () => {
    if (!user || !date || !timeSlot) {
      toast({
        title: "Missing Information",
        description: "Please select both a date and time for the pitch meeting.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create the scheduled date/time
      const [hours, minutes] = timeSlot.split(':').map(Number);
      const scheduledDate = new Date(date);
      scheduledDate.setHours(hours, minutes, 0, 0);

      // Create Whereby meeting room
      const { data: wherebyData, error: wherebyError } = await supabase.functions.invoke(
        'create-whereby-room',
        {
          body: {
            roomName: `${companyName} - Investor Pitch`,
            startDate: scheduledDate.toISOString(),
            endDate: new Date(scheduledDate.getTime() + duration * 60000).toISOString(),
          }
        }
      );

      if (wherebyError) throw wherebyError;

      // Insert pitch meeting with pending status
      const { error: meetingError } = await supabase
        .from('pitch_meetings')
        .insert({
          startup_id: startupId,
          investor_id: user.id,
          company_id: companyId,
          host_id: user.id,
          scheduled_date: scheduledDate.toISOString(),
          duration_minutes: duration,
          meeting_link: wherebyData.roomUrl,
          status: 'pending',
          meeting_notes: `Pitch meeting request from investor`
        });

      if (meetingError) throw meetingError;

      // Get investor's profile for notification
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      const investorName = profile?.full_name || 'An investor';

      // Create notification for the startup
      await supabase
        .from('notifications')
        .insert({
          user_id: startupId,
          type: 'pitch_request',
          title: 'New Pitch Meeting Request',
          message: `${investorName} would like to schedule a pitch meeting for ${companyName}`,
          data: {
            investor_id: user.id,
            company_id: companyId,
            scheduled_date: scheduledDate.toISOString(),
            investor_name: investorName,
            company_name: companyName
          }
        });

      toast({
        title: "Pitch Request Sent!",
        description: `Your pitch meeting request has been sent to ${startupName}. They will be notified to accept or reschedule.`,
      });

      onOpenChange(false);
      
      // Reset form
      setDate(undefined);
      setTimeSlot('');
      setDuration(30);
    } catch (error) {
      console.error('Error creating pitch meeting:', error);
      toast({
        title: "Error",
        description: "Failed to create pitch meeting. Please try again.",
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
          <DialogTitle>Schedule Pitch Meeting</DialogTitle>
          <DialogDescription>
            Propose a time for a pitch meeting with {companyName}. They will receive a notification and can accept or suggest an alternative time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              Select Date
            </label>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={(date) => date < new Date()}
              className="rounded-md border"
            />
          </div>

          {/* Time Slot Selection */}
          {date && (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Select Time
              </label>
              <Select value={timeSlot} onValueChange={setTimeSlot}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a time slot" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {generateTimeSlots().map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {format(new Date(`2000-01-01T${slot}`), 'h:mm a')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Duration Selection */}
          {timeSlot && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Meeting Duration</label>
              <Select value={duration.toString()} onValueChange={(v) => setDuration(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Selected Meeting Summary */}
          {date && timeSlot && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Proposed Meeting</p>
              <p className="text-sm text-muted-foreground">
                {format(date, 'EEEE, MMMM d, yyyy')} at {format(new Date(`2000-01-01T${timeSlot}`), 'h:mm a')}
              </p>
              <p className="text-sm text-muted-foreground">Duration: {duration} minutes</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!date || !timeSlot || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending Request...
                </>
              ) : (
                'Send Pitch Request'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
