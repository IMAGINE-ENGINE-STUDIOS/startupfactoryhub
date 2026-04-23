import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Check, X, Trash2, Pencil, Save } from 'lucide-react';
import { useCompanyTeam, useTeamMutations, MemberSeniority } from '@/hooks/useCompanyMembers';
import { useToast } from '@/hooks/use-toast';

interface Props {
  companyId: string;
}

export default function TeamRequestsManager({ companyId }: Props) {
  const { team, loading } = useCompanyTeam(companyId);
  const { approveRequest, rejectRequest, updateMember, removeMember } = useTeamMutations();
  const { toast } = useToast();
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSeniority, setEditSeniority] = useState<MemberSeniority>('member');

  const pending = team.filter((m) => m.status === 'pending');
  const approved = team.filter((m) => m.status === 'approved');

  const startEdit = (m: any) => {
    setEditing(m.id);
    setEditTitle(m.title || '');
    setEditSeniority(m.seniority);
  };

  const saveEdit = async (memberId: string) => {
    try {
      await updateMember(memberId, { title: editTitle.trim(), seniority: editSeniority });
      toast({ title: 'Updated' });
      setEditing(null);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handle = async (fn: () => Promise<void>, success: string) => {
    try {
      await fn();
      toast({ title: success });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <Card className="tech-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" /> Team
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading && <p className="text-sm text-muted-foreground">Loading team…</p>}

        {/* Pending */}
        <div>
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
            Pending requests ({pending.length})
          </h4>
          {pending.length === 0 && <p className="text-xs text-muted-foreground">No pending requests.</p>}
          <div className="space-y-2">
            {pending.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border border-amber-400/30 bg-amber-400/5">
                <Avatar className="h-10 w-10">
                  {m.profile?.avatar_url ? <AvatarImage src={m.profile.avatar_url} /> : null}
                  <AvatarFallback>{m.profile?.full_name?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{m.profile?.full_name || m.profile?.email || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    Wants to join as <strong>{m.title || 'Member'}</strong>
                  </p>
                  {m.message && <p className="text-xs italic text-muted-foreground mt-1">"{m.message}"</p>}
                </div>
                <Button size="sm" variant="default" onClick={() => handle(() => approveRequest(m.id), 'Approved')}>
                  <Check className="h-4 w-4 mr-1" /> Approve
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handle(() => rejectRequest(m.id), 'Rejected')}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Approved */}
        <div>
          <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
            Active members ({approved.length})
          </h4>
          {approved.length === 0 && <p className="text-xs text-muted-foreground">No team members yet.</p>}
          <div className="space-y-2">
            {approved.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                <Avatar className="h-10 w-10">
                  {m.profile?.avatar_url ? <AvatarImage src={m.profile.avatar_url} /> : null}
                  <AvatarFallback>{m.profile?.full_name?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
                {editing === m.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Title"
                      className="flex-1"
                    />
                    <Select value={editSeniority} onValueChange={(v) => setEditSeniority(v as MemberSeniority)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cofounder">Co-founder</SelectItem>
                        <SelectItem value="lead">Lead</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={() => saveEdit(m.id)}>
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{m.profile?.full_name || m.profile?.email || 'Unknown'}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {m.title && <Badge variant="secondary" className="text-[10px]">{m.title}</Badge>}
                        <span className="text-xs text-muted-foreground capitalize">{m.seniority}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => startEdit(m)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handle(() => removeMember(m.id), 'Removed')}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
