import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface Props {
  text: string;
  /** ms per character */
  speed?: number;
  /** delay before typing starts */
  startDelay?: number;
  className?: string;
  cursorClassName?: string;
  /** Show blinking caret while typing */
  showCursor?: boolean;
  /** Called once typing finishes */
  onDone?: () => void;
}

/**
 * Streams text character-by-character. Once a given `text` has finished
 * streaming it is cached so re-renders don't re-type the same content.
 */
export default function TypewriterText({
  text,
  speed = 18,
  startDelay = 0,
  className,
  cursorClassName,
  showCursor = true,
  onDone,
}: Props) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const completedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // If we've already streamed this exact text before, render instantly.
    if (completedRef.current.has(text)) {
      setDisplayed(text);
      setDone(true);
      return;
    }

    setDisplayed("");
    setDone(false);

    let i = 0;
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const startTimer = setTimeout(() => {
      if (cancelled) return;
      intervalId = setInterval(() => {
        i += 1;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          if (intervalId) clearInterval(intervalId);
          completedRef.current.add(text);
          setDone(true);
          onDone?.();
        }
      }, speed);
    }, startDelay);

    return () => {
      cancelled = true;
      clearTimeout(startTimer);
      if (intervalId) clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speed, startDelay]);

  return (
    <span className={className}>
      {displayed}
      {showCursor && !done && (
        <span
          className={cn(
            "inline-block w-[0.55em] h-[1em] -mb-[2px] ml-[1px] bg-current align-middle animate-pulse",
            cursorClassName
          )}
        />
      )}
    </span>
  );
}
