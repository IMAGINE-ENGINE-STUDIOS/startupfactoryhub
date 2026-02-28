
INSERT INTO regus_locations (name, address, city, country, latitude, longitude, office_type, capacity, amenities, rating, is_active) VALUES
-- Florida
('Regus Fort Lauderdale', '110 SE 6th Street, Fort Lauderdale, FL 33301', 'Fort Lauderdale', 'United States', 26.1224, -80.1373, 'private_office', 120, ARRAY['wifi','meeting_rooms','printing','kitchen','reception','parking'], 4.5, true),
('Regus Tampa Westshore', '4830 W Kennedy Blvd, Tampa, FL 33609', 'Tampa', 'United States', 27.9506, -82.5267, 'coworking', 100, ARRAY['wifi','meeting_rooms','printing','kitchen','reception','parking'], 4.4, true),
('Regus Jacksonville Riverplace', '1301 Riverplace Blvd, Jacksonville, FL 32207', 'Jacksonville', 'United States', 30.3165, -81.6553, 'private_office', 80, ARRAY['wifi','meeting_rooms','printing','kitchen','reception'], 4.3, true),
('Regus Orlando Lake Mary', '1185 W International Speedway Blvd, Lake Mary, FL 32746', 'Lake Mary', 'United States', 28.7589, -81.3178, 'coworking', 90, ARRAY['wifi','meeting_rooms','printing','kitchen','parking'], 4.4, true),
('Regus Miami Coral Gables', '2222 Ponce de Leon Blvd, Coral Gables, FL 33134', 'Coral Gables', 'United States', 25.7509, -80.2590, 'private_office', 110, ARRAY['wifi','meeting_rooms','printing','kitchen','reception','parking'], 4.6, true),
('Regus West Palm Beach', '1645 Palm Beach Lakes Blvd, West Palm Beach, FL 33401', 'West Palm Beach', 'United States', 26.7153, -80.0661, 'coworking', 85, ARRAY['wifi','meeting_rooms','printing','kitchen','reception'], 4.3, true),
('Regus Tampa Downtown', '100 S Ashley Dr, Tampa, FL 33602', 'Tampa', 'United States', 27.9466, -82.4572, 'private_office', 130, ARRAY['wifi','meeting_rooms','printing','kitchen','reception','parking'], 4.5, true),
('Regus St. Petersburg', '150 2nd Ave N, St. Petersburg, FL 33701', 'St. Petersburg', 'United States', 27.7717, -82.6368, 'coworking', 70, ARRAY['wifi','meeting_rooms','printing','kitchen'], 4.2, true),
('Regus Boca Raton', '980 N Federal Hwy, Boca Raton, FL 33432', 'Boca Raton', 'United States', 26.3587, -80.0831, 'private_office', 95, ARRAY['wifi','meeting_rooms','printing','kitchen','reception','parking'], 4.5, true),
('Regus Naples', '800 Laurel Oak Dr, Naples, FL 34108', 'Naples', 'United States', 26.2379, -81.7748, 'coworking', 60, ARRAY['wifi','meeting_rooms','printing','kitchen'], 4.3, true),
-- New York
('Regus Brooklyn Heights', '26 Court Street, Brooklyn, NY 11242', 'Brooklyn', 'United States', 40.6933, -73.9910, 'coworking', 100, ARRAY['wifi','meeting_rooms','printing','kitchen','reception'], 4.4, true),
('Regus Wall Street', '14 Wall Street, New York, NY 10005', 'New York', 'United States', 40.7074, -74.0113, 'private_office', 200, ARRAY['wifi','meeting_rooms','printing','kitchen','reception','parking'], 4.7, true),
('Regus Park Avenue', '245 Park Avenue, New York, NY 10167', 'New York', 'United States', 40.7551, -73.9745, 'private_office', 180, ARRAY['wifi','meeting_rooms','printing','kitchen','reception'], 4.6, true),
('Regus SoHo', '584 Broadway, New York, NY 10012', 'New York', 'United States', 40.7243, -73.9974, 'coworking', 120, ARRAY['wifi','meeting_rooms','printing','kitchen','reception'], 4.5, true),
('Regus Grand Central', '622 Third Avenue, New York, NY 10017', 'New York', 'United States', 40.7493, -73.9748, 'private_office', 160, ARRAY['wifi','meeting_rooms','printing','kitchen','reception'], 4.6, true),
('Regus Flatiron', '1140 Broadway, New York, NY 10001', 'New York', 'United States', 40.7437, -73.9893, 'coworking', 140, ARRAY['wifi','meeting_rooms','printing','kitchen','reception'], 4.5, true),
('Regus White Plains', '50 Main Street, White Plains, NY 10606', 'White Plains', 'United States', 41.0340, -73.7629, 'private_office', 80, ARRAY['wifi','meeting_rooms','printing','kitchen','parking'], 4.3, true),
('Regus Long Island', '534 Broadhollow Rd, Melville, NY 11747', 'Melville', 'United States', 40.7782, -73.4079, 'coworking', 90, ARRAY['wifi','meeting_rooms','printing','kitchen','parking'], 4.2, true),
-- San Francisco
('Regus Financial District', '101 California Street, San Francisco, CA 94111', 'San Francisco', 'United States', 37.7929, -122.3981, 'private_office', 150, ARRAY['wifi','meeting_rooms','printing','kitchen','reception'], 4.6, true),
('Regus Union Square', '580 California Street, San Francisco, CA 94104', 'San Francisco', 'United States', 37.7929, -122.4048, 'coworking', 110, ARRAY['wifi','meeting_rooms','printing','kitchen','reception'], 4.5, true),
('Regus Pacific Heights', '2201 Broadway, San Francisco, CA 94115', 'San Francisco', 'United States', 37.7948, -122.4354, 'coworking', 80, ARRAY['wifi','meeting_rooms','printing','kitchen'], 4.3, true),
('Regus Rincon Center', '121 Spear Street, San Francisco, CA 94105', 'San Francisco', 'United States', 37.7912, -122.3932, 'private_office', 130, ARRAY['wifi','meeting_rooms','printing','kitchen','reception','parking'], 4.5, true),
-- Japan
('Regus Osaka Umeda', '2-2-2 Umeda, Kita-ku, Osaka', 'Osaka', 'Japan', 34.7025, 135.4978, 'private_office', 140, ARRAY['wifi','meeting_rooms','printing','kitchen','reception'], 4.6, true),
('Regus Osaka Namba', '5-1-60 Namba, Chuo-ku, Osaka', 'Osaka', 'Japan', 34.6657, 135.5017, 'coworking', 100, ARRAY['wifi','meeting_rooms','printing','kitchen'], 4.4, true),
('Regus Yokohama Landmark', '2-2-1 Minatomirai, Nishi-ku, Yokohama', 'Yokohama', 'Japan', 35.4558, 139.6319, 'private_office', 120, ARRAY['wifi','meeting_rooms','printing','kitchen','reception'], 4.5, true),
('Regus Nagoya Station', '4-4-10 Meieki, Nakamura-ku, Nagoya', 'Nagoya', 'Japan', 35.1709, 136.8815, 'coworking', 90, ARRAY['wifi','meeting_rooms','printing','kitchen'], 4.4, true),
('Regus Fukuoka Tenjin', '2-14-2 Tenjin, Chuo-ku, Fukuoka', 'Fukuoka', 'Japan', 33.5904, 130.3990, 'private_office', 80, ARRAY['wifi','meeting_rooms','printing','kitchen','reception'], 4.3, true),
('Regus Tokyo Shinagawa', '2-16-4 Konan, Minato-ku, Tokyo', 'Tokyo', 'Japan', 35.6284, 139.7387, 'coworking', 130, ARRAY['wifi','meeting_rooms','printing','kitchen','reception'], 4.5, true),
('Regus Tokyo Shinjuku', '3-1-24 Nishi-Shinjuku, Shinjuku-ku, Tokyo', 'Tokyo', 'Japan', 35.6938, 139.6964, 'private_office', 160, ARRAY['wifi','meeting_rooms','printing','kitchen','reception'], 4.6, true),
('Regus Kyoto Karasuma', '620 Suiginya-cho, Shimogyo-ku, Kyoto', 'Kyoto', 'Japan', 34.9935, 135.7588, 'coworking', 70, ARRAY['wifi','meeting_rooms','printing','kitchen'], 4.4, true),
('Regus Kobe Sannomiya', '1-3-1 Kumoidori, Chuo-ku, Kobe', 'Kobe', 'Japan', 34.6942, 135.1956, 'private_office', 75, ARRAY['wifi','meeting_rooms','printing','kitchen','reception'], 4.3, true),
('Regus Sapporo Odori', '2 Chome Odorinishi, Chuo-ku, Sapporo', 'Sapporo', 'Japan', 43.0589, 141.3488, 'coworking', 65, ARRAY['wifi','meeting_rooms','printing','kitchen'], 4.2, true);
