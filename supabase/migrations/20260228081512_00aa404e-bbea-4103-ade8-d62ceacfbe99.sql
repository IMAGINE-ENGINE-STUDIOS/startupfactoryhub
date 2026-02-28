INSERT INTO public.user_roles (user_id, role)
VALUES 
  ('7f591579-b346-4234-a52b-c8d8e38a6f9f', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;