import { useEffect, useRef } from 'react';
import { FabricCanvasManager } from '@/lib/pdf/FabricCanvasManager';
import { usePDFEditorStore } from '@/stores/pdfEditorStore';

interface PDFFabricCanvasProps {
  width: number;
  height: number;
  onManagerReady: (manager: FabricCanvasManager) => void;
}

export const PDFFabricCanvas = ({ width, height, onManagerReady }: PDFFabricCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const managerRef = useRef<FabricCanvasManager | null>(null);
  const activeTool = usePDFEditorStore((state) => state.activeTool);

  // Initialize Fabric canvas
  useEffect(() => {
    if (!canvasRef.current || width === 0 || height === 0) return;

    const manager = new FabricCanvasManager(canvasRef.current, width, height);
    managerRef.current = manager;
    onManagerReady(manager);

    return () => {
      manager.dispose();
      managerRef.current = null;
    };
  }, [width, height, onManagerReady]);

  // Update tool when it changes
  useEffect(() => {
    if (managerRef.current) {
      managerRef.current.setTool(activeTool);
    }
  }, [activeTool]);

  // Update dimensions when they change
  useEffect(() => {
    if (managerRef.current && width > 0 && height > 0) {
      managerRef.current.setDimensions(width, height);
    }
  }, [width, height]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && managerRef.current) {
        managerRef.current.deleteSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-auto">
      <canvas ref={canvasRef} />
    </div>
  );
};
