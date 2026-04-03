import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Calendar, MapPin, Users, Clock, UserPlus, Check, X, Video, Pencil, ExternalLink, Copy, Link as LinkIcon, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VideoConferencing from './VideoConferencing';
import { EditEventDialog } from './EditEventDialog';
import { ExternalRegistrationsViewer } from './ExternalRegistrationsViewer';
import { cn } from '@/lib/utils';

interface Event {
  id: string;
  title: string;
  description: string;
  banner_url: string | null;
  start_date: string;
  end_date: string;
  location: string | null;
  meeting_room_url?: string | null;
  organizer_id: string;
  max_attendees: number | null;
  external_registration_url?: string | null;
  ticket_price_cents?: number;
  is_paid?: boolean;
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
  const [showVideo, setShowVideo] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [persistentRoomUrl, setPersistentRoomUrl] = useState<string | null>(event.meeting_room_url || null);
  const [hasPaidTicket, setHasPaidTicket] = useState(false);
  const [buyingTicket, setBuyingTicket] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchUserStatus();
      fetchAttendees();
      fetchUserProfile();
      fetchEventRoomUrl();
      if (event.is_paid && event.ticket_price_cents && event.ticket_price_cents > 0) {
        checkTicketPayment();
      }
      if (user?.id === event.organizer_id) {
        fetchAllUsers();
      }
    }
  }, [open, event.id]);

  const checkTicketPayment = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('event_payments')
      .select('id')
      .eq('event_id', event.id)
      .eq('user_id', user.id)
      .eq('payment_status', 'paid')
      .maybeSingle();
    setHasPaidTicket(!!data);
  };

  const handleBuyTicket = async () => {
    if (!user) return;
    setBuyingTicket(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-event-payment', {
        body: { eventId: event.id }
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast({ title: 'Payment error', description: err.message || 'Failed to start payment', variant: 'destructive' });
    } finally {
      setBuyingTicket(false);
    }
  };

  // Fetch the persistent room URL from database
  const fetchEventRoomUrl = async () => {
    const { data } = await supabase
      .from('events')
      .select('meeting_room_url')
      .eq('id', event.id)
      .single();
    
    if (data?.meeting_room_url) {
      setPersistentRoomUrl(data.meeting_room_url);
    }
  };

  // Save new room URL to database when first person creates it
  const saveRoomUrl = async (roomUrl: string) => {
    const { error } = await supabase
      .from('events')
      .update({ meeting_room_url: roomUrl } as any)
      .eq('id', event.id);
    
    if (!error) {
      setPersistentRoomUrl(roomUrl);
      console.log('Saved persistent room URL to database:', roomUrl);
    } else {
      console.error('Failed to save room URL:', error);
    }
  };

  const fetchUserProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .single();
    setUserProfile(data);
  };

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
  const isOnlineEvent = event.location?.includes('whereby.com');
  
  const timeData = useMemo(() => {
    const eventStartDate = new Date(event.start_date);
    const eventEndDate = new Date(event.end_date);
    const now = new Date();
    const isWithin15Min = eventStartDate.getTime() - now.getTime() < 15 * 60 * 1000 && eventStartDate.getTime() > now.getTime();
    const hasStarted = eventStartDate.getTime() <= now.getTime();
    const hasEnded = eventEndDate.getTime() < now.getTime();
    
    return { isWithin15Min, hasStarted, hasEnded };
  }, [event.start_date, event.end_date]);

  const { isWithin15Min, hasStarted, hasEnded } = timeData;

  const handleJoinEvent = async () => {
    // If meeting_room_url is an internal portal route, navigate there
    if (persistentRoomUrl?.startsWith('/') || persistentRoomUrl?.includes('/artemis-watch-party')) {
      const url = persistentRoomUrl.startsWith('/') ? persistentRoomUrl : new URL(persistentRoomUrl).pathname;
      window.location.href = url;
      return;
    }
    
    if (!event.location) {
      toast({ 
        title: 'No video link available', 
        description: 'This event does not have a video call link.',
        variant: 'destructive' 
      });
      return;
    }
    
    setShowVideo(true);
    await new Promise(resolve => setTimeout(resolve, 300));
  };

  if (showVideo && isOnlineEvent && event.location) {
    return (
      <Dialog open={open} onOpenChange={(open) => {
        if (!open) {
          setShowVideo(false);
          onOpenChange(false);
        }
      }}>
        <DialogContent className="max-w-5xl h-[90vh] p-0">
          <VideoConferencing
            roomUrl={event.location}
            persistentRoomUrl={persistentRoomUrl || undefined}
            userId={user?.id}
            hostId={event.organizer_id}
            userName={userProfile?.full_name || 'User'}
            meetingTitle={event.title}
            autoJoin={true}
            eventId={event.id}
            onRoomCreated={saveRoomUrl}
            onLeave={() => {
              setShowVideo(false);
              onOpenChange(false);
            }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden break-words" style={{ wordBreak: 'break-word' }}>
          <DialogHeader className="flex flex-row items-center justify-between space-y-0">
            <DialogTitle>{event.title}</DialogTitle>
            {isOrganizer && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowEditDialog(true)}
                className="h-8 w-8"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
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
                <span>
                  {format(
                    typeof event.start_date === 'string' ? parseISO(event.start_date) : event.start_date,
                    'EEEE, MMMM d, yyyy'
                  )}
                </span>
              </div>
            )}
            {event.start_date && event.end_date && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-5 w-5" />
                <span>
                  {format(
                    typeof event.start_date === 'string' ? parseISO(event.start_date) : event.start_date,
                    'h:mm a'
                  )} - {format(
                    typeof event.end_date === 'string' ? parseISO(event.end_date) : event.end_date,
                    'h:mm a'
                  )}
                </span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-5 w-5" />
                {event.location.startsWith('http') ? (
                  <a 
                    href={event.location}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {event.location}
                  </a>
                ) : (
                  <span>{event.location}</span>
                )}
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

          {/* Share Registration Link (Organizer Only) */}
          {isOrganizer && (
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Share Event Registration
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`https://startupfactoryhub.com/events/${event.id}/register`}
                  className="flex-1 px-3 py-2 text-sm bg-muted rounded-md border border-border"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(`https://startupfactoryhub.com/events/${event.id}/register`);
                    toast({ title: 'Link copied!', description: 'Share this link for external registrations.' });
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Anyone with this link can register for your event without an account
              </p>
            </div>
          )}

          {/* External Registrations Viewer (Organizer Only) */}
          {isOrganizer && (
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                External Registrations
              </h3>
              <ExternalRegistrationsViewer eventId={event.id} eventTitle={event.title} />
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

          {/* Online Event Join Button */}
          {isOnlineEvent && user && (userStatus === 'going' || isOrganizer) && !hasEnded && (
            <div className="pt-4 border-t space-y-4">
              {isOrganizer && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm">
                  <p className="font-semibold text-primary">Host Tip:</p>
                  <p className="text-muted-foreground">
                    You can start the meeting anytime. Attendees will join the same Whereby room automatically.
                  </p>
                </div>
              )}
              <Button
                onClick={handleJoinEvent}
                disabled={!isWithin15Min && !hasStarted && !isOrganizer}
                className={cn(
                  "w-full gap-2",
                  (isWithin15Min || hasStarted) && "bg-green-600 hover:bg-green-700"
                )}
                size="lg"
              >
                <Video className="h-5 w-5" />
                {isOrganizer 
                  ? 'Start Meeting' 
                  : hasStarted 
                    ? 'Join Meeting Now' 
                    : isWithin15Min 
                      ? 'Join Meeting (Available)' 
                      : 'Join Meeting (Opens 15 min before)'
                }
              </Button>
            </div>
          )}
          
          {/* Past Event Message */}
          {isOnlineEvent && hasEnded && (
            <div className="pt-4 border-t">
              <div className="p-4 bg-muted border border-border rounded-lg">
                <p className="text-sm text-muted-foreground text-center">
                  This event has ended. The video meeting is no longer available.
                </p>
              </div>
            </div>
          )}
          
          {isOnlineEvent && !event.location && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mt-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Video link not available. Please contact the organizer.
              </p>
            </div>
          )}

          {/* External Registration Link */}
          {event.external_registration_url && (
            <div className="pt-4 border-t">
              <a
                href={event.external_registration_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg font-medium transition-all shadow-lg shadow-emerald-500/25"
              >
                <ExternalLink className="h-5 w-5" />
                Register on {(() => {
                  try {
                    const url = new URL(event.external_registration_url);
                    const hostname = url.hostname.replace('www.', '');
                    if (hostname.includes('eventbrite')) return 'Eventbrite';
                    if (hostname.includes('lu.ma')) return 'Luma';
                    if (hostname.includes('meetup')) return 'Meetup';
                    if (hostname.includes('zoom')) return 'Zoom';
                    if (hostname.includes('forms.google')) return 'Google Forms';
                    return hostname.split('.')[0].charAt(0).toUpperCase() + hostname.split('.')[0].slice(1);
                  } catch {
                    return 'External Site';
                  }
                })()}
              </a>
              <p className="text-xs text-muted-foreground text-center mt-2">
                You'll be redirected to an external registration page
              </p>
            </div>
          )}

          {/* Paid Event Ticket Section */}
          {event.is_paid && event.ticket_price_cents && event.ticket_price_cents > 0 && user && !isOrganizer && !hasPaidTicket && (
            <div className="pt-4 border-t space-y-3">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium mb-1">Ticket Price</p>
                <p className="text-lg font-bold">
                  ${(event.ticket_price_cents / 100).toFixed(2)}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    + ${(Math.round(event.ticket_price_cents * 0.10) / 100).toFixed(2)} platform fee
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total: ${((event.ticket_price_cents + Math.round(event.ticket_price_cents * 0.10)) / 100).toFixed(2)}
                </p>
              </div>
              <Button
                onClick={handleBuyTicket}
                disabled={buyingTicket || (!!isFull)}
                className="w-full"
                size="lg"
              >
                {buyingTicket ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : isFull ? (
                  'Event Full'
                ) : (
                  `Buy Ticket — $${((event.ticket_price_cents + Math.round(event.ticket_price_cents * 0.10)) / 100).toFixed(2)}`
                )}
              </Button>
            </div>
          )}

          {/* Action Buttons - Show for free events OR if user already paid */}
          {user && !isOrganizer && (!event.is_paid || hasPaidTicket) && (
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
    
    {isOrganizer && (
      <EditEventDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onEventUpdated={() => {
          setShowEditDialog(false);
          onEventUpdated();
        }}
        event={event}
      />
    )}
    </>
  );
}