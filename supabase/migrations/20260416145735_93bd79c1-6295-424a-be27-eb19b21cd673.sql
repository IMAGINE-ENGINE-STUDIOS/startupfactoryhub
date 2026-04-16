
DELETE FROM hot_deals_agenda;

INSERT INTO hot_deals_agenda (time_slot, title, description, sort_order) VALUES
('2:00 PM', 'Welcome & Introduction', 'Opening remarks and event overview', 1),
('2:10 PM', 'NuView — Startup Pitch', 'NuView: Global 3D LiDAR mapping from space — nuview.space', 2),
('2:20 PM', 'Arachnid System — Startup Pitch', 'Arachnid System: Advanced space robotics and systems — arachnidsys.com', 3),
('2:30 PM', 'Fibonacci Cellars — Startup Pitch', 'Fibonacci Cellars via The Space Brokerage — thespacebrokerage.com', 4),
('2:40 PM', 'NASA Tech Transfer Presentation', 'NASA Technology Transfer Program presentation and speaker session', 5),
('2:55 PM', 'Robert Katz — Keynote Speaker', 'Robert S. Katz, Director of WIN, keynote address', 6),
('3:10 PM', 'Winner Announcement', 'Announcing the Hot Deals winner and closing remarks', 7);
