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
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return `${hour}:00`;
});

export default function AvailabilityManager() {
  const { toast } = useToast();
  const { availability, loading, addAvailability, deleteAvailability } = useMentorAvailability();
  const { blockedTimes, addBlockedTime, deleteBlockedTime } = useBlockedTimes();
  const [isAdding, setIsAdding] = useState(false);
  const [newSlot, setNewSlot] = useState({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00',
  });

  // Block time state
  const [blockDate, setBlockDate] = useState<Date | undefined>();
  const [blockFullDay, setBlockFullDay] = useState(true);
  const [blockStartTime, setBlockStartTime] = useState('09:00');
  const [blockEndTime, setBlockEndTime] = useState('17:00');
  const [blockReason, setBlockReason] = useState('');
  const [isBlocking, setIsBlocking] = useState(false);

  const handleAddSlot = async () => {
    if (newSlot.start_time >= newSlot.end_time) {
      toast({ title: 'Invalid Time Range', description: 'End time must be after start time', variant: 'destructive' });
      return;
    }
    setIsAdding(true);
    const { error } = await addAvailability({ ...newSlot, is_available: true });
    if (error) {
      toast({ title: 'Error', description: 'Failed to add availability slot', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Availability slot added' });
      setNewSlot({ day_of_week: 1, start_time: '09:00', end_time: '17:00' });
    }
    setIsAdding(false);
  };

  const handleDeleteSlot = async (id: string) => {
    const { error } = await deleteAvailability(id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete availability slot', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Availability slot removed' });
    }
  };

  const handleBlockTime = async () => {
    if (!blockDate) {
      toast({ title: 'Select a date', description: 'Please pick a date to block', variant: 'destructive' });
      return;
    }
    if (!blockFullDay && blockStartTime >= blockEndTime) {
      toast({ title: 'Invalid Time Range', description: 'End time must be after start time', variant: 'destructive' });
      return;
    }
    setIsBlocking(true);
    const { error } = await addBlockedTime({
      blocked_date: format(blockDate, 'yyyy-MM-dd'),
      start_time: blockFullDay ? null : blockStartTime,
      end_time: blockFullDay ? null : blockEndTime,
      reason: blockReason || null,
    });
    if (error) {
      toast({ title: 'Error', description: 'Failed to block time', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Time blocked successfully' });
      setBlockDate(undefined);
      setBlockReason('');
      setBlockFullDay(true);
    }
    setIsBlocking(false);
  };

  const handleDeleteBlock = async (id: string) => {
    const { error } = await deleteBlockedTime(id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to remove block', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Block removed' });
    }
  };

  const groupedAvailability = availability.reduce((acc, slot) => {
    if (!acc[slot.day_of_week]) acc[slot.day_of_week] = [];
    acc[slot.day_of_week].push(slot);
    return acc;
  }, {} as Record<number, typeof availability>);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weekly Availability */}
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              <h3 className="font-semibold">Availability Schedule</h3>
            </div>
            <Badge variant="outline">{availability.length} slots</Badge>
          </div>

          <div className="space-y-4">
            {DAYS_OF_WEEK.map((day) => {
              const slots = groupedAvailability[day.value] || [];
              return (
                <div key={day.value} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">{day.label}</Label>
                    {slots.length === 0 && <Badge variant="secondary" className="text-xs">Unavailable</Badge>}
                  </div>
                  {slots.length > 0 && (
                    <div className="space-y-2 ml-4">
                      {slots.map((slot) => (
                        <div key={slot.id} className="flex items-center justify-between gap-2 p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</span>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteSlot(slot.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add New Slot */}
          <div className="pt-4 border-t space-y-4">
            <h4 className="font-medium text-sm">Add Availability Slot</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="day" className="text-xs">Day</Label>
                <Select value={newSlot.day_of_week.toString()} onValueChange={(value) => setNewSlot(prev => ({ ...prev, day_of_week: parseInt(value) }))}>
                  <SelectTrigger id="day"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day.value} value={day.value.toString()}>{day.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="start" className="text-xs">Start Time</Label>
                <Select value={newSlot.start_time} onValueChange={(value) => setNewSlot(prev => ({ ...prev, start_time: value }))}>
                  <SelectTrigger id="start"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (<SelectItem key={time} value={time}>{time}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="end" className="text-xs">End Time</Label>
                <Select value={newSlot.end_time} onValueChange={(value) => setNewSlot(prev => ({ ...prev, end_time: value }))}>
                  <SelectTrigger id="end"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (<SelectItem key={time} value={time}>{time}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleAddSlot} disabled={isAdding} className="w-full">
              {isAdding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Add Availability Slot
            </Button>
          </div>
        </div>
      </Card>

      {/* Block Dates/Hours */}
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-destructive" />
            <h3 className="font-semibold">Block Dates & Hours</h3>
          </div>

          {/* Add Block */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Select Date to Block</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {blockDate ? format(blockDate, 'PPP') : 'Pick a date'}
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
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={blockFullDay} onCheckedChange={setBlockFullDay} id="full-day" />
              <Label htmlFor="full-day" className="text-sm">Block entire day</Label>
            </div>

            {!blockFullDay && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Start Time</Label>
                  <Select value={blockStartTime} onValueChange={setBlockStartTime}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((time) => (<SelectItem key={time} value={time}>{time}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">End Time</Label>
                  <Select value={blockEndTime} onValueChange={setBlockEndTime}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((time) => (<SelectItem key={time} value={time}>{time}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs">Reason (optional)</Label>
              <Input value={blockReason} onChange={e => setBlockReason(e.target.value)} placeholder="e.g. Holiday, Personal" />
            </div>

            <Button onClick={handleBlockTime} disabled={isBlocking || !blockDate} variant="destructive" className="w-full">
              {isBlocking ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Ban className="h-4 w-4 mr-2" />}
              Block Time
            </Button>
          </div>

          {/* Current Blocks */}
          {blockedTimes.length > 0 && (
            <div className="pt-4 border-t space-y-2">
              <h4 className="font-medium text-sm">Blocked Times</h4>
              {blockedTimes.map(bt => (
                <div key={bt.id} className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                  <div className="text-sm">
                    <span className="font-medium">{format(new Date(bt.blocked_date + 'T00:00:00'), 'MMM d, yyyy')}</span>
                    {bt.start_time && bt.end_time ? (
                      <span className="text-muted-foreground ml-2">{bt.start_time.slice(0, 5)} - {bt.end_time.slice(0, 5)}</span>
                    ) : (
                      <Badge variant="secondary" className="ml-2 text-xs">All Day</Badge>
                    )}
                    {bt.reason && <span className="text-muted-foreground ml-2">· {bt.reason}</span>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteBlock(bt.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
