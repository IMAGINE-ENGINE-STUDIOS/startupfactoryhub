import { prepareImageForUpload } from '@/lib/upload/prepareImage';
import { useCallback, useRef, useState } from 'react';
import { Upload, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatBytes, getFileKind, resolveContentType } from '@/lib/upload/fileKinds';
import { FileAttachmentPreview } from './FileAttachmentPreview';

export interface UploadedFile {
  url: string;
  path: string;
  name: string;
  size: number;
  mimeType: string;
  kind: string;
}

interface UploadItem {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'done' | 'error';
  progress: number;
  error?: string;
  result?: UploadedFile;
}

interface UniversalFileUploaderProps {
  /** Public storage bucket that accepts any mime type. */
  bucket?: string;
  /** Optional sub-folder appended after the user id folder. */
  folder?: string;
  maxFiles?: number;
  /** Max size per file, in MB. */
  maxSizeMB?: number;
  onUploaded?: (files: UploadedFile[]) => void;
  onRemoved?: (file: UploadedFile) => void;
  className?: string;
  compact?: boolean;
}

const DEFAULT_BUCKET = 'resource-assets';

/**
 * Solid, universal file uploader.
 * Supports every file type: images, video, audio, 3D models (glb/gltf/usdz readable by
 * Google model-viewer + AR), documents (docx, pdf, pptx), data (csv, json, xml, usda)
 * and anything else. Drag & drop, multi-file, per-file progress, retry-safe removal.
 */
export function UniversalFileUploader({
  bucket = DEFAULT_BUCKET,
  folder,
  maxFiles = 10,
  maxSizeMB = 500,
  onUploaded,
  onRemoved,
  className,
  compact = false,
}: UniversalFileUploaderProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);

  const uploadOne = useCallback(
    async (item: UploadItem, userId: string) => {
      const update = (patch: Partial<UploadItem>) =>
        setItems(prev => prev.map(i => (i.id === item.id ? { ...i, ...patch } : i)));

      update({ status: 'uploading', progress: 10 });
      const tick = setInterval(
        () => setItems(prev => prev.map(i => (i.id === item.id && i.status === 'uploading' ? { ...i, progress: Math.min(i.progress + 7, 92) } : i))),
        400,
      );

      try {
        item = { ...item, file: await prepareImageForUpload(item.file) };
        const safeName = item.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = [userId, folder, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`]
          .filter(Boolean)
          .join('/');

        const { error } = await supabase.storage.from(bucket).upload(path, item.file, {
          cacheControl: '3600',
          upsert: false,
          contentType: resolveContentType(item.file),
        });
        if (error) throw error;

        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        const result: UploadedFile = {
          url: data.publicUrl,
          path,
          name: item.file.name,
          size: item.file.size,
          mimeType: resolveContentType(item.file),
          kind: getFileKind(item.file.name, item.file.type),
        };
        clearInterval(tick);
        update({ status: 'done', progress: 100, result });
        return result;
      } catch (e: any) {
        clearInterval(tick);
        update({ status: 'error', progress: 0, error: e?.message || 'Upload failed' });
        return null;
      }
    },
    [bucket, folder],
  );

  const handleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      if (!files.length) return;

      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        toast({ title: 'Sign in required', description: 'Please sign in to upload files.', variant: 'destructive' });
        return;
      }

      const remaining = maxFiles - items.length;
      if (remaining <= 0) {
        toast({ title: 'Limit reached', description: `Maximum ${maxFiles} files.`, variant: 'destructive' });
        return;
      }

      const accepted: UploadItem[] = [];
      for (const file of files.slice(0, remaining)) {
        if (file.size > maxSizeMB * 1024 * 1024) {
          toast({
            title: 'File too large',
            description: `${file.name} is ${formatBytes(file.size)} — max ${maxSizeMB}MB.`,
            variant: 'destructive',
          });
          continue;
        }
        accepted.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          status: 'pending',
          progress: 0,
        });
      }
      if (!accepted.length) return;

      setItems(prev => [...prev, ...accepted]);
      const results = await Promise.all(accepted.map(i => uploadOne(i, auth.user!.id)));
      const ok = results.filter(Boolean) as UploadedFile[];
      if (ok.length) onUploaded?.(ok);
    },
    [items.length, maxFiles, maxSizeMB, onUploaded, toast, uploadOne],
  );

  const remove = useCallback(
    async (item: UploadItem) => {
      setItems(prev => prev.filter(i => i.id !== item.id));
      if (item.result) {
        onRemoved?.(item.result);
        await supabase.storage.from(bucket).remove([item.result.path]);
      }
    },
    [bucket, onRemoved],
  );

  return (
    <div className={cn('space-y-3', className)}>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={e => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        onDragOver={e => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          'rounded-xl border border-dashed border-primary/30 bg-background/40 backdrop-blur-xl text-center cursor-pointer transition-colors',
          dragging ? 'border-primary bg-primary/10' : 'hover:border-primary/60',
          compact ? 'p-4' : 'p-6',
        )}
      >
        <Upload className={cn('mx-auto text-primary', compact ? 'h-5 w-5' : 'h-7 w-7')} />
        <p className={cn('mt-2 font-medium', compact ? 'text-sm' : 'text-base')}>
          Drag & drop files or click to browse
        </p>
        <p className="mt-1 text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
          Images · Video · Audio · 3D (GLB/GLTF/USDZ/USDA) · DOCX · PDF · CSV · JSON · Any file
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Up to {maxFiles} files · {maxSizeMB}MB each
        </p>
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {items.map(item => (
            <div key={item.id} className="relative tech-card border-0 rounded-lg p-2 space-y-2">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  {item.status === 'done' && item.result ? (
                    <FileAttachmentPreview
                      url={item.result.url}
                      name={item.result.name}
                      size={item.result.size}
                      mimeType={item.result.mimeType}
                      compact
                    />
                  ) : (
                    <>
                      <p className="text-sm truncate">{item.file.name}</p>
                      <p className="text-[11px] text-muted-foreground">{formatBytes(item.file.size)}</p>
                    </>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 shrink-0"
                  onClick={() => remove(item)}
                  aria-label={`Remove ${item.file.name}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {item.status === 'uploading' && (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <Progress value={item.progress} className="h-1.5 flex-1" />
                </div>
              )}
              {item.status === 'done' && (
                <p className="flex items-center gap-1 text-[11px] text-primary">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Uploaded
                </p>
              )}
              {item.status === 'error' && (
                <p className="flex items-center gap-1 text-[11px] text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" /> {item.error}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UniversalFileUploader;
