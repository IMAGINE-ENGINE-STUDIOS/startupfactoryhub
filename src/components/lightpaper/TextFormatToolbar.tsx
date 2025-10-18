import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface TextFormatToolbarProps {
  position: { x: number; y: number } | null;
  format: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    align: 'left' | 'center' | 'right';
    fontSize: number;
    lineHeight: number;
  };
  onFormatChange: (format: Partial<TextFormatToolbarProps['format']>) => void;
  onClose: () => void;
}

export function TextFormatToolbar({ position, format, onFormatChange, onClose }: TextFormatToolbarProps) {
  if (!position) return null;

  return (
    <div 
      className="fixed z-50 bg-background border rounded-lg shadow-lg p-2 flex items-center gap-1"
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y - 60}px`,
      }}
    >
      <Button
        variant={format.bold ? "default" : "ghost"}
        size="sm"
        onClick={() => onFormatChange({ bold: !format.bold })}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </Button>

      <Button
        variant={format.italic ? "default" : "ghost"}
        size="sm"
        onClick={() => onFormatChange({ italic: !format.italic })}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </Button>

      <Button
        variant={format.underline ? "default" : "ghost"}
        size="sm"
        onClick={() => onFormatChange({ underline: !format.underline })}
        title="Underline"
      >
        <Underline className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Button
        variant={format.align === 'left' ? "default" : "ghost"}
        size="sm"
        onClick={() => onFormatChange({ align: 'left' })}
        title="Align Left"
      >
        <AlignLeft className="h-4 w-4" />
      </Button>

      <Button
        variant={format.align === 'center' ? "default" : "ghost"}
        size="sm"
        onClick={() => onFormatChange({ align: 'center' })}
        title="Align Center"
      >
        <AlignCenter className="h-4 w-4" />
      </Button>

      <Button
        variant={format.align === 'right' ? "default" : "ghost"}
        size="sm"
        onClick={() => onFormatChange({ align: 'right' })}
        title="Align Right"
      >
        <AlignRight className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" title="Text Size">
            <Type className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Font Size: {format.fontSize}px</Label>
              <Slider
                value={[format.fontSize]}
                onValueChange={([value]) => onFormatChange({ fontSize: value })}
                min={8}
                max={72}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Line Height: {format.lineHeight.toFixed(1)}</Label>
              <Slider
                value={[format.lineHeight]}
                onValueChange={([value]) => onFormatChange({ lineHeight: value })}
                min={0.8}
                max={3}
                step={0.1}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="ml-2"
      >
        Done
      </Button>
    </div>
  );
}
