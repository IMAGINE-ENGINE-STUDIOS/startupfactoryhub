import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, Share2, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface ShareSessionDialogProps {
  open: boolean;
  onClose: () => void;
  sessionId: string | null;
}

export const ShareSessionDialog = ({ open, onClose, sessionId }: ShareSessionDialogProps) => {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');

  const shareUrl = sessionId 
    ? `${window.location.origin}/shared-pdf/${sessionId}`
    : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleShareByEmail = async () => {
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    // Create mailto link
    const subject = encodeURIComponent('Join my PDF editing session');
    const body = encodeURIComponent(
      `I'd like to invite you to collaborate on a PDF document.\n\nClick the link below to join:\n${shareUrl}`
    );
    
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    
    toast.success('Email client opened');
    setEmail('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            <DialogTitle>Share PDF Session</DialogTitle>
          </div>
          <DialogDescription>
            Share this link with others to collaborate in real-time
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Copy Link Section */}
          <div className="space-y-2">
            <Label htmlFor="share-link">Session Link</Label>
            <div className="flex gap-2">
              <Input
                id="share-link"
                value={shareUrl}
                readOnly
                className="flex-1 font-mono text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Email Share Section */}
          <div className="space-y-2">
            <Label htmlFor="email">Share via Email</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={handleShareByEmail}
                disabled={!email}
                className="shrink-0"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send
              </Button>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Collaboration Features:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 ml-4">
              <li>• See cursors of other users in real-time</li>
              <li>• View who's currently editing</li>
              <li>• All changes sync automatically</li>
              <li>• Join/leave notifications</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
