import { useState, useEffect, useCallback } from 'react';
import {
  Landmark, Search, FileText, Calendar,
  Building2, Loader2, Star, ArrowLeft, Tag, Globe, Info,
  ChevronLeft, ChevronRight, ZoomIn, X, Image as ImageIcon, ScrollText
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────────────────────
interface DigitalObject {
  id: string;
  thumbnailUrl: string | null;
  objectUrl: string | null;
  objectType: string;
  title: string | null;
}

interface ArchiveRecord {
  id: string;
  naId: string;
  title: string;
  type: string;
  date: string | null;
  creator: string | null;
  description: string | null;
  series?: string | null;
  accessLevel: string;
  thumbnailUrl?: string | null;
  digitalObjects: DigitalObject[];
  url: string;
  scopeAndContentNote?: string | null;
  arrangementNote?: string | null;
  accessRestriction?: string | null;
  useRestriction?: string | null;
  levelOfDescription?: string | null;
}

interface Transcription {
  id: string;
  text: string;
  contributor: string | null;
  status: string;
}

interface ArchiveResults {
  type: string;
  query: string;
  total: number;
  records: ArchiveRecord[];
}

interface FullRecordData {
  type: 'record';
  record: ArchiveRecord | null;
  transcriptions: Transcription[];
  children?: ArchiveRecord[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const TYPE_COLORS: Record<string, string> = {
  'Founding Documents': 'text-amber-500 border-amber-500/30 bg-amber-500/10',
  'Military Records': 'text-red-500 border-red-500/30 bg-red-500/10',
  'Land Records': 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10',
  'Scientific Records': 'text-blue-500 border-blue-500/30 bg-blue-500/10',
  'Immigration Records': 'text-purple-500 border-purple-500/30 bg-purple-500/10',
  'Featured Collection': 'text-amber-500 border-amber-500/30 bg-amber-500/10',
};
const getTypeColor = (type: string) =>
  TYPE_COLORS[type] || 'text-violet-500 border-violet-500/30 bg-violet-500/10';

// ── ImageLightbox ─────────────────────────────────────────────────────────────
const ImageLightbox = ({
  objects,
  initialIndex,
  onClose,
}: {
  objects: DigitalObject[];
  initialIndex: number;
  onClose: () => void;
}) => {
  const [idx, setIdx] = useState(initialIndex);
  const current = objects[idx];

  const prev = useCallback(() => setIdx(i => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIdx(i => Math.min(objects.length - 1, i + 1)), [objects.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prev, next, onClose]);

  const imgSrc = current?.objectUrl || current?.thumbnailUrl || '';

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full p-2 bg-background border-border">
        <div className="relative flex flex-col items-center gap-3">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-background/80 hover:bg-accent/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Image */}
          <div className="w-full max-h-[75vh] flex items-center justify-center bg-foreground/5 rounded-xl overflow-hidden">
            {imgSrc ? (
              <img
                src={imgSrc}
                alt={current?.title || 'Archive document'}
                className="max-w-full max-h-[75vh] object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 py-20 text-muted-foreground">
                <ImageIcon className="w-10 h-10 opacity-30" />
                <p className="text-sm">Image not available</p>
              </div>
            )}
          </div>

          {/* Caption & nav */}
          <div className="flex items-center gap-3 w-full justify-between px-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prev}
              disabled={idx === 0}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </Button>

            <div className="text-center">
              {current?.title && (
                <p className="text-xs text-muted-foreground line-clamp-1">{current.title}</p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                {idx + 1} / {objects.length}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={next}
              disabled={idx === objects.length - 1}
              className="gap-1"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ── DigitalGallery ────────────────────────────────────────────────────────────
const DigitalGallery = ({ objects }: { objects: DigitalObject[] }) => {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const PER_PAGE = 9;
  const paged = objects.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(objects.length / PER_PAGE);

  if (!objects.length) return null;

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
        <ImageIcon className="w-3.5 h-3.5" />
        Digital Objects ({objects.length})
      </p>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {paged.map((obj, i) => {
          const globalIdx = page * PER_PAGE + i;
          return (
            <div
              key={obj.id || i}
              className="relative group cursor-pointer rounded-xl overflow-hidden bg-muted/30 border border-border/30 hover:border-violet-500/40 hover:ring-1 hover:ring-violet-500/30 transition-all aspect-square"
              onClick={() => setLightboxIdx(globalIdx)}
            >
              {obj.thumbnailUrl ? (
                <img
                  src={obj.thumbnailUrl}
                  alt={obj.title || 'Document image'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-muted-foreground/40" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="gap-1 text-xs"
          >
            <ChevronLeft className="w-3 h-3" /> Prev
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="gap-1 text-xs"
          >
            Next <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      )}

      {lightboxIdx !== null && (
        <ImageLightbox
          objects={objects}
          initialIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </div>
  );
};

// ── RecordDetail ──────────────────────────────────────────────────────────────
const RecordDetail = ({
  record,
  onBack,
}: {
  record: ArchiveRecord;
  onBack: () => void;
}) => {
  const [fullData, setFullData] = useState<FullRecordData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('national-archives', {
          body: { type: 'record', naId: record.naId || record.id },
        });
        if (error) throw error;
        setFullData(data);
      } catch (err: any) {
        console.warn('Full record fetch failed, using preview data:', err.message);
        setFullData({
          type: 'record',
          record,
          transcriptions: [],
          children: [],
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [record.id, record.naId]);

  const displayRecord = fullData?.record || record;
  const allDigitalObjects = displayRecord.digitalObjects || [];
  const transcriptions = fullData?.transcriptions || [];

  return (
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

      {loading ? (
        <div className="tech-card border-0 flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-violet-500" />
            <p className="text-sm text-muted-foreground">Loading full record...</p>
          </div>
        </div>
      ) : (
        <div className="tech-card border-0 p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-violet-500/10 shrink-0">
              <Landmark className="w-7 h-7 text-violet-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold leading-tight mb-2">{displayRecord.title}</h2>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={`text-xs ${getTypeColor(displayRecord.type)}`}>
                  <Tag className="w-3 h-3 mr-1" />
                  {displayRecord.type}
                </Badge>
                <Badge variant="outline" className="text-xs text-emerald-500 border-emerald-500/30 bg-emerald-500/10">
                  <Globe className="w-3 h-3 mr-1" />
                  {displayRecord.accessLevel === 'public' ? 'Public Access' : displayRecord.accessLevel}
                </Badge>
              </div>
              {/* Attribution — no redirect */}
              <p className="text-[10px] text-muted-foreground mt-2">
                Source: catalog.archives.gov · Record ID: {displayRecord.id}
              </p>
            </div>
          </div>

          <div className="border-t border-border/40" />

          {/* Meta grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {displayRecord.date && (
              <div className="tech-card border-0 p-4 rounded-xl space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Date / Coverage
                </p>
                <p className="text-sm font-semibold">{displayRecord.date}</p>
              </div>
            )}
            {displayRecord.creator && (
              <div className="tech-card border-0 p-4 rounded-xl space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> Creator / Organization
                </p>
                <p className="text-sm font-semibold">{displayRecord.creator}</p>
              </div>
            )}
            {displayRecord.series && (
              <div className="tech-card border-0 p-4 rounded-xl space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Series
                </p>
                <p className="text-sm font-semibold">{displayRecord.series}</p>
              </div>
            )}
            {displayRecord.accessRestriction && (
              <div className="tech-card border-0 p-4 rounded-xl space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="w-3 h-3" /> Access Restriction
                </p>
                <p className="text-sm font-semibold">{displayRecord.accessRestriction}</p>
              </div>
            )}
          </div>

          {/* Description / Scope Note */}
          {(displayRecord.scopeAndContentNote || displayRecord.description) && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Scope & Content
              </p>
              <div className="tech-card border-0 p-4 rounded-xl">
                <p className="text-sm leading-relaxed text-foreground/90">
                  {displayRecord.scopeAndContentNote || displayRecord.description}
                </p>
              </div>
            </div>
          )}

          {/* Arrangement Note */}
          {displayRecord.arrangementNote && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Arrangement
              </p>
              <div className="tech-card border-0 p-4 rounded-xl">
                <p className="text-sm leading-relaxed text-foreground/90">{displayRecord.arrangementNote}</p>
              </div>
            </div>
          )}

          {/* Digital Objects Gallery */}
          {allDigitalObjects.length > 0 && (
            <DigitalGallery objects={allDigitalObjects} />
          )}

          {/* No digital objects message */}
          {allDigitalObjects.length === 0 && !loading && (
            <div className="tech-card border-0 p-4 rounded-xl flex items-center gap-3 text-muted-foreground">
              <ImageIcon className="w-5 h-5 opacity-40 shrink-0" />
              <p className="text-xs">No digital images available for this record in the National Archives catalog.</p>
            </div>
          )}

          {/* Transcriptions */}
          {transcriptions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <ScrollText className="w-3.5 h-3.5" />
                Transcription{transcriptions.length > 1 ? 's' : ''} ({transcriptions.length})
              </p>
              {transcriptions.map((t, i) => (
                <div key={t.id || i} className="tech-card border-0 p-4 rounded-xl space-y-2">
                  <ScrollArea className="h-48">
                    <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap pr-3">{t.text}</p>
                  </ScrollArea>
                  {t.contributor && (
                    <p className="text-[10px] text-muted-foreground">
                      Contributed by: {t.contributor} · Status: {t.status}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Child records intentionally not displayed */}
        </div>
      )}
    </div>
  );
};

// ── RecordCard ────────────────────────────────────────────────────────────────
const RecordCard = ({
  record,
  onClick,
}: {
  record: ArchiveRecord;
  onClick: () => void;
}) => (
  <div
    className="tech-card border-0 hover:ring-1 hover:ring-violet-500/40 transition-all group cursor-pointer overflow-hidden"
    onClick={onClick}
  >
    {/* Thumbnail strip */}
    {record.thumbnailUrl && (
      <div className="h-28 overflow-hidden bg-muted/20">
        <img
          src={record.thumbnailUrl}
          alt={record.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).parentElement!.style.display = 'none';
          }}
        />
      </div>
    )}

    <div className="p-4 flex items-start gap-3">
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
          {record.digitalObjects?.length > 0 && (
            <Badge variant="outline" className="text-[10px] text-blue-500 border-blue-500/30 bg-blue-500/10">
              <ImageIcon className="w-2.5 h-2.5 mr-0.5" />
              {record.digitalObjects.length} image{record.digitalObjects.length !== 1 ? 's' : ''}
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
            Search millions of historical records — view documents, images & transcriptions in-app
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
            <p className="text-xs text-muted-foreground">Click any card to view content</p>
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
