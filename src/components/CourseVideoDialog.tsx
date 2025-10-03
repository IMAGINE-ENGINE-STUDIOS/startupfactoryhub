import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CourseVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: {
    title: string;
    playlist_url: string;
  } | null;
}

export function CourseVideoDialog({ open, onOpenChange, course }: CourseVideoDialogProps) {
  if (!course) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold">{course.title}</DialogTitle>
        </DialogHeader>
        <div className="p-6">
          <div className="aspect-video w-full rounded-lg overflow-hidden bg-black shadow-2xl">
            <iframe
              width="100%"
              height="100%"
              src={course.playlist_url}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
              title={course.title}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}