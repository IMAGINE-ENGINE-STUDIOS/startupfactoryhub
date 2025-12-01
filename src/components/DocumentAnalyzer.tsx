import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function DocumentAnalyzer() {
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState("");
  const [documentResult, setDocumentResult] = useState<any>(null);
  const [isDocumentLoading, setIsDocumentLoading] = useState(false);

  const analyzeDocument = async () => {
    if (!imageUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter an image URL",
        variant: "destructive",
      });
      return;
    }

    if (imageUrl.toLowerCase().endsWith('.pdf')) {
      toast({
        title: "Error",
        description: "PDF analysis is not supported yet. Please use image files (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    setIsDocumentLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-vision-analyzer', {
        body: {
          imageUrl,
          analysisType: 'document'
        }
      });

      if (error) throw error;
      setDocumentResult(data);

      toast({
        title: "Analysis Complete",
        description: "Document analyzed successfully",
      });
    } catch (error: any) {
      console.error('Error analyzing document:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to analyze document",
        variant: "destructive",
      });
    } finally {
      setIsDocumentLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Image/Document URL</label>
        <Input
          type="url"
          placeholder="https://example.com/image.jpg"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Enter a publicly accessible image URL (JPG, PNG, WEBP). PDFs are not supported.
        </p>
      </div>

      {imageUrl && (
        <div className="tech-card border-0 rounded-lg overflow-hidden">
          <img
            src={imageUrl}
            alt="Document to analyze"
            className="w-full h-auto max-h-96 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      <Button
        onClick={analyzeDocument}
        disabled={isDocumentLoading || !imageUrl.trim()}
        className="w-full"
        size="lg"
      >
        {isDocumentLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          'Analyze Document'
        )}
      </Button>

      {documentResult && (
        <Card className="tech-card border-0">
          <CardHeader>
            <CardTitle className="text-base">Analysis Result</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{documentResult.analysis}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
