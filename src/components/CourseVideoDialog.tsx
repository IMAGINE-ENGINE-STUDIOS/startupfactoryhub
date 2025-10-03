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
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle>{course.title}</DialogTitle>
        </DialogHeader>
        <div className="aspect-video w-full">
          <iframe
            width="100%"
            height="100%"
            src={course.playlist_url}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="rounded-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}