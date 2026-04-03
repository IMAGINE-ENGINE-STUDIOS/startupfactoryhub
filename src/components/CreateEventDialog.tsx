import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, ExternalLink, MapPin, Users } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventCreated: () => void;
}

const MAPBOX_TOKEN = 'pk.eyJ1IjoiaW1hZ2luZWVuZ2luZSIsImEiOiJjbWhlYWo5bTgwYzkyMmpxMno3ODdoZGt6In0.B66urpifKwsS7bltMqzaBQ';

export function CreateEventDialog({ open, onOpenChange, onEventCreated }: CreateEventDialogProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isOnlineEvent, setIsOnlineEvent] = useState(false);
  const [meetingType, setMeetingType] = useState<'event' | 'pitch'>('event');
  const [pitchCompanyId, setPitchCompanyId] = useState('');
  const [pitchParticipantId, setPitchParticipantId] = useState('');
  const [userCompanies, setUserCompanies] = useState<{ id: string; name: string }[]>([]);
  const [pitchDuration, setPitchDuration] = useState('30');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    max_attendees: '',
    banner_url: '',
    post_to_feed: true,
    external_registration_url: '',
    ticket_price: ''
  });
  
  // Geocoding state
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{
    latitude: number;
    longitude: number;
    city: string;
    country: string;
  } | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user's companies for pitch meetings
  useEffect(() => {
    if (meetingType === 'pitch' && user) {
      supabase
        .from('companies')
        .select('id, name')
        .eq('user_id', user.id)
        .then(({ data }) => {
          setUserCompanies(data || []);
          if (data && data.length === 1) setPitchCompanyId(data[0].id);
        });
    }
  }, [meetingType, user]);

  // Geocode address using Mapbox
  const geocodeAddress = useCallback(async (query: string) => {
    if (!query || query.length < 3 || isOnlineEvent) {
      setAddressSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&types=address,place,poi&limit=5`
      );
      const data = await response.json();
      
      if (data.features) {
        setAddressSuggestions(data.features);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  }, [isOnlineEvent]);

  // Handle address selection from suggestions
  const handleAddressSelect = useCallback((feature: any) => {
    const [lng, lat] = feature.center;
    
    // Extract city and country from context
    let city = '';
    let country = '';
    
    if (feature.context) {
      for (const ctx of feature.context) {
        if (ctx.id.startsWith('place')) city = ctx.text;
        if (ctx.id.startsWith('region') && !city) city = ctx.text;
        if (ctx.id.startsWith('country')) country = ctx.text;
      }
    }
    
    setSelectedCoords({
      latitude: lat,
      longitude: lng,
      city: city || feature.text,
      country: country || '',
    });
    
    setFormData(prev => ({ ...prev, location: feature.place_name }));
    setShowSuggestions(false);
    setAddressSuggestions([]);
  }, []);

  // Debounced search for addresses
  useEffect(() => {
    if (isOnlineEvent) return;
    
    const timer = setTimeout(() => {
      if (formData.location.length >= 3) {
        geocodeAddress(formData.location);
      } else {
        setAddressSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [formData.location, geocodeAddress, isOnlineEvent]);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('event-banners')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('event-banners')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, banner_url: publicUrl }));
      toast({ title: 'Banner uploaded successfully!' });
    } catch (error) {
      console.error('Error uploading banner:', error);
      toast({ title: 'Failed to upload banner', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const startDateTime = new Date(`${formData.start_date}T${formData.start_time}`);
      const endDateTime = new Date(`${formData.end_date}T${formData.end_time}`);

      // Validate end date is after start date
      if (endDateTime <= startDateTime) {
        toast({ 
          title: 'Invalid dates', 
          description: 'End date and time must be after start date and time.',
          variant: 'destructive' 
        });
        setLoading(false);
        return;
      }

      let meetingLocation = formData.location;

      // If online event, create Whereby room
      if (isOnlineEvent) {
        const { data: roomData, error: roomError } = await supabase.functions.invoke('create-whereby-room', {
          body: {
            roomName: `evt-${formData.title.substring(0, 20).replace(/\s+/g, '-')}-${Date.now().toString(36).slice(-8)}`,
            startDate: startDateTime.toISOString(),
            endDate: endDateTime.toISOString()
          }
        });

        if (roomError) {
          console.error('Failed to create Whereby room:', roomError);
          toast({ 
            title: 'Warning: Video room creation failed', 
            description: 'Event will be created without a video link.',
            variant: 'destructive' 
          });
        } else if (roomData?.roomUrl) {
          meetingLocation = roomData.roomUrl;
          toast({ 
            title: 'Video room created!', 
            description: 'Meeting link has been generated.',
          });
        }
      }

      const ticketPriceCents = formData.ticket_price ? Math.round(parseFloat(formData.ticket_price) * 100) : 0;
      const isPaidEvent = ticketPriceCents > 0;

      const { data: eventData, error } = await supabase.from('events').insert({
        title: formData.title,
        description: formData.description,
        location: meetingLocation || null,
        meeting_room_url: isOnlineEvent && meetingLocation ? meetingLocation : null,
        start_date: startDateTime.toISOString(),
        end_date: endDateTime.toISOString(),
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        banner_url: formData.banner_url || null,
        organizer_id: user.id,
        host_id: user.id,
        is_virtual: isOnlineEvent,
        latitude: !isOnlineEvent && selectedCoords ? selectedCoords.latitude : null,
        longitude: !isOnlineEvent && selectedCoords ? selectedCoords.longitude : null,
        city: !isOnlineEvent && selectedCoords ? selectedCoords.city : null,
        country: !isOnlineEvent && selectedCoords ? selectedCoords.country : null,
        external_registration_url: formData.external_registration_url || null,
        ticket_price_cents: ticketPriceCents,
        is_paid: isPaidEvent,
      } as any).select().single();

      if (error) throw error;

      // If pitch meeting, also create pitch_meetings record
      if (meetingType === 'pitch' && pitchCompanyId && eventData) {
        const durationMin = parseInt(pitchDuration) || 30;
        const { error: pitchError } = await supabase
          .from('pitch_meetings')
          .insert({
            startup_id: user.id,
            investor_id: pitchParticipantId || user.id,
            company_id: pitchCompanyId,
            host_id: user.id,
            scheduled_date: startDateTime.toISOString(),
            duration_minutes: durationMin,
            meeting_link: meetingLocation || null,
            status: 'scheduled',
            meeting_notes: formData.description || `Pitch meeting for ${formData.title}`,
          });

        if (pitchError) {
          console.error('Error creating pitch meeting record:', pitchError);
        }
      }

      // Post to feed if option is selected
      if (formData.post_to_feed && eventData) {
        // Determine location display text
        let locationDisplay = '';
        if (meetingLocation) {
          if (meetingLocation.startsWith('http')) {
            locationDisplay = '🎥 Virtual Event - Join link in event details';
          } else {
            locationDisplay = meetingLocation;
          }
        } else if (formData.location) {
          locationDisplay = formData.location;
        } else {
          locationDisplay = 'Location to be announced';
        }

        const feedContent = `📅 ${formData.title}\n\n${formData.description || ''}\n\n📍 ${locationDisplay}\n⏰ ${format(startDateTime, 'PPP p')}`;
        
        await supabase.from('feed_posts').insert({
          user_id: user.id,
          content: feedContent,
          post_type: 'event',
          media_urls: formData.banner_url ? [formData.banner_url] : null,
          internship_data: { event_id: eventData.id }
        } as any);
      }

      toast({ title: 'Event created successfully!' });
      onEventCreated();
      onOpenChange(false);
      setFormData({
        title: '',
        description: '',
        location: '',
        start_date: '',
        start_time: '',
        end_date: '',
        end_time: '',
        max_attendees: '',
        banner_url: '',
        post_to_feed: true,
        external_registration_url: '',
        ticket_price: ''
      });
      setIsOnlineEvent(false);
      setMeetingType('event');
      setPitchCompanyId('');
      setPitchParticipantId('');
      setPitchDuration('30');
      setSelectedCoords(null);
      setAddressSuggestions([]);
    } catch (error) {
      console.error('Error creating event:', error);
      toast({ title: 'Failed to create event', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Meeting Type */}
          <div className="space-y-2">
            <Label>Meeting Type</Label>
            <Select value={meetingType} onValueChange={(v: 'event' | 'pitch') => setMeetingType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="event">
                  <span className="flex items-center gap-2">Community Event</span>
                </SelectItem>
                <SelectItem value="pitch">
                  <span className="flex items-center gap-2">Pitch Meeting</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pitch Meeting Fields */}
          {meetingType === 'pitch' && (
            <div className="space-y-4 p-4 rounded-lg border border-primary/20 bg-primary/5">
              <p className="text-sm font-medium text-primary flex items-center gap-2">
                <Users className="h-4 w-4" />
                Pitch Meeting Details
              </p>
              
              {/* Company Selection */}
              <div className="space-y-2">
                <Label>Your Company *</Label>
                {userCompanies.length > 0 ? (
                  <Select value={pitchCompanyId} onValueChange={setPitchCompanyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your company" />
                    </SelectTrigger>
                    <SelectContent>
                      {userCompanies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">No companies found. Create a company profile first.</p>
                )}
              </div>

              {/* Participant Email/ID */}
              <div className="space-y-2">
                <Label>Investor / Participant ID (optional)</Label>
                <Input
                  value={pitchParticipantId}
                  onChange={(e) => setPitchParticipantId(e.target.value)}
                  placeholder="Investor user ID (leave blank if open pitch)"
                />
                <p className="text-xs text-muted-foreground">Leave empty to create an open pitch meeting</p>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label>Pitch Duration</Label>
                <Select value={pitchDuration} onValueChange={setPitchDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Banner Upload */}
          <div className="space-y-2">
            <Label>Event Banner</Label>
            {formData.banner_url && (
              <img src={formData.banner_url} alt="Banner preview" className="w-full h-48 object-cover rounded-lg" />
            )}
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleBannerUpload}
                disabled={uploading}
                className="hidden"
                id="banner-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('banner-upload')?.click()}
                disabled={uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Banner
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
              placeholder="Enter event title"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your event..."
              rows={4}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="online_event" className="cursor-pointer flex items-center space-x-2">
              <Checkbox
                id="online_event"
                checked={isOnlineEvent}
                onCheckedChange={(checked) => {
                  setIsOnlineEvent(checked as boolean);
                  if (!checked) {
                    setFormData(prev => ({ ...prev, location: '' }));
                  }
                  // Room will be created on form submit when dates are available
                }}
              />
              <span>Online Event (Generate video conference link)</span>
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">
              {isOnlineEvent ? 'Meeting Link (Generated on submit)' : 'Location *'}
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="location"
                value={formData.location}
                onChange={e => {
                  if (!isOnlineEvent) {
                    setFormData(prev => ({ ...prev, location: e.target.value }));
                    setSelectedCoords(null); // Reset coords when typing
                  }
                }}
                onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
                placeholder={isOnlineEvent ? 'Video meeting link will be created when you submit' : 'Start typing an address...'}
                readOnly={isOnlineEvent}
                className={`pl-10 ${isOnlineEvent ? 'bg-muted' : ''}`}
              />
              
              {/* Address Suggestions Dropdown */}
              {showSuggestions && addressSuggestions.length > 0 && !isOnlineEvent && (
                <ScrollArea className="absolute top-full left-0 right-0 mt-1 max-h-48 bg-popover border rounded-md shadow-lg z-50">
                  {addressSuggestions.map((feature: any) => (
                    <button
                      key={feature.id}
                      type="button"
                      onClick={() => handleAddressSelect(feature)}
                      className="w-full px-3 py-2 text-left hover:bg-accent transition-colors border-b last:border-0"
                    >
                      <div className="font-medium text-sm">{feature.text}</div>
                      <div className="text-xs text-muted-foreground truncate">{feature.place_name}</div>
                    </button>
                  ))}
                </ScrollArea>
              )}
            </div>
            
            {/* Show selected location confirmation */}
            {selectedCoords && !isOnlineEvent && (
              <div className="flex items-center gap-2 text-sm text-emerald-500">
                <MapPin className="h-3 w-3" />
                Location confirmed: {selectedCoords.city}, {selectedCoords.country}
              </div>
            )}
            
            {formData.location && formData.location.startsWith('http') && (
              <a 
                href={formData.location} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Open link
              </a>
            )}
          </div>

          {/* Start Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time *</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={e => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* End Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={e => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time *</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={e => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Max Attendees */}
          <div className="space-y-2">
            <Label htmlFor="max_attendees">Maximum Attendees (Optional)</Label>
            <Input
              id="max_attendees"
              type="number"
              min="1"
              value={formData.max_attendees}
              onChange={e => setFormData(prev => ({ ...prev, max_attendees: e.target.value }))}
              placeholder="Leave empty for unlimited"
            />
          </div>

          {/* Ticket Price */}
          <div className="space-y-2">
            <Label htmlFor="ticket_price">Ticket Price (USD)</Label>
            <Input
              id="ticket_price"
              type="number"
              min="0"
              step="0.01"
              value={formData.ticket_price}
              onChange={e => setFormData(prev => ({ ...prev, ticket_price: e.target.value }))}
              placeholder="0.00 (free)"
            />
            <p className="text-xs text-muted-foreground">
              Leave at $0 for free events. A 10% platform fee will be charged to attendees on paid events.
            </p>
          </div>

          {/* External Registration URL */}
          <div className="space-y-2">
            <Label htmlFor="external_registration_url">External Registration Link (Optional)</Label>
            <Input
              id="external_registration_url"
              type="url"
              value={formData.external_registration_url}
              onChange={e => setFormData(prev => ({ ...prev, external_registration_url: e.target.value }))}
              placeholder="https://eventbrite.com/your-event or https://lu.ma/..."
            />
            <p className="text-xs text-muted-foreground">
              Add a link to Eventbrite, Luma, Meetup, or any external registration platform
            </p>
          </div>

          {/* Post to Feed Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="post_to_feed"
              checked={formData.post_to_feed}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, post_to_feed: checked as boolean }))
              }
            />
            <Label htmlFor="post_to_feed" className="cursor-pointer">
              Post event announcement to community feed
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Event'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}