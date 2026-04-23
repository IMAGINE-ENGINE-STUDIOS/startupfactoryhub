import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Settings, Copy, Link2, Check } from 'lucide-react';
import { useCalendarSettings } from '@/hooks/useCalendarSettings';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import CalendarBookingSettings from '@/components/CalendarBookingSettings';
import { AvailabilityScheduleCard, BlockedTimesCard } from '@/components/AvailabilityManager';

/**
 * Compact booking-link bar designed to live at the top of the Calendar tab.
 * - Shows the user's public booking URL with a one-click copy button.
 * - A small settings icon on the LEFT opens a panel containing the full
 *   Calendar Booking Settings, Availability Schedule, and Blocked Times.
 */
export default function BookingLinkBar() {
  const { settings, loading } = useCalendarSettings();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  if (loading) return null;

  const slug = settings?.booking_slug || '';
  const bookingUrl = slug
    ? `https://startupfactoryhub.com/meet/${slug}`
    : '';

  const handleCopy = () => {
    if (!bookingUrl) return;
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    toast({ title: 'Booking link copied!' });
    setTimeout(() => setCopied(false), 1800);
  };

  const SettingsPanel = (
    <div className="space-y-4">
      <CalendarBookingSettings />
      <AvailabilityScheduleCard />
      <BlockedTimesCard />
    </div>
  );

  return (
    <Card className="tech-card border-0 p-2 sm:p-3 space-y-2">
      {/* Description header */}
      <div className="flex items-start gap-2 px-1">
        <Link2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold leading-tight">Your Personal Booking Link</h3>
          <p className="text-xs text-muted-foreground leading-snug mt-0.5">
            Share this link so anyone can book a meeting with you based on your availability.
            Use the settings icon to configure your slug, durations, schedule, and blocked times.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Settings trigger on the LEFT */}
        {isMobile ? (
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 h-9 w-9"
                title="Booking settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader className="mb-4">
                <SheetTitle>Booking Settings</SheetTitle>
              </SheetHeader>
              {SettingsPanel}
            </SheetContent>
          </Sheet>
        ) : (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 h-9 w-9"
                title="Booking settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              side="bottom"
              className="w-[420px] max-h-[80vh] overflow-y-auto p-3"
            >
              {SettingsPanel}
            </PopoverContent>
          </Popover>
        )}

        {/* Booking URL */}
        <div className="flex-1 min-w-0 flex items-center gap-1.5 rounded-md bg-primary/5 border border-primary/20 px-2.5 py-1.5">
          <Link2 className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="truncate text-xs sm:text-sm font-mono">
            {bookingUrl || 'Set your booking slug in settings →'}
          </span>
        </div>

        {/* Copy */}
        <Button
          size="sm"
          variant="default"
          onClick={handleCopy}
          disabled={!bookingUrl}
          className="shrink-0 gap-1.5"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
        </Button>
      </div>
    </Card>
  );
}
