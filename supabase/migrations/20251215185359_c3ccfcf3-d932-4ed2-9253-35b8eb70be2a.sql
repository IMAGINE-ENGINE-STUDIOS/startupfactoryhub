
-- Rename 8 orphaned Khalia Padilla profiles to random names
UPDATE profiles SET full_name = 'Maya Rodriguez' WHERE user_id = 'ea967088-b52a-483e-a85c-a9d776b11da0';
UPDATE profiles SET full_name = 'Jessica Chen' WHERE user_id = '9e62a91e-b4f9-4cb6-b893-21184e533415';
UPDATE profiles SET full_name = 'Amanda Foster' WHERE user_id = 'fa13a804-3243-49a4-80c5-f719bbadfbdb';
UPDATE profiles SET full_name = 'Rachel Thompson' WHERE user_id = '522371e2-7fbc-4d90-93e6-f91d90db6cac';
UPDATE profiles SET full_name = 'Sarah Mitchell' WHERE user_id = '112c98de-f1fb-4733-8c02-4efe4cc748c5';
UPDATE profiles SET full_name = 'Emily Davis' WHERE user_id = '88cb78f4-7bfe-4fd1-8e61-7c20ed65035a';
UPDATE profiles SET full_name = 'Nicole Williams' WHERE user_id = '30fb4223-c858-4229-b4c6-51a41a9c3606';
UPDATE profiles SET full_name = 'Lauren Martinez' WHERE user_id = '2152a153-7850-4ff5-b9bf-0bd5c046e928';

-- Create profile for the REAL Khalia (owner of Imagine Engine Studios)
INSERT INTO profiles (user_id, full_name, bio, email)
VALUES (
  '7f591579-b346-4234-a52b-c8d8e38a6f9f', 
  'Khalia Padilla', 
  'Founder & CEO of Imagine Engine Studios',
  'ceo@imagineengine.space'
)
ON CONFLICT (user_id) DO UPDATE SET 
  full_name = 'Khalia Padilla',
  bio = 'Founder & CEO of Imagine Engine Studios';
