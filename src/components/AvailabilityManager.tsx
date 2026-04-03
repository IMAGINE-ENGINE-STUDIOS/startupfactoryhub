import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useMentorAvailability } from '@/hooks/useMentorAvailability';
import { useBlockedTimes } from '@/hooks/useBlockedTimes';
import { Clock, Plus, Trash2, Loader2, Calendar as CalendarIcon, Ban } from 'lucide-react';
import { format } from 'date-fns';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return `${hour}:00`;
});

// ── Availability Schedule Card ──
export function AvailabilityScheduleCard() {
  const { toast } = useToast();
  const { availability, loading, addAvailability, deleteAvailability } = useMentorAvailability();
  const [isAdding, setIsAdding] = useState(false);
  const [newSlot, setNewSlot] = useState({ day_of_week: 1, start_time: '09:00', end_time: '17:00' });

  const handleAddSlot = async () => {
    if (newSlot.start_time >= newSlot.end_time) {
      toast({ title: 'Invalid Time Range', description: 'End time must be after start time', variant: 'destructive' });
      return;
    }
    setIsAdding(true);
    const { error } = await addAvailability({ ...newSlot, is_available: true });
    if (error) {
      toast({ title: 'Error', description: 'Failed to add slot', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Slot added' });
      setNewSlot({ day_of_week: 1, start_time: '09:00', end_time: '17:00' });
    }
    setIsAdding(false);
  };

  const handleDeleteSlot = async (id: string) => {
    const { error } = await deleteAvailability(id);
    if (error) toast({ title: 'Error', description: 'Failed to delete slot', variant: 'destructive' });
    else toast({ title: 'Success', description: 'Slot removed' });
  };

  const groupedAvailability = availability.reduce((acc, slot) => {
    if (!acc[slot.day_of_week]) acc[slot.day_of_week] = [];
    acc[slot.day_of_week].push(slot);
    return acc;
  }, {} as Record<number, typeof availability>);

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Availability Schedule</h3>
          </div>
          <Badge variant="outline" className="text-xs">{availability.length} slots</Badge>
        </div>

        {/* Compact day grid */}
        <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
          {DAYS_OF_WEEK.map((day) => {
            const slots = groupedAvailability[day.value] || [];
            return (
              <div key={day.value} className="flex items-center gap-2 text-xs">
                <span className="w-8 font-medium text-muted-foreground">{day.label}</span>
                {slots.length === 0 ? (
                  <span className="text-muted-foreground/50">—</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {slots.map((slot) => (
                      <Badge key={slot.id} variant="secondary" className="text-[10px] px-1.5 py-0 gap-1 font-normal">
                        {slot.start_time.slice(0, 5)}-{slot.end_time.slice(0, 5)}
                        <button onClick={() => handleDeleteSlot(slot.id)} className="hover:text-destructive">
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add slot form */}
        <div className="pt-2 border-t space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <Select value={newSlot.day_of_week.toString()} onValueChange={(v) => setNewSlot(p => ({ ...p, day_of_week: parseInt(v) }))}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DAYS_OF_WEEK.map((d) => (
                  <SelectItem key={d.value} value={d.value.toString()} className="text-xs">{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={newSlot.start_time} onValueChange={(v) => setNewSlot(p => ({ ...p, start_time: v }))}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((t) => (<SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={newSlot.end_time} onValueChange={(v) => setNewSlot(p => ({ ...p, end_time: v }))}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((t) => (<SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAddSlot} disabled={isAdding} size="sm" className="w-full h-8 text-xs">
            {isAdding ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />}
            Add Slot
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ── Blocked Times Card ──
export function BlockedTimesCard() {
  const { toast } = useToast();
  const { blockedTimes, addBlockedTime, deleteBlockedTime } = useBlockedTimes();
  const [blockDate, setBlockDate] = useState<Date | undefined>();
  const [blockFullDay, setBlockFullDay] = useState(true);
  const [blockStartTime, setBlockStartTime] = useState('09:00');
  const [blockEndTime, setBlockEndTime] = useState('17:00');
  const [blockReason, setBlockReason] = useState('');
  const [isBlocking, setIsBlocking] = useState(false);

  const handleBlockTime = async () => {
    if (!blockDate) {
      toast({ title: 'Select a date', variant: 'destructive' });
      return;
    }
    if (!blockFullDay && blockStartTime >= blockEndTime) {
      toast({ title: 'Invalid range', variant: 'destructive' });
      return;
    }
    setIsBlocking(true);
    const { error } = await addBlockedTime({
      blocked_date: format(blockDate, 'yyyy-MM-dd'),
      start_time: blockFullDay ? null : blockStartTime,
      end_time: blockFullDay ? null : blockEndTime,
      reason: blockReason || null,
    });
    if (error) toast({ title: 'Error', description: 'Failed to block time', variant: 'destructive' });
    else {
      toast({ title: 'Success', description: 'Time blocked' });
      setBlockDate(undefined);
      setBlockReason('');
      setBlockFullDay(true);
    }
    setIsBlocking(false);
  };

  const handleDeleteBlock = async (id: string) => {
    const { error } = await deleteBlockedTime(id);
    if (error) toast({ title: 'Error', variant: 'destructive' });
    else toast({ title: 'Block removed' });
  };

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Ban className="h-4 w-4 text-destructive" />
          <h3 className="font-semibold text-sm">Block Dates & Hours</h3>
        </div>

        {/* Add block */}
        <div className="space-y-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-start text-left text-xs h-8">
                <CalendarIcon className="mr-1.5 h-3 w-3" />
                {blockDate ? format(blockDate, 'MMM d, yyyy') : 'Pick date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={blockDate}
                onSelect={setBlockDate}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-2">
            <Switch checked={blockFullDay} onCheckedChange={setBlockFullDay} id="full-day-block" className="scale-75" />
            <Label htmlFor="full-day-block" className="text-xs">All day</Label>
          </div>

          {!blockFullDay && (
            <div className="grid grid-cols-2 gap-2">
              <Select value={blockStartTime} onValueChange={setBlockStartTime}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((t) => (<SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={blockEndTime} onValueChange={setBlockEndTime}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((t) => (<SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Input
            value={blockReason}
            onChange={e => setBlockReason(e.target.value)}
            placeholder="Reason (optional)"
            className="h-8 text-xs"
          />

          <Button onClick={handleBlockTime} disabled={isBlocking || !blockDate} variant="destructive" size="sm" className="w-full h-8 text-xs">
            {isBlocking ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Ban className="h-3 w-3 mr-1" />}
            Block
          </Button>
        </div>

        {/* Current blocks */}
        {blockedTimes.length > 0 && (
          <div className="pt-2 border-t space-y-1 max-h-[120px] overflow-y-auto">
            {blockedTimes.map(bt => (
              <div key={bt.id} className="flex items-center justify-between p-1.5 bg-destructive/10 rounded text-xs">
                <div className="flex items-center gap-1 min-w-0">
                  <span className="font-medium whitespace-nowrap">{format(new Date(bt.blocked_date + 'T00:00:00'), 'MMM d')}</span>
                  {bt.start_time && bt.end_time ? (
                    <span className="text-muted-foreground">{bt.start_time.slice(0, 5)}-{bt.end_time.slice(0, 5)}</span>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">All Day</Badge>
                  )}
                  {bt.reason && <span className="text-muted-foreground truncate">· {bt.reason}</span>}
                </div>
                <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => handleDeleteBlock(bt.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// ── Default export (backward compat) ──
export default function AvailabilityManager() {
  return (
    <div className="space-y-6">
      <AvailabilityScheduleCard />
      <BlockedTimesCard />
    </div>
  );
}
