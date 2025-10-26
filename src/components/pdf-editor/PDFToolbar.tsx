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
  PenTool,
  Share2,
  MessageSquare,
} from 'lucide-react';
import { usePDFEditorStore, ToolType } from '@/stores/pdfEditorStore';
import { cn } from '@/lib/utils';
import { ActiveUsersList } from './ActiveUsersList';

interface PDFToolbarProps {
  onUpload: () => void;
  onExport: () => void;
  onImageUpload: () => void;
  onShowKeyboardShortcuts: () => void;
  onAddFormField: () => void;
  onAddSignature: () => void;
  onShare: () => void;
  onToggleCollaborationSidebar: () => void;
  showCollaborationSidebar: boolean;
  isExporting?: boolean;
  isUploading?: boolean;
  hasSession?: boolean;
  activeUsers?: any[];
  userColor?: string;
}

export const PDFToolbar = ({ 
  onUpload, 
  onExport, 
  onImageUpload,
  onShowKeyboardShortcuts,
  onAddFormField,
  onAddSignature,
  onShare,
  onToggleCollaborationSidebar,
  showCollaborationSidebar,
  isExporting = false, 
  isUploading = false,
  hasSession = false,
  activeUsers = [],
  userColor = '#3B82F6',
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
    <div className="flex items-center gap-1 md:gap-2 p-1.5 md:p-2 bg-background border-b overflow-x-auto">
      <Button variant="outline" size="sm" onClick={onUpload} disabled={isUploading} className="shrink-0">
        <Upload className="w-4 h-4 md:mr-2" />
        <span className="hidden md:inline">{isUploading ? 'Uploading...' : 'Upload PDF'}</span>
      </Button>

      <Separator orientation="vertical" className="h-6 md:h-8 shrink-0" />

      <div className="flex gap-0.5 md:gap-1">
        {tools.map(({ type, icon: Icon, label }) => (
          <Button
            key={type}
            variant={activeTool === type ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTool(type)}
            title={`${label} (${type === 'select' ? 'V' : type.charAt(0).toUpperCase()})`}
            className={cn(
              'w-8 h-8 md:w-9 md:h-9 p-0 shrink-0',
              activeTool === type && 'bg-primary text-primary-foreground'
            )}
          >
            <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </Button>
        ))}
      </div>

      <Separator orientation="vertical" className="h-6 md:h-8 shrink-0" />

      <Button 
        variant="outline" 
        size="sm" 
        onClick={onImageUpload}
        disabled={!hasSession}
        title="Upload Image"
        className="shrink-0"
      >
        <ImageIcon className="w-4 h-4 md:mr-2" />
        <span className="hidden md:inline">Image</span>
      </Button>

      <Button 
        variant="outline" 
        size="sm" 
        onClick={onAddFormField}
        disabled={!hasSession}
        title="Add Form Field"
        className="shrink-0"
      >
        <FileText className="w-4 h-4 md:mr-2" />
        <span className="hidden md:inline">Form</span>
      </Button>

      <Button 
        variant="outline" 
        size="sm" 
        onClick={onAddSignature}
        disabled={!hasSession}
        title="Add Signature"
        className="shrink-0"
      >
        <PenTool className="w-4 h-4 md:mr-2" />
        <span className="hidden md:inline">Sign</span>
      </Button>

      <Separator orientation="vertical" className="h-6 md:h-8 shrink-0" />

      <Button 
        variant="outline" 
        size="sm" 
        onClick={onExport}
        disabled={!hasSession || isExporting}
        title="Export PDF (Ctrl+E)"
        className="shrink-0"
      >
        <Download className="w-4 h-4 md:mr-2" />
        <span className="hidden md:inline">{isExporting ? 'Exporting...' : 'Export'}</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onShare}
        disabled={!hasSession}
        title="Share Session"
        className="shrink-0"
      >
        <Share2 className="w-4 h-4 md:mr-2" />
        <span className="hidden md:inline">Share</span>
      </Button>

      <Separator orientation="vertical" className="h-6 md:h-8 shrink-0" />

      {hasSession && activeUsers && (
        <ActiveUsersList users={activeUsers} currentUserColor={userColor} />
      )}

      <Button
        variant={showCollaborationSidebar ? 'default' : 'outline'}
        size="sm"
        onClick={onToggleCollaborationSidebar}
        title="Toggle Collaboration Panel"
        className="shrink-0"
      >
        <MessageSquare className="w-4 h-4 md:mr-2" />
        <span className="hidden md:inline">Collaborate</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={onShowKeyboardShortcuts}
        title="Keyboard Shortcuts (Ctrl+/)"
        className="hidden lg:flex shrink-0"
      >
        <Keyboard className="w-4 h-4 md:mr-2" />
        <span className="hidden md:inline">Shortcuts</span>
      </Button>

      <div className="ml-auto text-xs text-muted-foreground hidden xl:block">
        Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+/</kbd> for shortcuts
      </div>
    </div>
  );
};
