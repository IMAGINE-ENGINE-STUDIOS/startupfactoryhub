import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pen, Type, Upload, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface SignaturePanelProps {
  open: boolean;
  onClose: () => void;
  onSignatureCreated: (signatureDataUrl: string) => void;
}

export const SignaturePanel = ({ open, onClose, onSignatureCreated }: SignaturePanelProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [typedSignature, setTypedSignature] = useState('');
  const [savedSignatures, setSavedSignatures] = useState<string[]>([]);
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type' | 'upload' | 'saved'>('draw');

  useEffect(() => {
    const saved = localStorage.getItem('pdfEditorSignatures');
    if (saved) {
      setSavedSignatures(JSON.parse(saved));
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveDrawnSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const isEmpty = imageData.data.every(pixel => pixel === 0);
    
    if (isEmpty) {
      toast.error('Please draw your signature first');
      return;
    }

    onSignatureCreated(dataUrl);
    
    const newSavedSignatures = [...savedSignatures, dataUrl];
    setSavedSignatures(newSavedSignatures);
    localStorage.setItem('pdfEditorSignatures', JSON.stringify(newSavedSignatures));
    
    toast.success('Signature added to PDF');
    onClose();
  };

  const generateTypedSignature = () => {
    if (!typedSignature.trim()) {
      toast.error('Please enter your name');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '36px cursive';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedSignature, canvas.width / 2, canvas.height / 2);

    const dataUrl = canvas.toDataURL('image/png');
    onSignatureCreated(dataUrl);
    
    const newSavedSignatures = [...savedSignatures, dataUrl];
    setSavedSignatures(newSavedSignatures);
    localStorage.setItem('pdfEditorSignatures', JSON.stringify(newSavedSignatures));
    
    toast.success('Signature added to PDF');
    onClose();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onSignatureCreated(dataUrl);
      toast.success('Signature image added to PDF');
      onClose();
    };
    reader.readAsDataURL(file);
  };

  const useSavedSignature = (signatureUrl: string) => {
    onSignatureCreated(signatureUrl);
    toast.success('Signature added to PDF');
    onClose();
  };

  const deleteSavedSignature = (index: number) => {
    const newSavedSignatures = savedSignatures.filter((_, i) => i !== index);
    setSavedSignatures(newSavedSignatures);
    localStorage.setItem('pdfEditorSignatures', JSON.stringify(newSavedSignatures));
    toast.success('Signature deleted');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Signature</DialogTitle>
        </DialogHeader>

        <Tabs value={signatureMode} onValueChange={(value: any) => setSignatureMode(value)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="draw" className="gap-2">
              <Pen className="w-4 h-4" />
              Draw
            </TabsTrigger>
            <TabsTrigger value="type" className="gap-2">
              <Type className="w-4 h-4" />
              Type
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-2">
              <Save className="w-4 h-4" />
              ({savedSignatures.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="draw" className="space-y-4">
            <div className="border-2 border-dashed rounded-lg bg-white">
              <canvas
                ref={canvasRef}
                width={550}
                height={200}
                className="cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={clearCanvas}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
              <Button onClick={saveDrawnSignature}>
                Add to PDF
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="type" className="space-y-4">
            <div className="space-y-2">
              <Label>Type your name</Label>
              <Input
                value={typedSignature}
                onChange={(e) => setTypedSignature(e.target.value)}
                placeholder="Your full name"
                className="text-2xl font-['cursive']"
              />
            </div>
            {typedSignature && (
              <div className="p-4 border rounded-lg bg-white">
                <p className="text-4xl font-['cursive'] text-center">
                  {typedSignature}
                </p>
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={generateTypedSignature}>
                Add to PDF
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Upload an image of your signature (PNG, JPG, or GIF)
            </div>
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </TabsContent>

          <TabsContent value="saved" className="space-y-4">
            {savedSignatures.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No saved signatures. Create one using Draw or Type tabs.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
                {savedSignatures.map((sig, index) => (
                  <div key={index} className="relative border rounded-lg p-2 bg-white group">
                    <img 
                      src={sig} 
                      alt={`Saved signature ${index + 1}`}
                      className="w-full h-24 object-contain cursor-pointer"
                      onClick={() => useSavedSignature(sig)}
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                      onClick={() => deleteSavedSignature(index)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
