import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';
import { TextItem } from '@/lib/pdf/textExtractor';

interface PDFSearchDialogProps {
  open: boolean;
  onClose: () => void;
  textItems: TextItem[];
  onResultSelect: (result: SearchResult) => void;
}

export interface SearchResult {
  page: number;
  x: number;
  y: number;
  text: string;
  index: number;
}

export function PDFSearchDialog({ open, onClose, textItems, onResultSelect }: PDFSearchDialogProps) {
  const [query, setQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const searchResults: SearchResult[] = [];
    textItems.forEach((item, idx) => {
      let matches = false;
      
      if (wholeWord) {
        const regex = new RegExp(`\\b${query}\\b`, caseSensitive ? '' : 'i');
        matches = regex.test(item.text);
      } else {
        matches = caseSensitive 
          ? item.text.includes(query)
          : item.text.toLowerCase().includes(query.toLowerCase());
      }

      if (matches) {
        searchResults.push({
          page: item.page,
          x: item.x,
          y: item.y,
          text: item.text,
          index: idx,
        });
      }
    });

    setResults(searchResults);
    setCurrentIndex(0);
    
    if (searchResults.length > 0) {
      onResultSelect(searchResults[0]);
    }
  }, [query, caseSensitive, wholeWord, textItems]);

  const handleNext = () => {
    if (results.length === 0) return;
    const newIndex = (currentIndex + 1) % results.length;
    setCurrentIndex(newIndex);
    onResultSelect(results[newIndex]);
  };

  const handlePrevious = () => {
    if (results.length === 0) return;
    const newIndex = currentIndex === 0 ? results.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
    onResultSelect(results[newIndex]);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search in PDF
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search text..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <Button variant="ghost" size="icon" onClick={() => setQuery('')}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="case-sensitive"
                checked={caseSensitive}
                onCheckedChange={(checked) => setCaseSensitive(checked === true)}
              />
              <Label htmlFor="case-sensitive" className="text-sm">Case sensitive</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="whole-word"
                checked={wholeWord}
                onCheckedChange={(checked) => setWholeWord(checked === true)}
              />
              <Label htmlFor="whole-word" className="text-sm">Whole word</Label>
            </div>
          </div>

          {results.length > 0 && (
            <div className="flex items-center justify-between gap-4 p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">
                Result {currentIndex + 1} of {results.length}
              </span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={handlePrevious}>
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleNext}>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {query && results.length === 0 && (
            <div className="text-sm text-center text-muted-foreground p-4">
              No results found
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
