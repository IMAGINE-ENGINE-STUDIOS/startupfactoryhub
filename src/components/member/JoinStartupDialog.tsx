import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useTeamMutations } from '@/hooks/useCompanyMembers';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: { id: string; name: string };
  onSuccess?: () => void;
}

export default function JoinStartupDialog({ open, onOpenChange, company, onSuccess }: Props) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { requestJoin } = useTeamMutations();
  const { toast } = useToast();

  const submit = async () => {
    if (!title.trim()) {
      toast({ title: 'Title required', description: 'Tell the founder what role you want', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await requestJoin(company.id, title.trim(), message.trim() || undefined);
      toast({ title: 'Request sent', description: `The founders of ${company.name} will be notified.` });
      onSuccess?.();
      onOpenChange(false);
      setTitle('');
      setMessage('');
    } catch (e: any) {
      toast({
        title: 'Could not send request',
        description: e.message?.includes('duplicate') ? 'You already have a request with this startup.' : e.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request to join {company.name}</DialogTitle>
          <DialogDescription>
            The founders will review your request. Once approved, you'll appear on their team.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="join-title">Your role / title</Label>
            <Input
              id="join-title"
              placeholder="e.g. CTO, Designer, Growth Lead"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="join-message">Short message (optional)</Label>
            <Textarea
              id="join-message"
              placeholder="Why do you want to join the team?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={loading}>
            {loading ? 'Sending…' : 'Send request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
