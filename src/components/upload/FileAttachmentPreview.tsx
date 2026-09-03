import { useEffect, useState } from 'react';
import '@google/model-viewer';
import {
  FileText, FileSpreadsheet, FileJson, FileCode2, FileArchive, FileType,
  Presentation, Box, Music, Download, ExternalLink, File as FileIcon,
  Eye, EyeOff, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getFileKind, isARModel, KIND_LABEL, formatBytes, type FileKind } from '@/lib/upload/fileKinds';
import { cn } from '@/lib/utils';

const ICONS: Record<FileKind, typeof FileIcon> = {
  image: FileIcon,
  video: FileIcon,
  audio: Music,
  model3d: Box,
  pdf: FileText,
  document: FileText,
  spreadsheet: FileSpreadsheet,
  presentation: Presentation,
  data: FileJson,
  code: FileCode2,
  archive: FileArchive,
  font: FileType,
  other: FileIcon,
};

/** Kinds we can render inline in the feed without leaving the page. */
const IFRAME_PREVIEW: FileKind[] = ['pdf'];
const TEXT_PREVIEW: FileKind[] = ['data', 'code'];
/** Text-ish document extensions that can be shown as plain text. */
const TEXT_DOC_EXTENSIONS = ['txt', 'md', 'csv', 'tsv', 'rtf'];

interface FileAttachmentPreviewProps {
  url: string;
  name?: string;
  size?: number;
  mimeType?: string;
  className?: string;
  /** Compact mode used inside the composer preview grid */
  compact?: boolean;
}

/**
 * Renders any uploaded file: images, video, audio, 3D models (Google model-viewer /
 * Scene Viewer / AR Quick Look) and every document/data format as a rich file card
 * with an inline preview and a true download action.
 */
export function FileAttachmentPreview({
  url, name, size, mimeType, className, compact = false,
}: FileAttachmentPreviewProps) {
  const [failed, setFailed] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [textPreview, setTextPreview] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const label = name || decodeURIComponent(url.split('/').pop() || 'file');
  const kind = getFileKind(name || url, mimeType);
  const Icon = ICONS[kind];
  const extension = label.split('.').pop()?.toLowerCase() || '';
  const canIframePreview = IFRAME_PREVIEW.includes(kind);
  const canTextPreview =
    TEXT_PREVIEW.includes(kind) || (kind === 'document' && TEXT_DOC_EXTENSIONS.includes(extension));
  const canPreview = canIframePreview || canTextPreview;

  // Fetch a short text excerpt only when the user opens the preview.
  useEffect(() => {
    if (!showPreview || !canTextPreview || textPreview !== null) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(url);
        const raw = await res.text();
        if (!cancelled) setTextPreview(raw.slice(0, 5000));
      } catch {
        if (!cancelled) setTextPreview('Preview unavailable — download the file to view it.');
      }
    })();
    return () => { cancelled = true; };
  }, [showPreview, canTextPreview, textPreview, url]);

  /**
   * Cross-origin Storage URLs ignore the anchor `download` attribute, so the
   * file used to just open in a new tab. Fetching it as a blob forces a real
   * download with the original filename.
   */
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('download failed');
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = label;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      // Fall back to opening the file directly if the blob fetch is blocked.
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setDownloading(false);
    }
  };

  const downloadButton = (
    <Button variant="ghost" size="sm" onClick={handleDownload} aria-label={`Download ${label}`} title="Download">
      {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
    </Button>
  );

  if (kind === 'image' && !failed) {
    return (
      <div className={cn('relative group rounded-lg overflow-hidden', className)}>
        <img
          src={url}
          alt={label}
          loading="lazy"
          onError={() => setFailed(true)}
          className={cn('w-full rounded-lg object-cover', compact ? 'h-24 sm:h-32' : 'max-h-[520px]')}
        />
        {!compact && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="rounded-md bg-background/80 backdrop-blur-sm">{downloadButton}</div>
          </div>
        )}
      </div>
    );
  }

  if (kind === 'video' && !failed) {
    return (
      <div className={cn('space-y-1', className)}>
        <video
          src={url}
          controls={!compact}
          playsInline
          onError={() => setFailed(true)}
          className={cn('w-full rounded-lg bg-black object-cover', compact ? 'h-24 sm:h-32' : 'max-h-[520px]')}
        />
        {!compact && (
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            {downloadButton}
          </div>
        )}
      </div>
    );
  }

  if (kind === 'audio' && !failed) {
    return (
      <div className={cn('tech-card border-0 rounded-lg p-3 space-y-2', className)}>
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
          <Music className="h-4 w-4 text-primary" />
          <span className="truncate flex-1">{label}</span>
          {!compact && downloadButton}
        </div>
        <audio src={url} controls className="w-full" onError={() => setFailed(true)} />
      </div>
    );
  }

  if (kind === 'model3d' && isARModel(url) && !failed) {
    return (
      <div className={cn('relative rounded-lg overflow-hidden tech-card border-0', className)}>
        <model-viewer
          src={url}
          alt={label}
          camera-controls
          auto-rotate
          ar
          ar-modes="webxr scene-viewer quick-look"
          shadow-intensity="1"
          exposure="1"
          style={{ width: '100%', height: compact ? '128px' : '360px', background: 'transparent' }}
        />
        <div className="absolute bottom-1 left-2 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
          3D · AR Ready
        </div>
        {!compact && (
          <div className="absolute top-2 right-2 rounded-md bg-background/80 backdrop-blur-sm">{downloadButton}</div>
        )}
      </div>
    );
  }

  // Generic file card (documents, data, archives, non-AR 3D formats, unknown types)
  return (
    <div className={cn('tech-card border-0 rounded-lg overflow-hidden', className)}>
      <div className="p-3 flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{label}</p>
          <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            {KIND_LABEL[kind]}{size ? ` · ${formatBytes(size)}` : ''}
          </p>
        </div>
        {!compact && (
          <div className="flex gap-1">
            {canPreview && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview((v) => !v)}
                aria-label={showPreview ? 'Hide preview' : 'Show preview'}
                title={showPreview ? 'Hide preview' : 'Preview'}
              >
                {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            )}
            <Button asChild variant="ghost" size="sm">
              <a href={url} target="_blank" rel="noopener noreferrer" aria-label="Open file in a new tab" title="Open">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            {downloadButton}
          </div>
        )}
      </div>

      {!compact && showPreview && canIframePreview && (
        <iframe
          src={url}
          title={`Preview of ${label}`}
          className="w-full h-[420px] border-t border-border bg-background"
        />
      )}

      {!compact && showPreview && canTextPreview && (
        <pre className="max-h-72 overflow-auto border-t border-border bg-muted/30 p-3 text-xs whitespace-pre-wrap break-words">
          {textPreview ?? 'Loading preview…'}
        </pre>
      )}
    </div>
  );
}

export default FileAttachmentPreview;
