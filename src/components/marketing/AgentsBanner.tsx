import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Image as ImageIcon, Bot } from 'lucide-react';
import { toast } from 'sonner';
import sfhLogoSphere from '@/assets/sfh-logo-sphere.png';
import { AGENTS_TEAM, drawAgentsFrame } from '@/components/marketing/AgentsAnimatedBanner';

// Static twin of the Meet Your Agent Team animated banner — same
// light glass-stage design with the founder's personalized agent
// characters, drawn once at a lively moment for a PNG download.
const AgentsBanner = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendering, setIsRendering] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = 2;
    const W = 1200;
    const H = 630;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const faces = AGENTS_TEAM.map(() => new window.Image());
    const logo = new window.Image();
    let loaded = 0;
    const total = faces.length + 1;
    const ready = () => {
      loaded++;
      if (loaded === total) {
        drawAgentsFrame(ctx, faces, logo, 1.4);
        setIsRendering(false);
      }
    };
    logo.onload = ready;
    logo.src = sfhLogoSphere;
    faces.forEach((img, i) => {
      img.onload = ready;
      img.src = AGENTS_TEAM[i].src;
    });
  }, []);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'agents-team-banner.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success('Banner downloaded');
  };

  return (
    <div className="tech-card border-0 p-6 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-400" />
            Agents — Meet Your Agent Team — Marketing Banner
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            New platform feature · Her personalized agent characters · Create · Customize · Chain · Run
          </p>
        </div>
        <Button onClick={handleDownload} disabled={isRendering} size="sm">
          <Download className="w-4 h-4 mr-2" />
          Download PNG
        </Button>
      </div>

      <div className="relative rounded-lg overflow-hidden border border-border bg-black">
        {isRendering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
            <div className="flex items-center gap-2 text-white text-sm">
              <ImageIcon className="w-4 h-4 animate-pulse" />
              Rendering…
            </div>
          </div>
        )}
        <canvas ref={canvasRef} className="w-full h-auto block" />
      </div>

      <p className="text-xs text-muted-foreground">
        1200×630px · Light glass-stage aesthetic · Optimized for social & email headers
      </p>
    </div>
  );
};

export default AgentsBanner;
