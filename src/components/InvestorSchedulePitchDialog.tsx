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

interface StartupOption {
  id: string;
  user_id: string;
  company_id: string;
  company_name: string;
  avatar_url?: string;
  logo_url?: string;
  connection_type: 'invested' | 'interested' | 'connected' | 'none';
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
  const [allStartups, setAllStartups] = useState<StartupOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStartupId, setSelectedStartupId] = useState<string>('');
  const [date, setDate] = useState<Date>();
  const [timeSlot, setTimeSlot] = useState<string>('');
  const [duration, setDuration] = useState<number>(30);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchAllStartups();
    }
  }, [open, user]);

  const fetchAllStartups = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // First get all companies on the platform
      const { data: allCompanies, error: companiesError } = await supabase
        .from('companies')
        .select('id, name, user_id, logo_url')
        .order('name');

      if (companiesError) throw companiesError;
      if (!allCompanies || allCompanies.length === 0) {
        setAllStartups([]);
        setLoading(false);
        return;
      }

      // Build connection type map for sorting
      const connectionMap = new Map<string, 'invested' | 'interested' | 'connected' | 'none'>();

      // 1. Get companies I've invested in
      const { data: investments } = await supabase
        .from('investments')
        .select('company_id')
        .eq('investor_id', user.id)
        .eq('status', 'active');

      investments?.forEach((inv: any) => {
        if (inv.company_id) {
          connectionMap.set(inv.company_id, 'invested');
        }
      });

      // 2. Get companies I've expressed interest in
      const { data: interests } = await supabase
        .from('investment_interests')
        .select('company_id')
        .eq('investor_id', user.id);

      interests?.forEach((int: any) => {
        if (int.company_id && !connectionMap.has(int.company_id)) {
          connectionMap.set(int.company_id, 'interested');
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

      // Map connected user IDs to company IDs
      if (connectedUserIds.length > 0) {
        allCompanies.forEach(company => {
          if (connectedUserIds.includes(company.user_id) && !connectionMap.has(company.id)) {
            connectionMap.set(company.id, 'connected');
          }
        });
      }

      // Build the startup options list
      const startups: StartupOption[] = allCompanies.map(company => ({
        id: company.id,
        user_id: company.user_id,
        company_id: company.id,
        company_name: company.name,
        logo_url: company.logo_url || undefined,
        connection_type: connectionMap.get(company.id) || 'none'
      }));

      // Sort by connection type priority (invested > interested > connected > none)
      const sortOrder = { invested: 0, interested: 1, connected: 2, none: 3 };
      startups.sort((a, b) => sortOrder[a.connection_type] - sortOrder[b.connection_type]);

      setAllStartups(startups);
    } catch (error) {
      console.error('Error fetching startups:', error);
      toast({
        title: 'Error',
        description: 'Failed to load startups',
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
      case 'none': return 'outline';
      default: return 'outline';
    }
  };

  const getConnectionLabel = (type: string) => {
    switch (type) {
      case 'invested': return 'Invested';
      case 'interested': return 'Interested';
      case 'connected': return 'Connected';
      case 'none': return 'New';
      default: return '';
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

    const selectedStartup = allStartups.find(s => s.id === selectedStartupId);
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
        ) : allStartups.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No startups available on the platform yet.
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
                <SelectContent className="max-h-[300px]">
                  {allStartups.map((startup) => (
                    <SelectItem key={startup.id} value={startup.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={startup.logo_url} />
                          <AvatarFallback>{startup.company_name[0]}</AvatarFallback>
                        </Avatar>
                        <span>{startup.company_name}</span>
                        {startup.connection_type !== 'none' && (
                          <Badge variant={getConnectionBadgeVariant(startup.connection_type)} className="text-xs">
                            {getConnectionLabel(startup.connection_type)}
                          </Badge>
                        )}
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

                {/* Right Column - Time & Duration */}
                <div className="space-y-4">
                  {/* Time Slot Selection */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
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
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-2">Proposed Meeting</p>
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
