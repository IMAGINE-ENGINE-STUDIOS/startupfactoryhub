-- Delete all CareerSource Florida resources except the Tallahassee location
DELETE FROM public.resources 
WHERE title ILIKE '%careersource%' 
AND address != '2308 Killearn Center Blvd, Ste 101';