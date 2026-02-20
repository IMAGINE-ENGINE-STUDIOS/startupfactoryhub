import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function buildDigestHtml(recipientName: string, data: {
  newStartups: any[],
  newMentors: any[],
  newInvestors: any[],
  newAccelerators: any[],
  newResources: any[],
  newEvents: any[],
}) {
  const { newStartups, newMentors, newInvestors, newAccelerators, newResources, newEvents } = data;
  const total = newStartups.length + newMentors.length + newInvestors.length + newAccelerators.length;

  const renderSection = (emoji: string, title: string, items: any[], nameKey = 'full_name') => {
    if (!items.length) return '';
    return `
    <div class="section">
      <div class="section-header">${emoji} ${title} <span class="count">${items.length} new</span></div>
      <div class="section-content">
        ${items.slice(0, 5).map(i => `<div class="item">• ${i[nameKey] || i.name || i.title || 'Unknown'}</div>`).join('')}
        ${items.length > 5 ? `<div class="item-more">+${items.length - 5} more</div>` : ''}
      </div>
    </div>`;
  };

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #0a0f1e; padding: 20px; }
    .wrapper { max-width: 600px; margin: 0 auto; }
    .container { background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(16,185,129,0.15); }
    .header { background: linear-gradient(135deg,#0ea270 0%,#059669 100%); padding: 40px 32px; text-align: center; }
    .header img { width: 70px; height: 70px; border-radius: 14px; margin-bottom: 14px; }
    .header h1 { color: #fff; font-size: 24px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.85); font-size: 13px; margin-top: 4px; }
    .hero { background: #1a1f35; padding: 28px 32px; text-align: center; }
    .week-badge { display: inline-block; background: rgba(14,162,112,0.15); border: 1px solid rgba(14,162,112,0.3); color: #0ea270; padding: 6px 18px; border-radius: 50px; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px; }
    .hero h2 { color: #f3f4f6; font-size: 22px; font-weight: 700; margin-bottom: 6px; }
    .hero p { color: #9ca3af; font-size: 14px; }
    .stats-row { display: flex; gap: 0; border-bottom: 1px solid rgba(14,162,112,0.15); }
    .stat { flex: 1; padding: 20px 16px; text-align: center; background: #0f1419; border-right: 1px solid rgba(14,162,112,0.1); }
    .stat:last-child { border-right: none; }
    .stat-num { font-size: 28px; font-weight: 800; color: #0ea270; }
    .stat-label { font-size: 11px; color: #6b7280; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px; }
    .content { padding: 24px 32px; background: #0f1419; }
    .section { background: #1a1f35; border-radius: 12px; border: 1px solid rgba(14,162,112,0.15); margin-bottom: 16px; overflow: hidden; }
    .section-header { padding: 14px 20px; font-size: 14px; font-weight: 700; color: #f3f4f6; background: rgba(14,162,112,0.08); border-bottom: 1px solid rgba(14,162,112,0.1); }
    .count { display: inline-block; background: #0ea270; color: #fff; padding: 2px 10px; border-radius: 50px; font-size: 11px; font-weight: 700; margin-left: 8px; }
    .section-content { padding: 12px 20px; }
    .item { color: #d1d5db; font-size: 13px; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
    .item:last-child { border-bottom: none; }
    .item-more { color: #6b7280; font-size: 12px; padding: 8px 0 4px; font-style: italic; }
    .cta-section { text-align: center; padding: 24px 0 8px; }
    .cta-btn { display: inline-block; background: linear-gradient(135deg,#0ea270,#059669); color: #fff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-size: 15px; font-weight: 700; box-shadow: 0 6px 20px rgba(14,162,112,0.4); }
    .footer { background: #0a0f1e; padding: 28px 32px; text-align: center; border-top: 1px solid rgba(14,162,112,0.1); }
    .footer p { color: #6b7280; font-size: 12px; line-height: 1.6; }
    .footer a { color: #0ea270; text-decoration: none; }
    @media (max-width: 600px) { .stats-row { flex-wrap: wrap; } .stat { flex: 1 1 50%; } }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <img src="https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png" alt="SFH" />
        <h1>Startup Factory Hub</h1>
        <p>Your Weekly Platform Digest</p>
      </div>

      <div class="hero">
        <div class="week-badge">📰 Weekly Digest</div>
        <h2>Hi ${recipientName}! Here's what's new 👋</h2>
        <p>${total} new members joined the platform this week</p>
      </div>

      <div class="stats-row">
        <div class="stat"><div class="stat-num">${newStartups.length}</div><div class="stat-label">Startups</div></div>
        <div class="stat"><div class="stat-num">${newMentors.length}</div><div class="stat-label">Mentors</div></div>
        <div class="stat"><div class="stat-num">${newInvestors.length}</div><div class="stat-label">Investors</div></div>
        <div class="stat"><div class="stat-num">${newResources.length + newEvents.length}</div><div class="stat-label">Resources & Events</div></div>
      </div>

      <div class="content">
        ${renderSection('🚀', 'New Startups', newStartups)}
        ${renderSection('🎓', 'New Mentors', newMentors)}
        ${renderSection('💰', 'New Investors', newInvestors)}
        ${renderSection('🏢', 'New Accelerators', newAccelerators)}
        ${renderSection('📚', 'New Resources', newResources, 'title')}
        ${renderSection('📅', 'Upcoming Events', newEvents, 'title')}
        ${total === 0 ? '<div style="text-align:center;color:#6b7280;padding:24px;font-size:14px;">🌙 A quiet week — but big things are coming!</div>' : ''}

        <div class="cta-section">
          <a href="https://startupfactoryhub.lovable.app/dashboard" class="cta-btn">🔭 Explore the Platform</a>
        </div>
      </div>

      <div class="footer">
        <p>You're receiving this weekly digest as a member of Startup Factory Hub.</p>
        <p style="margin-top:8px">© 2025 <a href="https://startupfactoryhub.lovable.app">Startup Factory Hub</a> · All rights reserved</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

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

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch new members by role
    const { data: newRoles } = await supabase
      .from('user_roles')
      .select('role, user_id, profiles(full_name)')
      .gte('created_at', oneWeekAgo);

    const newStartups = (newRoles || []).filter(u => u.role === 'startup').map(u => (u.profiles as any) || {});
    const newMentors = (newRoles || []).filter(u => u.role === 'mentor').map(u => (u.profiles as any) || {});
    const newInvestors = (newRoles || []).filter(u => u.role === 'investor').map(u => (u.profiles as any) || {});
    const newAccelerators = (newRoles || []).filter(u => u.role === 'accelerator').map(u => (u.profiles as any) || {});

    // Fetch new resources
    const { data: newResources } = await supabase
      .from('resources')
      .select('title, category')
      .gte('created_at', oneWeekAgo)
      .limit(10);

    // Fetch upcoming events
    const { data: newEvents } = await supabase
      .from('events')
      .select('title, start_date')
      .gte('created_at', oneWeekAgo)
      .limit(10);

    // Fetch all active users to send digest to
    const { data: allUsers } = await supabase
      .from('profiles')
      .select('email, full_name')
      .not('email', 'is', null);

    if (!allUsers?.length) {
      return new Response(JSON.stringify({ success: true, sent: 0, reason: 'No users' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const digestData = {
      newStartups,
      newMentors,
      newInvestors,
      newAccelerators,
      newResources: newResources || [],
      newEvents: newEvents || [],
    };

    let sent = 0;
    let errors = 0;

    // Send digest to each user (batched to avoid rate limits)
    for (const user of allUsers) {
      if (!user.email) continue;

      try {
        const html = buildDigestHtml(user.full_name || 'Member', digestData);
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Startup Factory Hub <info@startupfactoryhub.com>',
            to: [user.email],
            subject: `📰 Your Weekly SFH Digest — ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`,
            html,
          }),
        });

        if (res.ok) {
          sent++;
        } else {
          errors++;
          console.error(`Failed to send to ${user.email}:`, await res.text());
        }

        // Small delay to avoid Resend rate limits
        await new Promise(r => setTimeout(r, 100));
      } catch (err) {
        errors++;
        console.error(`Error sending to ${user.email}:`, err);
      }
    }

    console.log(`Weekly digest sent: ${sent} success, ${errors} errors`);

    return new Response(JSON.stringify({ success: true, sent, errors }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Weekly digest error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
