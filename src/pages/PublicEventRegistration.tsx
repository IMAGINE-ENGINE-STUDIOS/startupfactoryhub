import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, MapPin, Clock, Users, CheckCircle, Loader2, ArrowLeft, Video, Building } from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';
import { z } from 'zod';

// Validation schema
const registrationSchema = z.object({
  full_name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string().trim().email('Please enter a valid email').max(255, 'Email is too long'),
  phone: z.string().trim().max(20, 'Phone number is too long').optional(),
  company: z.string().trim().max(100, 'Company name is too long').optional(),
  notes: z.string().trim().max(500, 'Notes are too long').optional(),
});

interface Event {
  id: string;
  title: string;
  description: string | null;
  banner_url: string | null;
  start_date: string;
  end_date: string;
  location: string | null;
  max_attendees: number | null;
  is_virtual: boolean | null;
  organizer_id: string;
}

const PublicEventRegistration = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registrationCount, setRegistrationCount] = useState(0);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (eventId) {
      fetchEvent();
      fetchRegistrationCount();
    }
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast({ title: 'Event not found', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrationCount = async () => {
    const { count: externalCount } = await supabase
      .from('event_external_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'registered');

    const { count: platformCount } = await supabase
      .from('event_attendees')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('status', 'going');

    setRegistrationCount((externalCount || 0) + (platformCount || 0));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form data
    const result = registrationSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('event_external_registrations')
        .insert({
          event_id: eventId,
          full_name: formData.full_name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone?.trim() || null,
          company: formData.company?.trim() || null,
          notes: formData.notes?.trim() || null,
        });

      if (error) {
        if (error.code === '23505') {
          toast({ 
            title: 'Already registered', 
            description: 'This email is already registered for this event.',
            variant: 'destructive' 
          });
          return;
        }
        throw error;
      }

      setRegistered(true);
      toast({ title: 'Registration successful!', description: "You're all set for this event." });
    } catch (error) {
      console.error('Registration error:', error);
      toast({ title: 'Registration failed', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Event Not Found</h2>
            <p className="text-muted-foreground mb-4">This event may have been removed or the link is invalid.</p>
            <Link to="/">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to Homepage
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const eventDate = parseISO(event.start_date);
  const isEventPast = isPast(parseISO(event.end_date));
  const isFull = event.max_attendees && registrationCount >= event.max_attendees;
  const spotsLeft = event.max_attendees ? event.max_attendees - registrationCount : null;

  if (registered) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12 px-4">
        <div className="max-w-lg mx-auto">
          <Card className="border-green-500/50">
            <CardContent className="pt-8 pb-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">You're Registered!</h2>
              <p className="text-muted-foreground mb-6">
                Thank you for registering for <span className="font-semibold text-foreground">{event.title}</span>
              </p>
              
              <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>{format(eventDate, 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{format(eventDate, 'h:mm a')}</span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2 text-sm">
                    {event.is_virtual ? <Video className="h-4 w-4 text-primary" /> : <MapPin className="h-4 w-4 text-primary" />}
                    <span>{event.is_virtual ? 'Virtual Event' : event.location}</span>
                  </div>
                )}
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                A confirmation email will be sent to <span className="font-medium">{formData.email}</span>
              </p>

              <Link to="/">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Homepage
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Homepage
        </Link>

        {/* Event Header */}
        <Card className="mb-6 overflow-hidden">
          {event.banner_url && (
            <div className="h-48 relative">
              <img 
                src={event.banner_url} 
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            </div>
          )}
          <CardHeader className={event.banner_url ? '-mt-12 relative z-10' : ''}>
            <div className="flex flex-wrap gap-2 mb-2">
              {event.is_virtual && (
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                  <Video className="h-3 w-3 mr-1" />
                  Virtual Event
                </Badge>
              )}
              {isEventPast && (
                <Badge variant="secondary" className="bg-gray-500/20 text-gray-400">
                  Event Ended
                </Badge>
              )}
              {!isEventPast && isFull && (
                <Badge variant="secondary" className="bg-red-500/20 text-red-400">
                  Event Full
                </Badge>
              )}
              {!isEventPast && !isFull && spotsLeft !== null && spotsLeft < 20 && (
                <Badge variant="secondary" className="bg-amber-500/20 text-amber-400">
                  Only {spotsLeft} spots left
                </Badge>
              )}
            </div>
            <CardTitle className="text-2xl">{event.title}</CardTitle>
            {event.description && (
              <CardDescription className="text-base mt-2 whitespace-pre-wrap">
                {event.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Calendar className="h-5 w-5 text-primary" />
              <span>{format(eventDate, 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Clock className="h-5 w-5 text-primary" />
              <span>
                {format(parseISO(event.start_date), 'h:mm a')} - {format(parseISO(event.end_date), 'h:mm a')}
              </span>
            </div>
            {event.location && !event.location.startsWith('http') && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <MapPin className="h-5 w-5 text-primary" />
                <span>{event.location}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-muted-foreground">
              <Users className="h-5 w-5 text-primary" />
              <span>
                {registrationCount} registered
                {event.max_attendees && ` / ${event.max_attendees} max`}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Registration Form */}
        {!isEventPast && !isFull ? (
          <Card>
            <CardHeader>
              <CardTitle>Register for This Event</CardTitle>
              <CardDescription>
                Fill out the form below to secure your spot
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Enter your full name"
                    required
                    className={errors.full_name ? 'border-red-500' : ''}
                  />
                  {errors.full_name && (
                    <p className="text-sm text-red-500">{errors.full_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="you@example.com"
                    required
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+1 (555) 123-4567"
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-500">{errors.phone}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Company (Optional)</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                        placeholder="Your company"
                        className={`pl-10 ${errors.company ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.company && (
                      <p className="text-sm text-red-500">{errors.company}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any special requirements or questions?"
                    rows={3}
                    className={errors.notes ? 'border-red-500' : ''}
                  />
                  {errors.notes && (
                    <p className="text-sm text-red-500">{errors.notes}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    'Register for Event'
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  By registering, you agree to receive event-related communications.
                </p>
              </form>
            </CardContent>
          </Card>
        ) : isEventPast ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">This event has already ended.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                This event is at full capacity. Please check back later for cancellations.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          Powered by{' '}
          <Link to="/" className="text-primary hover:underline">
            Startup Factory Hub
          </Link>
        </p>
      </div>
    </div>
  );
};

export default PublicEventRegistration;
