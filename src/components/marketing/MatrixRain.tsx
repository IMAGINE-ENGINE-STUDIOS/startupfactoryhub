import { useEffect, useRef } from 'react';

interface MatrixRainProps {
  className?: string;
  density?: number; // columns
  speed?: number;   // px per frame
  opacity?: number; // 0..1 master opacity
}

/**
 * Matrix rain background canvas — emerald palette, Courier font.
 * Used as a decorative overlay behind hero content.
 */
const MatrixRain = ({
  className,
  density = 70,
  speed = 1.2,
  opacity = 0.55,
}: MatrixRainProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ';

    let W = 0;
    let H = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let drops: number[] = [];
    const fontSize = 16;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      const cols = Math.max(20, Math.floor(W / (W / density)));
      drops = new Array(cols).fill(0).map(() => Math.random() * H);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const render = () => {
      // fade trail
      ctx.fillStyle = 'rgba(0, 8, 6, 0.12)';
      ctx.fillRect(0, 0, W, H);

      ctx.font = `${fontSize}px "Courier New", monospace`;

      const colWidth = W / drops.length;
      for (let i = 0; i < drops.length; i++) {
        const x = i * colWidth + Math.random() * 4;
        const y = drops[i];
        const ch = chars[Math.floor(Math.random() * chars.length)];

        // bright leading char
        ctx.fillStyle = `rgba(180, 255, 220, ${0.85 * opacity})`;
        ctx.fillText(ch, x, y);

        // trailing
        ctx.fillStyle = `rgba(34, 197, 94, ${0.55 * opacity})`;
        ctx.fillText(ch, x, y - fontSize);

        if (y > H && Math.random() > 0.975) {
          drops[i] = 0;
        } else {
          drops[i] = y + fontSize * speed * 0.5;
        }
      }
      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [density, speed, opacity]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
    />
  );
};

export default MatrixRain;
