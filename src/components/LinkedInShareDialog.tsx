import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Linkedin, Link, Loader2, ExternalLink, Unlink } from 'lucide-react';

interface LinkedInShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postContent?: string;
  postImageUrl?: string;
}

export default function LinkedInShareDialog({
  open,
  onOpenChange,
  postContent = '',
  postImageUrl,
}: LinkedInShareDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [linkedinName, setLinkedinName] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [posting, setPosting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [text, setText] = useState('');
  const [articleUrl, setArticleUrl] = useState('');

  useEffect(() => {
    if (open && user) {
      checkConnection();
      setText(postContent);
    }
  }, [open, user]);

  // Listen for OAuth callback messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'linkedin-auth-success') {
        setConnecting(false);
        checkConnection();
        toast({ title: 'LinkedIn Connected!', description: 'You can now share posts to LinkedIn.' });
      } else if (event.data?.type === 'linkedin-auth-error') {
        setConnecting(false);
        toast({ title: 'Connection Failed', description: 'Could not connect to LinkedIn.', variant: 'destructive' });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const checkConnection = async () => {
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('linkedin-auth', {
        body: { action: 'check-connection' }
      });
      if (!error && data) {
        setIsConnected(data.isConnected);
        setLinkedinName(data.linkedinName);
      }
    } catch (err) {
      console.error('Check connection error:', err);
    } finally {
      setChecking(false);
    }
  };

  const connectLinkedIn = async () => {
    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('linkedin-auth', {
        body: { action: 'get-auth-url' }
      });
      if (error) throw error;
      if (data?.authUrl) {
        window.open(data.authUrl, 'linkedin-auth', 'width=600,height=700,scrollbars=yes');
      }
    } catch (err: any) {
      setConnecting(false);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const disconnectLinkedIn = async () => {
    try {
      await supabase.functions.invoke('linkedin-auth', {
        body: { action: 'disconnect' }
      });
      setIsConnected(false);
      setLinkedinName(null);
      toast({ title: 'Disconnected', description: 'LinkedIn account disconnected.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handlePost = async () => {
    if (!text.trim()) {
      toast({ title: 'Error', description: 'Please enter some text for your post.', variant: 'destructive' });
      return;
    }

    setPosting(true);
    try {
      const { data, error } = await supabase.functions.invoke('linkedin-post', {
        body: {
          text: text.trim(),
          articleUrl: articleUrl.trim() || undefined,
          imageUrl: postImageUrl || undefined,
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: '🎉 Posted to LinkedIn!', description: 'Your post has been published to LinkedIn.' });
      onOpenChange(false);
      setText('');
      setArticleUrl('');
    } catch (err: any) {
      toast({ title: 'Failed to post', description: err.message, variant: 'destructive' });
    } finally {
      setPosting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Linkedin className="h-5 w-5 text-[#0077B5]" />
            Share to LinkedIn
          </DialogTitle>
        </DialogHeader>

        {checking ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !isConnected ? (
          <div className="space-y-4 py-4">
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-full bg-[#0077B5]/10 flex items-center justify-center">
                <Linkedin className="h-8 w-8 text-[#0077B5]" />
              </div>
              <h3 className="font-semibold text-lg">Connect your LinkedIn account</h3>
              <p className="text-sm text-muted-foreground">
                Authorize Startup Factory Hub to post on your behalf. You can disconnect anytime.
              </p>
            </div>
            <Button 
              onClick={connectLinkedIn} 
              disabled={connecting}
              className="w-full bg-[#0077B5] hover:bg-[#006097] text-white"
            >
              {connecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Linkedin className="h-4 w-4 mr-2" />
                  Connect LinkedIn Account
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Connected status */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#0077B5]/5 border border-[#0077B5]/20">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-[#0077B5]/30 text-[#0077B5]">
                  <Linkedin className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
                {linkedinName && <span className="text-sm font-medium">{linkedinName}</span>}
              </div>
              <Button variant="ghost" size="sm" onClick={disconnectLinkedIn} className="text-muted-foreground hover:text-destructive">
                <Unlink className="h-4 w-4" />
              </Button>
            </div>

            {/* Post content */}
            <div className="space-y-2">
              <Label>Post Content</Label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write your LinkedIn post..."
                rows={5}
                className="resize-none"
                maxLength={3000}
              />
              <p className="text-xs text-muted-foreground text-right">{text.length}/3000</p>
            </div>

            {/* Article URL */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Link className="h-3.5 w-3.5" />
                Article URL (optional)
              </Label>
              <Input
                value={articleUrl}
                onChange={(e) => setArticleUrl(e.target.value)}
                placeholder="https://..."
                type="url"
              />
            </div>

            {/* Image preview */}
            {postImageUrl && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Attached image from post</Label>
                <img 
                  src={postImageUrl} 
                  alt="Post image" 
                  className="w-full h-32 object-cover rounded-md border"
                />
              </div>
            )}

            {/* Post button */}
            <Button
              onClick={handlePost}
              disabled={posting || !text.trim()}
              className="w-full bg-[#0077B5] hover:bg-[#006097] text-white"
            >
              {posting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Post to LinkedIn
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
