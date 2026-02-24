import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, differenceInDays, differenceInHours, isPast } from 'date-fns';
import { Calendar, MapPin, Users, Clock, Heart, MessageCircle, Share, Bookmark, Video, Check, HelpCircle, X, ExternalLink, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface EventData {
  event_id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  location?: string;
  is_virtual?: boolean;
  banner_url?: string;
  max_attendees?: number;
  external_registration_url?: string;
  ticket_price_cents?: number;
  is_paid?: boolean;
}

interface EventPostCardProps {
  post: {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    event_data: EventData;
    media_urls?: string[] | null;
    profiles?: {
      full_name: string;
      avatar_url?: string;
    } | null;
    company_name?: string | null;
  };
  isLiked: boolean;
  isBookmarked: boolean;
  likesCount: number;
  commentsCount: number;
  onLike: () => void;
  onBookmark: () => void;
  onComment: () => void;
  onShare: () => void;
  onUserClick?: (userId: string) => void;
}

export const EventPostCard = ({
  post,
  isLiked,
  isBookmarked,
  likesCount,
  commentsCount,
  onLike,
  onBookmark,
  onComment,
  onShare,
  onUserClick
}: EventPostCardProps) => {
  const [rsvpStatus, setRsvpStatus] = useState<'going' | 'maybe' | 'declined' | null>(null);
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPaidTicket, setHasPaidTicket] = useState(false);
  const [buyingTicket, setBuyingTicket] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const eventData = post.event_data;

  useEffect(() => {
    if (eventData?.event_id) {
      fetchRSVPStatus();
      fetchAttendeeCount();
      if (eventData.is_paid && eventData.ticket_price_cents && eventData.ticket_price_cents > 0) {
        checkTicketPayment();
      }
    }
  }, [eventData?.event_id, user?.id]);

  const fetchRSVPStatus = async () => {
    if (!user?.id || !eventData?.event_id) return;
    
    const { data } = await supabase
      .from('event_attendees')
      .select('status')
      .eq('event_id', eventData.event_id)
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (data) {
      setRsvpStatus(data.status as 'going' | 'maybe' | 'declined');
    }
  };

  const fetchAttendeeCount = async () => {
    if (!eventData?.event_id) return;
    
    const { count } = await supabase
      .from('event_attendees')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventData.event_id)
      .eq('status', 'going');
    
    setAttendeeCount(count || 0);
  };

  const checkTicketPayment = async () => {
    if (!user?.id || !eventData?.event_id) return;
    const { data } = await supabase
      .from('event_payments')
      .select('id')
      .eq('event_id', eventData.event_id)
      .eq('user_id', user.id)
      .eq('payment_status', 'paid')
      .maybeSingle();
    setHasPaidTicket(!!data);
  };

  const handleBuyTicket = async () => {
    if (!user) {
      toast({ title: 'Please log in to buy a ticket', variant: 'destructive' });
      return;
    }
    setBuyingTicket(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-event-payment', {
        body: { eventId: eventData.event_id }
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

  const handleRSVP = async (status: 'going' | 'maybe' | 'declined') => {
    if (!user?.id || !eventData?.event_id) {
      toast({ title: 'Please log in to RSVP', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('event_attendees')
        .upsert({
          event_id: eventData.event_id,
          user_id: user.id,
          status: status
        }, {
          onConflict: 'event_id,user_id'
        });

      if (error) throw error;

      setRsvpStatus(status);
      fetchAttendeeCount();
      
      const messages = {
        going: "You're going! See you there! 🎉",
        maybe: "Marked as maybe. We hope you can make it!",
        declined: "No worries, maybe next time!"
      };
      
      toast({ title: messages[status] });
    } catch (error) {
      console.error('RSVP error:', error);
      toast({ title: 'Failed to update RSVP', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!eventData) return null;

  const eventDate = new Date(eventData.start_date);
  const isEventPast = isPast(eventDate);
  const daysUntil = differenceInDays(eventDate, new Date());
  const hoursUntil = differenceInHours(eventDate, new Date());

  const getTimeUntil = () => {
    if (isEventPast) return 'Event ended';
    if (daysUntil === 0) {
      if (hoursUntil <= 0) return 'Starting soon!';
      return `In ${hoursUntil} hour${hoursUntil !== 1 ? 's' : ''}`;
    }
    if (daysUntil === 1) return 'Tomorrow';
    return `In ${daysUntil} days`;
  };

  const spotsLeft = eventData.max_attendees 
    ? eventData.max_attendees - attendeeCount 
    : null;

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      {/* Gradient glow border effect - Blue/Indigo theme */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 rounded-lg opacity-75 blur" />
      
      <Card className="relative tech-card border-2 border-blue-400 overflow-hidden">
        {/* Event header badge */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 px-4 py-2 border-b flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
            📅 Upcoming Event - Don't Miss Out!
          </span>
          {!isEventPast && (
            <Badge variant="outline" className="ml-auto bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30">
              {getTimeUntil()}
            </Badge>
          )}
        </div>

        {/* Banner Image or Gradient Header */}
        {eventData.banner_url ? (
          <div className="h-32 sm:h-40 relative overflow-hidden">
            <img 
              src={eventData.banner_url} 
              alt={eventData.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          </div>
        ) : (
          <div className="h-24 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 relative">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          </div>
        )}

        <CardContent className="p-5 -mt-8 relative">
          {/* Organizer Info */}
          <div className="flex items-center gap-3 mb-4">
            <Avatar 
              className="w-14 h-14 border-4 border-background cursor-pointer ring-2 ring-blue-400"
              onClick={() => onUserClick?.(post.user_id)}
            >
              <AvatarImage src={post.profiles?.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                {post.profiles?.full_name?.charAt(0) || 'E'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 
                  className="font-bold text-lg hover:text-primary cursor-pointer"
                  onClick={() => onUserClick?.(post.user_id)}
                >
                  {post.profiles?.full_name || 'Event Organizer'}
                </h3>
                {post.company_name && (
                  <span className="text-sm text-muted-foreground">@ {post.company_name}</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Posted {format(new Date(post.created_at), 'MMM d, yyyy')}
              </p>
            </div>
          </div>

          {/* Event Info */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">🎉 {eventData.title}</h2>
            
            {eventData.description && (
              <p className="text-muted-foreground line-clamp-3">{eventData.description}</p>
            )}

            {/* Key Details Badges */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <Clock className="w-4 h-4" />
                <span className="font-medium text-sm">
                  {format(eventDate, 'MMM d, h:mm a')}
                </span>
              </div>
              
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                {eventData.is_virtual ? (
                  <>
                    <Video className="w-4 h-4" />
                    <span className="font-medium text-sm">Virtual Event</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4" />
                    <span className="font-medium text-sm truncate max-w-[150px]">
                      {eventData.location || 'TBA'}
                    </span>
                  </>
                )}
              </div>

              {eventData.max_attendees && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                  spotsLeft && spotsLeft < 10 
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' 
                    : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                }`}>
                  <Users className="w-4 h-4" />
                  <span className="font-medium text-sm">
                    {spotsLeft !== null ? `${spotsLeft} spots left` : `${attendeeCount} going`}
                  </span>
                </div>
              )}
            </div>

            {/* Ticket Price Badge for paid events */}
            {eventData.is_paid && eventData.ticket_price_cents && eventData.ticket_price_cents > 0 && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 w-fit text-sm py-1 px-3">
                🎫 Ticket: ${(eventData.ticket_price_cents / 100).toFixed(2)} + ${(Math.round(eventData.ticket_price_cents * 0.10) / 100).toFixed(2)} fee
              </Badge>
            )}

            {/* External Registration Link */}
            {eventData.external_registration_url && !isEventPast && (
              <a
                href={eventData.external_registration_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full mt-4 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg font-medium transition-all shadow-lg shadow-emerald-500/25"
              >
                <ExternalLink className="w-5 h-5" />
                Register Externally
              </a>
            )}

            {/* Join Button for Virtual Events */}
            {eventData.is_virtual && !isEventPast && (
              <Button 
                className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25"
                size="lg"
                onClick={() => {
                  toast({ title: 'Joining virtual event...', description: 'The meeting link will open shortly.' });
                }}
              >
                <Video className="w-5 h-5 mr-2" />
                Join Virtual Event
              </Button>
            )}

            {/* Buy Ticket Button for paid events (not yet paid) */}
            {!isEventPast && eventData.is_paid && eventData.ticket_price_cents && eventData.ticket_price_cents > 0 && !hasPaidTicket && user && (
              <Button
                onClick={handleBuyTicket}
                disabled={buyingTicket}
                className="w-full mt-4"
                size="lg"
              >
                {buyingTicket ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Buy Ticket — $${((eventData.ticket_price_cents + Math.round(eventData.ticket_price_cents * 0.10)) / 100).toFixed(2)}`
                )}
              </Button>
            )}

            {/* Login prompt for paid events when not logged in */}
            {!isEventPast && eventData.is_paid && eventData.ticket_price_cents && eventData.ticket_price_cents > 0 && !user && (
              <p className="text-sm text-muted-foreground text-center mt-2">
                Log in to purchase a ticket for this event.
              </p>
            )}

            {/* Paid ticket confirmed badge */}
            {eventData.is_paid && hasPaidTicket && (
              <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30 w-fit">
                <Check className="w-3 h-3 mr-1" /> Ticket Purchased
              </Badge>
            )}

            {/* RSVP Buttons - show for free events OR if user already paid */}
            {!isEventPast && (!eventData.is_paid || hasPaidTicket) && (
              <div className="flex flex-wrap gap-2 mt-4">
                <Button 
                  variant={rsvpStatus === 'going' ? 'default' : 'outline'}
                  className={`flex-1 min-w-[100px] ${
                    rsvpStatus === 'going' 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/25' 
                      : 'border-blue-500/30 hover:border-blue-500/50 hover:bg-blue-500/10'
                  }`}
                  onClick={() => handleRSVP('going')}
                  disabled={isLoading}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Going
                </Button>
                <Button 
                  variant={rsvpStatus === 'maybe' ? 'default' : 'outline'}
                  className={`flex-1 min-w-[100px] ${
                    rsvpStatus === 'maybe' 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
                      : 'border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/10'
                  }`}
                  onClick={() => handleRSVP('maybe')}
                  disabled={isLoading}
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Maybe
                </Button>
                <Button 
                  variant={rsvpStatus === 'declined' ? 'default' : 'outline'}
                  className={`flex-1 min-w-[100px] ${
                    rsvpStatus === 'declined' 
                      ? 'bg-muted text-muted-foreground' 
                      : 'border-muted-foreground/30 hover:bg-muted/50'
                  }`}
                  onClick={() => handleRSVP('declined')}
                  disabled={isLoading}
                >
                  <X className="w-4 h-4 mr-2" />
                  Can't Go
                </Button>
              </div>
            )}

            {isEventPast && (
              <Badge variant="secondary" className="mt-2">
                This event has ended
              </Badge>
            )}
          </div>

          {/* Social Actions */}
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/50">
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onLike}
                className={isLiked ? 'text-red-500' : ''}
              >
                <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                {likesCount}
              </Button>
              <Button variant="ghost" size="sm" onClick={onComment}>
                <MessageCircle className="w-4 h-4 mr-1" />
                {commentsCount}
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={onShare}>
                <Share className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onBookmark}
                className={isBookmarked ? 'text-amber-500' : ''}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Floating calendar emoji */}
      <motion.div 
        className="absolute -top-6 -right-6 text-5xl pointer-events-none"
        animate={{
          y: [0, -10, 0],
          rotate: [0, 5, -5, 0]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        📅
      </motion.div>
    </motion.div>
  );
};
