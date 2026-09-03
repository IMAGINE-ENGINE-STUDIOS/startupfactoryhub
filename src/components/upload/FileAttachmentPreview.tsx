import { useState } from 'react';
import '@google/model-viewer';
import {
  FileText, FileSpreadsheet, FileJson, FileCode2, FileArchive, FileType,
  Presentation, Box, Music, Download, ExternalLink, File as FileIcon,
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
 * Scene Viewer / AR Quick Look) and every document/data format as a rich file card.
 */
export function FileAttachmentPreview({
  url, name, size, mimeType, className, compact = false,
}: FileAttachmentPreviewProps) {
  const [failed, setFailed] = useState(false);
  const label = name || decodeURIComponent(url.split('/').pop() || 'file');
  const kind = getFileKind(name || url, mimeType);
  const Icon = ICONS[kind];

  if (kind === 'image' && !failed) {
    return (
      <img
        src={url}
        alt={label}
        loading="lazy"
        onError={() => setFailed(true)}
        className={cn('w-full rounded-lg object-cover', compact ? 'h-24 sm:h-32' : 'max-h-[520px]', className)}
      />
    );
  }

  if (kind === 'video' && !failed) {
    return (
      <video
        src={url}
        controls={!compact}
        playsInline
        onError={() => setFailed(true)}
        className={cn('w-full rounded-lg bg-black object-cover', compact ? 'h-24 sm:h-32' : 'max-h-[520px]', className)}
      />
    );
  }

  if (kind === 'audio' && !failed) {
    return (
      <div className={cn('tech-card border-0 rounded-lg p-3 space-y-2', className)}>
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
          <Music className="h-4 w-4 text-primary" />
          <span className="truncate">{label}</span>
        </div>
        <audio src={url} controls className="w-full" onError={() => setFailed(true)} />
      </div>
    );
  }

  if (kind === 'model3d' && isARModel(url) && !failed) {
    return (
      <div className={cn('relative rounded-lg overflow-hidden tech-card border-0', className)}>
        {/* @ts-expect-error - web component */}
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
      </div>
    );
  }

  // Generic file card (documents, data, archives, non-AR 3D formats, unknown types)
  return (
    <div className={cn('tech-card border-0 rounded-lg p-3 flex items-center gap-3', className)}>
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
          <Button asChild variant="ghost" size="sm">
            <a href={url} target="_blank" rel="noopener noreferrer" aria-label="Open file">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <a href={url} download={label} aria-label="Download file">
              <Download className="h-4 w-4" />
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}

export default FileAttachmentPreview;
