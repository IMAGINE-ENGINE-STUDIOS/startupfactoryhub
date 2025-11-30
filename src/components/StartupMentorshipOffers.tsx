import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, XCircle, GraduationCap, Sparkles, Clock } from 'lucide-react';
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
    role: string;
    user_id: string;
  };
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

    // Fetch pending offers from mentors AND advisors
    const { data, error } = await supabase
      .from('mentorship_relationships')
      .select(`
        *,
        mentor:profiles!mentorship_relationships_mentor_id_fkey (
          full_name,
          avatar_url,
          bio,
          role,
          user_id
        )
      `)
      .eq('mentee_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching mentor offers:', error);
      return;
    }

    // Filter to only show offers from mentors and advisors
    const filteredOffers = (data || []).filter(
      (offer: any) => offer.mentor?.role === 'mentor' || offer.mentor?.role === 'advisor'
    );

    setOffers(filteredOffers as any);
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
        return 'bg-violet-500/10 text-violet-600 border-violet-500/20';
      case 'mentor':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (offers.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-dashed border-muted-foreground/20 bg-gradient-to-br from-muted/30 to-muted/10 p-8">
        <div className="absolute inset-0 bg-grid-white/5" />
        <div className="relative text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground font-medium">No pending offers</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Mentor and advisor offers will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {offers.map((offer) => (
        <div 
          key={offer.id} 
          className="group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-card to-card/80 p-4 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
        >
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative space-y-4">
            {/* Header with Avatar and Info */}
            <div className="flex items-start gap-3">
              <div className="relative">
                <Avatar className="h-11 w-11 ring-2 ring-background shadow-md">
                  <AvatarImage src={offer.mentor?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold">
                    {offer.mentor?.full_name?.charAt(0) || 'M'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-amber-500 ring-2 ring-background flex items-center justify-center">
                  <Sparkles className="h-2.5 w-2.5 text-white" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground">
                    {offer.mentor?.full_name || 'Anonymous'}
                  </h3>
                  <Badge variant="outline" className={`text-[10px] font-medium uppercase tracking-wide ${getRoleBadgeStyle(offer.mentor?.role)}`}>
                    {offer.mentor?.role || 'mentor'}
                  </Badge>
                </div>
                {offer.mentor?.bio && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {offer.mentor.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Message if present */}
            {offer.goals && (
              <div className="rounded-lg bg-muted/50 p-3 border border-border/50">
                <p className="text-xs text-foreground/80 leading-relaxed">
                  "{offer.goals}"
                </p>
              </div>
            )}

            {/* Footer with time and actions */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{formatDistanceToNow(new Date(offer.created_at), { addSuffix: true })}</span>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 px-3 text-xs hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleOffer(offer.id, 'decline')}
                  disabled={loading === offer.id}
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  Decline
                </Button>
                <Button 
                  size="sm"
                  className="h-8 px-4 text-xs bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-sm"
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
      ))}
    </div>
  );
}
