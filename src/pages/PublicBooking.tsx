import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { format, addMinutes, setHours, setMinutes, isBefore, isAfter, startOfDay, isSameDay } from 'date-fns';
import { Video, MapPin, Clock, CheckCircle, Calendar as CalendarIcon, User, ArrowLeft } from 'lucide-react';

interface HostProfile {
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface AvailabilitySlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface ExistingBooking {
  scheduled_at: string;
  duration_minutes: number;
  status: string;
}

export default function PublicBooking() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();

  const [settings, setSettings] = useState<any>(null);
  const [profile, setProfile] = useState<HostProfile | null>(null);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [existingBookings, setExistingBookings] = useState<ExistingBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Booking flow
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [step, setStep] = useState<'date' | 'details' | 'confirmed'>('date');
  const [meetingType, setMeetingType] = useState<'virtual' | 'in_person'>('virtual');
  const [bookerName, setBookerName] = useState('');
  const [bookerEmail, setBookerEmail] = useState('');
  const [topic, setTopic] = useState('');
  const [locationText, setLocationText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmationData, setConfirmationData] = useState<any>(null);

  useEffect(() => {
    loadHostData();
  }, [slug]);

  const loadHostData = async () => {
    if (!slug) return;
    try {
      // Get settings by slug
      const { data: settingsData, error: settingsErr } = await supabase
        .from('calendar_booking_settings')
        .select('*')
        .eq('booking_slug', slug)
        .maybeSingle();

      if (settingsErr || !settingsData) { setNotFound(true); setLoading(false); return; }
      if (!settingsData.is_booking_enabled) { setNotFound(true); setLoading(false); return; }
      setSettings(settingsData);

      // Get profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, bio')
        .eq('user_id', settingsData.user_id)
        .maybeSingle();
      setProfile(profileData);

      // Get availability
      const { data: availData } = await supabase
        .from('mentor_availability')
        .select('day_of_week, start_time, end_time, is_available')
        .eq('mentor_id', settingsData.user_id)
        .eq('is_available', true);
      setAvailability(availData || []);

      // Get existing bookings (only future, non-cancelled)
      const { data: bookingsData } = await supabase
        .from('calendar_bookings')
        .select('scheduled_at, duration_minutes, status')
        .eq('host_id', settingsData.user_id)
        .neq('status', 'cancelled')
        .gte('scheduled_at', new Date().toISOString());
      setExistingBookings(bookingsData || []);

    } catch (err) {
      console.error(err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  // Generate available time slots for selected date
  const timeSlots = useMemo(() => {
    if (!selectedDate || !availability.length || !settings) return [];

    const dayOfWeek = selectedDate.getDay();
    const daySlots = availability.filter(a => a.day_of_week === dayOfWeek);

    const slots: string[] = [];
    const duration = settings.default_duration || 30;
    const buffer = settings.buffer_minutes || 0;

    for (const daySlot of daySlots) {
      const [startH, startM] = daySlot.start_time.split(':').map(Number);
      const [endH, endM] = daySlot.end_time.split(':').map(Number);

      let current = setMinutes(setHours(selectedDate, startH), startM);
      const end = setMinutes(setHours(selectedDate, endH), endM);

      while (isBefore(addMinutes(current, duration), end) || format(addMinutes(current, duration), 'HH:mm') === daySlot.end_time) {
        const slotStart = current;
        const slotEnd = addMinutes(current, duration);

        // Check if slot conflicts with existing bookings
        const hasConflict = existingBookings.some(b => {
          const bStart = new Date(b.scheduled_at);
          const bEnd = addMinutes(bStart, b.duration_minutes);
          return isBefore(slotStart, bEnd) && isAfter(slotEnd, bStart);
        });

        // Skip past times for today
        const isPast = isSameDay(selectedDate, new Date()) && isBefore(slotStart, new Date());

        if (!hasConflict && !isPast) {
          slots.push(format(slotStart, 'HH:mm'));
        }

        current = addMinutes(current, duration + buffer);
        if (isAfter(current, end) || format(current, 'HH:mm') === daySlot.end_time) break;
      }
    }

    return slots;
  }, [selectedDate, availability, existingBookings, settings]);

  // Check if a date has any availability
  const isDateAvailable = (date: Date) => {
    const dayOfWeek = date.getDay();
    return availability.some(a => a.day_of_week === dayOfWeek) && !isBefore(startOfDay(date), startOfDay(new Date()));
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !bookerName || !bookerEmail || !settings) return;
    setSubmitting(true);
    try {
      const [h, m] = selectedTime.split(':').map(Number);
      const scheduledAt = setMinutes(setHours(selectedDate, h), m);

      let meetingLink: string | null = null;

      // Create virtual meeting room if virtual
      if (meetingType === 'virtual') {
        try {
          const { data: roomData, error: roomErr } = await supabase.functions.invoke('create-whereby-room', {
            body: { roomName: `meeting-${slug}-${Date.now()}` }
          });
          if (!roomErr && roomData?.roomUrl) {
            meetingLink = roomData.roomUrl;
          }
        } catch (err) {
          console.warn('Could not create video room:', err);
        }
      }

      const { data, error } = await supabase
        .from('calendar_bookings')
        .insert({
          host_id: settings.user_id,
          booker_name: bookerName,
          booker_email: bookerEmail,
          scheduled_at: scheduledAt.toISOString(),
          duration_minutes: settings.default_duration || 30,
          topic: topic || null,
          status: 'pending',
          meeting_type: meetingType,
          meeting_link: meetingLink,
          location: meetingType === 'in_person' ? locationText : null,
        })
        .select()
        .single();

      if (error) throw error;

      setConfirmationData({
        ...data,
        host_name: profile?.full_name || 'Host',
      });
      setStep('confirmed');
      toast({ title: 'Booking submitted!' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="py-12 text-center">
            <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Calendar Not Found</h2>
            <p className="text-muted-foreground text-sm">This booking link is inactive or doesn't exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Host Info */}
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback>{profile?.full_name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-bold">{profile?.full_name || 'Book a Meeting'}</h1>
            {profile?.bio && <p className="text-sm text-muted-foreground line-clamp-2">{profile.bio}</p>}
          </div>
        </div>

        {step === 'confirmed' && confirmationData ? (
          <Card>
            <CardContent className="py-10 text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold">Booking Confirmed!</h2>
              <p className="text-muted-foreground">Your meeting request has been submitted.</p>
              <div className="text-sm space-y-1 text-left max-w-xs mx-auto bg-muted/30 p-4 rounded-lg">
                <p><strong>Date:</strong> {format(new Date(confirmationData.scheduled_at), 'EEEE, MMMM d, yyyy')}</p>
                <p><strong>Time:</strong> {format(new Date(confirmationData.scheduled_at), 'h:mm a')}</p>
                <p><strong>Duration:</strong> {confirmationData.duration_minutes} min</p>
                <p><strong>Type:</strong> {confirmationData.meeting_type === 'virtual' ? 'Video Call' : 'In Person'}</p>
                {confirmationData.meeting_link && (
                  <p><strong>Link:</strong> <a href={confirmationData.meeting_link} className="text-primary underline" target="_blank" rel="noopener">Join Meeting</a></p>
                )}
                {confirmationData.location && <p><strong>Location:</strong> {confirmationData.location}</p>}
              </div>
            </CardContent>
          </Card>
        ) : step === 'details' ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setStep('date')}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-lg">Meeting Details</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedDate && format(selectedDate, 'EEEE, MMMM d')} at {selectedTime} · {settings?.default_duration || 30} min
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Your Name *</Label>
                <Input value={bookerName} onChange={e => setBookerName(e.target.value)} placeholder="John Doe" />
              </div>
              <div className="space-y-1.5">
                <Label>Your Email *</Label>
                <Input type="email" value={bookerEmail} onChange={e => setBookerEmail(e.target.value)} placeholder="john@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label>Topic (optional)</Label>
                <Textarea value={topic} onChange={e => setTopic(e.target.value)} placeholder="What would you like to discuss?" rows={2} />
              </div>

              {/* Meeting Type */}
              <div className="space-y-2">
                <Label>Meeting Type</Label>
                <RadioGroup value={meetingType} onValueChange={(v: 'virtual' | 'in_person') => setMeetingType(v)} className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="virtual" id="virtual" />
                    <Label htmlFor="virtual" className="flex items-center gap-1 cursor-pointer text-sm">
                      <Video className="h-4 w-4" /> Video Call
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="in_person" id="in_person" />
                    <Label htmlFor="in_person" className="flex items-center gap-1 cursor-pointer text-sm">
                      <MapPin className="h-4 w-4" /> In Person
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {meetingType === 'in_person' && (
                <div className="space-y-1.5">
                  <Label>Location</Label>
                  <Input value={locationText} onChange={e => setLocationText(e.target.value)} placeholder="Address or meeting point" />
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={!bookerName || !bookerEmail || submitting}
              >
                {submitting ? 'Submitting...' : 'Confirm Booking'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                Select a Date & Time
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {settings?.default_duration || 30} min meeting
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Calendar */}
                <div>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => { setSelectedDate(d); setSelectedTime(''); }}
                    disabled={(date) => !isDateAvailable(date)}
                    className="rounded-md"
                  />
                </div>

                {/* Time Slots */}
                <div>
                  {selectedDate ? (
                    timeSlots.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium mb-3">
                          {format(selectedDate, 'EEEE, MMMM d')}
                        </p>
                        <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                          {timeSlots.map(time => (
                            <Button
                              key={time}
                              variant={selectedTime === time ? 'default' : 'outline'}
                              size="sm"
                              className="text-sm"
                              onClick={() => setSelectedTime(time)}
                            >
                              {time}
                            </Button>
                          ))}
                        </div>
                        {selectedTime && (
                          <Button className="w-full mt-4" onClick={() => setStep('details')}>
                            Continue
                          </Button>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-8 text-center">
                        No available slots on this date
                      </p>
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      Select a date to see available times
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-center text-muted-foreground">
          Powered by Startup Factory Hub
        </p>
      </div>
    </div>
  );
}
