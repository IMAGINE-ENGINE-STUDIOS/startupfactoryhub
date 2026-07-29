import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FEATURES = [
  {
    tag: 'PLATAFORMA',
    title: 'Nuevas funciones en la plataforma',
    body: 'Command Deck de Genius AI con todas las herramientas en un solo lugar, editor LightPaper con paginación ilimitada y edición real de texto, Community Investors y una experiencia más rápida en todo el dashboard.',
    url: 'https://startupfactoryhub.com/dashboard',
  },
  {
    tag: 'RESOURCE MAP',
    title: '66 nuevos recursos globales',
    body: 'Incubadoras, VCs, transferencia tecnológica, grants y coworkings, categorizados por etapa: idea, MVP, validación, lanzamiento y crecimiento. El mapa ahora se centra automáticamente en tus recursos.',
    url: 'https://startupfactoryhub.com/resources',
  },
  {
    tag: 'GENIUS AI',
    title: 'Nuevos planes: Free, Starter, Pro y Enterprise',
    body: 'Free con 50 créditos al mes, Starter $9/mes con 1,000 créditos, Pro $29/mes con 5,000 créditos y modelos premium, y Enterprise a medida. Precio por crédito totalmente transparente dentro de la app.',
    url: 'https://startupfactoryhub.com/dashboard',
  },
  {
    tag: 'CRM',
    title: 'Escáner de tarjetas de presentación',
    body: 'Toma una foto de una tarjeta y la IA extrae automáticamente nombre, cargo, empresa, email y teléfono directo a tu CRM.',
    url: 'https://startupfactoryhub.com/dashboard?tab=crm',
  },
];


const buildHtml = (name: string) => `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Novedades en Startup Factory Hub</title>
</head>
<body style="margin:0;padding:0;background:#060b16;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Nuevas funciones, 66 nuevos recursos, planes de Genius AI y escáner de tarjetas.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#060b16;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#0b1220;border:1px solid rgba(16,185,129,0.18);border-radius:20px;overflow:hidden;">

  <tr><td style="background:linear-gradient(135deg,#0ea270 0%,#065f46 100%);padding:40px 32px;text-align:center;">
    <div style="display:inline-block;background:rgba(255,255,255,0.14);color:#ffffff;font-size:11px;font-weight:700;letter-spacing:2px;padding:6px 16px;border-radius:999px;">PRODUCT UPDATE</div>
    <h1 style="margin:18px 0 6px;color:#ffffff;font-size:28px;font-weight:800;line-height:1.2;">Lo nuevo en Startup Factory Hub</h1>
    <p style="margin:0;color:rgba(255,255,255,0.82);font-size:14px;">Una plataforma más rápida, más global y con más inteligencia</p>
  </td></tr>

  <tr><td style="padding:32px 32px 8px;">
    <p style="margin:0 0 8px;color:#e5e7eb;font-size:16px;line-height:1.6;">Hola ${name},</p>
    <p style="margin:0;color:#9ca3af;font-size:14px;line-height:1.7;">Hemos lanzado una gran tanda de mejoras en el ecosistema. Este es el resumen de todo lo que ya puedes usar hoy.</p>
  </td></tr>

  ${FEATURES.map((f) => `
  <tr><td style="padding:12px 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#111a2c;border:1px solid rgba(16,185,129,0.16);border-radius:14px;">
      <tr><td style="padding:20px 22px;">
        <div style="color:#10b981;font-size:10px;font-weight:800;letter-spacing:1.4px;margin-bottom:8px;">${f.tag}</div>
        <div style="color:#f3f4f6;font-size:17px;font-weight:700;margin-bottom:8px;">${f.title}</div>
        <div style="color:#9ca3af;font-size:13.5px;line-height:1.7;">${f.body}</div>
        <div style="margin-top:14px;"><a href="${f.url}" style="color:#10b981;font-size:13px;font-weight:700;text-decoration:none;">Explorar &rarr;</a></div>
      </td></tr>
    </table>
  </td></tr>`).join('')}

  <tr><td style="padding:28px 32px 36px;text-align:center;">
    <a href="https://startupfactoryhub.com" style="display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:15px 38px;border-radius:999px;">Entrar a la plataforma</a>
  </td></tr>

  <tr><td style="background:#070d18;padding:26px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
    <p style="margin:0 0 6px;color:#6b7280;font-size:12px;">Startup Factory Hub &middot; Construyendo el ecosistema global de startups</p>
    <p style="margin:0;color:#4b5563;font-size:11px;">Recibes este correo porque tienes una cuenta activa en Startup Factory Hub.</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase credentials not configured');

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Math.max(Number(body.limit) || 100, 1), 500);
    const offset = Math.max(Number(body.offset) || 0, 0);
    const testEmail: string | undefined = body.testEmail;
    const dryRun = body.dryRun === true;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Admin-only unless it's a test to a single address by an authenticated admin
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '');
    const { data: userData } = await supabase.auth.getUser(token);
    const callerId = userData?.user?.id;
    if (!callerId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: callerId, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const targetEmails: string[] = Array.isArray(body.targetEmails) ? body.targetEmails.filter((e: unknown) => typeof e === 'string' && e.includes('@')) : [];

    let recipients: { email: string; full_name: string | null }[] = [];
    if (testEmail) {
      recipients = [{ email: testEmail, full_name: 'Test' }];
    } else if (targetEmails.length > 0) {
      const { data } = await supabase
        .from('profiles')
        .select('email, full_name')
        .in('email', targetEmails);
      const nameByEmail = new Map((data || []).map((p: any) => [p.email, p.full_name]));
      recipients = targetEmails.map((email) => ({ email, full_name: nameByEmail.get(email) ?? null }));
    } else {
      const { data, error } = await supabase
        .from('profiles')
        .select('email, full_name, created_at')
        .not('email', 'is', null)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);
      if (error) throw error;
      recipients = (data || []) as any[];
    }


    if (dryRun) {
      return new Response(JSON.stringify({ success: true, dryRun: true, count: recipients.length, offset, limit }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let sent = 0;
    let errors = 0;
    const seen = new Set<string>();

    for (const user of recipients) {
      const email = (user.email || '').trim().toLowerCase();
      if (!email || seen.has(email)) continue;
      seen.add(email);

      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Startup Factory Hub <info@startupfactoryhub.com>',
            to: [email],
            subject: 'Novedades en Startup Factory Hub: World ATLAS, Genius Deck y 66 nuevos recursos',
            html: buildHtml(user.full_name || 'Founder'),
          }),
        });
        if (res.ok) sent++;
        else { errors++; console.error(`Failed for ${email}:`, await res.text()); }
        await new Promise((r) => setTimeout(r, 120));
      } catch (err) {
        errors++;
        console.error(`Error for ${email}:`, err);
      }
    }

    console.log(`Product update batch: offset=${offset} limit=${limit} sent=${sent} errors=${errors}`);

    return new Response(JSON.stringify({ success: true, sent, errors, offset, limit, nextOffset: offset + limit }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('send-product-update error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
