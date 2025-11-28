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

interface ConnectedStartup {
  id: string;
  user_id: string;
  company_id: string;
  company_name: string;
  avatar_url?: string;
  logo_url?: string;
  connection_type: 'invested' | 'connected' | 'interested';
}

interface InvestorSchedulePitchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPitchScheduled?: () => void;
}

export default function InvestorSchedulePitchDialog({
  open,
  onOpenChange,
  onPitchScheduled
}: InvestorSchedulePitchDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [connectedStartups, setConnectedStartups] = useState<ConnectedStartup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStartupId, setSelectedStartupId] = useState<string>('');
  const [date, setDate] = useState<Date>();
  const [timeSlot, setTimeSlot] = useState<string>('');
  const [duration, setDuration] = useState<number>(30);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchConnectedStartups();
    }
  }, [open, user]);

  const fetchConnectedStartups = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const startupMap = new Map<string, ConnectedStartup>();

      // 1. Get companies I've invested in
      const { data: investments } = await supabase
        .from('investments')
        .select('company_id, companies(id, name, user_id, logo_url)')
        .eq('investor_id', user.id)
        .eq('status', 'active');

      investments?.forEach((inv: any) => {
        if (inv.companies) {
          const company = inv.companies;
          startupMap.set(company.id, {
            id: company.id,
            user_id: company.user_id,
            company_id: company.id,
            company_name: company.name,
            logo_url: company.logo_url,
            connection_type: 'invested'
          });
        }
      });

      // 2. Get companies I've expressed interest in
      const { data: interests } = await supabase
        .from('investment_interests')
        .select('company_id, companies(id, name, user_id, logo_url)')
        .eq('investor_id', user.id);

      interests?.forEach((int: any) => {
        if (int.companies && !startupMap.has(int.companies.id)) {
          const company = int.companies;
          startupMap.set(company.id, {
            id: company.id,
            user_id: company.user_id,
            company_id: company.id,
            company_name: company.name,
            logo_url: company.logo_url,
            connection_type: 'interested'
          });
        }
      });

      // 3. Get connected users who are startups
      const { data: connections } = await supabase
        .from('connections')
        .select('requester_id, addressee_id')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted');

      const connectedUserIds = connections?.map(c => 
        c.requester_id === user.id ? c.addressee_id : c.requester_id
      ) || [];

      if (connectedUserIds.length > 0) {
        // Check which of these connected users are startups
        const { data: startupRoles } = await supabase
          .rpc('get_user_roles_batch', { user_ids: connectedUserIds });

        const startupUserIds = startupRoles
          ?.filter((r: any) => r.role === 'startup')
          .map((r: any) => r.user_id) || [];

        if (startupUserIds.length > 0) {
          // Get their companies
          const { data: companies } = await supabase
            .from('companies')
            .select('id, name, user_id, logo_url')
            .in('user_id', startupUserIds);

          companies?.forEach(company => {
            if (!startupMap.has(company.id)) {
              startupMap.set(company.id, {
                id: company.id,
                user_id: company.user_id,
                company_id: company.id,
                company_name: company.name,
                logo_url: company.logo_url || undefined,
                connection_type: 'connected'
              });
            }
          });
        }
      }

      // Sort by connection type priority
      const sortOrder = { invested: 0, interested: 1, connected: 2 };
      const startups = Array.from(startupMap.values()).sort(
        (a, b) => sortOrder[a.connection_type] - sortOrder[b.connection_type]
      );

      setConnectedStartups(startups);
    } catch (error) {
      console.error('Error fetching connected startups:', error);
      toast({
        title: 'Error',
        description: 'Failed to load connected startups',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate time slots from 9 AM to 5 PM in 30-minute intervals
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

  const getConnectionBadgeVariant = (type: string) => {
    switch (type) {
      case 'invested': return 'default';
      case 'interested': return 'secondary';
      case 'connected': return 'outline';
      default: return 'outline';
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

    const selectedStartup = connectedStartups.find(s => s.id === selectedStartupId);
    if (!selectedStartup) return;

    setSubmitting(true);

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
            roomName: `${selectedStartup.company_name} - Investor Pitch`,
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
          startup_id: selectedStartup.user_id,
          investor_id: user.id,
          company_id: selectedStartup.company_id,
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
          user_id: selectedStartup.user_id,
          type: 'pitch_request',
          title: 'New Pitch Meeting Request',
          message: `${investorName} would like to schedule a pitch meeting for ${selectedStartup.company_name}`,
          data: {
            investor_id: user.id,
            company_id: selectedStartup.company_id,
            scheduled_date: scheduledDate.toISOString(),
            investor_name: investorName,
            company_name: selectedStartup.company_name
          }
        });

      toast({
        title: "Pitch Request Sent!",
        description: `Your pitch meeting request has been sent to ${selectedStartup.company_name}.`,
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
        description: "Failed to create pitch meeting. Please try again.",
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
          <DialogTitle>Schedule Pitch Meeting</DialogTitle>
          <DialogDescription>
            Propose a time for a pitch meeting with a startup. They will receive a notification and can accept or suggest an alternative time.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : connectedStartups.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No connected startups available. Connect with startups or express interest first to schedule pitch meetings.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Startup Selection */}
            <div className="space-y-2">
              <Label>Select Startup</Label>
              <Select value={selectedStartupId} onValueChange={setSelectedStartupId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a startup" />
                </SelectTrigger>
                <SelectContent>
                  {connectedStartups.map((startup) => (
                    <SelectItem key={startup.id} value={startup.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={startup.logo_url} />
                          <AvatarFallback>{startup.company_name[0]}</AvatarFallback>
                        </Avatar>
                        <span>{startup.company_name}</span>
                        <Badge variant={getConnectionBadgeVariant(startup.connection_type)} className="text-xs">
                          {startup.connection_type}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedStartupId && (
              <>
                {/* Date Picker */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                    Select Date
                  </Label>
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
                    <Label className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Select Time
                    </Label>
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
              </>
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
              >
                {submitting ? (
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
        )}
      </DialogContent>
    </Dialog>
  );
}
