import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp, X, Search } from "lucide-react";
import { toast } from "sonner";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch: (query: string, options: SearchOptions) => void;
  matchCount?: number;
  currentMatch?: number;
  onNext?: () => void;
  onPrevious?: () => void;
  showReplace?: boolean;
  onReplace?: (replaceText: string) => void;
  onReplaceAll?: (replaceText: string) => void;
}

export interface SearchOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
}

export function SearchDialog({
  open,
  onOpenChange,
  onSearch,
  matchCount = 0,
  currentMatch = 0,
  onNext,
  onPrevious,
  showReplace = false,
  onReplace,
  onReplaceAll,
}: SearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }
    onSearch(searchQuery, { caseSensitive, wholeWord });
  };

  const handleReplace = () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search query first");
      return;
    }
    onReplace?.(replaceText);
    toast.success("Text replaced");
  };

  const handleReplaceAll = () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search query first");
      return;
    }
    onReplaceAll?.(replaceText);
    toast.success(`Replaced ${matchCount} occurrences`);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label={showReplace ? "Find and Replace" : "Find"}
      className="
        fixed z-50 bg-background border shadow-2xl rounded-lg
        flex flex-col
        /* Desktop: docked right side */
        sm:top-20 sm:right-4 sm:bottom-auto sm:left-auto
        sm:w-[360px] sm:max-h-[calc(100vh-6rem)]
        /* Mobile: fits phone screen, bottom sheet */
        left-2 right-2 bottom-2
        max-h-[70vh]
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Search className="h-4 w-4" />
          {showReplace ? "Find and Replace" : "Find"}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-3 overflow-y-auto">
        <div className="space-y-1.5">
          <Label htmlFor="search" className="text-xs">Find</Label>
          <div className="flex gap-2">
            <Input
              id="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                // live-search so matches highlight in the document as user types
                if (e.target.value.trim()) {
                  onSearch(e.target.value, { caseSensitive, wholeWord });
                }
              }}
              placeholder="Enter search text..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (e.shiftKey) onPrevious?.();
                  else if (matchCount > 0) onNext?.();
                  else handleSearch();
                }
              }}
              autoFocus
              className="h-8"
            />
            <Button onClick={handleSearch} size="sm" className="h-8">
              Search
            </Button>
          </div>
        </div>

        {showReplace && (
          <div className="space-y-1.5">
            <Label htmlFor="replace" className="text-xs">Replace with</Label>
            <Input
              id="replace"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="Enter replacement text..."
              className="h-8"
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="case-sensitive"
              checked={caseSensitive}
              onCheckedChange={(checked) => setCaseSensitive(checked as boolean)}
            />
            <Label htmlFor="case-sensitive" className="text-xs cursor-pointer">
              Case sensitive
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="whole-word"
              checked={wholeWord}
              onCheckedChange={(checked) => setWholeWord(checked as boolean)}
            />
            <Label htmlFor="whole-word" className="text-xs cursor-pointer">
              Whole word
            </Label>
          </div>
        </div>

        {searchQuery.trim() && (
          <div className="flex items-center justify-between bg-muted p-2 rounded-md">
            <span className="text-xs">
              {matchCount > 0 ? `${currentMatch + 1} of ${matchCount} matches` : 'No matches'}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={onPrevious}
                disabled={matchCount === 0}
                aria-label="Previous match"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={onNext}
                disabled={matchCount === 0}
                aria-label="Next match"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {showReplace && matchCount > 0 && (
          <div className="flex gap-2">
            <Button onClick={handleReplace} variant="outline" size="sm" className="flex-1 h-8">
              Replace
            </Button>
            <Button onClick={handleReplaceAll} variant="outline" size="sm" className="flex-1 h-8">
              Replace All
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
