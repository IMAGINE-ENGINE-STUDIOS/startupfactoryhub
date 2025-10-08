import { useState } from 'react';
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

interface SearchResult {
  id: string;
  type: 'user' | 'startup' | 'event' | 'resource';
  title: string;
  subtitle?: string;
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [results] = useState<SearchResult[]>([
    { id: '1', type: 'user', title: 'Sarah Chen', subtitle: 'Mentor - AI & ML' },
    { id: '2', type: 'startup', title: 'TechVenture AI', subtitle: 'Series A' },
    { id: '3', type: 'event', title: 'Startup Pitch Day', subtitle: 'Tomorrow at 2 PM' },
    { id: '4', type: 'resource', title: 'Fundraising 101', subtitle: 'Course' },
  ]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <Users className="h-4 w-4" />;
      case 'startup':
        return <Building className="h-4 w-4" />;
      case 'event':
        return <Calendar className="h-4 w-4" />;
      case 'resource':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
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
        <CommandInput placeholder="Search users, startups, events..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Users">
            {results
              .filter(r => r.type === 'user')
              .map(result => (
                <CommandItem key={result.id}>
                  {getIcon(result.type)}
                  <div className="ml-2">
                    <p className="font-medium">{result.title}</p>
                    {result.subtitle && (
                      <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                    )}
                  </div>
                </CommandItem>
              ))}
          </CommandGroup>
          <CommandGroup heading="Startups">
            {results
              .filter(r => r.type === 'startup')
              .map(result => (
                <CommandItem key={result.id}>
                  {getIcon(result.type)}
                  <div className="ml-2">
                    <p className="font-medium">{result.title}</p>
                    {result.subtitle && (
                      <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                    )}
                  </div>
                </CommandItem>
              ))}
          </CommandGroup>
          <CommandGroup heading="Events">
            {results
              .filter(r => r.type === 'event')
              .map(result => (
                <CommandItem key={result.id}>
                  {getIcon(result.type)}
                  <div className="ml-2">
                    <p className="font-medium">{result.title}</p>
                    {result.subtitle && (
                      <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                    )}
                  </div>
                </CommandItem>
              ))}
          </CommandGroup>
          <CommandGroup heading="Resources">
            {results
              .filter(r => r.type === 'resource')
              .map(result => (
                <CommandItem key={result.id}>
                  {getIcon(result.type)}
                  <div className="ml-2">
                    <p className="font-medium">{result.title}</p>
                    {result.subtitle && (
                      <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                    )}
                  </div>
                </CommandItem>
              ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
