CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, agency_name, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'agency_name', ''),
    'pending'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    agency_name = COALESCE(NULLIF(EXCLUDED.agency_name, ''), profiles.agency_name),
    email = COALESCE(EXCLUDED.email, profiles.email),
    status = 'pending';
  RETURN NEW;
END;
$function$;