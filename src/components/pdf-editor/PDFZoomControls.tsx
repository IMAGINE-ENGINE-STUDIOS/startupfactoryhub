import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize, Minimize } from 'lucide-react';
import { usePDFEditorStore } from '@/stores/pdfEditorStore';
import { toast } from 'sonner';

interface PDFZoomControlsProps {
  canvasWidth: number;
  canvasHeight: number;
  containerWidth?: number;
}

export const PDFZoomControls = ({ canvasWidth, canvasHeight, containerWidth = 800 }: PDFZoomControlsProps) => {
  const { zoom, setZoom } = usePDFEditorStore();

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 0.25, 3);
    setZoom(newZoom);
    toast.info(`Zoom: ${Math.round(newZoom * 100)}%`);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 0.25, 0.25);
    setZoom(newZoom);
    toast.info(`Zoom: ${Math.round(newZoom * 100)}%`);
  };

  const handleFitWidth = () => {
    if (canvasWidth > 0) {
      const newZoom = containerWidth / canvasWidth;
      setZoom(Math.min(newZoom, 3));
      toast.info('Fit to width');
    }
  };

  const handleFitPage = () => {
    setZoom(1);
    toast.info('Actual size');
  };

  return (
    <div className="flex items-center gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-2 rounded-lg border shadow-sm">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleZoomOut}
        disabled={zoom <= 0.25}
        title="Zoom Out"
        className="h-8 w-8 p-0"
      >
        <ZoomOut className="w-4 h-4" />
      </Button>

      <span className="text-sm font-medium min-w-[60px] text-center">
        {Math.round(zoom * 100)}%
      </span>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleZoomIn}
        disabled={zoom >= 3}
        title="Zoom In"
        className="h-8 w-8 p-0"
      >
        <ZoomIn className="w-4 h-4" />
      </Button>

      <div className="w-px h-6 bg-border" />

      <Button
        variant="ghost"
        size="sm"
        onClick={handleFitWidth}
        title="Fit to Width"
        className="h-8 w-8 p-0"
      >
        <Maximize className="w-4 h-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleFitPage}
        title="Actual Size"
        className="h-8 w-8 p-0"
      >
        <Minimize className="w-4 h-4" />
      </Button>
    </div>
  );
};
