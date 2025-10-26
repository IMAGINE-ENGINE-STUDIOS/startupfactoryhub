import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, GripVertical, Palette } from "lucide-react";

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
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const boxRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('resize-handle')) {
      setIsResizing(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    } else if ((e.target as HTMLElement).classList.contains('drag-handle')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - x * zoomLevel, y: e.clientY - y * zoomLevel });
    }
    e.stopPropagation();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = (e.clientX - dragStart.x) / zoomLevel;
        const newY = (e.clientY - dragStart.y) / zoomLevel;
        onUpdate(id, { x: Math.max(0, newX), y: Math.max(0, newY) });
      } else if (isResizing) {
        const deltaX = (e.clientX - dragStart.x) / zoomLevel;
        const deltaY = (e.clientY - dragStart.y) / zoomLevel;
        onUpdate(id, {
          width: Math.max(100, width + deltaX),
          height: Math.max(50, height + deltaY)
        });
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, x, y, width, height, zoomLevel, id, onUpdate]);

  return (
    <div
      ref={boxRef}
      className="absolute group"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Drag handle */}
      <div className="drag-handle absolute -top-8 left-0 bg-primary text-primary-foreground px-2 py-1 rounded-t text-xs flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
        <GripVertical className="h-3 w-3" />
        <span>Drag</span>
      </div>

      {/* Text box */}
      <div
        className="w-full h-full p-2 relative"
        style={{
          backgroundColor: backgroundColor,
          color: color,
          fontSize: `${fontSize}px`,
          fontFamily: fontFamily,
          border: borderVisible ? '1px solid rgba(0,0,0,0.2)' : 'none',
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
            className="w-full h-full bg-transparent resize-none outline-none"
            style={{ color, fontSize: `${fontSize}px`, fontFamily }}
          />
        ) : (
          <div className="whitespace-pre-wrap break-words">{text || 'Double-click to edit'}</div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute -right-2 -top-8 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
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
          value={backgroundColor}
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

      {/* Resize handle */}
      <div
        className="resize-handle absolute -bottom-2 -right-2 w-4 h-4 bg-primary rounded-full cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </div>
  );
}
