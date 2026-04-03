
-- Clear existing agenda
DELETE FROM public.hot_deals_agenda;

-- Insert updated agenda
INSERT INTO public.hot_deals_agenda (time_slot, title, description, sort_order) VALUES
('2:00 PM', 'Welcome & Introduction', 'Opening remarks and event overview', 1),
('2:10 PM', 'Startup #1 Pitch', '10-minute startup pitch presentation', 2),
('2:20 PM', 'Startup #2 Pitch', '10-minute startup pitch presentation', 3),
('2:30 PM', 'Startup #3 Pitch', '10-minute startup pitch presentation', 4),
('2:40 PM', 'Startup #4 Pitch', '10-minute startup pitch presentation', 5),
('2:50 PM', 'Startup #5 Pitch', '10-minute startup pitch presentation', 6),
('3:00 PM', 'NASA Tech Transfer Presentation', 'NASA Technology Transfer Program presentation and speaker session', 7),
('3:15 PM', 'Robert Katz — Keynote Speaker', 'Robert S. Katz, Director of WIN, keynote address', 8),
('3:30 PM', 'Winner Announcement', 'Announcing the Hot Deals winner and closing remarks', 9);
