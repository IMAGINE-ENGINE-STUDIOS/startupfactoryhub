/**
 * The Matrix Effect — the signature Startup Factory Hub background.
 *
 * Instead of random glyphs, columns rain short positive words of wisdom.
 * Rendered once, fixed behind the whole app (see App.tsx), and reusable as a
 * local layer through <MatrixBackground /> for individual sections.
 */
import { useEffect, useRef, useState } from "react";

export const WISDOM_WORDS = [
  "BELIEVE", "CREATE", "GROW", "RISE", "DREAM", "BUILD", "FOCUS", "LEARN",
  "COURAGE", "KINDNESS", "PATIENCE", "GRATITUDE", "VISION", "PURPOSE", "HOPE",
  "TRUST", "CLARITY", "BALANCE", "STRENGTH", "WISDOM", "PERSIST", "INSPIRE",
  "IMAGINE", "LEAD", "SHARE", "SERVE", "THRIVE", "EVOLVE", "BEGIN", "ADAPT",
  "HONESTY", "RESPECT", "DISCIPLINE", "CALM", "JOY", "LIGHT", "UNITY",
  "PROGRESS", "MOMENTUM", "RESILIENCE", "CURIOSITY", "GENEROSITY", "HUMILITY",
  "INTEGRITY", "OPTIMISM", "EMPATHY", "CONFIDENCE", "FREEDOM", "PEACE",
  "KEEP GOING", "STAY TRUE", "START NOW", "THINK BIG", "BE BOLD", "DO GOOD",
];

interface MatrixEffectProps {
  /** `fixed` covers the viewport behind the app, `absolute` fills a section. */
  position?: "fixed" | "absolute";
  className?: string;
  /** Layer opacity (0-1). */
  opacity?: number;
}

export default function MatrixEffect({
  position = "fixed",
  className = "",
  opacity = 0.2,
}: MatrixEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDark, setIsDark] = useState(
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const checkTheme = () => setIsDark(document.documentElement.classList.contains("dark"));
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const fontSize = 13;
    const columnWidth = 26;

    type Column = { y: number; speed: number; word: string; charIndex: number };
    let columns: Column[] = [];

    const randomWord = () => WISDOM_WORDS[Math.floor(Math.random() * WISDOM_WORDS.length)];

    const setup = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const count = Math.max(1, Math.floor(canvas.width / columnWidth));
      columns = Array.from({ length: count }, () => ({
        y: Math.random() * -canvas.height,
        speed: 0.6 + Math.random() * 1.1,
        word: randomWord(),
        charIndex: 0,
      }));
    };

    setup();

    const draw = () => {
      if (!ctx) return;
      // Trail fade
      ctx.fillStyle = isDark ? "rgba(0, 0, 0, 0.07)" : "rgba(255, 255, 255, 0.07)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${fontSize}px 'JetBrains Mono', ui-monospace, monospace`;
      ctx.textBaseline = "top";

      columns.forEach((col, i) => {
        const char = col.word[col.charIndex % col.word.length] ?? " ";
        const x = i * columnWidth + 6;
        const y = col.y;

        // Head glows brighter than the trail.
        ctx.fillStyle = isDark ? "hsl(160, 90%, 62%)" : "hsl(160, 65%, 38%)";
        ctx.fillText(char, x, y);

        col.charIndex++;
        col.y += fontSize * col.speed;

        if (col.y > canvas.height + fontSize * col.word.length) {
          col.y = -Math.random() * canvas.height * 0.5;
          col.word = randomWord();
          col.charIndex = 0;
          col.speed = 0.6 + Math.random() * 1.1;
        }
      });
    };

    const interval = reduceMotion ? null : window.setInterval(draw, 60);
    // Reduced motion: paint a static field of wisdom words instead of animating.
    if (reduceMotion) for (let i = 0; i < 80; i++) draw();

    window.addEventListener("resize", setup);
    return () => {
      if (interval) window.clearInterval(interval);
      window.removeEventListener("resize", setup);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`${position} inset-0 w-full h-full ${className}`}
      style={{
        pointerEvents: "none",
        opacity,
        zIndex: position === "fixed" ? 0 : undefined,
      }}
    />
  );
}
