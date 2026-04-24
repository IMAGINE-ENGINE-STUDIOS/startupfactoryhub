ALTER TABLE public.ar_drops
DROP CONSTRAINT IF EXISTS ar_drops_content_type_check;

ALTER TABLE public.ar_drops
ADD CONSTRAINT ar_drops_content_type_check
CHECK (content_type IN ('model_3d', 'image', 'audio', 'video', 'file', 'text'));
