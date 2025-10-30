-- Delete all events with Jitsi meeting links
DELETE FROM public.events 
WHERE location LIKE '%meet.jit.si%';