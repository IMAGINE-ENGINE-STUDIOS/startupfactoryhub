import { useState, useEffect } from 'react';
import { UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import MentorshipSessionCard from './MentorshipSessionCard';

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
  onCountChange?: (count: number) => void;
}

export default function StartupMentorshipOffers({ onOfferHandled, onCountChange }: StartupMentorshipOffersProps = {}) {
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
      onCountChange?.(0);
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
    
    // Create a map that stores all roles for each user (not just the last one)
    const roleMap = new Map<string, string[]>();
    roles?.forEach(r => {
      const existingRoles = roleMap.get(r.user_id) || [];
      roleMap.set(r.user_id, [...existingRoles, r.role]);
    });

    // Filter to only show offers from users who have mentor or advisor role AND valid profile
    const enrichedOffers = relationships
      .map(rel => {
        const profile = profileMap.get(rel.mentor_id);
        // Skip if no valid profile exists
        if (!profile || !profile.full_name) return null;
        
        const userRoles = roleMap.get(rel.mentor_id) || [];
        // Prefer 'advisor' role over 'mentor', then use first available
        const displayRole = userRoles.includes('advisor') ? 'advisor' : 
                           userRoles.includes('mentor') ? 'mentor' : 
                           userRoles[0] || 'mentor';
        return {
          ...rel,
          mentor: profile,
          role: displayRole,
          allRoles: userRoles
        };
      })
      .filter(offer => offer !== null && (offer.allRoles.includes('mentor') || offer.allRoles.includes('advisor')));

    setOffers(enrichedOffers as MentorOffer[]);
    onCountChange?.(enrichedOffers.length);
  };

  const handleAccept = async (offerId: string) => {
    setLoading(offerId);
    
    const { error } = await supabase
      .from('mentorship_relationships')
      .update({ 
        status: 'active',
        start_date: new Date().toISOString()
      })
      .eq('id', offerId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to accept offer",
        variant: "destructive",
      });
      setLoading(null);
      return;
    }

    const offer = offers.find(o => o.id === offerId);
    if (offer) {
      await supabase.from('notifications').insert({
        user_id: offer.mentor_id,
        type: 'mentorship_accepted',
        title: 'Mentorship Offer Accepted',
        message: 'Your mentorship offer has been accepted! You can now schedule sessions.',
      });
    }

    toast({
      title: "Offer Accepted!",
      description: "You can now schedule sessions with your new mentor.",
    });

    setLoading(null);
    fetchPendingOffers();
    
    if (onOfferHandled) {
      onOfferHandled();
    }
  };

  const handleReject = async (offerId: string) => {
    setLoading(offerId);
    
    const { error } = await supabase
      .from('mentorship_relationships')
      .update({ 
        status: 'declined'
      })
      .eq('id', offerId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to decline offer",
        variant: "destructive",
      });
      setLoading(null);
      return;
    }

    const offer = offers.find(o => o.id === offerId);
    if (offer) {
      await supabase.from('notifications').insert({
        user_id: offer.mentor_id,
        type: 'mentorship_declined',
        title: 'Mentorship Offer Declined',
        message: 'Your mentorship offer has been declined.',
      });
    }

    toast({
      title: "Offer Declined",
      description: "The offer has been declined.",
    });

    setLoading(null);
    fetchPendingOffers();
    
    if (onOfferHandled) {
      onOfferHandled();
    }
  };

  if (offers.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 min-h-[100px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">No pending offers</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {offers.map((offer) => (
        <MentorshipSessionCard
          key={offer.id}
          session={{
            id: offer.id,
            created_at: offer.created_at,
            goals: offer.goals,
            mentor: offer.mentor,
            role: offer.role,
          }}
          variant="offer"
          onAccept={handleAccept}
          onReject={handleReject}
          loading={loading === offer.id}
        />
      ))}
    </div>
  );
}
