import { useState } from 'react';
import { Workspace } from '@/hooks/useHubsSearch';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
  CreditCard,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

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
  { value: '8', label: 'Full day (8 hours)' },
];

export const HubsBookingModal = ({ workspace, open, onOpenChange }: HubsBookingModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('09:00');
  const [duration, setDuration] = useState<string>('2');
  const [notes, setNotes] = useState('');

  if (!workspace) return null;

  const calculatePrice = () => {
    if (!workspace.hourly_rate_min) return null;
    return workspace.hourly_rate_min * parseInt(duration);
  };

  const calculateEndTime = () => {
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const endHours = hours + parseInt(duration);
    return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const estimatedPrice = calculatePrice();

  const handleSubmit = async () => {
    if (!selectedDate) {
      toast({
        title: 'Please select a date',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Call the Edge Function to create Stripe checkout
      const { data, error } = await supabase.functions.invoke('hub-book-workspace', {
        body: {
          workspaceId: workspace.id,
          workspaceName: workspace.name,
          date: format(selectedDate, 'yyyy-MM-dd'),
          startTime: selectedTime,
          endTime: calculateEndTime(),
          pricePerHour: workspace.hourly_rate_min || 25,
          duration: parseInt(duration),
          notes: notes || undefined,
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        // Redirect to Stripe Checkout
        window.open(data.url, '_blank');
        
        toast({
          title: 'Redirecting to payment',
          description: 'Complete your booking in the new tab',
        });
        
        handleClose();
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      toast({
        title: 'Booking failed',
        description: error.message || 'Unable to process booking',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg tech-card border-0 backdrop-blur-3xl bg-white/10 dark:bg-black/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Book Workspace
          </DialogTitle>
          <DialogDescription>
            {workspace.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Workspace Info */}
          <div className="flex items-start gap-4 p-4 rounded-2xl backdrop-blur-xl bg-white/10 dark:bg-black/20 border border-white/30">
            {workspace.image_url ? (
              <img
                src={workspace.image_url}
                alt={workspace.name}
                className="w-20 h-20 rounded-xl object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary" />
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
                  <Badge key={type} variant="outline" className="text-xs capitalize bg-white/10 border-white/30">
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
                    "backdrop-blur-xl bg-white/10 dark:bg-black/20 border-white/30 hover:bg-white/20",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 tech-card border-0" align="start">
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
                <SelectTrigger className="backdrop-blur-xl bg-white/10 dark:bg-black/20 border-white/30">
                  <Clock className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="tech-card border-0">
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
                <SelectTrigger className="backdrop-blur-xl bg-white/10 dark:bg-black/20 border-white/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="tech-card border-0">
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
              className="resize-none backdrop-blur-xl bg-white/10 dark:bg-black/20 border-white/30"
              rows={2}
            />
          </div>

          {/* Price Summary */}
          {estimatedPrice && (
            <div className="flex items-center justify-between p-4 rounded-2xl backdrop-blur-xl bg-primary/20 border border-primary/30">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <span className="text-sm">Total ({duration} hour{parseInt(duration) > 1 ? 's' : ''})</span>
              </div>
              <span className="text-xl font-bold text-primary">
                ${estimatedPrice}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={handleClose} 
              className="flex-1 backdrop-blur-xl bg-white/10 border-white/30 hover:bg-white/20"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedDate || isLoading}
              className="flex-1 gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Pay & Book
                </>
              )}
            </Button>
          </div>

          {/* Stripe info */}
          <p className="text-xs text-center text-muted-foreground">
            Secure payment powered by Stripe
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
