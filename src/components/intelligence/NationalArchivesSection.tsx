import { useState, useEffect } from 'react';
import { Landmark, Search, ExternalLink, FileText, Calendar, Building2, Loader2, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ArchiveRecord {
  id: string;
  title: string;
  type: string;
  date: string | null;
  creator: string | null;
  description: string | null;
  accessLevel: string;
  url: string;
}

interface ArchiveResults {
  type: string;
  query: string;
  total: number;
  records: ArchiveRecord[];
}

const TYPE_COLORS: Record<string, string> = {
  'Founding Documents': 'text-amber-600 border-amber-500/30',
  'Military Records': 'text-red-600 border-red-500/30',
  'Land Records': 'text-emerald-600 border-emerald-500/30',
  'Scientific Records': 'text-blue-600 border-blue-500/30',
  'Immigration Records': 'text-purple-600 border-purple-500/30',
};

const getTypeColor = (type: string) =>
  TYPE_COLORS[type] || 'text-violet-600 border-violet-500/30';

export const NationalArchivesSection = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ArchiveResults | null>(null);
  const [isFeatured, setIsFeatured] = useState(false);

  const loadFeatured = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('national-archives', {
        body: { query: 'featured', type: 'featured' },
      });
      if (error) throw error;
      setResults(data);
      setIsFeatured(true);
    } catch (err: any) {
      toast.error('Failed to load featured collections: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('national-archives', {
        body: { query: query.trim(), type: 'search' },
      });
      if (error) throw error;
      setResults(data);
      setIsFeatured(false);
    } catch (err: any) {
      toast.error('Failed to search archives: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeatured();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-violet-500/10">
          <Landmark className="w-6 h-6 text-violet-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">National Archives Repository</h2>
          <p className="text-sm text-muted-foreground">
            Search millions of historical records from the U.S. National Archives
          </p>
        </div>
        <Badge variant="secondary" className="ml-auto text-[10px]">
          Live
        </Badge>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search records, documents, collections..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={loading || !query.trim()}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
        </Button>
        <Button type="button" variant="outline" onClick={loadFeatured} disabled={loading}>
          <Star className="w-4 h-4 mr-1" />
          Featured
        </Button>
      </form>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            <p className="text-sm text-muted-foreground">Searching the National Archives...</p>
          </div>
        </div>
      )}

      {/* Results */}
      {results && !loading && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {isFeatured ? (
                'Featured Collections'
              ) : (
                <>
                  Showing{' '}
                  <span className="font-medium text-foreground">{results.records.length}</span> of{' '}
                  <span className="font-medium text-foreground">{results.total.toLocaleString()}</span> results for "
                  <span className="font-medium text-foreground">{results.query}</span>"
                </>
              )}
            </p>
            <a
              href={`https://catalog.archives.gov/search?q=${encodeURIComponent(results.query)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-violet-500 hover:underline flex items-center gap-1"
            >
              View all on Archives.gov <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.records.map((record) => (
              <Card key={record.id} className="tech-card border-0 p-4 hover:ring-1 hover:ring-violet-500/30 transition-all group">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-violet-500/10 shrink-0">
                    <FileText className="w-4 h-4 text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-violet-500 transition-colors">
                        {record.title}
                      </h3>
                      <a
                        href={record.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-violet-500" />
                      </a>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <Badge variant="outline" className={`text-[10px] ${getTypeColor(record.type)}`}>
                        {record.type}
                      </Badge>
                      {record.accessLevel === 'public' && (
                        <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                          Public
                        </Badge>
                      )}
                    </div>

                    {record.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {record.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                      {record.date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {record.date}
                        </span>
                      )}
                      {record.creator && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          <span className="truncate max-w-[140px]">{record.creator}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {!results && !loading && (
        <div className="text-center py-16 text-muted-foreground">
          <Landmark className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>Search millions of historical records from the National Archives</p>
        </div>
      )}
    </div>
  );
};
