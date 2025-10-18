import { useState, useCallback, useMemo } from 'react';

export interface SearchMatch {
  index: number;
  text: string;
  context?: string;
}

export function useSearch(content: string) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [caseSensitive, setCaseSensitive] = useState(false);

  const matches = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = caseSensitive ? searchQuery : searchQuery.toLowerCase();
    const searchContent = caseSensitive ? content : content.toLowerCase();
    const results: SearchMatch[] = [];
    let index = 0;

    while (true) {
      index = searchContent.indexOf(query, index);
      if (index === -1) break;

      // Get context around the match
      const contextStart = Math.max(0, index - 50);
      const contextEnd = Math.min(content.length, index + query.length + 50);
      const context = content.substring(contextStart, contextEnd);

      results.push({
        index,
        text: content.substring(index, index + query.length),
        context
      });

      index += query.length;
    }

    return results;
  }, [content, searchQuery, caseSensitive]);

  const goToNext = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % matches.length);
  }, [matches.length]);

  const goToPrevious = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + matches.length) % matches.length);
  }, [matches.length]);

  const currentMatch = matches.length > 0 ? matches[currentMatchIndex] : null;

  return {
    searchQuery,
    setSearchQuery,
    matches,
    currentMatch,
    currentMatchIndex,
    goToNext,
    goToPrevious,
    caseSensitive,
    setCaseSensitive,
  };
}
