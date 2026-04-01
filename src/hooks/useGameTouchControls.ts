import { useEffect, useRef, useCallback } from "react";

interface TouchControlsOptions {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  keys: Record<string, boolean>;
  enabled: boolean;
  /** Which keys to simulate. Defaults to arrows + space */
  mode?: "4dir" | "horizontal-shoot" | "horizontal-thrust";
}

/**
 * Adds on-screen touch controls to a canvas game.
 * - Prevents page scroll when touching the canvas
 * - Swipe/drag direction maps to arrow keys
 * - Tap maps to space/shoot
 */
export function useGameTouchControls({ canvasRef, keys, enabled, mode = "4dir" }: TouchControlsOptions) {
  const touchStart = useRef<{ x: number; y: number; id: number } | null>(null);
  const isTouching = useRef(false);

  // Prevent scroll on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;

    const preventScroll = (e: TouchEvent) => {
      e.preventDefault();
    };

    canvas.addEventListener("touchstart", preventScroll, { passive: false });
    canvas.addEventListener("touchmove", preventScroll, { passive: false });
    canvas.addEventListener("touchend", preventScroll, { passive: false });

    return () => {
      canvas.removeEventListener("touchstart", preventScroll);
      canvas.removeEventListener("touchmove", preventScroll);
      canvas.removeEventListener("touchend", preventScroll);
    };
  }, [canvasRef, enabled]);

  // Touch direction controls
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;

    const clearKeys = () => {
      keys["ArrowLeft"] = false;
      keys["ArrowRight"] = false;
      keys["ArrowUp"] = false;
      keys["ArrowDown"] = false;
      keys[" "] = false;
    };

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      touchStart.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
        id: touch.identifier,
      };
      isTouching.current = true;

      // For shoot/thrust modes, pressing activates space/shoot immediately
      if (mode === "horizontal-shoot" || mode === "horizontal-thrust") {
        const relX = touch.clientX - rect.left;
        const centerX = rect.width / 2;
        const relY = touch.clientY - rect.top;
        const centerY = rect.height / 2;

        // Top half = shoot/thrust, bottom half = move
        if (relY < centerY * 0.6) {
          keys[" "] = true;
          keys["ArrowUp"] = true;
        } else {
          if (relX < centerX * 0.7) {
            keys["ArrowLeft"] = true;
          } else if (relX > centerX * 1.3) {
            keys["ArrowRight"] = true;
          } else {
            keys[" "] = true;
            keys["ArrowUp"] = true;
          }
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStart.current) return;
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const dx = touch.clientX - rect.left - touchStart.current.x;
      const dy = touch.clientY - rect.top - touchStart.current.y;
      const threshold = 10;

      clearKeys();

      if (mode === "4dir") {
        // Use primary axis
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > threshold) keys["ArrowRight"] = true;
          else if (dx < -threshold) keys["ArrowLeft"] = true;
        } else {
          if (dy > threshold) keys["ArrowDown"] = true;
          else if (dy < -threshold) keys["ArrowUp"] = true;
        }
      } else {
        // Horizontal + shoot/thrust
        if (dx > threshold) keys["ArrowRight"] = true;
        else if (dx < -threshold) keys["ArrowLeft"] = true;

        if (dy < -threshold) {
          keys[" "] = true;
          keys["ArrowUp"] = true;
        }
      }
    };

    const handleTouchEnd = () => {
      clearKeys();
      touchStart.current = null;
      isTouching.current = false;
    };

    canvas.addEventListener("touchstart", handleTouchStart);
    canvas.addEventListener("touchmove", handleTouchMove);
    canvas.addEventListener("touchend", handleTouchEnd);
    canvas.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
      canvas.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [canvasRef, keys, enabled, mode]);
}
