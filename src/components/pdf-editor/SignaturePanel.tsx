import { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { PenTool, Type } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SignatureLibrary } from '@/components/lightpaper/SignatureLibrary';

interface SignaturePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignatureSelect: (signatureData: string, type: 'draw' | 'text') => void;
}

export const SignaturePanel = ({ open, onOpenChange, onSignatureSelect }: SignaturePanelProps) => {
  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'library'>('draw');
  const [isDrawing, setIsDrawing] = useState(false);
  const [textSignature, setTextSignature] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || activeTab !== 'draw') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 500;
    canvas.height = 200;

    // Configure drawing
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000000';

    ctxRef.current = ctx;
  }, [activeTab]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    if (!ctxRef.current) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    ctxRef.current.beginPath();
    ctxRef.current.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !ctxRef.current) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    ctxRef.current.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctxRef.current.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!canvasRef.current || !ctxRef.current) return;
    ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const saveDrawnSignature = async () => {
    if (!canvasRef.current) return;

    const dataURL = canvasRef.current.toDataURL('image/png');
    
    // Save to library
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('pdf_editor_signatures').insert({
        user_id: user.id,
        signature_type: 'draw',
        signature_data: dataURL,
      });
    }

    onSignatureSelect(dataURL, 'draw');
    toast.success('Signature saved');
    clearCanvas();
    onOpenChange(false);
  };

  const saveTextSignature = async () => {
    if (!textSignature.trim()) {
      toast.error('Please enter your signature');
      return;
    }

    // Create canvas for text signature
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.font = "italic 40px 'Brush Script MT', cursive";
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(textSignature, 200, 50);

    const dataURL = canvas.toDataURL('image/png');

    // Save to library
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('pdf_editor_signatures').insert({
        user_id: user.id,
        signature_type: 'text',
        signature_data: dataURL,
      });
    }

    onSignatureSelect(dataURL, 'text');
    toast.success('Signature saved');
    setTextSignature('');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add Signature</SheetTitle>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="draw">Draw</TabsTrigger>
            <TabsTrigger value="type">Type</TabsTrigger>
            <TabsTrigger value="library">Library</TabsTrigger>
          </TabsList>

          <TabsContent value="draw" className="space-y-4">
            <Card className="p-4">
              <Label className="mb-2 block">Draw your signature</Label>
              <canvas
                ref={canvasRef}
                className="border border-border rounded-md w-full cursor-crosshair bg-white"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            </Card>
            <div className="flex gap-2">
              <Button onClick={saveDrawnSignature} className="flex-1">
                <PenTool className="h-4 w-4 mr-2" />
                Save & Use Signature
              </Button>
              <Button variant="outline" onClick={clearCanvas}>
                Clear
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="type" className="space-y-4">
            <Card className="p-4">
              <Label className="mb-2 block">Type your signature</Label>
              <div className="border border-border rounded-md p-6 bg-white min-h-[150px] flex items-center justify-center">
                <Input
                  value={textSignature}
                  onChange={(e) => setTextSignature(e.target.value)}
                  placeholder="Type your name"
                  className="text-4xl font-serif italic text-center border-0 focus-visible:ring-0"
                />
              </div>
            </Card>
            <Button onClick={saveTextSignature} className="w-full">
              <Type className="h-4 w-4 mr-2" />
              Save & Use Signature
            </Button>
          </TabsContent>

          <TabsContent value="library" className="space-y-4">
            <SignatureLibrary
              onSelectSignature={(data) => {
                onSignatureSelect(data, 'draw');
                onOpenChange(false);
              }}
            />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
