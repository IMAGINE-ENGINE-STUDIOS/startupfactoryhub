CREATE OR REPLACE FUNCTION public.update_project_search_vector()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  searchable_text text;
BEGIN
  searchable_text := left(
    concat_ws(
      ' ',
      COALESCE(NEW.content->>'text', ''),
      regexp_replace(COALESCE(NEW.content->>'html', ''), '<[^>]+>', ' ', 'g')
    ),
    50000
  );

  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', searchable_text), 'B');
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  NEW.search_vector := setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A');
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.update_project_search_vector() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_project_search_vector() FROM anon;
REVOKE ALL ON FUNCTION public.update_project_search_vector() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.update_project_search_vector() TO service_role;