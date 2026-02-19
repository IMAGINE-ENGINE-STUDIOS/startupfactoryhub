import { useState, useEffect } from 'react';
import {
  Landmark, Search, ExternalLink, FileText, Calendar,
  Building2, Loader2, Star, ArrowLeft, Tag, Globe, Info
} from 'lucide-react';
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
  series?: string | null;
  accessLevel: string;
  thumbnailUrl?: string | null;
  url: string;
}

interface ArchiveResults {
  type: string;
  query: string;
  total: number;
  records: ArchiveRecord[];
}

const TYPE_COLORS: Record<string, string> = {
  'Founding Documents': 'text-amber-500 border-amber-500/30 bg-amber-500/10',
  'Military Records': 'text-red-500 border-red-500/30 bg-red-500/10',
  'Land Records': 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10',
  'Scientific Records': 'text-blue-500 border-blue-500/30 bg-blue-500/10',
  'Immigration Records': 'text-purple-500 border-purple-500/30 bg-purple-500/10',
};

const getTypeColor = (type: string) =>
  TYPE_COLORS[type] || 'text-violet-500 border-violet-500/30 bg-violet-500/10';

// ── Record Detail View ────────────────────────────────────────────────────────
const RecordDetail = ({
  record,
  onBack,
}: {
  record: ArchiveRecord;
  onBack: () => void;
}) => (
  <div className="space-y-4">
    <Button
      variant="ghost"
      size="sm"
      onClick={onBack}
      className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="w-4 h-4" />
      Back to results
    </Button>

    <div className="tech-card border-0 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-2xl bg-violet-500/10 shrink-0">
          <Landmark className="w-7 h-7 text-violet-500" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold leading-tight mb-2">{record.title}</h2>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={`text-xs ${getTypeColor(record.type)}`}>
              <Tag className="w-3 h-3 mr-1" />
              {record.type}
            </Badge>
            <Badge variant="outline" className="text-xs text-emerald-500 border-emerald-500/30 bg-emerald-500/10">
              <Globe className="w-3 h-3 mr-1" />
              {record.accessLevel === 'public' ? 'Public Access' : record.accessLevel}
            </Badge>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border/40" />

      {/* Meta grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {record.date && (
          <div className="tech-card border-0 p-4 rounded-xl space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Date / Coverage
            </p>
            <p className="text-sm font-semibold">{record.date}</p>
          </div>
        )}
        {record.creator && (
          <div className="tech-card border-0 p-4 rounded-xl space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Building2 className="w-3 h-3" /> Creator / Organization
            </p>
            <p className="text-sm font-semibold">{record.creator}</p>
          </div>
        )}
        {record.series && (
          <div className="tech-card border-0 p-4 rounded-xl space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <FileText className="w-3 h-3" /> Series
            </p>
            <p className="text-sm font-semibold">{record.series}</p>
          </div>
        )}
        <div className="tech-card border-0 p-4 rounded-xl space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Info className="w-3 h-3" /> Record ID
          </p>
          <p className="text-sm font-semibold font-mono">{record.id}</p>
        </div>
      </div>

      {/* Description */}
      {record.description && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Description
          </p>
          <div className="tech-card border-0 p-4 rounded-xl">
            <p className="text-sm leading-relaxed text-foreground/90">{record.description}</p>
          </div>
        </div>
      )}

      {/* View on Archives.gov */}
      <div className="pt-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-violet-500/30 text-violet-500 hover:bg-violet-500/10"
          onClick={() => window.open(record.url, '_blank', 'noopener,noreferrer')}
        >
          <ExternalLink className="w-4 h-4" />
          View Full Record on Archives.gov
        </Button>
      </div>
    </div>
  </div>
);

// ── Record Card ───────────────────────────────────────────────────────────────
const RecordCard = ({
  record,
  onClick,
}: {
  record: ArchiveRecord;
  onClick: () => void;
}) => (
  <div
    className="tech-card border-0 p-4 hover:ring-1 hover:ring-violet-500/40 transition-all group cursor-pointer"
    onClick={onClick}
  >
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-xl bg-violet-500/10 shrink-0 mt-0.5">
        <FileText className="w-4 h-4 text-violet-500" />
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-violet-400 transition-colors">
          {record.title}
        </h3>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className={`text-[10px] ${getTypeColor(record.type)}`}>
            {record.type}
          </Badge>
          {record.accessLevel === 'public' && (
            <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30 bg-emerald-500/10">
              Public
            </Badge>
          )}
        </div>

        {record.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{record.description}</p>
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
              <span className="truncate max-w-[160px]">{record.creator}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
export const NationalArchivesSection = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ArchiveResults | null>(null);
  const [isFeatured, setIsFeatured] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ArchiveRecord | null>(null);

  const loadFeatured = async () => {
    setLoading(true);
    setSelectedRecord(null);
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
    setSelectedRecord(null);
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

  // Detail view
  if (selectedRecord) {
    return (
      <RecordDetail
        record={selectedRecord}
        onBack={() => setSelectedRecord(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="tech-card border-0 p-5 flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-violet-500/10 shrink-0">
          <Landmark className="w-6 h-6 text-violet-500" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold">National Archives Repository</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Search millions of historical records from the U.S. National Archives
          </p>
        </div>
        <Badge variant="secondary" className="text-[10px] shrink-0">Live</Badge>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search records, documents, collections..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 tech-card border-0"
          />
        </div>
        <Button type="submit" disabled={loading || !query.trim()}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
        </Button>
        <Button type="button" variant="outline" onClick={loadFeatured} disabled={loading} className="gap-1.5">
          <Star className="w-4 h-4" />
          Featured
        </Button>
      </form>

      {/* Loading */}
      {loading && (
        <div className="tech-card border-0 flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            <p className="text-sm text-muted-foreground">Searching the National Archives...</p>
          </div>
        </div>
      )}

      {/* Results */}
      {results && !loading && (
        <>
          <div className="flex items-center justify-between px-1">
            <p className="text-sm text-muted-foreground">
              {isFeatured ? (
                <span className="font-medium text-foreground">Featured Collections</span>
              ) : (
                <>
                  <span className="font-medium text-foreground">{results.records.length}</span>
                  {' '}of{' '}
                  <span className="font-medium text-foreground">{results.total.toLocaleString()}</span>
                  {' '}results for "
                  <span className="font-medium text-foreground">{results.query}</span>"
                </>
              )}
            </p>
            <p className="text-xs text-muted-foreground">Click any card to view details</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {results.records.map((record) => (
              <RecordCard
                key={record.id}
                record={record}
                onClick={() => setSelectedRecord(record)}
              />
            ))}
          </div>
        </>
      )}

      {!results && !loading && (
        <div className="tech-card border-0 text-center py-16 text-muted-foreground">
          <Landmark className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>Search millions of historical records from the National Archives</p>
        </div>
      )}
    </div>
  );
};
