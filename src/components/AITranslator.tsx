import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Languages, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AITranslatorProps {
  text: string;
  onTranslate?: (translatedText: string) => void;
  className?: string;
}

const languages = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ru', name: 'Russian' },
];

export default function AITranslator({ text, onTranslate, className }: AITranslatorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const { toast } = useToast();

  const handleTranslate = async () => {
    if (!selectedLanguage || !text) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-translator', {
        body: { 
          text,
          targetLanguage: selectedLanguage,
          sourceLanguage: 'auto'
        }
      });

      if (error) throw error;

      setTranslatedText(data.translated_text);
      setShowTranslation(true);
      
      if (onTranslate) {
        onTranslate(data.translated_text);
      }
    } catch (error: any) {
      console.error('Error translating:', error);
      toast({
        title: "Translation Error",
        description: error.message || "Failed to translate text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={className}>
      <div className="flex gap-2 items-center">
        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {languages.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={handleTranslate}
          disabled={!selectedLanguage || isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Languages className="h-4 w-4" />
          )}
          Translate
        </Button>
      </div>

      {showTranslation && translatedText && (
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">Translation:</p>
          <p className="text-sm">{translatedText}</p>
        </div>
      )}
    </div>
  );
}
