import { useState } from 'react';
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

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventCreated: () => void;
}

export function CreateEventDialog({ open, onOpenChange, onEventCreated }: CreateEventDialogProps) {
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
    post_to_feed: true
  });
  const { user } = useAuth();
  const { toast } = useToast();

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

      const { data: eventData, error } = await supabase.from('events').insert({
        title: formData.title,
        description: formData.description,
        location: meetingLocation || null,
        start_date: startDateTime.toISOString(),
        end_date: endDateTime.toISOString(),
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        banner_url: formData.banner_url || null,
        organizer_id: user.id,
        host_id: user.id
      }).select().single();

      if (error) throw error;

      // Post to feed if option is selected
      if (formData.post_to_feed && eventData) {
        const feedContent = `📅 ${formData.title}\n\n${formData.description || ''}\n\n📍 ${formData.location || 'TBD'}\n⏰ ${format(startDateTime, 'PPP p')}`;
        
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
        post_to_feed: true
      });
      setIsOnlineEvent(false);
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
              {isOnlineEvent ? 'Meeting Link (Generated on submit)' : 'Location'}
            </Label>
            <Input
              id="location"
              value={formData.location}
              onChange={e => !isOnlineEvent && setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder={isOnlineEvent ? 'Video meeting link will be created when you submit' : 'Event location or virtual link'}
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