
-- Add sample_trip_id to app_settings
ALTER TABLE public.app_settings
ADD COLUMN sample_trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL DEFAULT NULL;

-- Function to clone the sample trip for a new user
CREATE OR REPLACE FUNCTION public.clone_sample_trip_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sample_id UUID;
  _src RECORD;
BEGIN
  -- Get the current sample trip ID from app_settings
  SELECT sample_trip_id INTO _sample_id FROM public.app_settings LIMIT 1;

  IF _sample_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Fetch the source trip
  SELECT * INTO _src FROM public.trips WHERE id = _sample_id;

  IF _src IS NULL THEN
    RETURN NEW;
  END IF;

  -- Insert a clone owned by the new user
  INSERT INTO public.trips (
    owner_id, trip_type, status, draft_data, published_data,
    max_capacity, public_slug
  ) VALUES (
    NEW.id,
    _src.trip_type,
    'draft',
    _src.draft_data,
    NULL,
    _src.max_capacity,
    'sample-' || substr(gen_random_uuid()::text, 1, 8)
  );

  RETURN NEW;
END;
$$;

-- Trigger: clone sample trip when a new profile is created
CREATE TRIGGER on_profile_created_clone_sample
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.clone_sample_trip_for_user();
