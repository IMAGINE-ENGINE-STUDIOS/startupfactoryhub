import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { useCompanyTeam } from '@/hooks/useCompanyMembers';

interface Props {
  companyId: string;
}

const seniorityOrder: Record<string, number> = { cofounder: 0, lead: 1, member: 2 };

export default function StartupTeamSection({ companyId }: Props) {
  const { team, loading } = useCompanyTeam(companyId, { onlyApproved: true });

  const sorted = [...team].sort(
    (a, b) => (seniorityOrder[a.seniority] ?? 9) - (seniorityOrder[b.seniority] ?? 9)
  );

  return (
    <Card className="tech-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" /> Team
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <p className="text-sm text-muted-foreground">Loading team…</p>}
        {!loading && sorted.length === 0 && (
          <p className="text-sm text-muted-foreground">No team members listed yet.</p>
        )}
        {!loading && sorted.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card/50"
              >
                <Avatar className="h-12 w-12">
                  {m.profile?.avatar_url ? <AvatarImage src={m.profile.avatar_url} /> : null}
                  <AvatarFallback>{m.profile?.full_name?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{m.profile?.full_name || 'Member'}</p>
                  {m.title && <p className="text-xs text-muted-foreground truncate">{m.title}</p>}
                  {m.seniority !== 'member' && (
                    <Badge variant="outline" className="text-[10px] mt-1 capitalize">
                      {m.seniority}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
