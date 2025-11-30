import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, XCircle, Sparkles, Clock, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface MentorOffer {
  id: string;
  mentor_id: string;
  status: string;
  goals: string;
  created_at: string;
  mentor: {
    full_name: string;
    avatar_url: string;
    bio: string;
  };
  role: string;
}

interface StartupMentorshipOffersProps {
  onOfferHandled?: () => void;
}

export default function StartupMentorshipOffers({ onOfferHandled }: StartupMentorshipOffersProps = {}) {
  const [offers, setOffers] = useState<MentorOffer[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchPendingOffers();
    }
  }, [user]);

  // Real-time subscription for mentorship offers
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('startup-mentorship-offers')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mentorship_relationships',
          filter: `mentee_id=eq.${user.id}`,
        },
        () => {
          fetchPendingOffers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchPendingOffers = async () => {
    if (!user) return;

    // First, fetch pending mentorship relationships
    const { data: relationships, error: relError } = await supabase
      .from('mentorship_relationships')
      .select('id, mentor_id, status, goals, created_at')
      .eq('mentee_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (relError) {
      console.error('Error fetching mentorship relationships:', relError);
      return;
    }

    if (!relationships || relationships.length === 0) {
      setOffers([]);
      return;
    }

    // Get mentor IDs
    const mentorIds = relationships.map(r => r.mentor_id);

    // Fetch profiles for mentors
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url, bio')
      .in('user_id', mentorIds);

    // Fetch roles for mentors from user_roles table
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', mentorIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
    const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

    // Filter to only show offers from mentors and advisors
    const enrichedOffers = relationships
      .map(rel => ({
        ...rel,
        mentor: profileMap.get(rel.mentor_id) || { full_name: 'Unknown', avatar_url: null, bio: null },
        role: roleMap.get(rel.mentor_id) || 'mentor'
      }))
      .filter(offer => offer.role === 'mentor' || offer.role === 'advisor');

    setOffers(enrichedOffers as MentorOffer[]);
  };

  const handleOffer = async (offerId: string, action: 'accept' | 'decline') => {
    setLoading(offerId);
    
    const { error } = await supabase
      .from('mentorship_relationships')
      .update({ 
        status: action === 'accept' ? 'active' : 'declined',
        start_date: action === 'accept' ? new Date().toISOString() : null
      })
      .eq('id', offerId);

    if (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} offer`,
        variant: "destructive",
      });
      setLoading(null);
      return;
    }

    const offer = offers.find(o => o.id === offerId);
    if (offer) {
      await supabase.from('notifications').insert({
        user_id: offer.mentor_id,
        type: action === 'accept' ? 'mentorship_accepted' : 'mentorship_declined',
        title: action === 'accept' ? 'Mentorship Offer Accepted' : 'Mentorship Offer Declined',
        message: action === 'accept' 
          ? 'Your mentorship offer has been accepted! You can now schedule sessions.'
          : 'Your mentorship offer has been declined.',
      });
    }

    toast({
      title: action === 'accept' ? "Offer Accepted!" : "Offer Declined",
      description: action === 'accept' 
        ? "You can now schedule sessions with your new mentor."
        : "The offer has been declined.",
    });

    setLoading(null);
    fetchPendingOffers();
    
    if (onOfferHandled) {
      onOfferHandled();
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'advisor':
        return 'bg-violet-500/10 text-violet-600 border-violet-500/20 dark:text-violet-400';
      case 'mentor':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (offers.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 min-h-[140px] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center">
            <UserCheck className="h-5 w-5 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">No pending offers</p>
          <p className="text-xs text-muted-foreground/70 mt-0.5">Mentor and advisor offers will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {offers.map((offer) => (
        <div 
          key={offer.id} 
          className="rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:shadow-md hover:border-primary/20"
        >
          <div className="flex items-start gap-3">
            <div className="relative flex-shrink-0">
              <Avatar className="h-10 w-10 ring-2 ring-background">
                <AvatarImage src={offer.mentor?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-sm font-semibold">
                  {offer.mentor?.full_name?.charAt(0) || 'M'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-amber-500 ring-2 ring-background flex items-center justify-center">
                <Sparkles className="h-2 w-2 text-white" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-sm text-foreground truncate">
                  {offer.mentor?.full_name || 'Anonymous'}
                </h4>
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 font-medium uppercase tracking-wide ${getRoleBadgeStyle(offer.role)}`}>
                  {offer.role || 'mentor'}
                </Badge>
              </div>
              {offer.mentor?.bio && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {offer.mentor.bio}
                </p>
              )}
              {offer.goals && (
                <p className="text-xs text-foreground/80 mt-1.5 line-clamp-2 italic">
                  "{offer.goals}"
                </p>
              )}
              <div className="flex items-center justify-between mt-3">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(offer.created_at), { addSuffix: true })}
                </span>
                <div className="flex gap-1.5">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-7 px-2.5 text-xs hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleOffer(offer.id, 'decline')}
                    disabled={loading === offer.id}
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Decline
                  </Button>
                  <Button 
                    size="sm"
                    className="h-7 px-3 text-xs"
                    onClick={() => handleOffer(offer.id, 'accept')}
                    disabled={loading === offer.id}
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    Accept
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}