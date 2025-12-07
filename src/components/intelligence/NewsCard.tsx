import { ExternalLink, Clock, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface NewsCardProps {
  title: string;
  text: string;
  url: string;
  site: string;
  published: string;
  author: string;
  category: string;
  image?: string;
}

export const NewsCard = ({ 
  title, 
  text, 
  url, 
  site, 
  published, 
  author, 
  category,
  image 
}: NewsCardProps) => {
  const timeAgo = published 
    ? formatDistanceToNow(new Date(published), { addSuffix: true }) 
    : 'Recently';

  const getSiteLogo = (siteUrl: string) => {
    try {
      const domain = new URL(siteUrl).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };

  const categoryColors: Record<string, string> = {
    startups: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    fintech: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    ai: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    healthtech: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    climate: 'bg-green-500/20 text-green-400 border-green-500/30',
    enterprise: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    general: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <Card className="tech-card border-0 p-4 flex flex-col h-full min-h-[200px]">
      <div className="flex items-start gap-3 mb-3">
        {/* Site favicon */}
        <div className="flex-shrink-0">
          {getSiteLogo(url) ? (
            <img 
              src={getSiteLogo(url)!} 
              alt={site} 
              className="w-8 h-8 rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-bold">
              {site.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span className="font-medium truncate">{site}</span>
            <span>•</span>
            <Clock className="w-3 h-3" />
            <span>{timeAgo}</span>
          </div>
          <h3 className="font-semibold text-sm line-clamp-2 leading-tight">
            {title}
          </h3>
        </div>
      </div>

      {/* Article preview */}
      <p className="text-xs text-muted-foreground line-clamp-3 flex-1 mb-3">
        {text}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={`text-[10px] ${categoryColors[category] || categoryColors.general}`}
          >
            {category}
          </Badge>
          {author && author !== 'Unknown' && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <User className="w-3 h-3" />
              <span className="truncate max-w-[80px]">{author}</span>
            </span>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
        >
          Read
          <ExternalLink className="w-3 h-3" />
        </Button>
      </div>
    </Card>
  );
};
