import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { useCourseCompletion } from '@/hooks/useCourseCompletion';

interface CourseVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: {
    id: string;
    title: string;
    playlist_url: string;
  } | null;
}

// Convert YouTube URLs to proper embed format
const convertToEmbedUrl = (url: string): string => {
  if (!url) return '';
  
  // Already an embed URL
  if (url.includes('/embed/')) return url;
  
  // Playlist URL: youtube.com/playlist?list=PLAYLIST_ID
  if (url.includes('playlist?list=')) {
    const playlistId = url.split('list=')[1]?.split('&')[0];
    return `https://www.youtube.com/embed/videoseries?list=${playlistId}&enablejsapi=1`;
  }
  
  // Watch URL: youtube.com/watch?v=VIDEO_ID
  if (url.includes('watch?v=')) {
    const videoId = url.split('v=')[1]?.split('&')[0];
    return `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;
  }
  
  // youtu.be short URL
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    return `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;
  }
  
  return url;
};

export function CourseVideoDialog({ open, onOpenChange, course }: CourseVideoDialogProps) {
  const { isCompleted, markCourseComplete } = useCourseCompletion();

  if (!course) return null;

  const embedUrl = convertToEmbedUrl(course.playlist_url);
  const completed = isCompleted(course.id);

  const handleMarkComplete = () => {
    markCourseComplete(course.id, course.title);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">{course.title}</DialogTitle>
            {completed && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">Completed</span>
              </div>
            )}
          </div>
        </DialogHeader>
        <div className="p-6">
          <div className="aspect-video w-full rounded-lg overflow-hidden bg-black shadow-2xl">
            <iframe
              width="100%"
              height="100%"
              src={embedUrl}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
              title={course.title}
            />
          </div>
          {!completed && (
            <div className="mt-4 flex justify-end">
              <Button onClick={handleMarkComplete} variant="default">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark as Complete & Earn 50 Points
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}