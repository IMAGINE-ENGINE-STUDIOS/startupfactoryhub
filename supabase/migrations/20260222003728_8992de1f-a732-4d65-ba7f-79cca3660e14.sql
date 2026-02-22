
-- Trigger for new connection request notifications/emails
CREATE TRIGGER on_new_connection
  AFTER INSERT ON public.connections
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_connection();

-- Trigger for connection accepted notifications/emails
CREATE TRIGGER on_connection_accepted
  AFTER UPDATE ON public.connections
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_connection_accepted();
