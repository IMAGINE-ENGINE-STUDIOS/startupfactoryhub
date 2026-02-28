import { useState, useMemo, useEffect } from 'react';
import { Workspace } from '@/hooks/useHubsSearch';
import { useMembershipStatus } from '@/hooks/useMembershipStatus';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi 
} from '@/components/ui/carousel';
import { format } from 'date-fns';
import { CalendarIcon, Clock, MapPin, Building2, Loader2, CheckCircle2, Image as ImageIcon, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface RegusBookingModalProps {
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

export const RegusBookingModal = ({ workspace, open, onOpenChange }: RegusBookingModalProps) => {
  const { tier } = useMembershipStatus();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('09:00');
  const [duration, setDuration] = useState<string>('2');
  const [notes, setNotes] = useState('');
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');

  const allImages = useMemo(() => {
    const imgs: string[] = [];
    if (workspace?.images?.length) imgs.push(...workspace.images);
    else if (workspace?.image_url) imgs.push(workspace.image_url);
    return imgs;
  }, [workspace]);

  const allVideos = useMemo(() => workspace?.videos || [], [workspace]);

  useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => setCurrentSlide(carouselApi.selectedScrollSnap());
    carouselApi.on('select', onSelect);
    return () => { carouselApi.off('select', onSelect); };
  }, [carouselApi]);

  useEffect(() => {
    setCurrentSlide(0);
    setMediaType('image');
    carouselApi?.scrollTo(0);
  }, [workspace?.id, carouselApi]);

  if (!workspace) return null;

  const calculateEndTime = () => {
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const endHours = hours + parseInt(duration);
    return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!selectedDate) {
      toast({ title: 'Please select a date', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const fromDatetime = `${dateStr}T${selectedTime}:00`;
      const endTime = calculateEndTime();
      const toDatetime = `${dateStr}T${endTime}:00`;

      const { error } = await supabase.from('hub_bookings').insert({
        user_id: user.id,
        provider: 'internal',
        venue_id: workspace.id,
        venue_name: workspace.name,
        workspace_type: workspace.workspace_types[0] || 'coworking',
        from_datetime: fromDatetime,
        to_datetime: toDatetime,
        status: 'pending',
        notes: notes || null,
        price: null,
        currency: 'USD',
        subscription_tier: tier || 'community',
      });

      if (error) throw error;

      toast({
        title: '✅ Booking request submitted',
        description: 'Your workspace booking is pending admin confirmation.',
      });
      handleClose();
    } catch (error: any) {
      console.error('Booking error:', error);
      toast({
        title: 'Booking failed',
        description: error.message || 'Unable to submit booking request',
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
      <DialogContent className="sm:max-w-2xl tech-card border-0 backdrop-blur-3xl bg-white/10 dark:bg-black/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Book Workspace
          </DialogTitle>
          <DialogDescription>{workspace.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Media Carousel */}
          <div className="relative h-48 rounded-2xl overflow-hidden border border-white/30">
            {mediaType === 'image' && allImages.length > 0 ? (
              <Carousel className="w-full h-full" setApi={setCarouselApi} opts={{ loop: true }}>
                <CarouselContent className="-ml-0">
                  {allImages.map((imageUrl, index) => (
                    <CarouselItem key={index} className="pl-0">
                      <img src={imageUrl} alt={`${workspace.name} - Image ${index + 1}`} className="w-full h-48 object-cover" />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {allImages.length > 1 && (
                  <>
                    <CarouselPrevious className="left-3 h-8 w-8 backdrop-blur-xl bg-black/30 border-0 text-white hover:bg-black/50" />
                    <CarouselNext className="right-3 h-8 w-8 backdrop-blur-xl bg-black/30 border-0 text-white hover:bg-black/50" />
                  </>
                )}
                {allImages.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full backdrop-blur-xl bg-black/40 text-white text-xs font-medium">
                    {currentSlide + 1} / {allImages.length}
                  </div>
                )}
              </Carousel>
            ) : mediaType === 'video' && allVideos.length > 0 ? (
              <video src={allVideos[0]} controls className="w-full h-48 object-cover" poster={allImages[0]}>
                Your browser does not support video playback.
              </video>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                <Building2 className="h-16 w-16 text-primary/50" />
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {allImages.length > 1 && mediaType === 'image' && (
            <div className="flex gap-2 overflow-x-auto py-1">
              {allImages.map((img, idx) => (
                <button key={idx} onClick={() => carouselApi?.scrollTo(idx)}
                  className={cn("w-14 h-10 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all",
                    currentSlide === idx ? "border-primary ring-2 ring-primary/30" : "border-transparent opacity-70 hover:opacity-100"
                  )}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Media toggle */}
          {allVideos.length > 0 && (
            <div className="flex gap-2">
              <Button variant={mediaType === 'image' ? 'default' : 'outline'} size="sm" onClick={() => setMediaType('image')}
                className={cn("flex-1 gap-2", mediaType !== 'image' && "backdrop-blur-xl bg-white/10 border-white/30")}>
                <ImageIcon className="h-4 w-4" /> Photos ({allImages.length})
              </Button>
              <Button variant={mediaType === 'video' ? 'default' : 'outline'} size="sm" onClick={() => setMediaType('video')}
                className={cn("flex-1 gap-2", mediaType !== 'video' && "backdrop-blur-xl bg-white/10 border-white/30")}>
                <Play className="h-4 w-4" /> Video Tour
              </Button>
            </div>
          )}

          {/* Workspace Info */}
          <div className="flex items-start gap-4 p-4 rounded-2xl backdrop-blur-xl bg-white/10 dark:bg-black/20 border border-white/30">
            <div className="flex-1">
              <h4 className="font-medium">{workspace.name}</h4>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                <MapPin className="h-3 w-3" />
                {workspace.address}, {workspace.city}
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

          {/* Subscription badge */}
          <div className="flex items-center gap-2 p-3 rounded-2xl backdrop-blur-xl bg-emerald-500/10 border border-emerald-500/30">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <span className="text-sm text-emerald-400 font-medium">Included in your SFH subscription — no additional payment</span>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Select Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn(
                  "w-full justify-start text-left font-normal",
                  "backdrop-blur-xl bg-white/10 dark:bg-black/20 border-white/30 hover:bg-white/20",
                  !selectedDate && "text-muted-foreground"
                )}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 tech-card border-0" align="start">
                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger className="backdrop-blur-xl bg-white/10 dark:bg-black/20 border-white/30">
                  <Clock className="mr-2 h-4 w-4" /><SelectValue />
                </SelectTrigger>
                <SelectContent className="tech-card border-0">
                  {TIME_SLOTS.map((time) => <SelectItem key={time} value={time}>{time}</SelectItem>)}
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
                  {DURATION_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea placeholder="Any special requirements..." value={notes} onChange={(e) => setNotes(e.target.value)}
              className="resize-none backdrop-blur-xl bg-white/10 dark:bg-black/20 border-white/30" rows={2} />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={handleClose} className="flex-1 backdrop-blur-xl bg-white/10 border-white/30 hover:bg-white/20">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!selectedDate || isLoading} className="flex-1 gap-2">
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
              ) : (
                <><CheckCircle2 className="h-4 w-4" /> Request Booking</>
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Booking requests are confirmed by our team within 24 hours
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
