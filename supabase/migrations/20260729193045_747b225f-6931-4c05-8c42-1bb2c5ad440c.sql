REVOKE EXECUTE ON FUNCTION public.consume_genius_turn(uuid, bigint, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_session_stats(uuid, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_storage_usage(uuid, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_startup_announcement() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.consume_genius_turn(uuid, bigint, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_session_stats(uuid, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_storage_usage(uuid, bigint) TO service_role;

REVOKE EXECUTE ON FUNCTION public.check_and_grant_official_status(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_user_online_status(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_and_grant_official_status(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_user_online_status(uuid, boolean) TO authenticated, service_role;