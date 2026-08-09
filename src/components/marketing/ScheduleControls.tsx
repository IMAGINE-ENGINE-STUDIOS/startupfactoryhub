import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { CalendarClock, Loader2, Save } from 'lucide-react';

const WEEKDAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];

const HOURS = Array.from({ length: 24 }, (_, h) => ({
  value: h,
  label: `${((h + 11) % 12) + 1}:00 ${h < 12 ? 'AM' : 'PM'} ET`,
}));

type Mode = 'interval' | 'weekdays';

interface Props {
  table: 'mvp_campaign_settings' | 'partners_campaign_settings';
  settingsId: string;
  mode: Mode;
  hour: number;
  intervalDays?: number;
  postDays?: number[];
  onSaved: () => void;
}

export default function ScheduleControls({
  table,
  settingsId,
  mode,
  hour,
  intervalDays = 2,
  postDays = [1, 3],
  onSaved,
}: Props) {
  const [localHour, setLocalHour] = useState(hour);
  const [localInterval, setLocalInterval] = useState(intervalDays);
  const [localDays, setLocalDays] = useState<number[]>(postDays);
  const [saving, setSaving] = useState(false);

  const toggleDay = (day: number) => {
    setLocalDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    );
  };

  const save = async () => {
    if (mode === 'weekdays' && localDays.length === 0) {
      toast.error('Pick at least one day');
      return;
    }
    setSaving(true);
    const payload =
      mode === 'interval'
        ? { post_hour_local: localHour, interval_days: localInterval }
        : { post_hour_local: localHour, post_days: localDays };
    const { error } = await supabase.from(table).update(payload).eq('id', settingsId);
    setSaving(false);
    if (error) {
      toast.error('Could not save schedule');
      return;
    }
    toast.success('Schedule updated');
    onSaved();
  };

  return (
    <div className="rounded-xl border border-border/50 bg-background/40 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold">Schedule</h4>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {mode === 'interval' ? (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Frequency</Label>
            <Select
              value={String(localInterval)}
              onValueChange={(v) => setLocalInterval(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background backdrop-blur-none">
                {[1, 2, 3, 4, 5, 7, 14].map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {d === 1 ? 'Every day' : `Every ${d} days`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Posting days</Label>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((d) => (
                <Button
                  key={d.value}
                  type="button"
                  size="sm"
                  variant={localDays.includes(d.value) ? 'default' : 'outline'}
                  className="h-8 px-3"
                  onClick={() => toggleDay(d.value)}
                >
                  {d.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Time of day</Label>
          <Select value={String(localHour)} onValueChange={(v) => setLocalHour(Number(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background backdrop-blur-none max-h-72">
              {HOURS.map((h) => (
                <SelectItem key={h.value} value={String(h.value)}>
                  {h.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button size="sm" onClick={save} disabled={saving}>
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        Save schedule
      </Button>
    </div>
  );
}
