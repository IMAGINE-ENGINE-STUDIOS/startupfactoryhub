import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Bold, Italic, Trash2 } from 'lucide-react';
import { FabricObject } from 'fabric';
import { cn } from '@/lib/utils';

interface PDFPropertiesPanelProps {
  selectedObject: FabricObject | null;
  onUpdateProperty: (property: string, value: any) => void;
  onDelete: () => void;
}

export const PDFPropertiesPanel = ({
  selectedObject,
  onUpdateProperty,
  onDelete,
}: PDFPropertiesPanelProps) => {
  const [fillColor, setFillColor] = useState('#000000');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(1);
  const [fontSize, setFontSize] = useState(20);
  const [fontWeight, setFontWeight] = useState<'normal' | 'bold'>('normal');
  const [fontStyle, setFontStyle] = useState<'normal' | 'italic'>('normal');
  const [opacity, setOpacity] = useState(1);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);

  // Update local state when selected object changes
  useEffect(() => {
    if (!selectedObject) return;

    setFillColor(selectedObject.fill?.toString() || '#000000');
    setStrokeColor(selectedObject.stroke?.toString() || '#000000');
    setStrokeWidth(selectedObject.strokeWidth || 1);
    setOpacity(selectedObject.opacity || 1);
    setX(Math.round(selectedObject.left || 0));
    setY(Math.round(selectedObject.top || 0));

    // Text-specific properties
    if (selectedObject.type === 'i-text' || selectedObject.type === 'text') {
      const textObj = selectedObject as any;
      setFontSize(textObj.fontSize || 20);
      setFontWeight(textObj.fontWeight === 'bold' ? 'bold' : 'normal');
      setFontStyle(textObj.fontStyle === 'italic' ? 'italic' : 'normal');
    }
  }, [selectedObject]);

  if (!selectedObject) {
    return (
      <Card className="w-72 p-4 space-y-4">
        <div className="text-center text-muted-foreground text-sm">
          Select an object to edit its properties
        </div>
      </Card>
    );
  }

  const isText = selectedObject.type === 'i-text' || selectedObject.type === 'text';
  const isShape = selectedObject.type === 'rect' || selectedObject.type === 'circle';

  return (
    <Card className="w-72 p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Properties</h3>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          className="h-8 w-8 p-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Separator />

      {/* Position */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold">Position</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="x" className="text-xs">X</Label>
            <Input
              id="x"
              type="number"
              value={x}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                setX(val);
                onUpdateProperty('left', val);
              }}
              className="h-8"
            />
          </div>
          <div>
            <Label htmlFor="y" className="text-xs">Y</Label>
            <Input
              id="y"
              type="number"
              value={y}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                setY(val);
                onUpdateProperty('top', val);
              }}
              className="h-8"
            />
          </div>
        </div>
      </div>

      {/* Text Properties */}
      {isText && (
        <>
          <Separator />
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Text</Label>
            <div>
              <Label htmlFor="fontSize" className="text-xs">Font Size</Label>
              <Input
                id="fontSize"
                type="number"
                value={fontSize}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 12;
                  setFontSize(val);
                  onUpdateProperty('fontSize', val);
                }}
                className="h-8"
                min="8"
                max="200"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={fontWeight === 'bold' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  const newWeight = fontWeight === 'bold' ? 'normal' : 'bold';
                  setFontWeight(newWeight);
                  onUpdateProperty('fontWeight', newWeight);
                }}
                className="flex-1"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant={fontStyle === 'italic' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  const newStyle = fontStyle === 'italic' ? 'normal' : 'italic';
                  setFontStyle(newStyle);
                  onUpdateProperty('fontStyle', newStyle);
                }}
                className="flex-1"
              >
                <Italic className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Fill Color */}
      <Separator />
      <div className="space-y-2">
        <Label htmlFor="fillColor" className="text-xs font-semibold">Fill Color</Label>
        <div className="flex gap-2">
          <Input
            id="fillColor"
            type="color"
            value={fillColor}
            onChange={(e) => {
              setFillColor(e.target.value);
              onUpdateProperty('fill', e.target.value);
            }}
            className="h-10 w-20 cursor-pointer"
          />
          <Input
            type="text"
            value={fillColor}
            onChange={(e) => {
              setFillColor(e.target.value);
              onUpdateProperty('fill', e.target.value);
            }}
            className="h-10 flex-1"
          />
        </div>
      </div>

      {/* Stroke (for shapes) */}
      {isShape && (
        <>
          <Separator />
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Stroke</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={strokeColor}
                onChange={(e) => {
                  setStrokeColor(e.target.value);
                  onUpdateProperty('stroke', e.target.value);
                }}
                className="h-10 w-20 cursor-pointer"
              />
              <Input
                type="text"
                value={strokeColor}
                onChange={(e) => {
                  setStrokeColor(e.target.value);
                  onUpdateProperty('stroke', e.target.value);
                }}
                className="h-10 flex-1"
              />
            </div>
            <div>
              <Label htmlFor="strokeWidth" className="text-xs">Width</Label>
              <Input
                id="strokeWidth"
                type="number"
                value={strokeWidth}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setStrokeWidth(val);
                  onUpdateProperty('strokeWidth', val);
                }}
                className="h-8"
                min="0"
                max="50"
              />
            </div>
          </div>
        </>
      )}

      {/* Opacity */}
      <Separator />
      <div className="space-y-2">
        <Label htmlFor="opacity" className="text-xs font-semibold">Opacity</Label>
        <div className="flex gap-2 items-center">
          <Input
            id="opacity"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={opacity}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setOpacity(val);
              onUpdateProperty('opacity', val);
            }}
            className="flex-1"
          />
          <span className="text-sm w-12 text-right">{Math.round(opacity * 100)}%</span>
        </div>
      </div>
    </Card>
  );
};
