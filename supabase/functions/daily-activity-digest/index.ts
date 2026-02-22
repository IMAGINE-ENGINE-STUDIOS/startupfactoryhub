import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

interface UserActivity {
  likes: { actorName: string; actorAvatar: string | null; postContent: string }[];
  comments: { actorName: string; actorAvatar: string | null; postContent: string; commentText: string }[];
  bookmarks: { actorName: string; actorAvatar: string | null; postContent: string }[];
  shares: { actorName: string; actorAvatar: string | null; postContent: string }[];
  newFollowers: { name: string; avatar: string | null }[];
  newMessages: number;
  newConnectionRequests: { name: string; avatar: string | null }[];
}

function buildDigestHtml(recipientName: string, activity: UserActivity) {
  const renderActorRow = (name: string, avatar: string | null, detail: string) => {
    const avatarHtml = avatar
      ? `<img src="${avatar}" alt="${name}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;border:1px solid rgba(14,162,112,0.3);flex-shrink:0;" />`
      : `<div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#0ea270,#059669);display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;flex-shrink:0;">${getInitials(name)}</div>`;
    return `<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);">${avatarHtml}<span style="color:#d1d5db;font-size:13px;"><strong style="color:#f3f4f6;">${name}</strong> ${detail}</span></div>`;
  };

  const renderSection = (emoji: string, title: string, count: number, content: string) => {
    if (count === 0) return '';
    return `
    <div style="background:#1a1f35;border-radius:12px;border:1px solid rgba(14,162,112,0.15);margin-bottom:16px;overflow:hidden;">
      <div style="padding:14px 20px;font-size:14px;font-weight:700;color:#f3f4f6;background:rgba(14,162,112,0.08);border-bottom:1px solid rgba(14,162,112,0.1);">
        ${emoji} ${title} <span style="display:inline-block;background:#0ea270;color:#fff;padding:2px 10px;border-radius:50px;font-size:11px;font-weight:700;margin-left:8px;">${count}</span>
      </div>
      <div style="padding:12px 20px;">${content}</div>
    </div>`;
  };

  // Build sections
  const likesContent = activity.likes.slice(0, 5).map(l =>
    renderActorRow(l.actorName, l.actorAvatar, 'liked your post')
  ).join('') + (activity.likes.length > 5 ? `<div style="color:#6b7280;font-size:12px;padding:8px 0 4px;font-style:italic;">+${activity.likes.length - 5} more</div>` : '');

  const commentsContent = activity.comments.slice(0, 5).map(c =>
    renderActorRow(c.actorName, c.actorAvatar, `commented: "${c.commentText.slice(0, 50)}${c.commentText.length > 50 ? '…' : ''}"`)
  ).join('') + (activity.comments.length > 5 ? `<div style="color:#6b7280;font-size:12px;padding:8px 0 4px;font-style:italic;">+${activity.comments.length - 5} more</div>` : '');

  const bookmarksContent = activity.bookmarks.slice(0, 5).map(b =>
    renderActorRow(b.actorName, b.actorAvatar, 'bookmarked your post')
  ).join('') + (activity.bookmarks.length > 5 ? `<div style="color:#6b7280;font-size:12px;padding:8px 0 4px;font-style:italic;">+${activity.bookmarks.length - 5} more</div>` : '');

  const sharesContent = activity.shares.slice(0, 5).map(s =>
    renderActorRow(s.actorName, s.actorAvatar, 'shared your post')
  ).join('') + (activity.shares.length > 5 ? `<div style="color:#6b7280;font-size:12px;padding:8px 0 4px;font-style:italic;">+${activity.shares.length - 5} more</div>` : '');

  const followersContent = activity.newFollowers.slice(0, 5).map(f =>
    renderActorRow(f.name, f.avatar, 'started following you')
  ).join('') + (activity.newFollowers.length > 5 ? `<div style="color:#6b7280;font-size:12px;padding:8px 0 4px;font-style:italic;">+${activity.newFollowers.length - 5} more</div>` : '');

  const messagesContent = `<div style="color:#d1d5db;font-size:13px;padding:6px 0;">You received <strong style="color:#0ea270;">${activity.newMessages}</strong> new message${activity.newMessages > 1 ? 's' : ''}.</div>`;

  const connectionsContent = activity.newConnectionRequests.slice(0, 5).map(c =>
    renderActorRow(c.name, c.avatar, 'wants to connect with you')
  ).join('') + (activity.newConnectionRequests.length > 5 ? `<div style="color:#6b7280;font-size:12px;padding:8px 0 4px;font-style:italic;">+${activity.newConnectionRequests.length - 5} more</div>` : '');

  const totalActivity = activity.likes.length + activity.comments.length + activity.bookmarks.length + activity.shares.length + activity.newFollowers.length + activity.newMessages + activity.newConnectionRequests.length;

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
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div style="background:linear-gradient(135deg,#0ea270 0%,#059669 100%);padding:40px 32px;text-align:center;">
        <img src="https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png" alt="SFH" style="width:70px;height:70px;border-radius:14px;margin-bottom:14px;" />
        <h1 style="color:#fff;font-size:24px;font-weight:700;">Startup Factory Hub</h1>
        <p style="color:rgba(255,255,255,0.85);font-size:13px;margin-top:4px;">Your Daily Activity Summary</p>
      </div>

      <div style="background:#1a1f35;padding:28px 32px;text-align:center;">
        <div style="display:inline-block;background:rgba(14,162,112,0.15);border:1px solid rgba(14,162,112,0.3);color:#0ea270;padding:6px 18px;border-radius:50px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:16px;">Daily Digest</div>
        <h2 style="color:#f3f4f6;font-size:22px;font-weight:700;margin-bottom:6px;">Hi ${recipientName}! Here's your activity 👋</h2>
        <p style="color:#9ca3af;font-size:14px;">${totalActivity} interaction${totalActivity !== 1 ? 's' : ''} on your content today</p>
      </div>

      <div style="display:flex;gap:0;border-bottom:1px solid rgba(14,162,112,0.15);">
        <div style="flex:1;padding:20px 16px;text-align:center;background:#0f1419;border-right:1px solid rgba(14,162,112,0.1);">
          <div style="font-size:28px;font-weight:800;color:#0ea270;">${activity.likes.length}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:2px;text-transform:uppercase;letter-spacing:0.5px;">Likes</div>
        </div>
        <div style="flex:1;padding:20px 16px;text-align:center;background:#0f1419;border-right:1px solid rgba(14,162,112,0.1);">
          <div style="font-size:28px;font-weight:800;color:#0ea270;">${activity.comments.length}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:2px;text-transform:uppercase;letter-spacing:0.5px;">Comments</div>
        </div>
        <div style="flex:1;padding:20px 16px;text-align:center;background:#0f1419;border-right:1px solid rgba(14,162,112,0.1);">
          <div style="font-size:28px;font-weight:800;color:#0ea270;">${activity.newFollowers.length}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:2px;text-transform:uppercase;letter-spacing:0.5px;">Followers</div>
        </div>
        <div style="flex:1;padding:20px 16px;text-align:center;background:#0f1419;">
          <div style="font-size:28px;font-weight:800;color:#0ea270;">${activity.newMessages}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:2px;text-transform:uppercase;letter-spacing:0.5px;">Messages</div>
        </div>
      </div>

      <div style="padding:24px 32px;background:#0f1419;">
        ${renderSection('❤️', 'New Likes', activity.likes.length, likesContent)}
        ${renderSection('💬', 'New Comments', activity.comments.length, commentsContent)}
        ${renderSection('🔖', 'New Bookmarks', activity.bookmarks.length, bookmarksContent)}
        ${renderSection('🔄', 'Shares', activity.shares.length, sharesContent)}
        ${renderSection('👤', 'New Followers', activity.newFollowers.length, followersContent)}
        ${renderSection('✉️', 'New Messages', activity.newMessages, messagesContent)}
        ${renderSection('🤝', 'Connection Requests', activity.newConnectionRequests.length, connectionsContent)}

        <div style="text-align:center;padding:24px 0 8px;">
          <a href="https://startupfactoryhub.com" style="display:inline-block;background:linear-gradient(135deg,#0ea270,#059669);color:#fff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;box-shadow:0 6px 20px rgba(14,162,112,0.4);">View Your Feed</a>
        </div>
      </div>

      <div style="background:#0a0f1e;padding:28px 32px;text-align:center;border-top:1px solid rgba(14,162,112,0.1);">
        <p style="color:#6b7280;font-size:12px;line-height:1.6;">You're receiving this daily digest because you had activity on Startup Factory Hub.</p>
        <p style="color:#6b7280;font-size:12px;margin-top:8px;">© 2025 <a href="https://startupfactoryhub.com" style="color:#0ea270;text-decoration:none;">Startup Factory Hub</a> · <a href="https://www.linkedin.com/company/startup-factory-hub/?viewAsMember=true" style="color:#0ea270;text-decoration:none;">LinkedIn</a> · All rights reserved</p>
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
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // 1. Likes in last 24h — join with feed_posts to get post owner
    const { data: recentLikes } = await supabase
      .from('post_likes')
      .select('user_id, post_id, feed_posts!inner(user_id, content), profiles!post_likes_user_id_fkey(full_name, avatar_url)')
      .gte('created_at', oneDayAgo);

    // 2. Comments in last 24h
    const { data: recentComments } = await supabase
      .from('post_comments')
      .select('user_id, post_id, content, feed_posts!inner(user_id, content), profiles!post_comments_user_id_fkey(full_name, avatar_url)')
      .gte('created_at', oneDayAgo);

    // 3. Bookmarks in last 24h
    const { data: recentBookmarks } = await supabase
      .from('post_bookmarks')
      .select('user_id, post_id, feed_posts!inner(user_id, content), profiles!post_bookmarks_user_id_fkey(full_name, avatar_url)')
      .gte('created_at', oneDayAgo);

    // 4. Shares (feed_posts with shared_post_id) in last 24h
    const { data: recentShares } = await supabase
      .from('feed_posts')
      .select('user_id, shared_post_id, content, profiles!feed_posts_user_id_fkey(full_name, avatar_url), shared:feed_posts!feed_posts_shared_post_id_fkey(user_id)')
      .not('shared_post_id', 'is', null)
      .gte('created_at', oneDayAgo);

    // 5. New followers in last 24h
    const { data: recentFollows } = await supabase
      .from('follows')
      .select('follower_id, following_id, profiles!follows_follower_id_fkey(full_name, avatar_url)')
      .gte('created_at', oneDayAgo);

    // 6. New messages in last 24h (count per receiver)
    const { data: recentMessages } = await supabase
      .from('messages')
      .select('receiver_id, sender_id')
      .gte('created_at', oneDayAgo);

    // 7. New connection requests in last 24h
    const { data: recentConnections } = await supabase
      .from('connections')
      .select('requester_id, addressee_id, status, profiles!connections_requester_id_fkey(full_name, avatar_url)')
      .eq('status', 'pending')
      .gte('created_at', oneDayAgo);

    // Group activity by receiving user
    const userActivity: Record<string, UserActivity> = {};

    const ensureUser = (uid: string) => {
      if (!userActivity[uid]) {
        userActivity[uid] = { likes: [], comments: [], bookmarks: [], shares: [], newFollowers: [], newMessages: 0, newConnectionRequests: [] };
      }
    };

    // Process likes
    for (const like of recentLikes || []) {
      const postOwner = (like.feed_posts as any)?.user_id;
      if (!postOwner || postOwner === like.user_id) continue;
      ensureUser(postOwner);
      const profile = like.profiles as any;
      userActivity[postOwner].likes.push({
        actorName: profile?.full_name || 'Someone',
        actorAvatar: profile?.avatar_url || null,
        postContent: ((like.feed_posts as any)?.content || '').slice(0, 80),
      });
    }

    // Process comments
    for (const comment of recentComments || []) {
      const postOwner = (comment.feed_posts as any)?.user_id;
      if (!postOwner || postOwner === comment.user_id) continue;
      ensureUser(postOwner);
      const profile = comment.profiles as any;
      userActivity[postOwner].comments.push({
        actorName: profile?.full_name || 'Someone',
        actorAvatar: profile?.avatar_url || null,
        postContent: ((comment.feed_posts as any)?.content || '').slice(0, 80),
        commentText: comment.content || '',
      });
    }

    // Process bookmarks
    for (const bm of recentBookmarks || []) {
      const postOwner = (bm.feed_posts as any)?.user_id;
      if (!postOwner || postOwner === bm.user_id) continue;
      ensureUser(postOwner);
      const profile = bm.profiles as any;
      userActivity[postOwner].bookmarks.push({
        actorName: profile?.full_name || 'Someone',
        actorAvatar: profile?.avatar_url || null,
        postContent: ((bm.feed_posts as any)?.content || '').slice(0, 80),
      });
    }

    // Process shares
    for (const share of recentShares || []) {
      const originalPostOwner = (share.shared as any)?.user_id;
      if (!originalPostOwner || originalPostOwner === share.user_id) continue;
      ensureUser(originalPostOwner);
      const profile = share.profiles as any;
      userActivity[originalPostOwner].shares.push({
        actorName: profile?.full_name || 'Someone',
        actorAvatar: profile?.avatar_url || null,
        postContent: (share.content || '').slice(0, 80),
      });
    }

    // Process followers
    for (const follow of recentFollows || []) {
      ensureUser(follow.following_id);
      const profile = follow.profiles as any;
      userActivity[follow.following_id].newFollowers.push({
        name: profile?.full_name || 'Someone',
        avatar: profile?.avatar_url || null,
      });
    }

    // Process messages
    for (const msg of recentMessages || []) {
      if (msg.receiver_id === msg.sender_id) continue;
      ensureUser(msg.receiver_id);
      userActivity[msg.receiver_id].newMessages++;
    }

    // Process connection requests
    for (const conn of recentConnections || []) {
      ensureUser(conn.addressee_id);
      const profile = conn.profiles as any;
      userActivity[conn.addressee_id].newConnectionRequests.push({
        name: profile?.full_name || 'Someone',
        avatar: profile?.avatar_url || null,
      });
    }

    // Filter users with no activity
    const activeUserIds = Object.keys(userActivity).filter(uid => {
      const a = userActivity[uid];
      return a.likes.length + a.comments.length + a.bookmarks.length + a.shares.length + a.newFollowers.length + a.newMessages + a.newConnectionRequests.length > 0;
    });

    if (activeUserIds.length === 0) {
      console.log('No activity in last 24h — no digests to send');
      return new Response(JSON.stringify({ success: true, sent: 0, reason: 'No activity' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch profiles for active users
    const { data: userProfiles } = await supabase
      .from('profiles')
      .select('user_id, email, full_name')
      .in('user_id', activeUserIds);

    const profileMap = new Map((userProfiles || []).map(p => [p.user_id, p]));

    let sent = 0;
    let errors = 0;

    for (const userId of activeUserIds) {
      const profile = profileMap.get(userId);
      if (!profile?.email) continue;

      try {
        const html = buildDigestHtml(profile.full_name || 'Member', userActivity[userId]);
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Startup Factory Hub <info@startupfactoryhub.com>',
            to: [profile.email],
            subject: `📊 Your Daily Activity — ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`,
            html,
          }),
        });

        if (res.ok) {
          sent++;
        } else {
          errors++;
          console.error(`Failed to send to ${profile.email}:`, await res.text());
        }

        // Rate limit: 100ms between sends
        await new Promise(r => setTimeout(r, 100));
      } catch (err) {
        errors++;
        console.error(`Error sending to ${profile.email}:`, err);
      }
    }

    console.log(`Daily digest sent: ${sent} success, ${errors} errors`);

    return new Response(JSON.stringify({ success: true, sent, errors }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Daily digest error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
