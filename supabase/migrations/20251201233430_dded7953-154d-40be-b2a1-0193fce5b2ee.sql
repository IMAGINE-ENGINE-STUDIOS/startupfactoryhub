
-- Drop existing check constraint
ALTER TABLE resources DROP CONSTRAINT check_resource_type;

-- Create new check constraint with human_capital included
ALTER TABLE resources ADD CONSTRAINT check_resource_type 
CHECK (resource_type = ANY (ARRAY[
  'office'::text, 
  'lab'::text, 
  'venue'::text, 
  'perk'::text, 
  'chamber_of_commerce'::text, 
  'technology_transfer'::text, 
  'community'::text, 
  'government_grant'::text, 
  'accelerator_incubator'::text, 
  'entrepreneur_center'::text, 
  'university'::text, 
  'coworking'::text, 
  'investor_network'::text,
  'human_capital'::text,
  'other'::text
]));

-- Insert Nasdaq Interns Match resource
INSERT INTO resources (
  title,
  description,
  resource_type,
  location_type,
  address,
  city,
  country,
  latitude,
  longitude,
  website_url,
  logo_url,
  is_verified
) VALUES (
  'Nasdaq Interns Match',
  'Online internships program connecting talented students with opportunities at the Nasdaq Entrepreneurial Center.',
  'human_capital',
  'hybrid',
  '567 University Avenue',
  'Palo Alto',
  'United States',
  37.4459,
  -122.1599,
  'https://thenasdaqcenter.typeform.com/IPinterestform',
  '/nasdaq-logo.png',
  true
);
