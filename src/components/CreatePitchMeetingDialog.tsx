import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface ConnectedInvestor {
  id: string;
  user_id: string;
  name: string;
  avatar_url?: string;
  connection_type: 'invested' | 'connected' | 'interested';
}

interface CreatePitchMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companyName: string;
}

export default function CreatePitchMeetingDialog({
  open,
  onOpenChange,
  companyId,
  companyName
}: CreatePitchMeetingDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [connectedInvestors, setConnectedInvestors] = useState<ConnectedInvestor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvestorId, setSelectedInvestorId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (open) {
      fetchConnectedInvestors();
    }
  }, [open, companyId]);

  useEffect(() => {
    if (selectedInvestorId && selectedDate) {
      fetchAvailability();
    }
  }, [selectedInvestorId, selectedDate]);

  const fetchConnectedInvestors = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const investorMap = new Map<string, ConnectedInvestor>();

      // 1. Get investors who invested in this company
      const { data: investments } = await supabase
        .from('investments')
        .select('investor_id')
        .eq('company_id', companyId)
        .eq('status', 'active');

      const investorIds = investments?.map(i => i.investor_id) || [];

      if (investorIds.length > 0) {
        const { data: investorProfiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', investorIds);

        investorProfiles?.forEach(p => {
          investorMap.set(p.user_id, {
            id: p.user_id,
            user_id: p.user_id,
            name: p.full_name || 'Unknown',
            avatar_url: p.avatar_url || undefined,
            connection_type: 'invested'
          });
        });
      }

      // 2. Get investors who expressed interest
      const { data: interests } = await supabase
        .from('investment_interests')
        .select('investor_id')
        .eq('company_id', companyId);

      const interestedIds = interests?.map(i => i.investor_id).filter(id => !investorMap.has(id)) || [];

      if (interestedIds.length > 0) {
        const { data: interestedProfiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', interestedIds);

        interestedProfiles?.forEach(p => {
          if (!investorMap.has(p.user_id)) {
            investorMap.set(p.user_id, {
              id: p.user_id,
              user_id: p.user_id,
              name: p.full_name || 'Unknown',
              avatar_url: p.avatar_url || undefined,
              connection_type: 'interested'
            });
          }
        });
      }

      // 3. Get connected users who are investors (via connections table)
      const { data: connections } = await supabase
        .from('connections')
        .select('requester_id, addressee_id')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted');

      const connectedUserIds = connections?.map(c => 
        c.requester_id === user.id ? c.addressee_id : c.requester_id
      ).filter(id => !investorMap.has(id)) || [];

      if (connectedUserIds.length > 0) {
        // Check which of these connected users are investors
        const { data: investorRoles } = await supabase
          .rpc('get_user_roles_batch', { user_ids: connectedUserIds });

        const investorUserIds = investorRoles
          ?.filter((r: any) => r.role === 'investor')
          .map((r: any) => r.user_id) || [];

        if (investorUserIds.length > 0) {
          const { data: connectedProfiles } = await supabase
            .from('profiles')
            .select('user_id, full_name, avatar_url')
            .in('user_id', investorUserIds);

          connectedProfiles?.forEach(p => {
            if (!investorMap.has(p.user_id)) {
              investorMap.set(p.user_id, {
                id: p.user_id,
                user_id: p.user_id,
                name: p.full_name || 'Unknown',
                avatar_url: p.avatar_url || undefined,
                connection_type: 'connected'
              });
            }
          });
        }
      }

      // Sort by connection type priority: invested > interested > connected
      const sortOrder = { invested: 0, interested: 1, connected: 2 };
      const investors = Array.from(investorMap.values()).sort(
        (a, b) => sortOrder[a.connection_type] - sortOrder[b.connection_type]
      );

      setConnectedInvestors(investors);
    } catch (error) {
      console.error('Error fetching investors:', error);
      toast({
        title: 'Error',
        description: 'Failed to load connected investors',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async () => {
    if (!selectedInvestorId || !selectedDate) return;

    try {
      const dayOfWeek = selectedDate.getDay();
      
      const { data: availability } = await supabase
        .from('investor_availability')
        .select('start_time, end_time')
        .eq('investor_id', selectedInvestorId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_available', true);

      if (!availability || availability.length === 0) {
        // If no availability set, show default slots 9 AM - 5 PM
        const defaultSlots: string[] = [];
        for (let hour = 9; hour <= 17; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            if (hour === 17 && minute > 0) break;
            const h = hour.toString().padStart(2, '0');
            const m = minute.toString().padStart(2, '0');
            defaultSlots.push(`${h}:${m}`);
          }
        }
        setAvailableSlots(defaultSlots);
        return;
      }

      // Generate 30-minute slots from availability
      const slots: string[] = [];
      availability.forEach(slot => {
        const start = new Date(`2000-01-01T${slot.start_time}`);
        const end = new Date(`2000-01-01T${slot.end_time}`);
        
        let current = new Date(start);
        while (current < end) {
          const hours = current.getHours().toString().padStart(2, '0');
          const minutes = current.getMinutes().toString().padStart(2, '0');
          slots.push(`${hours}:${minutes}`);
          current.setMinutes(current.getMinutes() + 30);
        }
      });

      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error fetching availability:', error);
    }
  };

  const handleBookPitch = async () => {
    if (!user || !selectedInvestorId || !selectedDate || !selectedTimeSlot) return;

    setBooking(true);
    try {
      // Create Whereby room
      const wherebyResponse = await supabase.functions.invoke('create-whereby-room', {
        body: { 
          startDate: selectedDate.toISOString(),
          endDate: new Date(selectedDate.getTime() + 30 * 60000).toISOString()
        }
      });

      const meetingLink = wherebyResponse.data?.roomUrl || '';

      // Combine date and time
      const [hours, minutes] = selectedTimeSlot.split(':');
      const scheduledDate = new Date(selectedDate);
      scheduledDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Insert pitch meeting with 'pending' status
      const { error } = await supabase
        .from('pitch_meetings')
        .insert({
          startup_id: user.id,
          investor_id: selectedInvestorId,
          company_id: companyId,
          scheduled_date: scheduledDate.toISOString(),
          duration_minutes: 30,
          status: 'pending',
          meeting_link: meetingLink,
          host_id: user.id
        });

      if (error) throw error;

      // Send notification
      await supabase
        .from('notifications')
        .insert({
          user_id: selectedInvestorId,
          type: 'pitch_scheduled',
          title: 'New Pitch Meeting Request',
          message: `${companyName} has requested a pitch meeting with you`,
          data: {
            company_id: companyId,
            company_name: companyName,
            scheduled_date: scheduledDate.toISOString()
          }
        });

      toast({
        title: 'Pitch Request Sent!',
        description: `Your pitch meeting request has been sent. You'll be notified once they respond.`
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error booking pitch:', error);
      toast({
        title: 'Error',
        description: 'Failed to book pitch meeting',
        variant: 'destructive',
      });
    } finally {
      setBooking(false);
    }
  };

  const getConnectionBadgeVariant = (type: string) => {
    switch (type) {
      case 'invested': return 'default';
      case 'interested': return 'secondary';
      case 'connected': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Schedule Pitch Meeting</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : connectedInvestors.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No connected investors available. Connect with investors first to schedule pitch meetings.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <Label>Select Investor</Label>
              <Select value={selectedInvestorId} onValueChange={setSelectedInvestorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an investor" />
                </SelectTrigger>
                <SelectContent>
                  {connectedInvestors.map((investor) => (
                    <SelectItem key={investor.id} value={investor.user_id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={investor.avatar_url} />
                          <AvatarFallback>{investor.name[0]}</AvatarFallback>
                        </Avatar>
                        <span>{investor.name}</span>
                        <Badge variant={getConnectionBadgeVariant(investor.connection_type)} className="text-xs">
                          {investor.connection_type}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedInvestorId && (
              <>
                <div>
                  <Label>Select Date</Label>
                  <div className="rounded-lg border border-border/50 bg-background/50 overflow-hidden mt-2">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date()}
                      className="rounded-lg"
                    />
                  </div>
                </div>

                {selectedDate && (
                  <div>
                    <Label>Available Time Slots</Label>
                    {availableSlots.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No availability on this date
                      </p>
                    ) : (
                      <Select value={selectedTimeSlot} onValueChange={setSelectedTimeSlot}>
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
                    )}
                  </div>
                )}
              </>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleBookPitch}
                disabled={!selectedInvestorId || !selectedDate || !selectedTimeSlot || booking}
              >
                {booking ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Booking...
                  </>
                ) : (
                  'Book Pitch Meeting'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
