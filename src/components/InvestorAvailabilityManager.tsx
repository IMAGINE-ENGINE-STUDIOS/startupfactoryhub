import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useInvestorAvailability } from '@/hooks/useInvestorAvailability';
import { Clock, Plus, Trash2, Calendar } from 'lucide-react';

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
  return [`${hour}:00`, `${hour}:30`];
}).flat();

export default function InvestorAvailabilityManager() {
  const { availability, loading, addAvailability, deleteAvailability } = useInvestorAvailability();
  const { toast } = useToast();
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('17:00');
  const [adding, setAdding] = useState(false);

  const handleAddSlot = async () => {
    if (!startTime || !endTime) {
      toast({
        title: "Missing Information",
        description: "Please select both start and end times",
        variant: "destructive",
      });
      return;
    }

    if (startTime >= endTime) {
      toast({
        title: "Invalid Time Range",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return;
    }

    setAdding(true);
    const { error } = await addAvailability({
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      is_available: true,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add availability slot",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Availability Added",
        description: "Your pitch meeting availability has been updated",
      });
      // Reset form
      setDayOfWeek(1);
      setStartTime('09:00');
      setEndTime('17:00');
    }
    setAdding(false);
  };

  const handleDeleteSlot = async (id: string) => {
    const { error } = await deleteAvailability(id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete availability slot",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Availability Removed",
        description: "The time slot has been removed",
      });
    }
  };

  const getDayLabel = (day: number) => {
    return DAYS_OF_WEEK.find(d => d.value === day)?.label || 'Unknown';
  };

  const groupedAvailability = availability.reduce((acc, slot) => {
    if (!acc[slot.day_of_week]) {
      acc[slot.day_of_week] = [];
    }
    acc[slot.day_of_week].push(slot);
    return acc;
  }, {} as Record<number, typeof availability>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Pitch Meeting Availability
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Slot Form */}
        <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Availability
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Day</label>
              <Select value={dayOfWeek.toString()} onValueChange={(v) => setDayOfWeek(parseInt(v))}>
                <SelectTrigger>
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
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Start Time</label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger>
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
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">End Time</label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger>
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
          <Button onClick={handleAddSlot} disabled={adding} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            {adding ? 'Adding...' : 'Add Time Slot'}
          </Button>
        </div>

        {/* Current Availability */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Current Availability
          </h3>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading availability...
            </div>
          ) : Object.keys(groupedAvailability).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No availability set</p>
              <p className="text-sm">Add time slots above to let startups book pitch meetings</p>
            </div>
          ) : (
            <div className="space-y-3">
              {DAYS_OF_WEEK.map((day) => {
                const slots = groupedAvailability[day.value];
                if (!slots || slots.length === 0) return null;

                return (
                  <div key={day.value} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{day.label}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {slots.length} slot{slots.length > 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {slots.map((slot) => (
                        <div
                          key={slot.id}
                          className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span>{slot.start_time} - {slot.end_time}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSlot(slot.id)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
