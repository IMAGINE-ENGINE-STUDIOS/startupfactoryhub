import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            {showReplace ? "Find and Replace" : "Find"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">Find</Label>
            <div className="flex gap-2">
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter search text..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
                autoFocus
              />
              <Button onClick={handleSearch} size="sm">
                Search
              </Button>
            </div>
          </div>

          {showReplace && (
            <div className="space-y-2">
              <Label htmlFor="replace">Replace with</Label>
              <div className="flex gap-2">
                <Input
                  id="replace"
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  placeholder="Enter replacement text..."
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="case-sensitive"
                checked={caseSensitive}
                onCheckedChange={(checked) => setCaseSensitive(checked as boolean)}
              />
              <Label htmlFor="case-sensitive" className="text-sm cursor-pointer">
                Case sensitive
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="whole-word"
                checked={wholeWord}
                onCheckedChange={(checked) => setWholeWord(checked as boolean)}
              />
              <Label htmlFor="whole-word" className="text-sm cursor-pointer">
                Whole word
              </Label>
            </div>
          </div>

          {matchCount > 0 && (
            <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
              <span className="text-sm">
                {currentMatch + 1} of {matchCount} matches
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPrevious}
                  disabled={matchCount === 0}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNext}
                  disabled={matchCount === 0}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {showReplace && matchCount > 0 && (
            <div className="flex gap-2">
              <Button onClick={handleReplace} variant="outline" size="sm" className="flex-1">
                Replace
              </Button>
              <Button onClick={handleReplaceAll} variant="outline" size="sm" className="flex-1">
                Replace All
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
