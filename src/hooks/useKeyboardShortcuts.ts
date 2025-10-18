import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: (e: KeyboardEvent) => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled: boolean = true) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts if user is typing in an input/textarea
    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
    
    for (const shortcut of shortcuts) {
      const keyMatches = e.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatches = shortcut.ctrl === undefined || shortcut.ctrl === (e.ctrlKey || e.metaKey);
      const shiftMatches = shortcut.shift === undefined || shortcut.shift === e.shiftKey;
      const altMatches = shortcut.alt === undefined || shortcut.alt === e.altKey;
      const metaMatches = shortcut.meta === undefined || shortcut.meta === e.metaKey;

      if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
        // Allow some shortcuts even in inputs (like Ctrl+S for save)
        const allowedInInput = ['s', 'f', 'z', 'y'].includes(shortcut.key.toLowerCase()) && shortcut.ctrl;
        
        if (!isInput || allowedInInput) {
          e.preventDefault();
          shortcut.handler(e);
        }
        break;
      }
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
