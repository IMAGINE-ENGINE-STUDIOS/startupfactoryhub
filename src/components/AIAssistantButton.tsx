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
        className="fixed bottom-24 sm:bottom-6 left-4 sm:left-6 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg z-40"
        size="icon"
        title="AI Assistant"
      >
        <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>
      
      <AIAssistant isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
