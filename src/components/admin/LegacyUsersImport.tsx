import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Send, RefreshCw, Database } from 'lucide-react';

interface LegacyUser {
  id: string;
  legacy_account_id: string | null;
  full_name: string | null;
  email: string;
  company_name: string | null;
  legacy_role: string | null;
  mapped_role: string;
  import_status: string;
  import_error: string | null;
  invited_at: string | null;
  legacy_signup_date: string | null;
}

const STATUS_VARIANT: Record<string, any> = {
  pending: 'secondary',
  invited: 'default',
  skipped_duplicate: 'outline',
  failed: 'destructive',
};

export default function LegacyUsersImport() {
  const { toast } = useToast();
  const [users, setUsers] = useState<LegacyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('legacy_imported_users')
      .select('*')
      .order('legacy_signup_date', { ascending: false });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setUsers(data as LegacyUser[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleAll = () => {
    const pending = users.filter((u) => u.import_status === 'pending');
    if (selected.size === pending.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pending.map((u) => u.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const invite = async (ids?: string[]) => {
    setWorking(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-legacy-users', {
        body: ids && ids.length > 0 ? { ids } : {},
      });
      if (error) throw error;
      toast({
        title: 'Import complete',
        description: `Invited: ${data.invited} · Skipped: ${data.skipped_duplicate} · Failed: ${data.failed}`,
      });
      setSelected(new Set());
      await fetchUsers();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setWorking(false);
    }
  };

  const counts = users.reduce(
    (acc, u) => {
      acc[u.import_status] = (acc[u.import_status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const pendingCount = counts.pending || 0;

  return (
    <Card className="tech-card border-0">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Legacy Users Migration
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Mentors & advisors imported from previous platform (formerly "Clients")
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => invite(Array.from(selected))}
              disabled={working || selected.size === 0}
            >
              <Send className="h-4 w-4 mr-2" />
              Invite Selected ({selected.size})
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={() => invite()}
              disabled={working || pendingCount === 0}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite All Pending ({pendingCount})
            </Button>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap mt-4">
          <Badge variant="secondary">Pending: {counts.pending || 0}</Badge>
          <Badge variant="default">Invited: {counts.invited || 0}</Badge>
          <Badge variant="outline">Skipped: {counts.skipped_duplicate || 0}</Badge>
          <Badge variant="destructive">Failed: {counts.failed || 0}</Badge>
          <Badge variant="outline">Total: {users.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No legacy users to import.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        pendingCount > 0 && selected.size === pendingCount
                      }
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Legacy Role</TableHead>
                  <TableHead>Mapped Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <Checkbox
                        disabled={u.import_status !== 'pending'}
                        checked={selected.has(u.id)}
                        onCheckedChange={() => toggleOne(u.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{u.full_name || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>{u.company_name || '—'}</TableCell>
                    <TableCell className="text-xs">{u.legacy_role || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={u.mapped_role === 'advisor' ? 'default' : 'secondary'}>
                        {u.mapped_role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[u.import_status] || 'outline'}>
                        {u.import_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={u.import_error || ''}>
                      {u.import_error || (u.invited_at ? `Invited ${new Date(u.invited_at).toLocaleDateString()}` : '')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
