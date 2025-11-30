import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Heart, GraduationCap, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
    user_id: string;
  };
  mentorRole?: string;
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

    // First fetch pending offers
    const { data, error } = await supabase
      .from('mentorship_relationships')
      .select('*')
      .eq('mentee_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching mentor offers:', error);
      return;
    }

    if (!data || data.length === 0) {
      setOffers([]);
      return;
    }

    // Get mentor IDs
    const mentorIds = data.map(d => d.mentor_id);
    
    // Fetch profiles and roles in parallel
    const [{ data: profiles }, { data: rolesData }] = await Promise.all([
      supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, bio')
        .in('user_id', mentorIds),
      supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', mentorIds)
        .in('role', ['mentor', 'advisor'])
    ]);

    // Create maps
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
    const roleMap = new Map(rolesData?.map(r => [r.user_id, r.role]) || []);

    // Filter offers to only show those from mentors/advisors and merge data
    const offersWithData = data
      .filter(offer => roleMap.has(offer.mentor_id))
      .map(offer => ({
        ...offer,
        mentor: profileMap.get(offer.mentor_id) || { full_name: '', avatar_url: '', bio: '', user_id: offer.mentor_id },
        mentorRole: roleMap.get(offer.mentor_id) || 'mentor'
      }));

    setOffers(offersWithData as MentorOffer[]);
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

  if (offers.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 min-h-[180px] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-slate-800 flex items-center justify-center ring-1 ring-slate-700">
            <GraduationCap className="h-7 w-7 text-slate-500" />
          </div>
          <p className="text-slate-400 font-medium">No pending offers</p>
          <p className="text-xs text-slate-500 mt-1">Mentor and advisor offers will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {offers.map((offer) => (
        <div 
          key={offer.id} 
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 p-5 transition-all duration-300 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/10"
        >
          {/* Header with Avatar */}
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14 ring-2 ring-emerald-500/30 shadow-lg">
              <AvatarImage src={offer.mentor?.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-lg">
                {offer.mentor?.full_name?.charAt(0) || 'M'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-lg">
                {offer.mentor?.full_name || 'Anonymous'}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge className="bg-slate-700/80 text-slate-200 border-0 text-[10px] uppercase tracking-wider font-medium">
                  {offer.mentorRole || 'mentor'}
                </Badge>
                <div className="flex items-center gap-1.5 text-emerald-400 text-sm">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span className="font-medium">Great Match</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bio */}
          {offer.mentor?.bio && (
            <p className="text-slate-400 text-sm mt-4 line-clamp-2 leading-relaxed">
              {offer.mentor.bio}
            </p>
          )}

          {/* Goals message if present */}
          {offer.goals && (
            <div className="mt-4 rounded-xl bg-slate-800/50 p-3 border border-slate-700/50">
              <p className="text-slate-300 text-sm leading-relaxed">
                "{offer.goals}"
              </p>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-3 mt-5">
            <Button 
              variant="outline" 
              className="flex-1 h-11 bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 hover:border-slate-500 hover:text-white"
              onClick={() => handleOffer(offer.id, 'decline')}
              disabled={loading === offer.id}
            >
              <X className="h-4 w-4 mr-2" />
              Pass
            </Button>
            <Button 
              className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25"
              onClick={() => handleOffer(offer.id, 'accept')}
              disabled={loading === offer.id}
            >
              <Heart className="h-4 w-4 mr-2" />
              Connect
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}