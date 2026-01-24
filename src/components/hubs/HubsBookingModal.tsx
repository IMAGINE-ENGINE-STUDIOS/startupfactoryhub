import { useState } from 'react';
import { Workspace } from '@/hooks/useHubsSearch';
import { useHubBooking } from '@/hooks/useHubBooking';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format, addHours, setHours, setMinutes } from 'date-fns';
import { 
  CalendarIcon, 
  Clock, 
  MapPin, 
  Building2, 
  DollarSign,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HubsBookingModalProps {
  workspace: Workspace | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
];

const DURATION_OPTIONS = [
  { value: '1', label: '1 hour' },
  { value: '2', label: '2 hours' },
  { value: '4', label: '4 hours' },
  { value: '8', label: 'Full day' },
];

export const HubsBookingModal = ({ workspace, open, onOpenChange }: HubsBookingModalProps) => {
  const { createBooking } = useHubBooking();
  const [step, setStep] = useState<'details' | 'confirm' | 'success'>('details');
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('09:00');
  const [duration, setDuration] = useState<string>('2');
  const [notes, setNotes] = useState('');

  if (!workspace) return null;

  const calculatePrice = () => {
    if (!workspace.hourly_rate_min) return null;
    return workspace.hourly_rate_min * parseInt(duration);
  };

  const estimatedPrice = calculatePrice();

  const handleSubmit = async () => {
    if (!selectedDate) return;

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const fromDatetime = setMinutes(setHours(selectedDate, hours), minutes);
    const toDatetime = addHours(fromDatetime, parseInt(duration));

    await createBooking.mutateAsync({
      venueId: workspace.id,
      venueName: workspace.name,
      workspaceType: workspace.workspace_types[0],
      fromDatetime,
      toDatetime,
      price: estimatedPrice || undefined,
      currency: 'USD',
      notes: notes || undefined,
    });

    setStep('success');
  };

  const handleClose = () => {
    setStep('details');
    setNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-background/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {step === 'success' ? 'Booking Confirmed!' : 'Book Workspace'}
          </DialogTitle>
          <DialogDescription>
            {step === 'success' 
              ? 'Your workspace has been booked successfully'
              : workspace.name
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'success' ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{workspace.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedTime} • {duration} hour(s)
              </p>
            </div>
            {estimatedPrice && (
              <Badge variant="secondary" className="text-lg px-4 py-1">
                Total: ${estimatedPrice}
              </Badge>
            )}
            <Button onClick={handleClose} className="mt-4">
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Workspace Info */}
            <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 border border-border/50">
              {workspace.image_url ? (
                <img
                  src={workspace.image_url}
                  alt={workspace.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
              )}
              <div className="flex-1">
                <h4 className="font-medium">{workspace.name}</h4>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                  <MapPin className="h-3 w-3" />
                  {workspace.city}, {workspace.country}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {workspace.workspace_types.map((type) => (
                    <Badge key={type} variant="outline" className="text-xs capitalize">
                      {type.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Date Selection */}
            <div className="space-y-2">
              <Label>Select Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger>
                    <Clock className="mr-2 h-4 w-4" />
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
                <Label>Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Any special requirements..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="resize-none"
                rows={2}
              />
            </div>

            {/* Price Summary */}
            {estimatedPrice && (
              <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span className="text-sm">Estimated Total</span>
                </div>
                <span className="text-xl font-bold text-primary">
                  ${estimatedPrice}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!selectedDate || createBooking.isPending}
                className="flex-1"
              >
                {createBooking.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Booking...
                  </>
                ) : (
                  'Confirm Booking'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
