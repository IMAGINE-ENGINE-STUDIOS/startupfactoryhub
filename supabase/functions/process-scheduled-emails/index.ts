import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    const { data: due, error } = await supabase
      .from('scheduled_emails')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(10);

    if (error) throw error;

    const processed: unknown[] = [];

    for (const job of due ?? []) {
      await supabase.from('scheduled_emails').update({ status: 'processing' }).eq('id', job.id);

      let sent = 0;
      let errors = 0;
      let lastError: string | null = null;

      try {
        if (job.mode === 'per_recipient') {
          for (const email of job.recipients ?? []) {
            const body = { ...(job.body ?? {}), [job.recipient_field || 'to']: email };
            const { error: fnError } = await supabase.functions.invoke(job.function_name, { body });
            if (fnError) {
              errors++;
              lastError = fnError.message;
            } else {
              sent++;
            }
            await new Promise((r) => setTimeout(r, 250));
          }
        } else {
          const body = { ...(job.body ?? {}) };
          if ((job.recipients ?? []).length > 0) {
            body[job.recipient_field || 'targetEmails'] = job.recipients;
          }
          const { data, error: fnError } = await supabase.functions.invoke(job.function_name, { body });
          if (fnError) throw fnError;
          sent = (data as any)?.sent ?? (job.recipients?.length || 0);
          errors = (data as any)?.errors ?? 0;
        }

        await supabase
          .from('scheduled_emails')
          .update({
            status: errors > 0 && sent === 0 ? 'failed' : 'sent',
            sent_count: sent,
            error_count: errors,
            last_error: lastError,
            processed_at: new Date().toISOString(),
          })
          .eq('id', job.id);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Scheduled email ${job.id} failed:`, message);
        await supabase
          .from('scheduled_emails')
          .update({
            status: 'failed',
            sent_count: sent,
            error_count: errors || 1,
            last_error: message,
            processed_at: new Date().toISOString(),
          })
          .eq('id', job.id);
      }

      processed.push({ id: job.id, label: job.label, sent, errors });
    }

    return new Response(JSON.stringify({ processed: processed.length, jobs: processed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('process-scheduled-emails error:', message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
