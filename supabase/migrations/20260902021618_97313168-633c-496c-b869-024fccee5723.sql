GRANT SELECT, INSERT, UPDATE, DELETE ON public.flow_sessions TO authenticated;
GRANT ALL ON public.flow_sessions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flow_messages TO authenticated;
GRANT ALL ON public.flow_messages TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flow_notes TO authenticated;
GRANT ALL ON public.flow_notes TO service_role;