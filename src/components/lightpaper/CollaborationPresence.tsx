import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Users, Eye, Edit, Pen } from "lucide-react";
import { cn } from "@/lib/utils";

interface Collaborator {
  id: string;
  user_id: string | null;
  user_name: string;
  user_avatar: string | null;
  status: 'viewing' | 'editing' | 'signing';
  last_seen: string;
}

interface CollaborationPresenceProps {
  documentId: string;
  currentStatus?: 'viewing' | 'editing' | 'signing';
}

export function CollaborationPresence({ documentId, currentStatus = 'viewing' }: CollaborationPresenceProps) {
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [myPresenceId, setMyPresenceId] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) return;

    // Load existing collaborators
    const loadCollaborators = async () => {
      const { data } = await supabase
        .from('document_collaborators')
        .select('*')
        .eq('document_id', documentId)
        .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Active in last 5 minutes

      if (data) {
        setCollaborators(data as Collaborator[]);
      }
    };

    loadCollaborators();

    // Add current user as collaborator
    const joinAsCollaborator = async () => {
      if (!user) {
        // Guest user
        const { data, error } = await supabase
          .from('document_collaborators')
          .insert({
            document_id: documentId,
            user_id: null,
            user_name: 'Guest',
            user_avatar: null,
            status: currentStatus,
          })
          .select()
          .single();

        if (!error && data) {
          setMyPresenceId(data.id);
        }
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('user_id', user.id)
          .single();

        const { data, error } = await supabase
          .from('document_collaborators')
          .insert({
            document_id: documentId,
            user_id: user.id,
            user_name: profile?.full_name || user.email || 'User',
            user_avatar: profile?.avatar_url,
            status: currentStatus,
          })
          .select()
          .single();

        if (!error && data) {
          setMyPresenceId(data.id);
        }
      }
    };

    joinAsCollaborator();

    // Update presence every 30 seconds
    const presenceInterval = setInterval(async () => {
      if (myPresenceId) {
        await supabase
          .from('document_collaborators')
          .update({ 
            last_seen: new Date().toISOString(),
            status: currentStatus,
          })
          .eq('id', myPresenceId);
      }
    }, 30000);

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`document-${documentId}-collaborators`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'document_collaborators',
          filter: `document_id=eq.${documentId}`,
        },
        () => {
          loadCollaborators();
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      clearInterval(presenceInterval);
      if (myPresenceId) {
        supabase
          .from('document_collaborators')
          .delete()
          .eq('id', myPresenceId)
          .then();
      }
      channel.unsubscribe();
    };
  }, [documentId, user, currentStatus, myPresenceId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'editing': return <Edit className="h-3 w-3" />;
      case 'signing': return <Pen className="h-3 w-3" />;
      default: return <Eye className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'editing': return 'text-blue-500';
      case 'signing': return 'text-purple-500';
      default: return 'text-green-500';
    }
  };

  if (collaborators.length === 0) return null;

  return (
    <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2">
      <Users className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">
        {collaborators.length} {collaborators.length === 1 ? 'person' : 'people'}
      </span>
      <div className="flex -space-x-2">
        <TooltipProvider>
          {collaborators.slice(0, 5).map((collab) => (
            <Tooltip key={collab.id}>
              <TooltipTrigger>
                <div className="relative">
                  <Avatar className="h-8 w-8 border-2 border-background">
                    <AvatarImage src={collab.user_avatar || undefined} />
                    <AvatarFallback className="text-xs">
                      {collab.user_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "absolute -bottom-1 -right-1 rounded-full bg-background p-0.5",
                    getStatusColor(collab.status)
                  )}>
                    {getStatusIcon(collab.status)}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{collab.user_name}</p>
                <p className="text-xs text-muted-foreground capitalize">{collab.status}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
        {collaborators.length > 5 && (
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted border-2 border-background">
            <span className="text-xs font-medium">+{collaborators.length - 5}</span>
          </div>
        )}
      </div>
    </div>
  );
}
