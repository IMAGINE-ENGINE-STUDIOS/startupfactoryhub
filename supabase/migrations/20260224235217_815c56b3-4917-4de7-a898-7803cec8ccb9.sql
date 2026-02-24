
INSERT INTO public.resources (title, description, resource_type, location_type, address, city, country, latitude, longitude, website_url, contact_email, is_verified, journey_steps)
VALUES
  ('BXL Business Incubator', 'Bronx-based business incubator providing workspace, mentorship, and resources for early-stage startups. POC: Jorge Rolon, Community Manager. Phone: 646-723-3320', 'accelerator_incubator', 'physical', '2929 3rd Ave, 4th Fl, Bronx, NY 10455', 'Bronx', 'United States', 40.8168, -73.9030, 'https://bxl.nyc', 'jrolon@bocnet.org', true, ARRAY['idea','mvp','validation']::text[]),
  
  ('Tech Valley COG (TVCOG)', 'Maker space and incubator in Troy, NY offering prototyping tools, collaborative workspace, and innovation programs. POC: Dan Falkenstrom, Operations Director. Phone: 518-244-3544', 'accelerator_incubator', 'physical', '30 3rd St, Troy, NY 12180', 'Troy', 'United States', 42.7284, -73.6918, 'https://tvcog.net', 'daniel@tvcog.net', true, ARRAY['idea','research','mvp']::text[]),
  
  ('MIT Technology Licensing Office', 'MIT''s official technology transfer office facilitating commercialization of MIT inventions and technologies. POC: Lesley Millar-Nicholson, Executive Director. Phone: 617-253-6966', 'technology_transfer', 'physical', '255 Main St, NE18-501, Cambridge, MA 02142', 'Cambridge', 'United States', 42.3616, -71.0828, 'https://tlo.mit.edu', 'tlo@mit.edu', true, ARRAY['research','mvp','validation','launch']::text[]),
  
  ('WPI Makerspaces (Innovation)', 'Worcester Polytechnic Institute''s innovation and makerspace facilities supporting prototyping and deep-tech development. POC: Mitra Anand, Director of Innovation. Phone: 508-831-5000 x6780', 'university', 'physical', '100 Institute Rd, Worcester, MA 01609', 'Worcester', 'United States', 42.2746, -71.8063, 'https://wpi.edu', 'mvanand@wpi.edu', true, ARRAY['idea','research','mvp']::text[]);
