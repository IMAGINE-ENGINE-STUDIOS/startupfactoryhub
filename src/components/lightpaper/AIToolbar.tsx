import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AIToolbarProps {
  onInsertText: (text: string) => void;
  isDarkMode: boolean;
  isEditMode: boolean;
}

export function AIToolbar({ onInsertText, isDarkMode, isEditMode }: AIToolbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-chatbot', {
        body: { 
          message: `Search the document for: ${searchQuery} and provide relevant results`,
          text: searchQuery 
        }
      });
      
      if (error) throw error;
      
      const result = data.message || data.response || 'No results found';
      setAiResponse(result);
      setShowResults(true);
      toast.success('Search complete');
    } catch (err: any) {
      if (err.message?.includes('429')) {
        toast.error('Rate limit exceeded. Please try again later.');
      } else if (err.message?.includes('402')) {
        toast.error('AI credits exhausted. Please upgrade your plan.');
      } else {
        toast.error('Search failed: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      {/* Minimal AI Search Toolbar - Only visible when editing */}
      <div className={`
        absolute top-2 right-2 z-50 
        flex items-center gap-1
        transition-all duration-200
        ${isEditMode ? 'opacity-30 hover:opacity-100' : 'opacity-0 pointer-events-none'}
      `}>
        <Search className="h-4 w-4 text-foreground/50" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
          placeholder="..."
          disabled={isLoading}
          className="
            w-16 h-6 px-2 text-xs
            bg-transparent hover:bg-white/5 focus:bg-white/10
            border-0 focus:border-0 focus:ring-0
            rounded-full
            transition-all
            focus:w-48
            placeholder:text-foreground/30
          "
        />
      </div>
      
      {/* AI Search Results Popup */}
      {showResults && (
        <div className="absolute top-10 right-2 bg-card/95 backdrop-blur-sm border rounded-lg shadow-xl p-3 max-w-md z-50">
          <p className="text-sm mb-2 whitespace-pre-wrap">{aiResponse}</p>
          <div className="flex justify-end gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setShowResults(false)}
            >
              Close
            </Button>
            <Button 
              size="sm" 
              onClick={() => {
                onInsertText(aiResponse);
                setShowResults(false);
                toast.success('Text inserted');
              }}
            >
              Insert
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
