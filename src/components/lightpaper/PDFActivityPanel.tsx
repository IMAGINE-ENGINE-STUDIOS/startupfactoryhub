import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileSignature, Edit, Eye, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Signature {
  id: string;
  signer_name: string;
  signer_email: string | null;
  signed_at: string;
  page_number: number;
  signature_type: 'draw' | 'text';
}

interface Activity {
  id: string;
  type: 'signature' | 'view' | 'edit';
  user_name: string;
  timestamp: string;
  details?: any;
}

interface PDFActivityPanelProps {
  documentId: string;
}

export function PDFActivityPanel({ documentId }: PDFActivityPanelProps) {
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!documentId) return;

    const loadData = async () => {
      setLoading(true);

      // Load signatures
      const { data: sigData } = await supabase
        .from('pdf_signatures')
        .select('*')
        .eq('document_id', documentId)
        .order('signed_at', { ascending: false });

      if (sigData) {
        setSignatures(sigData as Signature[]);
      }

      // Load recent collaborator activity (last 24 hours)
      const { data: collabData } = await supabase
        .from('document_collaborators')
        .select('*')
        .eq('document_id', documentId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      // Combine activities
      const combinedActivities: Activity[] = [
        ...(sigData || []).map(sig => ({
          id: sig.id,
          type: 'signature' as const,
          user_name: sig.signer_name,
          timestamp: sig.signed_at,
          details: { page: sig.page_number, type: sig.signature_type },
        })),
        ...(collabData || []).map(collab => ({
          id: collab.id,
          type: collab.status === 'viewing' ? 'view' as const : 'edit' as const,
          user_name: collab.user_name,
          timestamp: collab.created_at,
          details: { status: collab.status },
        })),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setActivities(combinedActivities);
      setLoading(false);
    };

    loadData();

    // Subscribe to real-time signature updates
    const sigChannel = supabase
      .channel(`signatures-${documentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pdf_signatures',
          filter: `document_id=eq.${documentId}`,
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      sigChannel.unsubscribe();
    };
  }, [documentId]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'signature': return <FileSignature className="h-4 w-4" />;
      case 'edit': return <Edit className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'signature': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'edit': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-green-500/10 text-green-500 border-green-500/20';
    }
  };

  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case 'signature':
        return `signed page ${activity.details.page}`;
      case 'edit':
        return 'edited the document';
      default:
        return 'viewed the document';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Activity & History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="text-center text-muted-foreground py-8">
              Loading activity...
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No activity yet
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {activity.user_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getActivityText(activity)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge variant="outline" className={getActivityColor(activity.type)}>
                    {activity.type}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {signatures.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-semibold mb-2">Signatures ({signatures.length})</h4>
            <div className="space-y-2">
              {signatures.slice(0, 3).map((sig) => (
                <div key={sig.id} className="flex items-center justify-between text-xs">
                  <span className="truncate">{sig.signer_name}</span>
                  <span className="text-muted-foreground">Page {sig.page_number}</span>
                </div>
              ))}
              {signatures.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{signatures.length - 3} more signature{signatures.length - 3 > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
