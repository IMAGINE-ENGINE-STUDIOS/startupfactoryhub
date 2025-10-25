import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card } from '@/components/ui/card';
import { useSharedPDF } from '@/hooks/useSharedPDF';
import { supabase } from '@/integrations/supabase/client';
import { Link, Mail, Copy, Check, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PDFShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  sessionTitle: string;
  pdfUrl: string;
}

export const PDFShareDialog = ({ open, onOpenChange, sessionId, sessionTitle, pdfUrl }: PDFShareDialogProps) => {
  const [accessLevel, setAccessLevel] = useState<'view' | 'sign' | 'edit'>('sign');
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(undefined);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Email form state
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  const { createSharedDocument, sendEmailInvitation } = useSharedPDF();

  const generateShareLink = async () => {
    setLoading(true);
    try {
      // Get storage path from URL
      const pdfUrlObj = new URL(pdfUrl);
      const pathMatch = pdfUrlObj.pathname.match(/pdf-documents\/(.+)$/);
      const storagePath = pathMatch ? pathMatch[1] : '';

      const shareToken = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create shared document
      const { data, error } = await supabase
        .from('shared_pdf_documents')
        .insert([{
          owner_id: user.id,
          title: sessionTitle,
          share_token: shareToken,
          storage_path: storagePath,
          access_level: accessLevel,
          expires_at: expiresAt?.toISOString() || null,
        }] as any)
        .select()
        .single();

      if (error) throw error;

      const shareLink = `${window.location.origin}/shared/pdf/${shareToken}`;
      setShareUrl(shareLink);
      toast.success('Share link generated');
    } catch (error) {
      console.error('Error generating share link:', error);
      toast.error('Failed to generate share link');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!shareUrl) return;
    
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const sendEmail = async () => {
    if (!recipientEmail || !recipientName) {
      toast.error('Please enter recipient name and email');
      return;
    }

    setLoading(true);
    try {
      // Generate share link if not already generated
      let finalShareUrl = shareUrl;
      if (!finalShareUrl) {
        await generateShareLink();
        // Wait for state to update
        await new Promise(resolve => setTimeout(resolve, 100));
        finalShareUrl = shareUrl;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get storage path from URL
      const pdfUrlObj = new URL(pdfUrl);
      const pathMatch = pdfUrlObj.pathname.match(/pdf-documents\/(.+)$/);
      const storagePath = pathMatch ? pathMatch[1] : '';

      const shareToken = finalShareUrl.split('/').pop() || '';

      await sendEmailInvitation(
        recipientEmail,
        recipientName,
        sessionTitle,
        shareToken,
        emailMessage
      );

      toast.success('Invitation sent successfully');
      setRecipientEmail('');
      setRecipientName('');
      setEmailMessage('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share PDF Document</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Access Level */}
          <div>
            <Label>Access Level</Label>
            <Select value={accessLevel} onValueChange={(v: any) => setAccessLevel(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">View Only</SelectItem>
                <SelectItem value="sign">View & Sign</SelectItem>
                <SelectItem value="edit">Full Edit Access</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {accessLevel === 'view' && 'Recipients can only view the document'}
              {accessLevel === 'sign' && 'Recipients can view and add signatures'}
              {accessLevel === 'edit' && 'Recipients can view, sign, and edit the document'}
            </p>
          </div>

          {/* Expiration Date */}
          <div>
            <Label>Expiration Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !expiresAt && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expiresAt ? format(expiresAt, 'PPP') : 'No expiration'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={expiresAt}
                  onSelect={setExpiresAt}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Tabs defaultValue="link" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="link">Share Link</TabsTrigger>
              <TabsTrigger value="email">Send Email</TabsTrigger>
            </TabsList>

            <TabsContent value="link" className="space-y-4">
              {!shareUrl ? (
                <Button onClick={generateShareLink} disabled={loading} className="w-full">
                  <Link className="h-4 w-4 mr-2" />
                  Generate Share Link
                </Button>
              ) : (
                <Card className="p-4">
                  <Label className="mb-2 block">Share URL</Label>
                  <div className="flex gap-2">
                    <Input value={shareUrl} readOnly className="flex-1" />
                    <Button onClick={copyToClipboard} variant="outline">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Anyone with this link can {accessLevel} the document
                    {expiresAt && ` until ${format(expiresAt, 'PPP')}`}
                  </p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="email" className="space-y-4">
              <div>
                <Label>Recipient Name *</Label>
                <Input
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>

              <div>
                <Label>Recipient Email *</Label>
                <Input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <Label>Message (Optional)</Label>
                <Textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  rows={3}
                />
              </div>

              <Button onClick={sendEmail} disabled={loading} className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Send Invitation
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
