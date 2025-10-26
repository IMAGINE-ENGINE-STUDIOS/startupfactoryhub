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
  Upload,
  Image as ImageIcon,
  Keyboard,
  FileText,
  PenTool
} from 'lucide-react';
import { usePDFEditorStore, ToolType } from '@/stores/pdfEditorStore';
import { cn } from '@/lib/utils';

interface PDFToolbarProps {
  onUpload: () => void;
  onExport: () => void;
  onImageUpload: () => void;
  onShowKeyboardShortcuts: () => void;
  onAddFormField: () => void;
  onAddSignature: () => void;
  isExporting?: boolean;
  isUploading?: boolean;
  hasSession?: boolean;
}

export const PDFToolbar = ({ 
  onUpload, 
  onExport, 
  onImageUpload,
  onShowKeyboardShortcuts,
  onAddFormField,
  onAddSignature,
  isExporting = false, 
  isUploading = false,
  hasSession = false 
}: PDFToolbarProps) => {
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
      <Button variant="outline" size="sm" onClick={onUpload} disabled={isUploading}>
        <Upload className="w-4 h-4 mr-2" />
        {isUploading ? 'Uploading...' : 'Upload PDF'}
      </Button>

      <Separator orientation="vertical" className="h-8" />

      <div className="flex gap-1">
        {tools.map(({ type, icon: Icon, label }) => (
          <Button
            key={type}
            variant={activeTool === type ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTool(type)}
            title={`${label} (${type === 'select' ? 'V' : type.charAt(0).toUpperCase()})`}
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
        onClick={onImageUpload}
        disabled={!hasSession}
        title="Upload Image"
      >
        <ImageIcon className="w-4 h-4 mr-2" />
        Image
      </Button>

      <Button 
        variant="outline" 
        size="sm" 
        onClick={onAddFormField}
        disabled={!hasSession}
        title="Add Form Field"
      >
        <FileText className="w-4 h-4 mr-2" />
        Form
      </Button>

      <Button 
        variant="outline" 
        size="sm" 
        onClick={onAddSignature}
        disabled={!hasSession}
        title="Add Signature"
      >
        <PenTool className="w-4 h-4 mr-2" />
        Sign
      </Button>

      <Separator orientation="vertical" className="h-8" />

      <Button 
        variant="outline" 
        size="sm" 
        onClick={onExport}
        disabled={!hasSession || isExporting}
        title="Export PDF (Ctrl+E)"
      >
        <Download className="w-4 h-4 mr-2" />
        {isExporting ? 'Exporting...' : 'Export'}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={onShowKeyboardShortcuts}
        title="Keyboard Shortcuts (Ctrl+/)"
        className="hidden lg:flex"
      >
        <Keyboard className="w-4 h-4 mr-2" />
        Shortcuts
      </Button>

      <div className="ml-auto text-xs text-muted-foreground hidden xl:block">
        Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+/</kbd> for shortcuts
      </div>
    </div>
  );
};
