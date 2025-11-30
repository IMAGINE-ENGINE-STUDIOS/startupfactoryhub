import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, CheckCircle, XCircle, GraduationCap, Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import UserProfileDialog from './UserProfileDialog';

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
  };
}

interface StartupMentorshipOffersProps {
  onOfferHandled?: () => void;
}

export default function StartupMentorshipOffers({ onOfferHandled }: StartupMentorshipOffersProps = {}) {
  const [offers, setOffers] = useState<MentorOffer[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchPendingOffers();
    }
  }, [user]);

  const fetchPendingOffers = async () => {
    if (!user) return;

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

    setOffers(data as any || []);
  };

  const handleOffer = async (offerId: string, action: 'accept' | 'decline') => {
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
        description: `Failed to ${action} mentor offer`,
        variant: "destructive",
      });
      return;
    }

    // Get the offer to notify the mentor
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
        : "The mentor offer has been declined.",
    });

    fetchPendingOffers();
    
    if (onOfferHandled) {
      onOfferHandled();
    }
  };

  if (offers.length === 0) {
    return (
      <div className="text-center py-8 rounded-xl border border-dashed border-muted-foreground/20">
        <GraduationCap className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
        <p className="text-muted-foreground text-sm">No pending mentor offers</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {offers.map((offer) => (
        <Card key={offer.id} className="hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3">
              {/* Mentor Info */}
              <div className="flex items-start space-x-3">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={offer.mentor?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                    {offer.mentor?.full_name?.charAt(0) || 'M'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground text-sm">
                      {offer.mentor?.full_name || 'Anonymous Mentor'}
                    </h3>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {offer.mentor?.role || 'mentor'}
                    </Badge>
                  </div>
                  {offer.mentor?.bio && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {offer.mentor.bio}
                    </p>
                  )}
                  {offer.goals && (
                    <p className="text-xs text-muted-foreground mt-2">
                      <span className="font-medium">Their message:</span> {offer.goals}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Offered {new Date(offer.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                  onClick={() => handleOffer(offer.id, 'decline')}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Decline
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleOffer(offer.id, 'accept')}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Accept
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <UserProfileDialog 
        userId={selectedMentor?.user_id}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
