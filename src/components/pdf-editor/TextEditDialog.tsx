import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TextItem } from '@/lib/pdf/textExtractor';

interface TextEditDialogProps {
  open: boolean;
  onClose: () => void;
  textItem: TextItem | null;
  onSave: (newText: string, fontSize: number, color: { r: number; g: number; b: number }) => void;
}

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64];

const COLORS = [
  { name: 'Black', value: { r: 0, g: 0, b: 0 } },
  { name: 'Red', value: { r: 1, g: 0, b: 0 } },
  { name: 'Blue', value: { r: 0, g: 0, b: 1 } },
  { name: 'Green', value: { r: 0, g: 0.5, b: 0 } },
  { name: 'Gray', value: { r: 0.5, g: 0.5, b: 0.5 } },
];

export function TextEditDialog({ open, onClose, textItem, onSave }: TextEditDialogProps) {
  const [text, setText] = useState(textItem?.text || '');
  const [fontSize, setFontSize] = useState(textItem?.fontSize || 12);
  const [color, setColor] = useState<{ r: number; g: number; b: number }>({ r: 0, g: 0, b: 0 });

  const handleSave = () => {
    onSave(text, fontSize, color);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Text</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="text">Text Content</Label>
            <Input
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fontSize">Font Size</Label>
            <Select value={fontSize.toString()} onValueChange={(v) => setFontSize(Number(v))}>
              <SelectTrigger id="fontSize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_SIZES.map(size => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}pt
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <Select 
              value={COLORS.findIndex(c => c.value.r === color.r && c.value.g === color.g && c.value.b === color.b).toString()}
              onValueChange={(v) => setColor(COLORS[Number(v)].value)}
            >
              <SelectTrigger id="color">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLORS.map((c, idx) => (
                  <SelectItem key={idx} value={idx.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
