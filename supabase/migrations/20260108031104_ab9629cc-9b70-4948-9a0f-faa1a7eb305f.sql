-- Delete all data for Khalia's 3 duplicate accounts (keeping the most active one: 7f591579-b346-4234-a52b-c8d8e38a6f9f)
DO $$
DECLARE
  khalia_duplicates uuid[] := ARRAY[
    '10e9cabf-5185-4ed2-947b-dd639237dc96'::uuid,
    '9aee2c56-b269-4ea2-9814-f3ed8acd9655'::uuid,
    'edf4d8e5-c2ff-4eb7-9d46-55bea8359ce8'::uuid
  ];
  mithran_duplicate uuid := '54e6f62e-b3bc-4123-8d3a-524fb38e429d'::uuid;
BEGIN
  -- Delete Khalia duplicates from all related tables
  DELETE FROM mentorship_relationships WHERE mentor_id = ANY(khalia_duplicates) OR mentee_id = ANY(khalia_duplicates);
  DELETE FROM mentoring_sessions WHERE mentor_id = ANY(khalia_duplicates) OR mentee_id = ANY(khalia_duplicates);
  DELETE FROM connections WHERE requester_id = ANY(khalia_duplicates) OR addressee_id = ANY(khalia_duplicates);
  DELETE FROM messages WHERE sender_id = ANY(khalia_duplicates) OR receiver_id = ANY(khalia_duplicates);
  DELETE FROM companies WHERE user_id = ANY(khalia_duplicates);
  DELETE FROM user_roles WHERE user_id = ANY(khalia_duplicates);
  DELETE FROM feed_posts WHERE user_id = ANY(khalia_duplicates);
  DELETE FROM notifications WHERE user_id = ANY(khalia_duplicates);
  DELETE FROM achievements WHERE user_id = ANY(khalia_duplicates);
  DELETE FROM mentor_profiles WHERE user_id = ANY(khalia_duplicates);
  DELETE FROM advisor_skills WHERE user_id = ANY(khalia_duplicates);
  DELETE FROM advisor_experiences WHERE user_id = ANY(khalia_duplicates);
  DELETE FROM advisor_education WHERE user_id = ANY(khalia_duplicates);
  DELETE FROM advisor_achievements WHERE user_id = ANY(khalia_duplicates);
  DELETE FROM mentor_availability WHERE mentor_id = ANY(khalia_duplicates);
  DELETE FROM profiles WHERE user_id = ANY(khalia_duplicates);
  
  -- Delete Mithran duplicate from all related tables
  DELETE FROM mentorship_relationships WHERE mentor_id = mithran_duplicate OR mentee_id = mithran_duplicate;
  DELETE FROM mentoring_sessions WHERE mentor_id = mithran_duplicate OR mentee_id = mithran_duplicate;
  DELETE FROM connections WHERE requester_id = mithran_duplicate OR addressee_id = mithran_duplicate;
  DELETE FROM messages WHERE sender_id = mithran_duplicate OR receiver_id = mithran_duplicate;
  DELETE FROM companies WHERE user_id = mithran_duplicate;
  DELETE FROM user_roles WHERE user_id = mithran_duplicate;
  DELETE FROM feed_posts WHERE user_id = mithran_duplicate;
  DELETE FROM notifications WHERE user_id = mithran_duplicate;
  DELETE FROM achievements WHERE user_id = mithran_duplicate;
  DELETE FROM mentor_profiles WHERE user_id = mithran_duplicate;
  DELETE FROM advisor_skills WHERE user_id = mithran_duplicate;
  DELETE FROM advisor_experiences WHERE user_id = mithran_duplicate;
  DELETE FROM advisor_education WHERE user_id = mithran_duplicate;
  DELETE FROM advisor_achievements WHERE user_id = mithran_duplicate;
  DELETE FROM mentor_availability WHERE mentor_id = mithran_duplicate;
  DELETE FROM profiles WHERE user_id = mithran_duplicate;
END $$;