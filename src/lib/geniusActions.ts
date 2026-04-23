// Client-side executor for actions proposed by the genius-agent edge function.
// Each action runs against the user's RLS-protected Supabase data, or fires
// a navigation/lightpaper event the rest of the app already listens to.

import { supabase } from "@/integrations/supabase/client";
import type { NavigateFunction } from "react-router-dom";

export type ProposedAction = {
  id: string;
  name: string;
  args: Record<string, any>;
  title: string;
  details: string[];
  risk: "low" | "medium" | "high";
};

export type ActionResult = {
  ok: boolean;
  summary: string;
  error?: string;
};

interface ExecCtx {
  userId: string | null;
  navigate: NavigateFunction;
  /** Used to prompt the chat to attach a document image */
  requestDocumentUpload?: () => void;
}

const markdownToHtml = (md: string) =>
  md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^\- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    .replace(/\n{2,}/g, '</p><p style="font-size:12pt;line-height:1.6;">')
    .replace(/\n/g, "<br/>")
    .replace(/^/, '<p style="font-size:12pt;line-height:1.6;">')
    .replace(/$/, "</p>");

export async function executeAction(action: ProposedAction, ctx: ExecCtx): Promise<ActionResult> {
  try {
    switch (action.name) {
      // ───────────── Calendar ─────────────
      case "schedule_calendar_booking": {
        if (!ctx.userId) return { ok: false, summary: "Not signed in" };
        const a = action.args;
        const { error } = await supabase.from("calendar_bookings").insert({
          host_id: ctx.userId,
          booker_id: ctx.userId,
          booker_name: a.booker_name || "Self",
          booker_email: a.booker_email || "",
          scheduled_at: a.scheduled_at,
          duration_minutes: a.duration_minutes ?? 30,
          topic: a.topic,
          status: "confirmed",
          meeting_type: a.meeting_type || "video",
          notes: a.notes ?? null,
        });
        if (error) throw error;
        return { ok: true, summary: `Booking "${a.topic}" created for ${new Date(a.scheduled_at).toLocaleString()}.` };
      }

      case "reschedule_calendar_booking": {
        const a = action.args;
        const update: any = { scheduled_at: a.scheduled_at };
        if (a.duration_minutes) update.duration_minutes = a.duration_minutes;
        const { error } = await supabase.from("calendar_bookings").update(update).eq("id", a.booking_id);
        if (error) throw error;
        return { ok: true, summary: `Booking rescheduled to ${new Date(a.scheduled_at).toLocaleString()}.` };
      }

      case "cancel_calendar_booking": {
        const a = action.args;
        const { error } = await supabase.from("calendar_bookings").update({ status: "cancelled" }).eq("id", a.booking_id);
        if (error) throw error;
        return { ok: true, summary: "Booking cancelled." };
      }

      case "update_calendar_settings": {
        if (!ctx.userId) return { ok: false, summary: "Not signed in" };
        const a = action.args;
        const { data: existing } = await supabase
          .from("calendar_booking_settings")
          .select("id")
          .eq("user_id", ctx.userId)
          .maybeSingle();
        if (existing) {
          const { error } = await supabase.from("calendar_booking_settings").update(a).eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("calendar_booking_settings").insert({
            user_id: ctx.userId,
            booking_slug: ctx.userId.slice(0, 8),
            ...a,
          });
          if (error) throw error;
        }
        return { ok: true, summary: "Calendar settings updated." };
      }

      case "schedule_mentoring_session": {
        if (!ctx.userId) return { ok: false, summary: "Not signed in" };
        const a = action.args;
        // Find mentor by name keyword
        const { data: mentors } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .ilike("full_name", `%${a.mentor_query}%`)
          .limit(1);
        const mentor = mentors?.[0];
        if (!mentor) return { ok: false, summary: `Mentor matching "${a.mentor_query}" not found.` };

        const { error } = await supabase.from("mentoring_sessions").insert({
          mentor_id: mentor.user_id,
          mentee_id: ctx.userId,
          scheduled_at: a.scheduled_at,
          duration_minutes: a.duration_minutes ?? 60,
          topic: a.topic,
          description: a.description ?? null,
          status: "pending",
        });
        if (error) throw error;
        return { ok: true, summary: `Mentoring session requested with ${mentor.full_name}.` };
      }

      // ───────────── Events ─────────────
      case "create_event": {
        if (!ctx.userId) return { ok: false, summary: "Not signed in" };
        const a = action.args;
        const { data, error } = await supabase
          .from("events")
          .insert({
            organizer_id: ctx.userId,
            title: a.title,
            description: a.description ?? "",
            start_date: a.start_date,
            end_date: a.end_date,
            location: a.location ?? null,
            max_attendees: a.max_attendees ?? null,
            is_paid: a.is_paid ?? false,
            ticket_price_cents: a.ticket_price_cents ?? 0,
          })
          .select("id")
          .single();
        if (error) throw error;
        return { ok: true, summary: `Event "${a.title}" created.` };
      }

      case "update_event": {
        const a = action.args;
        const { event_id, ...updates } = a;
        const { error } = await supabase.from("events").update(updates).eq("id", event_id);
        if (error) throw error;
        return { ok: true, summary: "Event updated." };
      }

      case "rsvp_to_event": {
        if (!ctx.userId) return { ok: false, summary: "Not signed in" };
        const a = action.args;
        const { data: events } = await supabase
          .from("events")
          .select("id, title")
          .ilike("title", `%${a.event_query}%`)
          .limit(1);
        const ev = events?.[0];
        if (!ev) return { ok: false, summary: `Event matching "${a.event_query}" not found.` };

        const { error } = await supabase
          .from("event_attendees")
          .upsert({ event_id: ev.id, user_id: ctx.userId, status: a.status }, { onConflict: "event_id,user_id" });
        if (error) throw error;
        return { ok: true, summary: `RSVP "${a.status}" recorded for "${ev.title}".` };
      }

      // ───────────── LightPaper ─────────────
      case "create_lightpaper_document": {
        const a = action.args;
        const html = markdownToHtml(a.markdown_content);
        window.dispatchEvent(
          new CustomEvent("genius-open-in-lightpaper", {
            detail: { content: html, title: a.title },
          })
        );
        setTimeout(() => ctx.navigate("/lightpaper"), 200);
        return { ok: true, summary: `Document "${a.title}" opened in LightPaper.` };
      }

      case "insert_into_active_lightpaper": {
        const a = action.args;
        window.dispatchEvent(
          new CustomEvent("genius-insert-into-lightpaper", {
            detail: { markdown: a.markdown_content },
          })
        );
        return { ok: true, summary: "Inserted into open LightPaper document." };
      }

      // ───────────── Analysis ─────────────
      case "analyze_uploaded_document": {
        ctx.requestDocumentUpload?.();
        return { ok: true, summary: "Tap the 📎 attach button below to upload a document." };
      }

      case "summarize_text": {
        const { data, error } = await supabase.functions.invoke("ai-text-summarizer", {
          body: { text: action.args.text },
        });
        if (error) throw error;
        return { ok: true, summary: data?.summary || "Summary ready." };
      }

      case "translate_text": {
        const { data, error } = await supabase.functions.invoke("ai-translator", {
          body: {
            text: action.args.text,
            source_language: "auto",
            target_language: action.args.target_language,
          },
        });
        if (error) throw error;
        return { ok: true, summary: data?.translated_text || "Translation ready." };
      }

      case "analyze_sentiment": {
        const { data, error } = await supabase.functions.invoke("ai-sentiment-analyzer", {
          body: { text: action.args.text },
        });
        if (error) throw error;
        return {
          ok: true,
          summary: `Sentiment: ${data?.sentiment ?? "n/a"} (score ${data?.score ?? 0}).`,
        };
      }

      // ───────────── Search & navigation ─────────────
      case "web_search": {
        // Open Perplexity-style search via the platform's existing search if available;
        // otherwise fall back to a Google search in a new tab.
        const q = encodeURIComponent(action.args.query);
        window.open(`https://www.google.com/search?q=${q}`, "_blank", "noopener,noreferrer");
        return { ok: true, summary: `Web search opened for "${action.args.query}".` };
      }

      case "platform_search": {
        const { data, error } = await supabase.functions.invoke("search", {
          body: { query: action.args.query, types: action.args.types },
        });
        if (error) throw error;
        const counts = data
          ? Object.entries(data)
              .map(([k, v]) => `${k}: ${(v as any[])?.length ?? 0}`)
              .join(", ")
          : "no results";
        return { ok: true, summary: `Platform search results — ${counts}.` };
      }

      case "navigate_4d_map": {
        const a = action.args;
        ctx.navigate("/dashboard?tab=resources");
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("genius-map-navigate", {
              detail: { lat: a.lat, lng: a.lng, zoom: a.zoom ?? 14, place: a.place, layer: a.layer ?? "" },
            })
          );
        }, 600);
        return { ok: true, summary: `Flying to ${a.place}.` };
      }

      case "open_dashboard_tab": {
        const a = action.args;
        const search = a.search ? `&search=${encodeURIComponent(a.search)}` : "";
        ctx.navigate(`/dashboard?tab=${a.tab}${search}`);
        return { ok: true, summary: `Opened ${a.tab}.` };
      }

      default:
        return { ok: false, summary: `Unknown action: ${action.name}` };
    }
  } catch (e: any) {
    console.error("executeAction error:", action.name, e);
    return { ok: false, summary: "Action failed", error: e?.message || String(e) };
  }
}
