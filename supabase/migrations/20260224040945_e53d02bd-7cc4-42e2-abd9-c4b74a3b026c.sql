
-- =============================================
-- FIX: Remove duplicate triggers causing double emails/notifications/counts
-- =============================================

-- Connections: keep on_new_connection and on_connection_accepted, drop duplicates
DROP TRIGGER IF EXISTS trigger_notify_new_connection ON public.connections;
DROP TRIGGER IF EXISTS trigger_notify_connection_accepted ON public.connections;

-- Messages: keep on_new_message, drop duplicate
DROP TRIGGER IF EXISTS trigger_notify_new_message ON public.messages;

-- Post likes: keep update_likes_count_on_like, drop duplicate
DROP TRIGGER IF EXISTS update_post_likes_count_trigger ON public.post_likes;

-- Post comments: keep update_comments_count_on_comment, drop duplicate
DROP TRIGGER IF EXISTS update_post_comments_count_trigger ON public.post_comments;

-- Post bookmarks: keep update_bookmarks_count_on_bookmark, drop duplicate
DROP TRIGGER IF EXISTS update_post_bookmarks_count_trigger ON public.post_bookmarks;

-- Post shares: keep update_shares_count_on_share, drop duplicate
DROP TRIGGER IF EXISTS update_post_shares_count_trigger ON public.feed_posts;

-- Add missing post_bookmarks notification trigger (likes and comments have it, bookmarks don't)
DROP TRIGGER IF EXISTS trigger_notify_post_bookmark ON public.post_bookmarks;
CREATE TRIGGER trigger_notify_post_bookmark
  AFTER INSERT ON public.post_bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_post_interaction();

-- =============================================
-- Enable pg_cron for daily digest scheduling
-- =============================================
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
