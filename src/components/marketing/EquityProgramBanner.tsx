/** Copyright Imagine Engine Studios Corp. All rights reserved. */
import { useEffect, useRef, useState } from 'react';
import { Download, Film, Loader2, Pause, Play } from 'lucide-react';
import GIF from 'gif.js';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { createEquityBannerRenderer } from './equityBannerRenderer';

export default function EquityProgramBanner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderRef = useRef<Awaited<ReturnType<typeof createEquityBannerRenderer>>>();
  const encoderRef = useRef<GIF>();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [paused, setPaused] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [progress, setProgress] = useState<number | null>(null);
  const pausedRef = useRef(paused);
  const exportingRef = useRef(false);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let frame = 0;
    let visible = true;
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    observer.observe(canvas);
    createEquityBannerRenderer(canvas).then((renderer) => {
      if (disposed) { renderer.dispose(); return; }
      renderRef.current = renderer;
      renderer.draw(0);
      setReady(true);
      let last = 0;
      let time = 0;
      const animate = (now: number) => {
        if (disposed) return;
        if (visible && !document.hidden && !pausedRef.current && !exportingRef.current && now - last >= 50) {
          time += 0.05;
          renderer.draw(time);
          last = now;
        }
        frame = requestAnimationFrame(animate);
      };
      frame = requestAnimationFrame(animate);
    }).catch(() => { if (!disposed) setError(true); });
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      encoderRef.current?.abort();
      renderRef.current?.dispose();
      renderRef.current = undefined;
    };
  }, []);

  const download = (blob: Blob, extension: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sfh-equity-program.${extension}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };
  const downloadJpg = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) download(blob, 'jpg');
      else toast.error('Could not export the JPG. Please try again.');
    }, 'image/jpeg', 0.95);
  };
  const downloadGif = async () => {
    const canvas = canvasRef.current;
    const renderer = renderRef.current;
    if (!canvas || !renderer || exportingRef.current) return;
    exportingRef.current = true;
    setProgress(0);
    const gif = new GIF({ workers: 2, quality: 10, width: 1200, height: 630, workerScript: '/gif.worker.js', repeat: 0 });
    encoderRef.current = gif;
    const reset = () => { exportingRef.current = false; setProgress(null); encoderRef.current = undefined; };
    gif.on('progress', (value: number) => setProgress(Math.round(20 + value * 80)));
    gif.on('finished', (blob: Blob) => { download(blob, 'gif'); reset(); });
    gif.on('abort', reset);
    try {
      for (let index = 0; index < 60; index++) {
        if (encoderRef.current !== gif) return;
        renderer.draw(index / 10);
        gif.addFrame(canvas, { copy: true, delay: 100 });
        if (index % 6 === 0) {
          setProgress(Math.round(index / 60 * 20));
          await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        }
      }
      gif.render();
    } catch {
      gif.abort(); reset();
      toast.error('Could not export the GIF. Please try again.');
    }
  };

  return (
    <section aria-labelledby="equity-banner-title" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 id="equity-banner-title" className="text-xl font-semibold text-foreground">Equity Program</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="icon" disabled={!ready || progress !== null} onClick={() => setPaused(!paused)} title={paused ? 'Play rover animation' : 'Pause rover animation'} aria-label={paused ? 'Play rover animation' : 'Pause rover animation'}>
            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" className="gap-2" disabled={!ready || progress !== null} onClick={downloadJpg}><Download className="h-4 w-4" />Download JPG</Button>
          <Button variant="default" size="sm" className="gap-2" disabled={!ready || progress !== null} onClick={downloadGif}>
            {progress !== null ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}
            {progress !== null ? `Creating GIF ${progress}%` : 'Download GIF'}
          </Button>
        </div>
      </div>
      <div className="relative aspect-[1200/630] overflow-hidden rounded-lg border border-border">
        <canvas ref={canvasRef} className="block h-auto w-full" role="img" aria-label="Startup Factory Hub Equity Program: from idea to investable company, 1–10% equity, with a rotating Perseverance rover. startupfactoryhub.com/equity-program" />
        {!ready && <div className="absolute inset-0 flex items-center justify-center bg-background text-muted-foreground" role="status">{error ? 'The rover could not load. Please reload to try again.' : <Loader2 className="h-7 w-7 animate-spin" aria-label="Loading equity banner" />}</div>}
      </div>
    </section>
  );
}