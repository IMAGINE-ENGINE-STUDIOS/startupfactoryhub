import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, Languages } from 'lucide-react';
import { useLanguage, LANGUAGES } from '@/contexts/LanguageContext';

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);

  const currentLang = LANGUAGES.find(l => l.code === language);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="neon-glow hover:scale-110 transition-transform duration-300 h-9 w-9 sm:h-10 sm:w-10 relative"
          title={t('header.language')}
        >
          <span className="text-base leading-none">{currentLang?.flag || '🇺🇸'}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-52 p-1.5"
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center gap-2 px-2.5 py-2 border-b border-border/50 mb-1">
          <Languages className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t('header.language')}
          </span>
        </div>
        <ScrollArea className="max-h-[320px]">
          <div className="space-y-0.5">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors ${
                  language === lang.code
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground hover:bg-accent'
                }`}
              >
                <span className="text-base">{lang.flag}</span>
                <span className="flex-1 text-left">{lang.name}</span>
                {language === lang.code && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
