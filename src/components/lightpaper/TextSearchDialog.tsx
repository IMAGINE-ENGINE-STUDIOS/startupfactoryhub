import { useState } from "react";
import { Search, X, ChevronUp, ChevronDown, Replace } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface TextSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch: (query: string, options: SearchOptions) => void;
  onReplace: (searchQuery: string, replaceText: string, replaceAll: boolean) => void;
  currentMatch: number;
  totalMatches: number;
  onNextMatch: () => void;
  onPreviousMatch: () => void;
}

export interface SearchOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
}

export function TextSearchDialog({
  open,
  onOpenChange,
  onSearch,
  onReplace,
  currentMatch,
  totalMatches,
  onNextMatch,
  onPreviousMatch,
}: TextSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [showReplace, setShowReplace] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search term");
      return;
    }
    onSearch(searchQuery, { caseSensitive, wholeWord });
  };

  const handleReplace = () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search term");
      return;
    }
    onReplace(searchQuery, replaceText, false);
  };

  const handleReplaceAll = () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search term");
      return;
    }
    onReplace(searchQuery, replaceText, true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find {showReplace && "& Replace"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search-input">Search for</Label>
            <div className="flex gap-2">
              <Input
                id="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
                placeholder="Enter search term..."
                className="flex-1"
              />
              <Button onClick={handleSearch} size="sm">
                Search
              </Button>
            </div>
            {totalMatches > 0 && (
              <p className="text-sm text-muted-foreground">
                Match {currentMatch + 1} of {totalMatches}
              </p>
            )}
          </div>

          {showReplace && (
            <div className="space-y-2">
              <Label htmlFor="replace-input">Replace with</Label>
              <div className="flex gap-2">
                <Input
                  id="replace-input"
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  placeholder="Enter replacement text..."
                  className="flex-1"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="case-sensitive"
                checked={caseSensitive}
                onCheckedChange={(checked) => setCaseSensitive(checked === true)}
              />
              <Label htmlFor="case-sensitive" className="text-sm cursor-pointer">
                Case sensitive
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="whole-word"
                checked={wholeWord}
                onCheckedChange={(checked) => setWholeWord(checked === true)}
              />
              <Label htmlFor="whole-word" className="text-sm cursor-pointer">
                Whole word
              </Label>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplace(!showReplace)}
            >
              <Replace className="h-4 w-4 mr-2" />
              {showReplace ? "Hide" : "Show"} Replace
            </Button>

            <div className="flex gap-2">
              {totalMatches > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onPreviousMatch}
                    disabled={totalMatches === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onNextMatch}
                    disabled={totalMatches === 0}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </>
              )}

              {showReplace && totalMatches > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={handleReplace}>
                    Replace
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleReplaceAll}>
                    Replace All
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
