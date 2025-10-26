import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePDFEditorStore } from '@/stores/pdfEditorStore';
import { cn } from '@/lib/utils';

interface PDFPageNavigatorProps {
  onPageChange: (page: number) => void;
}

export const PDFPageNavigator = ({ onPageChange }: PDFPageNavigatorProps) => {
  const { currentPage, totalPages } = usePDFEditorStore();

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => {
    onPageChange(page);
  };

  if (totalPages <= 1) return null;

  return (
    <Card className="w-64 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Pages</h3>
        <span className="text-xs text-muted-foreground">
          {currentPage} / {totalPages}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="flex-1"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="flex-1"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageClick(page)}
              className={cn(
                'w-full p-3 text-left rounded-lg border-2 transition-all hover:border-primary/50',
                currentPage === page
                  ? 'border-primary bg-primary/5'
                  : 'border-transparent bg-muted/50'
              )}
            >
              <div className="text-sm font-medium">Page {page}</div>
              <div className="text-xs text-muted-foreground">
                Click to edit
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};
