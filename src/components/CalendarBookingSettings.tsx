import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useCalendarSettings } from '@/hooks/useCalendarSettings';
import { useToast } from '@/hooks/use-toast';
import { Copy, Share2, Settings, Globe, Link2 } from 'lucide-react';

export default function CalendarBookingSettings() {
  const { settings, loading, createOrUpdateSettings } = useCalendarSettings();
  const { toast } = useToast();
  const [slug, setSlug] = useState('');
  const [duration, setDuration] = useState('30');
  const [buffer, setBuffer] = useState('10');
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (settings) {
      setSlug(settings.booking_slug);
      setDuration(String(settings.default_duration));
      setBuffer(String(settings.buffer_minutes));
      setEnabled(settings.is_booking_enabled);
    }
  }, [settings]);

  const bookingUrl = `https://startupfactoryhub.lovable.app/meet/${slug}`;

  const handleSave = () => {
    createOrUpdateSettings({
      booking_slug: slug,
      default_duration: parseInt(duration),
      buffer_minutes: parseInt(buffer),
      is_booking_enabled: enabled,
    });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(bookingUrl);
    toast({ title: 'Link copied!' });
  };

  if (loading) return null;

  return (
    <Card className="glass-morphism border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="h-5 w-5 text-primary" />
          Calendar Booking Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Shareable Link */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <Label className="text-xs text-muted-foreground mb-1 block">Your Booking Link</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-1 text-sm font-mono bg-background/50 rounded px-2 py-1.5 truncate">
              <Link2 className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="truncate">{bookingUrl}</span>
            </div>
            <Button size="sm" variant="outline" onClick={copyLink} className="shrink-0">
              <Copy className="h-3.5 w-3.5 mr-1" /> Copy
            </Button>
          </div>
        </div>

        {/* Slug */}
        <div className="space-y-1.5">
          <Label className="text-sm">Booking Slug</Label>
          <Input value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} placeholder="your-name" />
        </div>

        {/* Duration */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-sm">Default Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 min</SelectItem>
                <SelectItem value="30">30 min</SelectItem>
                <SelectItem value="45">45 min</SelectItem>
                <SelectItem value="60">60 min</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Buffer Time</Label>
            <Select value={buffer} onValueChange={setBuffer}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No buffer</SelectItem>
                <SelectItem value="5">5 min</SelectItem>
                <SelectItem value="10">10 min</SelectItem>
                <SelectItem value="15">15 min</SelectItem>
                <SelectItem value="30">30 min</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Enable/Disable */}
        <div className="flex items-center justify-between py-2">
          <div>
            <Label className="text-sm">Accept Bookings</Label>
            <p className="text-xs text-muted-foreground">Allow others to book time with you</p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        {/* Sync Status */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={settings?.google_calendar_connected ? 'default' : 'outline'} className="text-xs">
            <Globe className="h-3 w-3 mr-1" />
            Google Calendar {settings?.google_calendar_connected ? '✓' : '—'}
          </Badge>
          <Badge variant={settings?.microsoft_calendar_connected ? 'default' : 'outline'} className="text-xs">
            <Globe className="h-3 w-3 mr-1" />
            Microsoft {settings?.microsoft_calendar_connected ? '✓' : '—'}
          </Badge>
        </div>

        <Button onClick={handleSave} className="w-full">
          <Share2 className="h-4 w-4 mr-2" /> Save & Share Calendar
        </Button>
      </CardContent>
    </Card>
  );
}
