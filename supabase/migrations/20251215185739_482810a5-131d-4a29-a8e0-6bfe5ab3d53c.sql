
-- Rename the 5 orphaned Khalia profiles that have posts to random names
-- Keep 7f591579-b346-4234-a52b-c8d8e38a6f9f as the REAL Khalia Padilla

UPDATE profiles SET full_name = 'Sofia Garcia' WHERE user_id = '649f240e-ee95-4011-8092-48784588767b';
UPDATE profiles SET full_name = 'Olivia Kim' WHERE user_id = '7e814ec7-ce1c-47fa-b958-e75f4cc50212';
UPDATE profiles SET full_name = 'Emma Johnson' WHERE user_id = '4b7af1be-013d-4feb-87cc-1f7dd6f571b7';
UPDATE profiles SET full_name = 'Isabella Brown' WHERE user_id = 'a750a565-7391-4e2e-9392-e09479b3ce66';
UPDATE profiles SET full_name = 'Ava Wilson' WHERE user_id = 'e99c5a6f-2c0d-4dc1-9fec-7cd33bc0ec93';
