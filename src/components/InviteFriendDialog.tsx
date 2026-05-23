import { useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const schema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  name: z.string().trim().max(100).optional(),
});

interface Props {
  trigger?: React.ReactNode;
}

export default function InviteFriendDialog({ trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const parsed = schema.safeParse({ email, name: name || undefined });
    if (!parsed.success) {
      toast({
        title: "Check your inputs",
        description: parsed.error.errors[0]?.message ?? "Invalid input",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-referral-invite-email", {
        body: {
          to: parsed.data.email,
          recipientName: parsed.data.name ?? null,
        },
      });
      if (error) throw error;

      toast({
        title: "Invitation sent",
        description: `${parsed.data.email} will receive your invite shortly.`,
      });
      setEmail("");
      setName("");
      setOpen(false);
    } catch (err: any) {
      toast({
        title: "Failed to send invite",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="gap-2">
            <UserPlus className="w-4 h-4" />
            Invite a friend
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-background backdrop-blur-none sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Invite a friend to the platform
          </DialogTitle>
          <DialogDescription>
            Send a personal invite. They'll receive a one-on-one email with details about Startup Factory Hub and the referral program.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Friend's email</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="friend@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={255}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-name">Their name (optional)</Label>
            <Input
              id="invite-name"
              type="text"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending || !email} className="gap-2">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send invite
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
