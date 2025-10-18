import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Calendar, MapPin, Users, Clock, UserPlus, Check, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Event {
  id: string;
  title: string;
  description: string;
  banner_url: string | null;
  start_date: string;
  end_date: string;
  location: string | null;
  organizer_id: string;
  max_attendees: number | null;
  profiles?: {
    full_name: string;
  };
  attendees?: number;
}

interface EventDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
  onEventUpdated: () => void;
}

export function EventDetailsDialog({ open, onOpenChange, event, onEventUpdated }: EventDetailsDialogProps) {
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchUserStatus();
      fetchAttendees();
      if (user?.id === event.organizer_id) {
        fetchAllUsers();
      }
    }
  }, [open, event.id]);

  const fetchUserStatus = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('event_attendees')
      .select('status')
      .eq('event_id', event.id)
      .eq('user_id', user.id)
      .maybeSingle();

    setUserStatus(data?.status || null);
  };

  const fetchAttendees = async () => {
    const { data } = await supabase
      .from('event_attendees')
      .select('*, profiles:user_id(full_name)')
      .eq('event_id', event.id)
      .eq('status', 'going');

    setAttendees(data || []);
  };

  const fetchAllUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .neq('user_id', event.organizer_id);

    setAllUsers(data || []);
  };

  const updateAttendance = async (status: 'going' | 'maybe' | 'declined') => {
    if (!user) return;

    const { error } = await supabase
      .from('event_attendees')
      .upsert({
        event_id: event.id,
        user_id: user.id,
        status
      });

    if (error) {
      toast({ title: 'Failed to update attendance', variant: 'destructive' });
      return;
    }

    setUserStatus(status);
    fetchAttendees();
    onEventUpdated();
    toast({ title: `Marked as ${status}!` });
  };

  const inviteUser = async () => {
    if (!selectedUser || !user) return;

    const { error } = await supabase
      .from('event_invites')
      .insert({
        event_id: event.id,
        inviter_id: user.id,
        invitee_id: selectedUser
      });

    if (error) {
      if (error.code === '23505') {
        toast({ title: 'User already invited', variant: 'destructive' });
      } else {
        toast({ title: 'Failed to send invite', variant: 'destructive' });
      }
      return;
    }

    toast({ title: 'Invite sent!' });
    setSelectedUser('');
  };

  const isOrganizer = user?.id === event.organizer_id;
  const isFull = event.max_attendees && attendees.length >= event.max_attendees;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Banner */}
          {event.banner_url && (
            <img
              src={event.banner_url}
              alt={event.title}
              className="w-full h-64 object-cover rounded-lg"
            />
          )}

          {/* Event Info */}
          <div className="space-y-4">
            {event.start_date && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-5 w-5" />
                <span>{format(parseISO(event.start_date), 'EEEE, MMMM d, yyyy')}</span>
              </div>
            )}
            {event.start_date && event.end_date && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-5 w-5" />
                <span>
                  {format(parseISO(event.start_date), 'h:mm a')} - {format(parseISO(event.end_date), 'h:mm a')}
                </span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-5 w-5" />
                <span>{event.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-5 w-5" />
              <span>
                {attendees.length} attending
                {event.max_attendees && ` / ${event.max_attendees} max`}
              </span>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div>
              <h3 className="font-semibold mb-2">About This Event</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
            </div>
          )}

          {/* Organizer */}
          <div>
            <h3 className="font-semibold mb-2">Organized By</h3>
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10">
                  {event.profiles?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <span>{event.profiles?.full_name || 'Anonymous'}</span>
            </div>
          </div>

          {/* Attendees */}
          {attendees.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Attendees ({attendees.length})</h3>
              <div className="grid grid-cols-2 gap-2">
                {attendees.slice(0, 8).map(attendee => (
                  <div key={attendee.id} className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-primary/10 text-xs">
                        {attendee.profiles?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{attendee.profiles?.full_name || 'Anonymous'}</span>
                  </div>
                ))}
              </div>
              {attendees.length > 8 && (
                <p className="text-sm text-muted-foreground mt-2">
                  And {attendees.length - 8} more...
                </p>
              )}
            </div>
          )}

          {/* Invite Users (Organizer Only) */}
          {isOrganizer && allUsers.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Invite People</h3>
              <div className="flex gap-2">
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a user to invite" />
                  </SelectTrigger>
                  <SelectContent>
                    {allUsers.map(u => (
                      <SelectItem key={u.user_id} value={u.user_id}>
                        {u.full_name || 'Anonymous'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={inviteUser} disabled={!selectedUser}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {user && !isOrganizer && (
            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={() => updateAttendance('going')}
                variant={userStatus === 'going' ? 'default' : 'outline'}
                className="flex-1"
                disabled={isFull && userStatus !== 'going'}
              >
                <Check className="h-4 w-4 mr-2" />
                {isFull && userStatus !== 'going' ? 'Event Full' : 'Going'}
              </Button>
              <Button
                onClick={() => updateAttendance('maybe')}
                variant={userStatus === 'maybe' ? 'default' : 'outline'}
                className="flex-1"
              >
                Maybe
              </Button>
              <Button
                onClick={() => updateAttendance('declined')}
                variant={userStatus === 'declined' ? 'default' : 'outline'}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Can't Go
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}