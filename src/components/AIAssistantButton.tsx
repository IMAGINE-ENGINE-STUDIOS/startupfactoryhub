import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import AIAssistant from './AIAssistant';

export default function AIAssistantButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 h-14 w-14 rounded-full shadow-lg z-40"
        size="icon"
        title="AI Assistant"
      >
        <Sparkles className="h-6 w-6" />
      </Button>
      
      <AIAssistant isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
