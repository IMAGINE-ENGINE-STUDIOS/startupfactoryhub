import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GraduationCap, Briefcase, Loader2, UserCheck } from 'lucide-react';
import UserProfileDialog from '@/components/UserProfileDialog';

export type RequestServiceMode = 'mentor' | 'advisor';

interface Person {
  user_id: string;
  full_name: string;
  avatar_url?: string | null;
  bio?: string | null;
}

interface Props {
  mode: RequestServiceMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COPY: Record<RequestServiceMode, { title: string; description: string; empty: string; sent: string }> = {
  mentor: {
    title: 'Request mentorship',
    description: 'Pick a mentor and send them a mentorship request. They will see it under Meetings → Requests.',
    empty: 'No mentors available right now.',
    sent: 'Mentorship request sent!',
  },
  advisor: {
    title: 'Request advisory service',
    description: 'Pick an advisor and send them an advisory request. They will see it under Meetings → Requests.',
    empty: 'No advisors available right now.',
    sent: 'Advisory request sent!',
  },
};

export default function RequestServiceDialog({ mode, open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { notifyConnection } = useNotifications();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  const copy = COPY[mode];
  const ModeIcon = mode === 'mentor' ? GraduationCap : Briefcase;

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        // Page through every registered profile (no 100-row cap)
        const profiles: Person[] = [];
        for (let from = 0; ; from += 1000) {
          const { data } = await supabase
            .from('profiles')
            .select('user_id, full_name, avatar_url, bio')
            .neq('user_id', user.id)
            .order('created_at', { ascending: true })
            .range(from, from + 999);
          if (!data || data.length === 0) break;
          profiles.push(...(data as Person[]));
          if (data.length < 1000) break;
        }

        const userIds = profiles.map(p => p.user_id);
        const [{ data: roles }, { data: existing }] = await Promise.all([
          supabase.rpc('get_user_roles_batch', { user_ids: userIds }),
          supabase
            .from('mentorship_relationships')
            .select('mentor_id')
            .eq('mentee_id', user.id)
            .in('status', ['pending', 'active']),
        ]);

        if (cancelled) return;
        const wanted = new Set(
          (roles || []).filter((r: any) => r.role === mode).map((r: any) => r.user_id)
        );
        setPeople(profiles.filter(p => wanted.has(p.user_id) && p.full_name));
        setRequestedIds(new Set((existing || []).map((r: any) => r.mentor_id)));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [open, user, mode]);

  const sendRequest = async (person: Person) => {
    if (!user || sendingId) return;
    setSendingId(person.user_id);
    try {
      const { error } = await supabase.from('mentorship_relationships').insert({
        mentor_id: person.user_id,
        mentee_id: user.id,
        status: 'pending',
      });
      if (error) throw error;

      setRequestedIds(prev => new Set(prev).add(person.user_id));
      const senderName = user.user_metadata?.full_name || 'Someone';
      notifyConnection(person.user_id, senderName);
      toast({
        title: copy.sent,
        description: `Your request has been sent to ${person.full_name}.`,
      });
    } catch (e) {
      console.error('Request error:', e);
      toast({
        title: 'Could not send request',
        description: 'Please try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setSendingId(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ModeIcon className="h-5 w-5 text-primary" />
              {copy.title}
            </DialogTitle>
            <DialogDescription>{copy.description}</DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] -mx-2 px-2">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : people.length === 0 ? (
              <div className="text-center py-12 rounded-xl border border-dashed border-muted-foreground/20">
                <p className="text-sm text-muted-foreground">{copy.empty}</p>
              </div>
            ) : (
              <div className="space-y-2 py-1">
                {people.map(person => {
                  const requested = requestedIds.has(person.user_id);
                  return (
                    <div key={person.user_id} className="flex items-center gap-3 p-3 rounded-xl tech-card border-0">
                      <button
                        type="button"
                        className="flex items-center gap-3 min-w-0 flex-1 text-left"
                        onClick={() => setProfileUserId(person.user_id)}
                      >
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={person.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {person.full_name?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">{person.full_name}</p>
                          {person.bio && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{person.bio}</p>
                          )}
                        </div>
                      </button>
                      <Button
                        size="sm"
                        variant={requested ? 'outline' : 'default'}
                        disabled={requested || sendingId === person.user_id}
                        onClick={() => sendRequest(person)}
                        className="gap-1.5 shrink-0 h-8 text-xs"
                      >
                        {sendingId === person.user_id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : requested ? (
                          <UserCheck className="h-3.5 w-3.5" />
                        ) : (
                          <ModeIcon className="h-3.5 w-3.5" />
                        )}
                        {requested ? 'Requested' : 'Request'}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {profileUserId && (
        <UserProfileDialog
          userId={profileUserId}
          open={!!profileUserId}
          onOpenChange={(o) => { if (!o) setProfileUserId(null); }}
        />
      )}
    </>
  );
}
