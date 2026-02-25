
INSERT INTO public.resources (title, description, resource_type, location_type, address, city, country, latitude, longitude, website_url, contact_email, is_verified, is_official_partner, journey_steps)
VALUES
('Tampa Bay WaVE', 'Premier startup accelerator in Tampa Bay. POC: Richard Munassi, MD, MBA – Managing Director, Phone: 813-280-4422', 'accelerator_incubator', 'physical', '501 E Kennedy Blvd Suite 650, Tampa, FL 33602, USA', 'Tampa', 'United States', 27.9475, -82.4584, 'https://tampabaywave.org', NULL, true, false, ARRAY['mvp','growth']::text[]),

('CIC Miami', 'Innovation campus and coworking space in Miami. POC: George Deeb – Managing Director, Phone: 786-800-2121', 'coworking', 'physical', '1951 NW 7th Ave 6th Floor, Miami, FL 33136, USA', 'Miami', 'United States', 25.7959, -80.2090, 'https://cic.com/miami', NULL, true, false, ARRAY['idea','research','mvp','validation','launch','growth']::text[]),

('Orlando Tech Community (Tech Hub Orlando)', 'Community tech hub and venue in Orlando. POC: Sheena Fowler – Executive Leadership, Innovate Orlando', 'community', 'physical', '925 W Colonial Dr, Orlando, FL 32804, USA', 'Orlando', 'United States', 28.5530, -81.3942, 'https://innovateorlando.io/tech-hub-orlando', NULL, true, false, ARRAY['idea','mvp']::text[]),

('eMerge Americas', 'Premier tech conference and community connecting the Americas. POC: Melissa Medina – CEO, Phone: 305-702-7779', 'event', 'physical', '350 S Miami Ave, Miami, FL 33130, USA', 'Miami', 'United States', 25.7650, -80.1936, 'https://emergeamericas.com', NULL, true, false, ARRAY['idea','research','mvp','validation','launch','growth']::text[]),

('UCF Business Incubation Program', 'University-based accelerator and incubation program. POC: Carol Ann Dykes Logue – Director, Phone: 407-882-0440', 'accelerator_incubator', 'physical', '12424 Research Pkwy Suite 100, Orlando, FL 32826, USA', 'Orlando', 'United States', 28.5963, -81.1976, 'https://incubator.ucf.edu', NULL, true, false, ARRAY['idea','mvp']::text[]),

('FAU Tech Runway', 'University accelerator at Florida Atlantic University. POC: Andrew Duffell – Executive Director, Phone: 561-297-1080', 'accelerator_incubator', 'physical', '777 Glades Rd AD10-125, Boca Raton, FL 33431, USA', 'Boca Raton', 'United States', 26.3735, -80.1018, 'https://techrunway.fau.edu', NULL, true, false, ARRAY['mvp','validation']::text[]),

('Miami-Dade Beacon Council', 'Economic development partnership for Miami-Dade County. POC: Rodrick Miller – President & CEO, Phone: 305-579-1300', 'chamber_of_commerce', 'physical', '80 SW 8th St Suite 2400, Miami, FL 33130, USA', 'Miami', 'United States', 25.7734, -80.1937, 'https://beaconcouncil.com', NULL, true, false, ARRAY['research','growth']::text[]),

('Space Florida', 'State aerospace economic development agency. POC: Rob Long – President & CEO, Phone: 321-730-5301', 'government_grant', 'physical', '505 Odyssey Way Suite 300, Exploration Park, FL 32953, USA', 'Exploration Park', 'United States', 28.5200, -80.6820, 'https://spaceflorida.gov', NULL, true, false, ARRAY['growth']::text[]),

('Tampa Bay Innovation Center (TBIC)', 'Technology accelerator in Clearwater. Phone: 727-547-7340', 'accelerator_incubator', 'physical', '4601 Ulmerton Rd Suite 350, Clearwater, FL 33762, USA', 'Clearwater', 'United States', 27.8900, -82.7130, 'https://tbinnovates.com', NULL, true, false, ARRAY['mvp','growth']::text[]),

('Jacksonville Women''s Business Center', 'Government-supported entrepreneurship center. POC: Jill Johnson – Program Director, Phone: 904-366-6680', 'entrepreneur_center', 'physical', '319 W Adams St Suite 100, Jacksonville, FL 32202, USA', 'Jacksonville', 'United States', 30.3275, -81.6640, 'https://jaxwbc.org', NULL, true, false, ARRAY['idea','research']::text[]),

('Broward Office of Economic & Small Business Development', 'County government economic development office. POC: Sandy-Michael McDonald – Director, Phone: 954-357-6400', 'government_grant', 'physical', '115 S Andrews Ave Room A680, Fort Lauderdale, FL 33301, USA', 'Fort Lauderdale', 'United States', 26.1190, -80.1435, 'https://broward.org/econdev', NULL, true, false, ARRAY['research','growth']::text[]),

('St. Pete Innovation District', 'Community innovation district and lab space. POC: Morgan Lazzara – Outreach & Operations Manager, Phone: 727-893-7465', 'community', 'physical', '100 2nd Ave N Suite 130, St. Petersburg, FL 33701, USA', 'St. Petersburg', 'United States', 27.7730, -82.6340, 'https://stpeteinnovationdistrict.com', NULL, true, false, ARRAY['idea','research','mvp','validation','launch','growth']::text[]),

('Palm Beach Tech', 'Tech community and human capital network. POC: Andre Kay – Executive Director, Phone: 561-556-9022', 'community', 'physical', '700 S Rosemary Ave Suite 204, West Palm Beach, FL 33401, USA', 'West Palm Beach', 'United States', 26.7078, -80.0570, 'https://palmbeachtech.org', NULL, true, false, ARRAY['idea','mvp']::text[]);
