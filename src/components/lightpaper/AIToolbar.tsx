import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, FileText, Languages, TrendingUp, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AIToolbarProps {
  onInsertText: (text: string) => void;
  isDarkMode: boolean;
}

export function AIToolbar({ onInsertText, isDarkMode }: AIToolbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [showResponsePopup, setShowResponsePopup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const aiTools = [
    { id: 'chat', icon: Bot, label: 'Ask AI', endpoint: 'ai-chatbot' },
    { id: 'summarize', icon: FileText, label: 'Summarize', endpoint: 'ai-text-summarizer' },
    { id: 'translate', icon: Languages, label: 'Translate', endpoint: 'ai-translator' },
    { id: 'sentiment', icon: TrendingUp, label: 'Sentiment', endpoint: 'ai-sentiment-analyzer' },
  ];
  
  const handleAIToolClick = async (endpoint: string, label: string) => {
    if (!searchQuery.trim()) {
      toast.error('Please enter some text first');
      return;
    }
    
    setIsLoading(true);
    setShowAIMenu(false);
    toast.loading(`Processing with ${label}...`);
    
    try {
      const { data, error } = await supabase.functions.invoke(endpoint, {
        body: { message: searchQuery, text: searchQuery }
      });
      
      if (error) throw error;
      
      const result = data.message || data.summary || data.translation || data.result || data.response || 'No response received';
      setAiResponse(result);
      setShowResponsePopup(true);
      toast.dismiss();
      toast.success('AI processing complete!');
    } catch (err: any) {
      toast.dismiss();
      if (err.message?.includes('429')) {
        toast.error('Rate limit exceeded. Please try again later.');
      } else if (err.message?.includes('402')) {
        toast.error('AI credits exhausted. Please upgrade your plan.');
      } else {
        toast.error('AI request failed: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      {/* Compact AI Toolbar */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-background/95 backdrop-blur-sm border rounded-lg p-2 shadow-lg">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Ask AI..."
          className="w-48 h-8 text-sm"
          disabled={isLoading}
        />
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => setShowAIMenu(!showAIMenu)}
          disabled={isLoading}
        >
          <Plus className="h-4 w-4" />
        </Button>
        
        {showAIMenu && (
          <div className="absolute top-12 right-0 bg-background border rounded-lg shadow-xl p-2 space-y-1 min-w-[160px]">
            {aiTools.map(tool => (
              <Button
                key={tool.id}
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => handleAIToolClick(tool.endpoint, tool.label)}
              >
                <tool.icon className="h-4 w-4 mr-2" />
                {tool.label}
              </Button>
            ))}
          </div>
        )}
      </div>
      
      {/* AI Response Popup */}
      <Dialog open={showResponsePopup} onOpenChange={setShowResponsePopup}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI Response</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-96 p-4 bg-muted/30 rounded">
            <p className="whitespace-pre-wrap">{aiResponse}</p>
          </ScrollArea>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowResponsePopup(false)}>
              Close
            </Button>
            <Button onClick={() => {
              onInsertText(aiResponse);
              setShowResponsePopup(false);
              toast.success('Text inserted into document');
            }}>
              Insert into Document
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
