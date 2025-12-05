import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage, Language } from "@/contexts/LanguageContext";

interface LanguageSelectorProps {
  variant?: 'icon' | 'full';
  className?: string;
}

const languages: { code: Language; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
];

export function LanguageSelector({ variant = 'icon', className }: LanguageSelectorProps) {
  const { language, setLanguage, t } = useLanguage();
  
  const currentLanguage = languages.find(l => l.code === language);

  if (variant === 'full') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className={`gap-2 ${className}`}>
            <span className="text-lg">{currentLanguage?.flag}</span>
            <span className="text-sm">{currentLanguage?.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="tech-card border-0">
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`gap-2 cursor-pointer ${language === lang.code ? 'bg-primary/10' : ''}`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span>{lang.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`neon-glow hover:scale-110 transition-transform duration-300 ${className}`}
          title={t('common.selectLanguage')}
        >
          <span className="text-lg">{currentLanguage?.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="tech-card border-0">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`gap-2 cursor-pointer ${language === lang.code ? 'bg-primary/10' : ''}`}
          >
            <span className="text-lg">{lang.flag}</span>
            <span>{lang.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
