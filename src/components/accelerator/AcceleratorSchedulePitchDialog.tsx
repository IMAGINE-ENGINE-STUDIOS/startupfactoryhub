import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface PortfolioStartup {
  id: string;
  company_id: string;
  company_name: string;
  company_logo?: string;
  user_id: string;
  cohort_name?: string;
  current_stage: string;
}

interface AcceleratorSchedulePitchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolioStartups: any[];
  cohorts: { id: string; name: string }[];
  onPitchScheduled?: () => void;
}

export default function AcceleratorSchedulePitchDialog({
  open,
  onOpenChange,
  portfolioStartups,
  cohorts,
  onPitchScheduled
}: AcceleratorSchedulePitchDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [startups, setStartups] = useState<PortfolioStartup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStartupId, setSelectedStartupId] = useState<string>('');
  const [date, setDate] = useState<Date>();
  const [timeSlot, setTimeSlot] = useState<string>('');
  const [duration, setDuration] = useState<number>(30);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      buildStartupList();
    }
  }, [open, portfolioStartups]);

  const buildStartupList = async () => {
    setLoading(true);
    try {
      const startupList: PortfolioStartup[] = portfolioStartups.map(startup => {
        const cohort = cohorts.find(c => c.id === startup.cohort_id);
        return {
          id: startup.id,
          company_id: startup.company_id,
          company_name: startup.is_manual_entry 
            ? startup.external_company_name || 'Unknown'
            : startup.company?.name || 'Unknown',
          company_logo: startup.is_manual_entry 
            ? startup.external_company_logo 
            : startup.company?.logo_url,
          user_id: startup.company?.user_id || '',
          cohort_name: cohort?.name,
          current_stage: startup.current_stage
        };
      });

      setStartups(startupList.filter(s => s.user_id)); // Only include startups with user_id
    } catch (error) {
      console.error('Error building startup list:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = () => {
    const slots: string[] = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 17 && minute > 0) break;
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'onboarding': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'active': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'graduated': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleSubmit = async () => {
    if (!user || !selectedStartupId || !date || !timeSlot) {
      toast({
        title: "Missing Information",
        description: "Please select a startup, date, and time for the pitch meeting.",
        variant: "destructive",
      });
      return;
    }

    const selectedStartup = startups.find(s => s.id === selectedStartupId);
    if (!selectedStartup) return;

    setSubmitting(true);

    try {
      const [hours, minutes] = timeSlot.split(':').map(Number);
      const scheduledDate = new Date(date);
      scheduledDate.setHours(hours, minutes, 0, 0);

      // Create Whereby meeting room
      const { data: wherebyData, error: wherebyError } = await supabase.functions.invoke(
        'create-whereby-room',
        {
          body: {
            roomName: `${selectedStartup.company_name} - Program Review`,
            startDate: scheduledDate.toISOString(),
            endDate: new Date(scheduledDate.getTime() + duration * 60000).toISOString(),
          }
        }
      );

      if (wherebyError) throw wherebyError;

      // Get accelerator profile
      const { data: acceleratorProfile } = await supabase
        .from('accelerator_profiles')
        .select('organization_name')
        .eq('user_id', user.id)
        .single();

      const acceleratorName = acceleratorProfile?.organization_name || 'An accelerator';

      // Insert pitch meeting - accelerator acts like investor in this context
      const { error: meetingError } = await supabase
        .from('pitch_meetings')
        .insert({
          startup_id: selectedStartup.user_id,
          investor_id: user.id, // Accelerator is the "investor" in this meeting
          company_id: selectedStartup.company_id,
          host_id: user.id,
          scheduled_date: scheduledDate.toISOString(),
          duration_minutes: duration,
          meeting_link: wherebyData?.roomUrl || '',
          status: 'pending',
          meeting_notes: `Program review meeting from ${acceleratorName}`
        });

      if (meetingError) throw meetingError;

      // Create notification for the startup
      await supabase
        .from('notifications')
        .insert({
          user_id: selectedStartup.user_id,
          type: 'pitch_request',
          title: 'Program Review Meeting Request',
          message: `${acceleratorName} would like to schedule a program review meeting for ${selectedStartup.company_name}`,
          data: {
            accelerator_id: user.id,
            company_id: selectedStartup.company_id,
            scheduled_date: scheduledDate.toISOString(),
            accelerator_name: acceleratorName,
            company_name: selectedStartup.company_name
          }
        });

      toast({
        title: "Meeting Request Sent!",
        description: `Your meeting request has been sent to ${selectedStartup.company_name}.`,
      });

      onOpenChange(false);
      onPitchScheduled?.();
      
      // Reset form
      setSelectedStartupId('');
      setDate(undefined);
      setTimeSlot('');
      setDuration(30);
    } catch (error) {
      console.error('Error creating pitch meeting:', error);
      toast({
        title: "Error",
        description: "Failed to create meeting. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Program Review</DialogTitle>
          <DialogDescription>
            Schedule a pitch or review meeting with a portfolio startup. They will receive a notification and can accept or suggest an alternative time.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : startups.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No portfolio startups available. Accept applications to add startups to your portfolio.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Startup Selection */}
            <div className="space-y-2">
              <Label>Select Startup</Label>
              <Select value={selectedStartupId} onValueChange={setSelectedStartupId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a startup from your portfolio" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {startups.map((startup) => (
                    <SelectItem key={startup.id} value={startup.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={startup.company_logo} />
                          <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-xs">
                            {startup.company_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span>{startup.company_name}</span>
                        {startup.cohort_name && (
                          <Badge variant="outline" className="text-xs">
                            {startup.cohort_name}
                          </Badge>
                        )}
                        <Badge className={`text-xs ${getStageColor(startup.current_stage)}`}>
                          {startup.current_stage}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedStartupId && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Calendar */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-emerald-500" />
                    Select Date
                  </Label>
                  <div className="rounded-xl border border-border/50 bg-card/50 p-4">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(date) => date < new Date()}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Right Column - Time & Duration */}
                <div className="space-y-4">
                  {/* Time Slot Selection */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-emerald-500" />
                      Select Time
                    </Label>
                    <Select value={timeSlot} onValueChange={setTimeSlot} disabled={!date}>
                      <SelectTrigger>
                        <SelectValue placeholder={date ? "Choose a time slot" : "Select a date first"} />
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

                  {/* Duration Selection */}
                  <div className="space-y-2">
                    <Label>Meeting Duration</Label>
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

                  {/* Selected Meeting Summary */}
                  {date && timeSlot && (
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                      <p className="text-sm font-medium mb-2 text-emerald-400">Proposed Meeting</p>
                      <p className="text-sm text-muted-foreground">
                        {format(date, 'EEEE, MMMM d, yyyy')} at {format(new Date(`2000-01-01T${timeSlot}`), 'h:mm a')}
                      </p>
                      <p className="text-sm text-muted-foreground">Duration: {duration} minutes</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!selectedStartupId || !date || !timeSlot || submitting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending Request...
                  </>
                ) : (
                  'Send Meeting Request'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}