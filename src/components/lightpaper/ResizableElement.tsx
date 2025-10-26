import { useState, useEffect, useRef, ReactNode } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResizableElementProps {
  children: ReactNode;
  initialX: number;
  initialY: number;
  initialWidth: number;
  initialHeight: number;
  onUpdate: (x: number, y: number, width: number, height: number) => void;
  onDelete?: () => void;
  lockAspectRatio?: boolean;
  minWidth?: number;
  minHeight?: number;
  zoomLevel?: number;
  showDelete?: boolean;
}

export function ResizableElement({
  children,
  initialX,
  initialY,
  initialWidth,
  initialHeight,
  onUpdate,
  onDelete,
  lockAspectRatio = false,
  minWidth = 50,
  minHeight = 50,
  zoomLevel = 1,
  showDelete = true
}: ResizableElementProps) {
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [isSelected, setIsSelected] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const elementRef = useRef<HTMLDivElement>(null);
  const aspectRatio = initialWidth / initialHeight;

  useEffect(() => {
    setPosition({ x: initialX, y: initialY });
    setSize({ width: initialWidth, height: initialHeight });
  }, [initialX, initialY, initialWidth, initialHeight]);

  const handleMouseDown = (e: React.MouseEvent, handle?: string) => {
    e.stopPropagation();
    setIsSelected(true);
    
    if (handle) {
      setIsResizing(handle);
      setDragStart({ x: e.clientX, y: e.clientY });
    } else {
      setIsDragging(true);
      setDragStart({ 
        x: e.clientX - position.x * zoomLevel, 
        y: e.clientY - position.y * zoomLevel 
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = (e.clientX - dragStart.x) / zoomLevel;
        const newY = (e.clientY - dragStart.y) / zoomLevel;
        const updatedPos = {
          x: Math.max(0, newX),
          y: Math.max(0, newY)
        };
        setPosition(updatedPos);
        onUpdate(updatedPos.x, updatedPos.y, size.width, size.height);
      } else if (isResizing) {
        const deltaX = (e.clientX - dragStart.x) / zoomLevel;
        const deltaY = (e.clientY - dragStart.y) / zoomLevel;
        
        let newWidth = size.width;
        let newHeight = size.height;
        let newX = position.x;
        let newY = position.y;

        // Handle different resize directions
        switch (isResizing) {
          case 'se': // Bottom-right
            newWidth = Math.max(minWidth, size.width + deltaX);
            newHeight = lockAspectRatio 
              ? newWidth / aspectRatio 
              : Math.max(minHeight, size.height + deltaY);
            break;
          case 'sw': // Bottom-left
            newWidth = Math.max(minWidth, size.width - deltaX);
            newHeight = lockAspectRatio 
              ? newWidth / aspectRatio 
              : Math.max(minHeight, size.height + deltaY);
            newX = position.x + deltaX;
            break;
          case 'ne': // Top-right
            newWidth = Math.max(minWidth, size.width + deltaX);
            newHeight = lockAspectRatio 
              ? newWidth / aspectRatio 
              : Math.max(minHeight, size.height - deltaY);
            newY = position.y + deltaY;
            break;
          case 'nw': // Top-left
            newWidth = Math.max(minWidth, size.width - deltaX);
            newHeight = lockAspectRatio 
              ? newWidth / aspectRatio 
              : Math.max(minHeight, size.height - deltaY);
            newX = position.x + deltaX;
            newY = position.y + deltaY;
            break;
        }

        setSize({ width: newWidth, height: newHeight });
        setPosition({ x: newX, y: newY });
        setDragStart({ x: e.clientX, y: e.clientY });
        onUpdate(newX, newY, newWidth, newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (elementRef.current && !elementRef.current.contains(e.target as Node)) {
        setIsSelected(false);
      }
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDragging, isResizing, dragStart, position, size, zoomLevel, onUpdate, lockAspectRatio, aspectRatio, minWidth, minHeight]);

  const handleStyle = "absolute w-3 h-3 bg-primary border-2 border-white rounded-full z-50 transition-opacity";
  const hoverClass = isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100";

  return (
    <div
      ref={elementRef}
      className="group absolute"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
        border: isSelected ? '2px solid rgba(59, 130, 246, 0.5)' : '2px solid transparent',
        boxShadow: isSelected 
          ? '0 0 20px rgba(59, 130, 246, 0.4)' 
          : undefined,
        transition: isSelected ? 'none' : 'border 0.2s ease, box-shadow 0.2s ease'
      }}
      onMouseDown={(e) => handleMouseDown(e)}
    >
      {children}

      {/* Delete button */}
      {showDelete && onDelete && (
        <Button
          size="sm"
          variant="destructive"
          className={`absolute -top-8 -right-2 h-6 w-6 p-0 ${hoverClass}`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}

      {/* Corner resize handles */}
      <div
        className={`${handleStyle} ${hoverClass} -top-1.5 -left-1.5 cursor-nw-resize`}
        onMouseDown={(e) => handleMouseDown(e, 'nw')}
      />
      <div
        className={`${handleStyle} ${hoverClass} -top-1.5 -right-1.5 cursor-ne-resize`}
        onMouseDown={(e) => handleMouseDown(e, 'ne')}
      />
      <div
        className={`${handleStyle} ${hoverClass} -bottom-1.5 -left-1.5 cursor-sw-resize`}
        onMouseDown={(e) => handleMouseDown(e, 'sw')}
      />
      <div
        className={`${handleStyle} ${hoverClass} -bottom-1.5 -right-1.5 cursor-se-resize`}
        onMouseDown={(e) => handleMouseDown(e, 'se')}
      />
    </div>
  );
}
