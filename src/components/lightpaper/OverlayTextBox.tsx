import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, GripVertical, Pipette } from "lucide-react";
import { toast } from "sonner";

interface OverlayTextBoxProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  borderVisible: boolean;
  onUpdate: (id: string, updates: Partial<Omit<OverlayTextBoxProps, 'id' | 'onUpdate' | 'onDelete'>>) => void;
  onDelete: (id: string) => void;
  zoomLevel: number;
}

const FONTS = ["Arial", "Times New Roman", "Georgia", "Verdana", "Courier New", "Roboto"];

export function OverlayTextBox({
  id,
  x,
  y,
  width,
  height,
  text,
  fontSize,
  fontFamily,
  color,
  backgroundColor,
  borderVisible,
  onUpdate,
  onDelete,
  zoomLevel
}: OverlayTextBoxProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [isSampling, setIsSampling] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const resizeStart = useRef<{ startX: number; startY: number; startWidth: number; startHeight: number } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // Click outside to deselect
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setIsSelected(false);
      }
    };
    if (isSelected) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isSelected]);

  const sampleBackgroundColor = async () => {
    setIsSampling(true);
    try {
      const pageElement = document.querySelector('.page') as HTMLElement;
      if (!pageElement) { toast.error('Could not find document page'); return; }
      const pageRect = pageElement.getBoundingClientRect();
      const boxRect = boxRef.current!.getBoundingClientRect();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const sampleSize = 30;
      canvas.width = sampleSize;
      canvas.height = sampleSize;
      const bgElements = document.querySelectorAll('img, canvas');
      let sampledColor = null;
      for (const el of Array.from(bgElements)) {
        const rect = el.getBoundingClientRect();
        if (rect.left < boxRect.right && rect.right > boxRect.left &&
            rect.top < boxRect.bottom && rect.bottom > boxRect.top) {
          if (el instanceof HTMLImageElement || el instanceof HTMLCanvasElement) {
            ctx.drawImage(el, 0, 0, sampleSize, sampleSize);
            const imageData = ctx.getImageData(sampleSize/2, sampleSize/2, 1, 1);
            const [r, g, b] = imageData.data;
            sampledColor = `rgb(${r}, ${g}, ${b})`;
            break;
          }
        }
      }
      if (sampledColor) {
        onUpdate(id, { backgroundColor: sampledColor });
        toast.success(`Background color sampled`);
      } else {
        toast.info('No image found under text box to sample from');
      }
    } catch (error) {
      console.error('Error sampling color:', error);
      toast.error('Failed to sample background color');
    } finally {
      setIsSampling(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('resize-handle')) {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      resizeStart.current = {
        startX: e.clientX,
        startY: e.clientY,
        startWidth: width,
        startHeight: height
      };
    } else if (!(e.target as HTMLElement).closest('.controls-area')) {
      e.preventDefault();
      e.stopPropagation();
      setIsSelected(true);
      setIsDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        const pageElement = document.querySelector('.page');
        if (!pageElement) return;
        const pageRect = pageElement.getBoundingClientRect();
        const deltaX = e.clientX - dragStart.current.x;
        const deltaY = e.clientY - dragStart.current.y;
        const newX = x + deltaX / zoomLevel;
        const newY = y + deltaY / zoomLevel;
        onUpdate(id, { 
          x: Math.max(0, Math.min(newX, (pageRect.width / zoomLevel) - width)),
          y: Math.max(0, Math.min(newY, (pageRect.height / zoomLevel) - height))
        });
        dragStart.current = { x: e.clientX, y: e.clientY };
      } else if (isResizing && resizeStart.current) {
        e.preventDefault();
        const deltaX = e.clientX - resizeStart.current.startX;
        const deltaY = e.clientY - resizeStart.current.startY;
        const newWidth = Math.max(100, resizeStart.current.startWidth + deltaX / zoomLevel);
        const newHeight = Math.max(50, resizeStart.current.startHeight + deltaY / zoomLevel);
        onUpdate(id, { width: newWidth, height: newHeight });
      }
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      resizeStart.current = null;
    };
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, x, y, width, height, zoomLevel, id, onUpdate]);

  return (
    <div
      ref={boxRef}
      className="absolute"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: 100
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Text box - NO border, blends with background */}
      <div
        className="w-full h-full p-2 relative"
        style={{
          backgroundColor: backgroundColor,
          color: color,
          fontSize: `${fontSize}px`,
          fontFamily: fontFamily,
          border: 'none',
          outline: 'none',
          boxShadow: 'none',
          overflow: 'hidden'
        }}
        onDoubleClick={() => setIsEditing(true)}
      >
        {isEditing ? (
          <textarea
            autoFocus
            value={text}
            onChange={(e) => onUpdate(id, { text: e.target.value })}
            onBlur={() => setIsEditing(false)}
            className="w-full h-full bg-transparent resize-none"
            style={{ 
              color, 
              fontSize: `${fontSize}px`, 
              fontFamily,
              outline: 'none',
              border: 'none',
              boxShadow: 'none',
            }}
          />
        ) : (
          <div className="whitespace-pre-wrap break-words">{text || 'Double-click to edit'}</div>
        )}
      </div>

      {/* Controls - only visible when selected */}
      {isSelected && (
        <>
          {/* Drag handle */}
          <div className="absolute -top-8 left-0 bg-primary text-primary-foreground px-2 py-1 rounded-t text-xs flex items-center gap-2 cursor-grab active:cursor-grabbing">
            <GripVertical className="h-3 w-3" />
            <span>Drag</span>
          </div>

          <div className="controls-area absolute -right-2 -top-8 flex gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-6 w-6 p-0"
              onClick={sampleBackgroundColor}
              disabled={isSampling}
              title="Sample background color"
            >
              <Pipette className="h-3 w-3" />
            </Button>
            
            <Select value={fontFamily} onValueChange={(val) => onUpdate(id, { fontFamily: val })}>
              <SelectTrigger className="h-6 w-24 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONTS.map(font => <SelectItem key={font} value={font}>{font}</SelectItem>)}
              </SelectContent>
            </Select>
            
            <Input
              type="number"
              value={fontSize}
              onChange={(e) => onUpdate(id, { fontSize: parseInt(e.target.value) || 12 })}
              className="h-6 w-14 text-xs"
              min="8"
              max="72"
            />

            <input
              type="color"
              value={color}
              onChange={(e) => onUpdate(id, { color: e.target.value })}
              className="h-6 w-8 cursor-pointer rounded border"
              title="Text color"
            />

            <input
              type="color"
              value={backgroundColor === 'transparent' ? '#ffffff' : backgroundColor}
              onChange={(e) => onUpdate(id, { backgroundColor: e.target.value })}
              className="h-6 w-8 cursor-pointer rounded border"
              title="Background color"
            />

            <Button
              size="sm"
              variant="destructive"
              className="h-6 w-6 p-0"
              onClick={() => onDelete(id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>

          {/* Selection border - only when selected, using primary color */}
          <div className="absolute inset-0 pointer-events-none" style={{ border: '1px dashed hsl(var(--primary))', borderRadius: '2px' }} />

          {/* Resize handle */}
          <div
            className="resize-handle absolute -bottom-2 -right-2 w-4 h-4 bg-primary rounded-full cursor-se-resize"
          />
        </>
      )}
    </div>
  );
}
