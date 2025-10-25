import { useState } from 'react';
import { PDFFabricManager } from '@/lib/pdf/fabricManager';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  MousePointer2,
  Type,
  Pencil,
  Square,
  Circle,
  Image as ImageIcon,
  Trash2,
  Save,
  Download,
  ZoomIn,
  ZoomOut,
  Undo,
  Redo,
  Loader2,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FabricToolbarProps {
  fabricManager: PDFFabricManager;
  currentPage: number;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onSave: () => void;
  onExport: () => void;
  saving: boolean;
  exporting: boolean;
}

export const FabricToolbar = ({
  fabricManager,
  currentPage,
  zoom,
  onZoomChange,
  onSave,
  onExport,
  saving,
  exporting,
}: FabricToolbarProps) => {
  const [activeTool, setActiveTool] = useState<'select' | 'text' | 'draw' | 'rect' | 'circle' | 'erase'>('select');
  const [color, setColor] = useState('#000000');
  const [fontSize, setFontSize] = useState(16);

  const handleToolChange = (tool: typeof activeTool) => {
    setActiveTool(tool);
    fabricManager.setTool(tool);
  };

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    fabricManager.setColor(newColor);
  };

  const handleFontSizeChange = (size: string) => {
    const newSize = parseInt(size);
    setFontSize(newSize);
    fabricManager.setFontSize(newSize);
  };

  const handleAddShape = (shape: 'rect' | 'circle') => {
    if (shape === 'rect') {
      fabricManager.addRectangle(currentPage);
    } else {
      fabricManager.addCircle(currentPage);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageUrl = event.target?.result as string;
      await fabricManager.addImage(currentPage, imageUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = () => {
    fabricManager.deleteSelected(currentPage);
  };

  const handleZoomIn = () => {
    onZoomChange(Math.min(zoom + 0.1, 2));
  };

  const handleZoomOut = () => {
    onZoomChange(Math.max(zoom - 0.1, 0.5));
  };

  const toolButtons = [
    { tool: 'select' as const, icon: MousePointer2, label: 'Select' },
    { tool: 'text' as const, icon: Type, label: 'Text' },
    { tool: 'draw' as const, icon: Pencil, label: 'Draw' },
    { tool: 'rect' as const, icon: Square, label: 'Rectangle' },
    { tool: 'circle' as const, icon: Circle, label: 'Circle' },
    { tool: 'erase' as const, icon: Trash2, label: 'Eraser' },
  ];

  return (
    <div className="border-b bg-background p-4">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Tools */}
        <div className="flex items-center gap-1">
          {toolButtons.map(({ tool, icon: Icon, label }) => (
            <Button
              key={tool}
              variant={activeTool === tool ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                handleToolChange(tool);
                if (tool === 'rect' || tool === 'circle') {
                  handleAddShape(tool);
                }
              }}
              title={label}
            >
              <Icon className="w-4 h-4" />
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Image Upload */}
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <Button variant="outline" size="sm" asChild>
            <span>
              <ImageIcon className="w-4 h-4" />
            </span>
          </Button>
        </label>

        <Separator orientation="vertical" className="h-8" />

        {/* Color Picker */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Color:</label>
          <Input
            type="color"
            value={color}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-12 h-8 p-1 cursor-pointer"
          />
        </div>

        {/* Font Size */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Size:</label>
          <Select value={fontSize.toString()} onValueChange={handleFontSizeChange}>
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12">12</SelectItem>
              <SelectItem value="14">14</SelectItem>
              <SelectItem value="16">16</SelectItem>
              <SelectItem value="18">18</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="24">24</SelectItem>
              <SelectItem value="32">32</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={handleZoomOut} title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="outline" size="sm" onClick={handleZoomIn} title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-8" />

        {/* Delete */}
        <Button variant="outline" size="sm" onClick={handleDelete} title="Delete Selected">
          <Trash2 className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-8" />

        {/* Save & Export */}
        <Button variant="outline" size="sm" onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span className="ml-1">Save</span>
        </Button>

        <Button variant="default" size="sm" onClick={onExport} disabled={exporting}>
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span className="ml-1">Export</span>
        </Button>
      </div>
    </div>
  );
};
