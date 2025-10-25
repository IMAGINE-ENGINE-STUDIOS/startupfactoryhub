import { useState } from 'react';
import { Bold, Italic, Underline, Type, Palette, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface TextFormatToolbarProps {
  position: { x: number; y: number } | null;
  text: string;
  fontSize: number;
  color: { r: number; g: number; b: number };
  onSave: (text: string, fontSize: number, color: { r: number; g: number; b: number }) => void;
  onClose: () => void;
}

export function TextFormatToolbar({ 
  position, 
  text: initialText, 
  fontSize: initialFontSize,
  color: initialColor,
  onSave, 
  onClose 
}: TextFormatToolbarProps) {
  const [text, setText] = useState(initialText);
  const [fontSize, setFontSize] = useState(initialFontSize);
  const [color, setColor] = useState(initialColor);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  if (!position) return null;

  const rgbToHex = (r: number, g: number, b: number) => {
    return '#' + [r, g, b].map(x => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
  };

  const handleSave = () => {
    onSave(text, fontSize, color);
    onClose();
  };

  const presetColors = [
    { r: 0, g: 0, b: 0 }, // Black
    { r: 1, g: 0, b: 0 }, // Red
    { r: 0, g: 0, b: 1 }, // Blue
    { r: 0, g: 0.5, b: 0 }, // Green
    { r: 1, g: 0.65, b: 0 }, // Orange
  ];

  return (
    <div 
      className="fixed z-50 bg-background border rounded-lg shadow-xl p-3 min-w-[400px]"
      style={{ 
        left: `${Math.max(10, Math.min(position.x - 200, window.innerWidth - 420))}px`, 
        top: `${Math.max(10, position.y - 80)}px`,
      }}
    >
      <div className="space-y-3">
        {/* Text Input */}
        <div className="space-y-1">
          <Label className="text-xs">Text Content</Label>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="text-sm"
            placeholder="Enter text"
          />
        </div>

        {/* Formatting Buttons Row */}
        <div className="flex items-center gap-1 pb-2 border-b">
          <Button
            variant={isBold ? "default" : "ghost"}
            size="sm"
            onClick={() => setIsBold(!isBold)}
            title="Bold"
            className="h-8 w-8 p-0"
          >
            <Bold className="h-4 w-4" />
          </Button>

          <Button
            variant={isItalic ? "default" : "ghost"}
            size="sm"
            onClick={() => setIsItalic(!isItalic)}
            title="Italic"
            className="h-8 w-8 p-0"
          >
            <Italic className="h-4 w-4" />
          </Button>

          <Button
            variant={isUnderline ? "default" : "ghost"}
            size="sm"
            onClick={() => setIsUnderline(!isUnderline)}
            title="Underline"
            className="h-8 w-8 p-0"
          >
            <Underline className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Font Size Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" title="Font Size" className="h-8 px-2">
                <Type className="h-4 w-4 mr-1" />
                <span className="text-xs">{fontSize}px</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="space-y-2">
                <Label className="text-xs">Font Size: {fontSize}px</Label>
                <Slider
                  value={[fontSize]}
                  onValueChange={([value]) => setFontSize(value)}
                  min={8}
                  max={72}
                  step={1}
                />
                <div className="flex gap-1 flex-wrap">
                  {[10, 12, 14, 16, 18, 24, 32, 48].map(size => (
                    <Button
                      key={size}
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => setFontSize(size)}
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Color Picker Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" title="Text Color" className="h-8 w-8 p-0">
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="space-y-3">
                <div>
                  <Label className="text-xs mb-2 block">Preset Colors</Label>
                  <div className="flex gap-2">
                    {presetColors.map((preset, idx) => (
                      <button
                        key={idx}
                        className="w-8 h-8 rounded border-2 hover:scale-110 transition-transform"
                        style={{ 
                          backgroundColor: rgbToHex(preset.r, preset.g, preset.b),
                          borderColor: color.r === preset.r && color.g === preset.g && color.b === preset.b ? 'hsl(var(--primary))' : 'transparent'
                        }}
                        onClick={() => setColor(preset)}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs mb-2 block">Custom Color</Label>
                  <Input
                    type="color"
                    value={rgbToHex(color.r, color.g, color.b)}
                    onChange={(e) => setColor(hexToRgb(e.target.value))}
                    className="h-10 w-full"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            size="sm"
            className="flex-1"
          >
            <Save className="h-3 w-3 mr-1" />
            Save Changes
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
