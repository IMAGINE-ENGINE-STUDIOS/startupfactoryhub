import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PDFCollaborationCursor } from '@/types/pdf-editor';
import { MousePointer2 } from 'lucide-react';

interface LiveCursorsProps {
  cursors: PDFCollaborationCursor[];
  containerRef: React.RefObject<HTMLDivElement>;
}

export function LiveCursors({ cursors, containerRef }: LiveCursorsProps) {
  const cursorRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    cursors.forEach((cursor) => {
      const cursorEl = cursorRefs.current.get(cursor.id);
      if (cursorEl) {
        const x = cursor.position.x;
        const y = cursor.position.y;
        
        cursorEl.style.transform = `translate(${x}px, ${y}px)`;
      }
    });
  }, [cursors, containerRef]);

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {cursors.map((cursor) => (
          <motion.div
            key={cursor.id}
            ref={(el) => {
              if (el) {
                cursorRefs.current.set(cursor.id, el);
              } else {
                cursorRefs.current.delete(cursor.id);
              }
            }}
            className="absolute"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <div className="relative">
              <MousePointer2
                className="w-5 h-5"
                style={{ color: cursor.user_color }}
                fill={cursor.user_color}
              />
              <div
                className="absolute top-6 left-2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap shadow-lg"
                style={{
                  backgroundColor: cursor.user_color,
                  color: 'white',
                }}
              >
                {cursor.user_name}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
