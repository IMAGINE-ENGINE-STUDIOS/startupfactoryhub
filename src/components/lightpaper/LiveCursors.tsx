import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CursorPosition {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  user_color: string;
  position: {
    x: number;
    y: number;
    selection?: { start: number; end: number };
  };
  last_active: string;
}

interface LiveCursorsProps {
  cursors: CursorPosition[];
  containerRef: React.RefObject<HTMLElement>;
}

export function LiveCursors({ cursors, containerRef }: LiveCursorsProps) {
  const cursorsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();

    cursors.forEach((cursor) => {
      const cursorElement = cursorsRef.current.get(cursor.id);
      if (cursorElement) {
        // Adjust cursor position relative to container
        const x = cursor.position.x - containerRect.left;
        const y = cursor.position.y - containerRect.top;
        cursorElement.style.transform = `translate(${x}px, ${y}px)`;
      }
    });
  }, [cursors, containerRef]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <AnimatePresence>
        {cursors.map((cursor) => (
          <motion.div
            key={cursor.id}
            ref={(el) => {
              if (el) cursorsRef.current.set(cursor.id, el);
              else cursorsRef.current.delete(cursor.id);
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute pointer-events-none"
            style={{
              left: 0,
              top: 0,
              transition: "transform 0.1s ease-out",
            }}
          >
            {/* Cursor pointer */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}
            >
              <path
                d="M5 3L19 12L12 13L9 21L5 3Z"
                fill={cursor.user_color}
                stroke="white"
                strokeWidth="1.5"
              />
            </svg>

            {/* User label */}
            <div
              className="absolute left-6 top-0 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap"
              style={{
                backgroundColor: cursor.user_color,
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              }}
            >
              {cursor.user_name}
            </div>

            {/* Selection highlight */}
            {cursor.position.selection && (
              <div
                className="absolute rounded"
                style={{
                  backgroundColor: `${cursor.user_color}30`,
                  border: `2px solid ${cursor.user_color}`,
                  left: cursor.position.selection.start,
                  width: cursor.position.selection.end - cursor.position.selection.start,
                  height: 24,
                  top: 20,
                }}
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
