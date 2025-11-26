import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Copy, RotateCw, MoveUp, MoveDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PageManagementPanelProps {
  numPages: number;
  currentPage: number;
  onPageSelect: (page: number) => void;
  onAddPage: () => void;
  onDeletePage: (page: number) => void;
  onDuplicatePage: (page: number) => void;
  onRotatePage: (page: number) => void;
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
  onRotatePage,
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
        <h3 className="text-lg font-semibold mb-3">Pages</h3>
        <Button onClick={onAddPage} size="sm" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Blank Page
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
            <Card
              key={pageNum}
              className={`p-3 cursor-pointer transition-all ${
                currentPage === pageNum ? 'ring-2 ring-primary' : 'hover:bg-accent'
              }`}
              onClick={() => onPageSelect(pageNum)}
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-16 h-20 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground border">
                  {pageThumbnails[pageNum - 1] ? (
                    <img
                      src={pageThumbnails[pageNum - 1]}
                      alt={`Page ${pageNum}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    `Page ${pageNum}`
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium mb-1">Page {pageNum}</div>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicatePage(pageNum);
                      }}
                      className="h-8 w-8 p-0"
                      title="Duplicate"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRotatePage(pageNum);
                      }}
                      className="h-8 w-8 p-0"
                      title="Rotate 90°"
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveUp(pageNum);
                      }}
                      disabled={pageNum === 1}
                      className="h-8 w-8 p-0"
                      title="Move Up"
                    >
                      <MoveUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveDown(pageNum);
                      }}
                      disabled={pageNum === numPages}
                      className="h-8 w-8 p-0"
                      title="Move Down"
                    >
                      <MoveDown className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePage(pageNum);
                      }}
                      className="h-8 w-8 p-0 hover:text-destructive hover:border-destructive"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
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