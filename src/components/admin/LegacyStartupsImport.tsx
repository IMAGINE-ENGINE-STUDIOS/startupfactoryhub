import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Building2, RefreshCw, Database, Upload, ExternalLink, Trash2 } from 'lucide-react';
import legacyStartups from '@/data/legacy_pipeline_startups.json';

interface LegacyStartup {
  id: string;
  legacy_id: string;
  name: string;
  tagline: string | null;
  location: string | null;
  country: string | null;
  markets: string[] | null;
  website: string | null;
  milestone: string | null;
  cash_runway: string | null;
  rev_last_month: string | null;
  founders: Array<{ name: string; role: string }>;
  import_status: string;
  created_at: string;
}

const STATUS_VARIANT: Record<string, any> = {
  pending: 'secondary',
  promoted: 'default',
  skipped: 'outline',
};

export default function LegacyStartupsImport() {
  const { toast } = useToast();
  const [rows, setRows] = useState<LegacyStartup[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const fetchRows = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('legacy_imported_startups')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setRows((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const loadFromExport = async () => {
    setWorking(true);
    try {
      const payload = (legacyStartups as any[]).map((r) => ({
        legacy_id: String(r.legacy_id),
        name: r.name,
        tagline: r.tagline,
        description: r.description,
        differentiators: r.differentiators,
        location: r.location,
        country: r.country,
        markets: r.markets,
        founded_text: r.founded_text,
        website: r.website,
        linkedin_url: r.linkedin_url,
        twitter_url: r.twitter_url,
        facebook_url: r.facebook_url,
        milestone: r.milestone,
        revenue_model: r.revenue_model,
        cash_runway: r.cash_runway,
        total_funding: r.total_funding,
        rev_last_12_months: r.rev_last_12_months,
        rev_last_month: r.rev_last_month,
        interfaces: r.interfaces,
        clients: r.clients,
        videos: r.videos,
        decks: r.decks,
        assigned_evaluators: r.assigned_evaluators,
        founders: r.founders || [],
      }));

      const { error, count } = await supabase
        .from('legacy_imported_startups')
        .upsert(payload, { onConflict: 'legacy_id', ignoreDuplicates: true, count: 'exact' });

      if (error) throw error;
      toast({
        title: 'Import complete',
        description: `Staged ${payload.length} startups (duplicates skipped). New rows: ${count ?? '—'}`,
      });
      await fetchRows();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setWorking(false);
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('legacy_imported_startups').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setRows((r) => r.filter((x) => x.id !== id));
    }
  };

  const counts = rows.reduce((acc, r) => {
    acc[r.import_status] = (acc[r.import_status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card className="tech-card border-0">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Legacy Startups Migration
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Startups imported from the previous platform pipeline ({(legacyStartups as any[]).length} available in export)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchRows} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={loadFromExport} disabled={working}>
              <Upload className="h-4 w-4 mr-2" />
              Stage All from Export
            </Button>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap mt-4">
          <Badge variant="secondary">Pending: {counts.pending || 0}</Badge>
          <Badge variant="default">Promoted: {counts.promoted || 0}</Badge>
          <Badge variant="outline">Skipped: {counts.skipped || 0}</Badge>
          <Badge variant="outline">Total staged: {rows.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No startups staged yet. Click <strong>Stage All from Export</strong> to load the 49 legacy pipeline startups.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Startup</TableHead>
                  <TableHead>Founders</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Markets</TableHead>
                  <TableHead>Milestone</TableHead>
                  <TableHead>Revenue (mo)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="max-w-[260px]">
                      <div className="font-medium flex items-center gap-1">
                        {s.name}
                        {s.website && (
                          <a href={s.website} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" />
                          </a>
                        )}
                      </div>
                      {s.tagline && (
                        <div className="text-xs text-muted-foreground line-clamp-2">{s.tagline}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {(s.founders || []).slice(0, 2).map((f, i) => (
                        <div key={i}>
                          {f.name} <span className="text-muted-foreground">{f.role && `· ${f.role}`}</span>
                        </div>
                      ))}
                      {(s.founders || []).length > 2 && (
                        <div className="text-muted-foreground">+{s.founders.length - 2} more</div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{s.location || '—'}</TableCell>
                    <TableCell className="text-xs max-w-[180px]">
                      <div className="flex flex-wrap gap-1">
                        {(s.markets || []).slice(0, 3).map((m, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">{m}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{s.milestone || '—'}</TableCell>
                    <TableCell className="text-xs">{s.rev_last_month || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[s.import_status] || 'outline'}>
                        {s.import_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(s.id)}
                        title="Remove from staging"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
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
