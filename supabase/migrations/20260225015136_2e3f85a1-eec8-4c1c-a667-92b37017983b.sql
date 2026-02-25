
INSERT INTO public.resources (title, description, resource_type, location_type, address, city, country, latitude, longitude, website_url, contact_email, is_verified, journey_steps)
VALUES
  ('1871', 'Premier digital startup incubator and co-working space in Chicago. POC: Betsy Ziegler, CEO. Phone: 312-239-0310', 'accelerator_incubator', 'physical', '222 W Merchandise Mart Plaza Suite 1212, Chicago, IL 60654', 'Chicago', 'United States', 41.8885, -87.6354, 'https://1871.com', NULL, true, ARRAY['mvp','growth']::text[]),

  ('Plug and Play Tech Center', 'Global innovation platform and accelerator connecting startups with corporations. POC: Jojo Flores, Global Managing Director. Phone: 408-524-1400', 'accelerator_incubator', 'physical', '440 N Wolfe Rd, Sunnyvale, CA 94085', 'Sunnyvale', 'United States', 37.4030, -122.0326, 'https://plugandplaytechcenter.com', NULL, true, ARRAY['mvp','growth']::text[]),

  ('Capital Factory', 'Austin-based accelerator, coworking, and innovation hub for startups at all stages. POC: Lauren Washington, Managing Director. Phone: 512-548-8970', 'accelerator_incubator', 'physical', '701 Brazos St, Austin, TX 78701', 'Austin', 'United States', 30.2686, -97.7404, 'https://capitalfactory.com', NULL, true, ARRAY['idea','research','mvp','validation','launch','growth']::text[]),

  ('MassChallenge', 'Global network of zero-equity startup accelerators. POC: Cait Brumme, CEO. Phone: 617-500-3010', 'accelerator_incubator', 'physical', '10 Fan Pier Blvd 3rd Floor, Boston, MA 02210', 'Boston', 'United States', 42.3530, -71.0440, 'https://masschallenge.org', NULL, true, ARRAY['mvp','validation','launch','growth']::text[]),

  ('Atlanta Tech Village', 'Technology hub and coworking community for startups in Atlanta. POC: Tyler Scriven, President. Phone: 404-995-6075', 'coworking', 'physical', '3423 Piedmont Rd NE, Atlanta, GA 30305', 'Atlanta', 'United States', 33.8486, -84.3620, 'https://atlantatechvillage.com', NULL, true, ARRAY['idea','research','mvp']::text[]),

  ('Houston Technology Center', 'Accelerator supporting technology startups in Houston. POC: Walter Ulrich, Executive Director. Phone: 713-655-0611', 'accelerator_incubator', 'physical', '410 Pierce St, Houston, TX 77002', 'Houston', 'United States', 29.7520, -95.3830, 'https://houstontech.org', NULL, true, ARRAY['mvp','validation','launch','growth']::text[]),

  ('CIC Cambridge', 'Flexible office and coworking space for innovators at all stages. POC: Brad Serot, General Manager. Phone: 617-577-7800', 'coworking', 'physical', '1 Broadway, Cambridge, MA 02142', 'Cambridge', 'United States', 42.3626, -71.0843, 'https://cic.com', NULL, true, ARRAY['idea','research','mvp','validation','launch','growth']::text[]),

  ('Polsky Center (University of Chicago)', 'University of Chicago center for entrepreneurship and innovation, supporting tech transfer and startups. POC: Samir Mayekar, Managing Director. Phone: 773-702-2076', 'technology_transfer', 'physical', '1452 E 53rd St 2nd Floor, Chicago, IL 60615', 'Chicago', 'United States', 41.7994, -87.5930, 'https://polsky.uchicago.edu', NULL, true, ARRAY['idea','research','mvp']::text[]),

  ('NYU Tandon Future Labs', 'NYU''s startup incubator and accelerator for deep-tech ventures. POC: Shiva Dustdar, Managing Director. Phone: 646-997-3050', 'university', 'physical', '370 Jay St 9th Floor, Brooklyn, NY 11201', 'Brooklyn', 'United States', 40.6932, -73.9867, 'https://engineering.nyu.edu', NULL, true, ARRAY['mvp','validation']::text[]),

  ('Florida SBDC at UCF', 'Small Business Development Center offering free consulting and government grant assistance. POC: Eileen Rodriguez, Regional Director. Phone: 407-420-4850', 'government_grant', 'physical', '4000 Central Florida Blvd, Orlando, FL 32816', 'Orlando', 'United States', 28.6024, -81.2001, 'https://sbdcorlando.com', NULL, true, ARRAY['idea','research']::text[]),

  ('Arizona Commerce Authority', 'State agency providing grants, incentives, and resources for business growth. POC: Sandra Watson, President & CEO. Phone: 602-845-1200', 'government_grant', 'physical', '100 N 7th Ave Suite 100, Phoenix, AZ 85007', 'Phoenix', 'United States', 33.4484, -112.0773, 'https://azcommerce.com', NULL, true, ARRAY['research','growth']::text[]),

  ('Georgia Tech VentureLab', 'Georgia Tech''s startup launch program for faculty-founded deep-tech companies. POC: Kathryn Kee, Director. Phone: 404-894-3575', 'technology_transfer', 'physical', '75 5th St NW Suite 1100, Atlanta, GA 30308', 'Atlanta', 'United States', 33.7773, -84.3891, 'https://venturelab.gatech.edu', NULL, true, ARRAY['idea','research','mvp']::text[]),

  ('Maryland Innovation Center', 'Accelerator and coworking space fostering technology entrepreneurship in Maryland. POC: Tammi Thomas, Executive Director. Phone: 443-345-4200', 'accelerator_incubator', 'physical', '6751 Columbia Gateway Dr Suite 300, Columbia, MD 21046', 'Columbia', 'United States', 39.1710, -76.8512, 'https://mdinnovationcenter.org', NULL, true, ARRAY['mvp','validation','launch','growth']::text[]),

  ('Launch NY', 'Venture development organization providing mentoring and investment across Upstate NY. POC: Marnie LaVigne, President & CEO. Phone: 716-768-6117', 'investor_network', 'physical', '640 Ellicott St Suite 407, Buffalo, NY 14203', 'Buffalo', 'United States', 42.8967, -78.8713, 'https://launchny.org', NULL, true, ARRAY['growth']::text[]),

  ('Nevada SBDC', 'Small Business Development Center offering free advising and government grant resources. POC: Michele Kruger, State Director. Phone: 702-992-7080', 'government_grant', 'physical', '8400 W Sunset Rd Suite 200, Las Vegas, NV 89113', 'Las Vegas', 'United States', 36.0560, -115.2530, 'https://nevadasbdc.org', NULL, true, ARRAY['idea']::text[]),

  ('The Ion Houston', 'Innovation hub and community venue with lab spaces for startups at all stages. POC: Jan Odegard, Executive Director. Phone: 713-913-4220', 'community', 'physical', '4201 Main St, Houston, TX 77002', 'Houston', 'United States', 29.7490, -95.3750, 'https://ionhouston.com', NULL, true, ARRAY['idea','research','mvp','validation','launch','growth']::text[]),

  ('REV1 Ventures', 'Startup studio combining capital, talent, and mentorship for high-growth ventures. POC: Tom Walker, President & CEO. Phone: 614-643-1200', 'accelerator_incubator', 'physical', '1275 Kinnear Rd, Columbus, OH 43212', 'Columbus', 'United States', 40.0044, -83.0165, 'https://rev1ventures.com', NULL, true, ARRAY['mvp','validation','launch','growth']::text[]),

  ('North Carolina Biotechnology Center', 'State-supported center providing lab resources and grants for biotech and life sciences. POC: Laura Mulligan, President & CEO. Phone: 919-541-9366', 'lab', 'physical', '15 TW Alexander Dr, Durham, NC 27709', 'Durham', 'United States', 35.9101, -78.8587, 'https://ncbiotech.org', NULL, true, ARRAY['research','mvp','validation','launch','growth']::text[]),

  ('Utah Innovation Center', 'Accelerator supporting MVP development and product launch for Utah startups. POC: Dave Winder, Executive Director. Phone: 801-887-9400', 'accelerator_incubator', 'physical', '352 S 1400 W, Salt Lake City, UT 84104', 'Salt Lake City', 'United States', 40.7440, -111.9210, 'https://utahinnovationcenter.com', NULL, true, ARRAY['mvp','launch']::text[]),

  ('Cortex Innovation Community', 'Innovation district and community venue supporting startups and research in St. Louis. POC: Sam Fiorello, President & CEO. Phone: 314-615-6900', 'community', 'physical', '4220 Duncan Ave Suite 201, St. Louis, MO 63110', 'St. Louis', 'United States', 38.6334, -90.2593, 'https://cortexstl.com', NULL, true, ARRAY['idea','research','mvp','validation','launch','growth']::text[]);
