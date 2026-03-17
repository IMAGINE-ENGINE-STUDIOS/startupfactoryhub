import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Download, Linkedin, Copy, PartyPopper, CheckCircle2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import officialMentorBadge from '@/assets/official-mentor-badge.png';
import officialAdvisorBadge from '@/assets/official-advisor-badge.png';
import OfficialBadge from './OfficialBadge';

const MENTOR_LINKEDIN_POST = `🎉 Thrilled to announce that I've been officially verified as an Official Mentor at Startup Factory Hub! 🚀

As part of this exclusive program, I'm now equipped with premium tools including satellite-powered Earth Intelligence, direct VC introductions, and HSBC Innovation Banking — all to help the next generation of startups succeed.

If you're building something bold in Space, Deep Tech, or Quantum — let's connect! 🌍✨

#StartupFactoryHub #OfficialMentor #Startups #Innovation #Mentorship #DeepTech #VentureCapital`;

const ADVISOR_LINKEDIN_POST = `🎉 Proud to share that I've been officially verified as an Official Advisor at Startup Factory Hub! 🚀

As an Official Advisor, I now have access to premium tools including satellite-powered Earth Intelligence, direct VC introductions, and HSBC Innovation Banking — helping shape the future of startups worldwide.

Looking to connect with founders in Space, Deep Tech, and Quantum industries. Let's build the future together! 🌍✨

#StartupFactoryHub #OfficialAdvisor #Startups #Innovation #Advisory #DeepTech #VentureCapital`;

interface OfficialBadgeCelebrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName?: string;
  role?: 'mentor' | 'advisor';
}

export default function OfficialBadgeCelebrationDialog({ open, onOpenChange, userName, role = 'mentor' }: OfficialBadgeCelebrationDialogProps) {
  const { toast } = useToast();
  const badgeImage = role === 'advisor' ? officialAdvisorBadge : officialMentorBadge;
  const badgeLabel = role === 'advisor' ? 'Official Advisor' : 'Official Mentor';
  const [linkedinPost, setLinkedinPost] = useState(role === 'advisor' ? ADVISOR_LINKEDIN_POST : MENTOR_LINKEDIN_POST);
  const [downloaded, setDownloaded] = useState(false);
  const linkRef = useRef<HTMLAnchorElement>(null);

  const handleDownloadBadge = () => {
    const link = document.createElement('a');
    link.href = badgeImage;
    link.download = `official-${role}-badge.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloaded(true);
    toast({ title: 'Badge Downloaded!', description: 'Add it to your LinkedIn profile, website, or email signature.' });
  };

  const handleCopyPost = () => {
    navigator.clipboard.writeText(linkedinPost);
    toast({ title: 'Copied!', description: 'Post text copied to clipboard.' });
  };

  const handleShareLinkedIn = () => {
    navigator.clipboard.writeText(linkedinPost);
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://startupfactoryhub.com/official')}`;
    window.open(linkedinUrl, '_blank', 'width=600,height=600');
    toast({ title: 'LinkedIn Opened!', description: 'Paste your copied post text into the LinkedIn share dialog.' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg tech-card border-amber-400/30 bg-background overflow-y-auto max-h-[90vh]">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <img 
                src={badgeImage} 
                alt={`${badgeLabel} Badge`} 
                className="w-32 h-32 drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]"
              />
              <div className="absolute -top-2 -right-2">
                <PartyPopper className="h-8 w-8 text-amber-400 animate-bounce" />
              </div>
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold">
            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">
              You're Now Official! 🎉
            </span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Congratulations{userName ? `, ${userName}` : ''}! You've earned the Official Mentor badge. Download it and share the news!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Download Badge Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Download className="h-4 w-4 text-amber-400" />
              Download Your Badge
            </h3>
            <p className="text-xs text-muted-foreground">
              Use this badge on your LinkedIn profile, website, email signature, or social media.
            </p>
            <Button 
              onClick={handleDownloadBadge} 
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              {downloaded ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              {downloaded ? 'Downloaded!' : 'Download Badge PNG'}
            </Button>
          </div>

          {/* LinkedIn Share Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Linkedin className="h-4 w-4 text-[#0A66C2]" />
              Share on LinkedIn
            </h3>
            <p className="text-xs text-muted-foreground">
              Customize the post below, then share it directly to your LinkedIn profile.
            </p>
            <Textarea 
              value={linkedinPost}
              onChange={(e) => setLinkedinPost(e.target.value)}
              className="min-h-[180px] text-sm bg-muted/30 border-border/50 resize-none"
              placeholder="Write your LinkedIn post..."
            />
            <div className="flex gap-2">
              <Button 
                onClick={handleCopyPost} 
                variant="outline" 
                className="flex-1 border-border/50"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Text
              </Button>
              <Button 
                onClick={handleShareLinkedIn} 
                className="flex-1 bg-[#0A66C2] hover:bg-[#004182] text-white"
              >
                <Linkedin className="h-4 w-4 mr-2" />
                Share on LinkedIn
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground text-center">
              Tip: After clicking "Share on LinkedIn", paste the copied text and attach your downloaded badge image for maximum impact!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
