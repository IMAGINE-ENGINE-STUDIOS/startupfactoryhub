-- Delete orphaned mentorship relationships where mentor profile doesn't exist
DELETE FROM public.mentorship_relationships 
WHERE mentor_id NOT IN (SELECT user_id FROM public.profiles WHERE full_name IS NOT NULL);

-- Also delete the specific orphaned record
DELETE FROM public.mentorship_relationships 
WHERE mentor_id = '74ef8e8b-b535-4869-aa14-b4a249d3cca4';