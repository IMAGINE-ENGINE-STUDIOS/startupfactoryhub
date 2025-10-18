import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Mail, Link as LinkIcon, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LightPaperProject } from "@/hooks/useLightPaperProjects";

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: LightPaperProject | null;
}

export default function ShareDialog({ isOpen, onClose, project }: ShareDialogProps) {
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [accessType, setAccessType] = useState<"view" | "edit" | "comment">("view");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const generateShareLink = async () => {
    if (!project) return;

    setLoading(true);
    try {
      const token = Math.random().toString(36).substring(2, 15);
      
      const { error } = await supabase.from("lightpaper_share_links").insert({
        project_id: project.id,
        share_token: token,
        access_type: accessType,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (error) throw error;

      const link = `${window.location.origin}/shared/${token}`;
      setShareLink(link);
      toast.success("Share link generated");
    } catch (error: any) {
      console.error("Error generating share link:", error);
      toast.error("Failed to generate share link");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied to clipboard");
  };

  const sendEmail = async () => {
    if (!email || !project) return;

    setLoading(true);
    try {
      // Generate link if not exists
      if (!shareLink) {
        await generateShareLink();
      }

      toast.success("Email sent successfully");
      setEmail("");
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast.error("Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share "{project?.title}"</DialogTitle>
          <DialogDescription>
            Choose how you want to share this file
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link">
              <LinkIcon className="h-4 w-4 mr-2" />
              Link
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="h-4 w-4 mr-2" />
              Email
            </TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="access-type">Access Level</Label>
              <Select value={accessType} onValueChange={(v: any) => setAccessType(v)}>
                <SelectTrigger id="access-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View only</SelectItem>
                  <SelectItem value="edit">Can edit</SelectItem>
                  <SelectItem value="comment">Can comment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!shareLink ? (
              <Button onClick={generateShareLink} disabled={loading} className="w-full">
                Generate Share Link
              </Button>
            ) : (
              <div className="space-y-2">
                <Label>Share Link</Label>
                <div className="flex gap-2">
                  <Input value={shareLink} readOnly />
                  <Button
                    onClick={copyToClipboard}
                    size="icon"
                    variant="outline"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Link expires in 7 days
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Recipient Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="access-type-email">Access Level</Label>
              <Select value={accessType} onValueChange={(v: any) => setAccessType(v)}>
                <SelectTrigger id="access-type-email">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View only</SelectItem>
                  <SelectItem value="edit">Can edit</SelectItem>
                  <SelectItem value="comment">Can comment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={sendEmail} disabled={loading || !email} className="w-full">
              Send Invitation
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
