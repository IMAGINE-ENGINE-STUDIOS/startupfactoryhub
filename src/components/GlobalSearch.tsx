import { useState, useEffect } from 'react';
import { Search, Users, Building, Calendar, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  id: string;
  type: 'user' | 'startup' | 'event' | 'resource';
  title: string;
  subtitle?: string;
  avatar?: string;
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (query.trim().length > 0) {
      performSearch(query);
    } else {
      setResults([]);
    }
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setIsSearching(true);

    try {
      const { data, error } = await supabase.functions.invoke('search', {
        body: { query: searchQuery },
      });

      if (error) throw error;

      const searchResults: SearchResult[] = [];

      // Map users
      data.results.users?.forEach((user: any) => {
        searchResults.push({
          id: user.user_id,
          type: 'user',
          title: user.full_name,
          subtitle: user.role,
          avatar: user.avatar_url,
        });
      });

      // Map startups
      data.results.startups?.forEach((startup: any) => {
        searchResults.push({
          id: startup.id,
          type: 'startup',
          title: startup.name,
          subtitle: `${startup.industry} • ${startup.stage || 'Early Stage'}`,
          avatar: startup.logo_url,
        });
      });

      // Map events
      data.results.events?.forEach((event: any) => {
        searchResults.push({
          id: event.id,
          type: 'event',
          title: event.title,
          subtitle: new Date(event.start_date).toLocaleDateString(),
          avatar: event.banner_url,
        });
      });

      // Map resources
      data.results.resources?.forEach((resource: any) => {
        searchResults.push({
          id: resource.id,
          type: 'resource',
          title: resource.title,
          subtitle: `${resource.category} • by ${resource.instructor_name || 'Unknown'}`,
          avatar: resource.thumbnail_url,
        });
      });

      setResults(searchResults);
    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: 'Search failed',
        description: error.message || 'Failed to perform search',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    
    // Navigate based on type
    switch (result.type) {
      case 'user':
        navigate(`/profile?id=${result.id}`);
        break;
      case 'startup':
        navigate(`/profile?company=${result.id}`);
        break;
      case 'event':
        navigate(`/events?id=${result.id}`);
        break;
      case 'resource':
        navigate(`/dashboard?tab=learn&course=${result.id}`);
        break;
    }
  };

  return (
    <>
      <Button
        variant="outline"
        className="relative w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Search...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search users, startups, events..." 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {isSearching ? (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-sm">Searching...</p>
            </div>
          ) : results.length === 0 && query.trim().length > 0 ? (
            <CommandEmpty>No results found.</CommandEmpty>
          ) : (
            <>
              {results.filter(r => r.type === 'user').length > 0 && (
                <CommandGroup heading="Users">
                  {results
                    .filter(r => r.type === 'user')
                    .map(result => (
                      <CommandItem 
                        key={result.id} 
                        onSelect={() => handleSelect(result)}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        <div className="flex-1">
                          <p className="font-medium">{result.title}</p>
                          {result.subtitle && (
                            <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                </CommandGroup>
              )}

              {results.filter(r => r.type === 'startup').length > 0 && (
                <CommandGroup heading="Startups">
                  {results
                    .filter(r => r.type === 'startup')
                    .map(result => (
                      <CommandItem 
                        key={result.id}
                        onSelect={() => handleSelect(result)}
                      >
                        <Building className="mr-2 h-4 w-4" />
                        <div className="flex-1">
                          <p className="font-medium">{result.title}</p>
                          {result.subtitle && (
                            <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                </CommandGroup>
              )}

              {results.filter(r => r.type === 'event').length > 0 && (
                <CommandGroup heading="Events">
                  {results
                    .filter(r => r.type === 'event')
                    .map(result => (
                      <CommandItem 
                        key={result.id}
                        onSelect={() => handleSelect(result)}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        <div className="flex-1">
                          <p className="font-medium">{result.title}</p>
                          {result.subtitle && (
                            <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                </CommandGroup>
              )}

              {results.filter(r => r.type === 'resource').length > 0 && (
                <CommandGroup heading="Resources">
                  {results
                    .filter(r => r.type === 'resource')
                    .map(result => (
                      <CommandItem 
                        key={result.id}
                        onSelect={() => handleSelect(result)}
                      >
                        <BookOpen className="mr-2 h-4 w-4" />
                        <div className="flex-1">
                          <p className="font-medium">{result.title}</p>
                          {result.subtitle && (
                            <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
