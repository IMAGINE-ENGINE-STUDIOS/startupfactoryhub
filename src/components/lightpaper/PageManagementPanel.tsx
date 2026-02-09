import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Copy, MoveUp, MoveDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PageManagementPanelProps {
  numPages: number;
  currentPage: number;
  onPageSelect: (page: number) => void;
  onAddPage: () => void;
  onDeletePage: (page: number) => void;
  onDuplicatePage: (page: number) => void;
  onMovePage: (from: number, to: number) => void;
  pageThumbnails?: string[];
}

export const PageManagementPanel = ({
  numPages,
  currentPage,
  onPageSelect,
  onAddPage,
  onDeletePage,
  onDuplicatePage,
  onMovePage,
  pageThumbnails = []
}: PageManagementPanelProps) => {
  const { toast } = useToast();

  const handleDeletePage = (page: number) => {
    if (numPages <= 1) {
      toast({
        title: "Cannot Delete",
        description: "Cannot delete the last page",
        variant: "destructive",
      });
      return;
    }
    onDeletePage(page);
  };

  const handleMoveUp = (page: number) => {
    if (page === 1) return;
    onMovePage(page, page - 1);
  };

  const handleMoveDown = (page: number) => {
    if (page === numPages) return;
    onMovePage(page, page + 1);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold mb-1">Pages</h3>
        <p className="text-xs text-muted-foreground mb-3">{numPages} page{numPages !== 1 ? 's' : ''}</p>
        <Button onClick={onAddPage} size="sm" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Blank Page
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
            <Card
              key={pageNum}
              className={`p-2.5 cursor-pointer transition-all ${
                currentPage === pageNum ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-accent'
              }`}
              onClick={() => onPageSelect(pageNum)}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex-shrink-0 w-14 h-[72px] bg-muted rounded flex items-center justify-center text-[10px] text-muted-foreground border overflow-hidden">
                  {pageThumbnails[pageNum - 1] ? (
                    <img
                      src={pageThumbnails[pageNum - 1]}
                      alt={`Page ${pageNum}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="font-medium">{pageNum}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium mb-1.5">
                    Page {pageNum}
                    {currentPage === pageNum && (
                      <span className="ml-1.5 text-[10px] text-primary font-normal">(current)</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveUp(pageNum);
                      }}
                      disabled={pageNum === 1}
                      className="h-7 w-7 p-0"
                      title="Move Up"
                    >
                      <MoveUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveDown(pageNum);
                      }}
                      disabled={pageNum === numPages}
                      className="h-7 w-7 p-0"
                      title="Move Down"
                    >
                      <MoveDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicatePage(pageNum);
                      }}
                      className="h-7 w-7 p-0"
                      title="Duplicate Page"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePage(pageNum);
                      }}
                      disabled={numPages <= 1}
                      className="h-7 w-7 p-0 hover:text-destructive hover:border-destructive"
                      title="Delete Page"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};