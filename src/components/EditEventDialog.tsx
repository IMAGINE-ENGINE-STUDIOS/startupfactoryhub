import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, ExternalLink } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';

interface EditEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventUpdated: () => void;
  event: {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    start_date: string;
    end_date: string;
    max_attendees: number | null;
    banner_url: string | null;
    external_registration_url?: string | null;
  } | null;
}

export function EditEventDialog({ open, onOpenChange, onEventUpdated, event }: EditEventDialogProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isOnlineEvent, setIsOnlineEvent] = useState(false);
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
    external_registration_url: '',
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (event) {
      const startDate = new Date(event.start_date);
      const endDate = new Date(event.end_date);
      
      setFormData({
        title: event.title,
        description: event.description || '',
        location: event.location || '',
        start_date: format(startDate, 'yyyy-MM-dd'),
        start_time: format(startDate, 'HH:mm'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        end_time: format(endDate, 'HH:mm'),
        max_attendees: event.max_attendees?.toString() || '',
        banner_url: event.banner_url || '',
        external_registration_url: event.external_registration_url || '',
      });
      
      setIsOnlineEvent(event.location?.includes('whereby.com') || false);
    }
  }, [event]);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
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
    if (!user || !event) return;

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
      const wasOnline = event.location?.includes('whereby.com');
      const nowOnline = isOnlineEvent;

      // Handle online event scenarios
      if (nowOnline && !wasOnline) {
        // Changed from physical to online - create new room
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
            description: 'Event will be updated without a new video link.',
            variant: 'destructive'
          });
        } else if (roomData?.roomUrl) {
          meetingLocation = roomData.roomUrl;
          toast({ 
            title: 'Video room created!', 
            description: 'Meeting link has been generated.',
          });
        }
      } else if (!nowOnline && wasOnline) {
        // Changed from online to physical - clear Whereby link
        meetingLocation = formData.location;
      } else if (nowOnline && wasOnline) {
        // Stays online - keep existing Whereby link
        meetingLocation = event.location;
      }

      const { error } = await supabase
        .from('events')
        .update({
          title: formData.title,
          description: formData.description,
          location: meetingLocation,
          start_date: startDateTime.toISOString(),
          end_date: endDateTime.toISOString(),
          max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
          banner_url: formData.banner_url || null,
          external_registration_url: formData.external_registration_url || null,
        })
        .eq('id', event.id)
        .eq('organizer_id', user.id);

      if (error) throw error;

      toast({ title: 'Event updated successfully!' });
      onEventUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating event:', error);
      toast({ title: 'Failed to update event', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
                id="banner-upload-edit"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('banner-upload-edit')?.click()}
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
                onCheckedChange={async (checked) => {
                  setIsOnlineEvent(checked as boolean);
                  if (checked && user) {
                    setUploading(true);
                    try {
                      const { data, error } = await supabase.functions.invoke('create-whereby-room', {
                        body: { 
                          roomName: `evt-${Math.random().toString(36).substring(2, 10)}`,
                          startDate: formData.start_date && formData.start_time 
                            ? new Date(`${formData.start_date}T${formData.start_time}`).toISOString() 
                            : undefined,
                          endDate: formData.end_date && formData.end_time
                            ? new Date(`${formData.end_date}T${formData.end_time}`).toISOString()
                            : undefined
                        }
                      });
                      
                      if (error) throw error;
                      
                      setFormData(prev => ({ ...prev, location: data.roomUrl }));
                      toast({ title: 'Video conference room created!' });
                    } catch (error) {
                      console.error('Failed to create Whereby room:', error);
                      toast({ title: 'Failed to create meeting room', variant: 'destructive' });
                      setIsOnlineEvent(false);
                    } finally {
                      setUploading(false);
                    }
                  } else {
                    setFormData(prev => ({ ...prev, location: '' }));
                  }
                }}
              />
              <span>Online Event (Generate video conference link)</span>
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">
              {isOnlineEvent ? 'Meeting Link (Auto-generated)' : 'Location'}
            </Label>
            <Input
              id="location"
              value={formData.location}
              onChange={e => !isOnlineEvent && setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder={isOnlineEvent ? 'Whereby meeting link will be generated' : 'Event location or virtual link'}
              readOnly={isOnlineEvent}
              className={isOnlineEvent ? 'bg-muted' : ''}
            />
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

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Event'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
