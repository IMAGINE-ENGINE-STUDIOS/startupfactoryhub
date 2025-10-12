import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMentorAvailability } from '@/hooks/useMentorAvailability';
import { Clock, Plus, Trash2, Loader2, Calendar } from 'lucide-react';

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
  const [isAdding, setIsAdding] = useState(false);
  const [newSlot, setNewSlot] = useState({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00',
  });

  const handleAddSlot = async () => {
    if (newSlot.start_time >= newSlot.end_time) {
      toast({
        title: 'Invalid Time Range',
        description: 'End time must be after start time',
        variant: 'destructive',
      });
      return;
    }

    setIsAdding(true);
    const { error } = await addAvailability({
      ...newSlot,
      is_available: true,
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to add availability slot',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Availability slot added',
      });
      setNewSlot({
        day_of_week: 1,
        start_time: '09:00',
        end_time: '17:00',
      });
    }
    setIsAdding(false);
  };

  const handleDeleteSlot = async (id: string) => {
    const { error } = await deleteAvailability(id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete availability slot',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Availability slot removed',
      });
    }
  };

  const groupedAvailability = availability.reduce((acc, slot) => {
    if (!acc[slot.day_of_week]) {
      acc[slot.day_of_week] = [];
    }
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
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <h3 className="font-semibold">Availability Schedule</h3>
          </div>
          <Badge variant="outline">{availability.length} slots</Badge>
        </div>

        {/* Current Availability */}
        <div className="space-y-4">
          {DAYS_OF_WEEK.map((day) => {
            const slots = groupedAvailability[day.value] || [];
            
            return (
              <div key={day.value} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{day.label}</Label>
                  {slots.length === 0 && (
                    <Badge variant="secondary" className="text-xs">Unavailable</Badge>
                  )}
                </div>
                
                {slots.length > 0 && (
                  <div className="space-y-2 ml-4">
                    {slots.map((slot) => (
                      <div key={slot.id} className="flex items-center justify-between gap-2 p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSlot(slot.id)}
                        >
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
              <Select
                value={newSlot.day_of_week.toString()}
                onValueChange={(value) => setNewSlot(prev => ({ ...prev, day_of_week: parseInt(value) }))}
              >
                <SelectTrigger id="day">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start" className="text-xs">Start Time</Label>
              <Select
                value={newSlot.start_time}
                onValueChange={(value) => setNewSlot(prev => ({ ...prev, start_time: value }))}
              >
                <SelectTrigger id="start">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="end" className="text-xs">End Time</Label>
              <Select
                value={newSlot.end_time}
                onValueChange={(value) => setNewSlot(prev => ({ ...prev, end_time: value }))}
              >
                <SelectTrigger id="end">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleAddSlot} 
            disabled={isAdding}
            className="w-full"
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Add Availability Slot
          </Button>
        </div>
      </div>
    </Card>
  );
}
