import { Dialog, DialogContent } from '@/components/ui/dialog';
import VideoConferencing from './VideoConferencing';

interface VideoMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingLink: string;
  userId?: string;
  hostId?: string;
  userName?: string;
  meetingTitle?: string;
}

export default function VideoMeetingDialog({
  open,
  onOpenChange,
  meetingLink,
  userId,
  hostId,
  userName,
  meetingTitle,
}: VideoMeetingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0">
        <VideoConferencing
          roomUrl={meetingLink}
          userId={userId}
          hostId={hostId}
          userName={userName}
          meetingTitle={meetingTitle}
          onLeave={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
