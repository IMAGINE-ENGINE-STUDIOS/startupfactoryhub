import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, FileText, Languages, TrendingUp, Loader2 } from "lucide-react";

export default function AIQuickActions() {
  const { toast } = useToast();
  const [activeDialog, setActiveDialog] = useState<'summarize' | 'translate' | 'sentiment' | null>(null);
  const [inputText, setInputText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');

  const handleSummarize = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setResult('');

    try {
      const { data, error } = await supabase.functions.invoke('ai-text-summarizer', {
        body: { 
          text: inputText,
          sourceType: 'user_input'
        }
      });

      if (error) throw error;
      setResult(data.summary || 'Summary generated successfully');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to summarize text",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setResult('');

    try {
      const { data, error } = await supabase.functions.invoke('ai-translator', {
        body: { 
          text: inputText,
          targetLanguage
        }
      });

      if (error) throw error;
      setResult(data.translatedText || 'Translation completed');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to translate text",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSentiment = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setResult('');

    try {
      const { data, error } = await supabase.functions.invoke('ai-sentiment-analyzer', {
        body: { 
          text: inputText,
          contentType: 'user_input'
        }
      });

      if (error) throw error;
      const sentiment = data.sentiment || 'neutral';
      const urgency = data.urgency || 'low';
      const category = data.category || 'general';
      setResult(`Sentiment: ${sentiment}\nUrgency: ${urgency}\nCategory: ${category}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to analyze sentiment",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const closeDialog = () => {
    setActiveDialog(null);
    setInputText('');
    setResult('');
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Tools
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm mb-3">Quick AI Actions</h4>
            
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2"
              onClick={() => setActiveDialog('summarize')}
            >
              <FileText className="h-4 w-4" />
              Summarize Content
            </Button>

            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2"
              onClick={() => setActiveDialog('translate')}
            >
              <Languages className="h-4 w-4" />
              Translate
            </Button>

            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2"
              onClick={() => setActiveDialog('sentiment')}
            >
              <TrendingUp className="h-4 w-4" />
              Analyze Sentiment
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Summarize Dialog */}
      <Dialog open={activeDialog === 'summarize'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Summarize Text</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea 
              placeholder="Paste your text here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={6}
            />
            <Button onClick={handleSummarize} disabled={isLoading || !inputText.trim()} className="w-full">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Summarize
            </Button>
            {result && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{result}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Translate Dialog */}
      <Dialog open={activeDialog === 'translate'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Translate Text</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea 
              placeholder="Enter text to translate..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={4}
            />
            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="it">Italian</SelectItem>
                <SelectItem value="pt">Portuguese</SelectItem>
                <SelectItem value="zh">Chinese</SelectItem>
                <SelectItem value="ja">Japanese</SelectItem>
                <SelectItem value="ko">Korean</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleTranslate} disabled={isLoading || !inputText.trim()} className="w-full">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Translate
            </Button>
            {result && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{result}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Sentiment Dialog */}
      <Dialog open={activeDialog === 'sentiment'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Analyze Sentiment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea 
              placeholder="Enter text to analyze..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={6}
            />
            <Button onClick={handleSentiment} disabled={isLoading || !inputText.trim()} className="w-full">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Analyze
            </Button>
            {result && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{result}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
