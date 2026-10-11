import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hostId: string;
  hostName: string;
}

/** Sends a meeting request that lands in both people's Meetings tab (pending until the host accepts). */
export default function BookMeetingDialog({ open, onOpenChange, hostId, hostName }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState('30');
  const [type, setType] = useState<'virtual' | 'in_person'>('virtual');
  const [location, setLocation] = useState('');
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!user) return;
    const when = new Date(`${date}T${time}`);
    if (!date || isNaN(when.getTime()) || when < new Date()) {
      toast({ title: 'Pick a future date and time', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { data: me } = await supabase.from('profiles').select('full_name').eq('user_id', user.id).maybeSingle();
    const { error } = await supabase.from('calendar_bookings').insert({
      host_id: hostId,
      booker_id: user.id,
      booker_name: me?.full_name || user.email || 'Member',
      booker_email: user.email || '',
      scheduled_at: when.toISOString(),
      duration_minutes: Number(duration),
      meeting_type: type,
      location: type === 'in_person' ? location || null : null,
      topic: topic || null,
      notes: notes || null,
      status: 'pending',
    });
    setSaving(false);
    if (error) {
      toast({ title: 'Could not send the request', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Meeting request sent', description: `${hostName} will see it in their Meetings tab.` });
    window.dispatchEvent(new CustomEvent('sfh:bookings-changed'));
    onOpenChange(false);
    setDate(''); setTopic(''); setNotes(''); setLocation('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        <DialogHeader>
          <DialogTitle>Book a meeting with {hostName}</DialogTitle>
          <DialogDescription>The request appears in both of your Meetings tabs until {hostName} accepts it.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Date</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
            <div className="space-y-1"><Label>Time</Label><Input type="time" value={time} onChange={e => setTime(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-background backdrop-blur-none">
                  {['15', '30', '45', '60', '90'].map(d => <SelectItem key={d} value={d}>{d} min</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={type} onValueChange={v => setType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-background backdrop-blur-none">
                  <SelectItem value="virtual">Video call</SelectItem>
                  <SelectItem value="in_person">In person</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {type === 'in_person' && (
            <div className="space-y-1"><Label>Location</Label><Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Address or place" /></div>
          )}
          <div className="space-y-1"><Label>Topic</Label><Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="What would you like to talk about?" /></div>
          <div className="space-y-1"><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Send request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
