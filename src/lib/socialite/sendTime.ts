/**
 * Send-time helpers for SOCIALITE. A send time is a wall-clock date/time
 * ("2026-10-01T10:00") in a chosen IANA time zone; we convert it to the exact
 * UTC moment the server scheduler (socialite-scheduler) fires at.
 */
import { supabase } from "@/integrations/supabase/client";

export const SEND_TIMEZONES = [
  { id: "America/New_York", label: "New York / Florida (ET)" },
  { id: "America/Chicago", label: "Chicago (CT)" },
  { id: "America/Denver", label: "Denver (MT)" },
  { id: "America/Los_Angeles", label: "Los Angeles (PT)" },
  { id: "America/Sao_Paulo", label: "São Paulo" },
  { id: "America/Mexico_City", label: "Mexico City" },
  { id: "Europe/London", label: "London" },
  { id: "Europe/Madrid", label: "Madrid / Paris" },
  { id: "Asia/Dubai", label: "Dubai" },
  { id: "Asia/Tokyo", label: "Tokyo" },
  { id: "Australia/Sydney", label: "Sydney" },
  { id: "UTC", label: "UTC" },
];

export const TZ_KEY = "pf_send_timezone";
export const getSavedTz = () => localStorage.getItem(TZ_KEY) || "America/New_York";

/** Offset (ms) of `tz` from UTC at instant `d`. */
function tzOffset(d: Date, tz: string) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
    .formatToParts(d).map((x) => [x.type, x.value]));
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - d.getTime();
}

/** "2026-10-01T10:00" in `tz` → exact Date. */
export function zonedToDate(local: string, tz: string) {
  const [dt, tm = "00:00"] = local.split("T");
  const [y, m, d] = dt.split("-").map(Number);
  const [h, mi] = tm.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, h, mi);
  let t = guess - tzOffset(new Date(guess), tz);
  t = guess - tzOffset(new Date(t), tz); // second pass handles DST edges
  return new Date(t);
}

export const fmtIn = (d: Date | string, tz: string) =>
  new Date(d).toLocaleString([], { timeZone: tz, month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" });

export type SendKind = "post" | "email" | "sms" | "whatsapp" | "call" | "contact";

/** Queue a send on the server. Returns the row id or throws. */
export async function scheduleSend(kind: SendKind, payload: unknown, local: string, tz: string) {
  const when = zonedToDate(local, tz);
  if (isNaN(when.getTime())) throw new Error("Pick a valid date and time");
  if (when.getTime() < Date.now() - 60_000) throw new Error("That time has already passed");
  const { data: u } = await supabase.auth.getUser();
  const { data, error } = await (supabase as any).from("socialite_scheduled")
    .insert({ kind, payload, send_at: when.toISOString(), timezone: tz, created_by: u.user?.id ?? null })
    .select("id").single();
  if (error) throw new Error(error.message);
  return { id: data.id as string, when };
}
