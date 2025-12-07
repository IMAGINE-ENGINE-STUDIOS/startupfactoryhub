import { useState, useEffect } from 'react';
import { Newspaper, RefreshCw, Search, Filter } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { NewsCard } from './NewsCard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Article {
  title: string;
  text: string;
  url: string;
  site: string;
  published: string;
  author: string;
  category: string;
  image?: string;
}

const categories = [
  { id: 'all', label: 'All News', icon: '📰' },
  { id: 'startups', label: 'Startups', icon: '🚀' },
  { id: 'fintech', label: 'FinTech', icon: '💳' },
  { id: 'ai', label: 'AI & ML', icon: '🤖' },
  { id: 'healthtech', label: 'HealthTech', icon: '🏥' },
  { id: 'climate', label: 'Climate', icon: '🌍' },
  { id: 'enterprise', label: 'Enterprise', icon: '🏢' },
];

export const NewsSection = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchNews = async (category: string = 'all', query?: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('fetch-news', {
        body: { 
          category: category === 'all' ? undefined : category,
          query: query || undefined,
          size: 12
        }
      });

      if (error) throw error;

      if (data?.articles) {
        setArticles(data.articles);
      } else {
        setArticles([]);
      }
    } catch (error: any) {
      console.error('Error fetching news:', error);
      toast.error('Failed to load news articles');
      setArticles([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews(selectedCategory);
  }, [selectedCategory]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchNews(selectedCategory, searchQuery);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      fetchNews('all', searchQuery);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Card className="tech-card border-0 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Newspaper className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Latest News</h2>
            <p className="text-xs text-muted-foreground">
              Real-time industry updates powered by Webz.io
            </p>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search news..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-9 bg-background/50"
          />
        </div>
        <Button onClick={handleSearch} size="sm">
          Search
        </Button>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => (
          <Badge
            key={cat.id}
            variant={selectedCategory === cat.id ? 'default' : 'outline'}
            className={`cursor-pointer transition-all ${
              selectedCategory === cat.id 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-muted'
            }`}
            onClick={() => {
              setSelectedCategory(cat.id);
              setSearchQuery('');
            }}
          >
            <span className="mr-1">{cat.icon}</span>
            {cat.label}
          </Badge>
        ))}
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="tech-card border-0 p-4 min-h-[200px]">
              <div className="flex items-start gap-3 mb-3">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
              <Skeleton className="h-12 w-full mb-3" />
              <div className="flex justify-between">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-7 w-16" />
              </div>
            </Card>
          ))}
        </div>
      ) : articles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((article, index) => (
            <NewsCard
              key={`${article.url}-${index}`}
              {...article}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Newspaper className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No articles found</h3>
          <p className="text-sm text-muted-foreground">
            Try a different search term or category
          </p>
        </div>
      )}
    </Card>
  );
};
