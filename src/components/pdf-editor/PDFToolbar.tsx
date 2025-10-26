import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  MousePointer2, 
  Type, 
  Square, 
  Circle, 
  Pencil, 
  Eraser,
  Download,
  Upload
} from 'lucide-react';
import { usePDFEditorStore, ToolType } from '@/stores/pdfEditorStore';
import { cn } from '@/lib/utils';

interface PDFToolbarProps {
  onUpload: () => void;
  onExport: () => void;
  isExporting?: boolean;
  hasSession?: boolean;
}

export const PDFToolbar = ({ onUpload, onExport, isExporting = false, hasSession = false }: PDFToolbarProps) => {
  const { activeTool, setActiveTool } = usePDFEditorStore();

  const tools: { type: ToolType; icon: any; label: string }[] = [
    { type: 'select', icon: MousePointer2, label: 'Select' },
    { type: 'text', icon: Type, label: 'Text' },
    { type: 'rectangle', icon: Square, label: 'Rectangle' },
    { type: 'circle', icon: Circle, label: 'Circle' },
    { type: 'draw', icon: Pencil, label: 'Draw' },
    { type: 'erase', icon: Eraser, label: 'Eraser' },
  ];

  return (
    <div className="flex items-center gap-2 p-2 bg-background border-b">
      <Button variant="outline" size="sm" onClick={onUpload}>
        <Upload className="w-4 h-4 mr-2" />
        Upload PDF
      </Button>

      <Separator orientation="vertical" className="h-8" />

      <div className="flex gap-1">
        {tools.map(({ type, icon: Icon, label }) => (
          <Button
            key={type}
            variant={activeTool === type ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTool(type)}
            title={label}
            className={cn(
              'w-9 h-9 p-0',
              activeTool === type && 'bg-primary text-primary-foreground'
            )}
          >
            <Icon className="w-4 h-4" />
          </Button>
        ))}
      </div>

      <Separator orientation="vertical" className="h-8" />

      <Button 
        variant="outline" 
        size="sm" 
        onClick={onExport}
        disabled={!hasSession || isExporting}
      >
        <Download className="w-4 h-4 mr-2" />
        {isExporting ? 'Exporting...' : 'Export PDF'}
      </Button>
    </div>
  );
};
