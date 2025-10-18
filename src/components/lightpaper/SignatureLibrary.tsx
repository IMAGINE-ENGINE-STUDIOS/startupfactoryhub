import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SavedSignature {
  id: string;
  signature_type: 'draw' | 'text';
  signature_data: string;
  is_default: boolean;
  created_at: string;
}

interface SignatureLibraryProps {
  onSelectSignature: (signatureData: string, type: 'draw' | 'text') => void;
}

export const SignatureLibrary = ({ onSelectSignature }: SignatureLibraryProps) => {
  const [signatures, setSignatures] = useState<SavedSignature[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSignatures();
  }, []);

  const loadSignatures = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('pdf_editor_signatures')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSignatures((data || []) as SavedSignature[]);
    } catch (error) {
      console.error('Error loading signatures:', error);
      toast({
        title: "Error",
        description: "Failed to load signatures",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteSignature = async (id: string) => {
    try {
      const { error } = await supabase
        .from('pdf_editor_signatures')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSignatures(prev => prev.filter(sig => sig.id !== id));
      toast({
        title: "Success",
        description: "Signature deleted",
      });
    } catch (error) {
      console.error('Error deleting signature:', error);
      toast({
        title: "Error",
        description: "Failed to delete signature",
        variant: "destructive",
      });
    }
  };

  const setDefaultSignature = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Remove default from all signatures
      await supabase
        .from('pdf_editor_signatures')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Set new default
      const { error } = await supabase
        .from('pdf_editor_signatures')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;

      setSignatures(prev => prev.map(sig => ({
        ...sig,
        is_default: sig.id === id
      })));

      toast({
        title: "Success",
        description: "Default signature updated",
      });
    } catch (error) {
      console.error('Error setting default:', error);
      toast({
        title: "Error",
        description: "Failed to update default signature",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading signatures...</div>;
  }

  if (signatures.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No saved signatures. Create one above to save it to your library.
      </div>
    );
  }

  return (
    <ScrollArea className="h-64">
      <div className="space-y-2">
        {signatures.map((sig) => (
          <Card key={sig.id} className="p-3 relative group">
            <div
              className="cursor-pointer"
              onClick={() => onSelectSignature(sig.signature_data, sig.signature_type)}
            >
              {sig.signature_type === 'draw' ? (
                <img
                  src={sig.signature_data}
                  alt="Signature"
                  className="h-16 w-full object-contain bg-white"
                />
              ) : (
                <div className="h-16 flex items-center justify-center text-2xl font-signature">
                  {sig.signature_data}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">
                {sig.signature_type === 'draw' ? 'Drawn' : 'Text'} 
                {sig.is_default && ' • Default'}
              </span>
              <div className="flex gap-1">
                {!sig.is_default && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDefaultSignature(sig.id)}
                    className="h-6 w-6 p-0"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteSignature(sig.id)}
                  className="h-6 w-6 p-0 hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};