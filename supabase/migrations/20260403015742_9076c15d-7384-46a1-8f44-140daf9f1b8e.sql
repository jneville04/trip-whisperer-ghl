
-- Add subscription tracking columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'trialing',
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamp with time zone;

-- Backfill trial_ends_at for all existing profiles based on created_at
UPDATE public.profiles
SET trial_ends_at = created_at + interval '14 days'
WHERE trial_ends_at IS NULL;

-- Set admins to 'active' so they skip trial
UPDATE public.profiles
SET subscription_status = 'active'
WHERE id IN (SELECT user_id FROM public.user_roles WHERE role = 'admin');

-- Set default for new rows: trigger to auto-set trial_ends_at on insert
CREATE OR REPLACE FUNCTION public.set_trial_end_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.trial_ends_at IS NULL THEN
    NEW.trial_ends_at := COALESCE(NEW.created_at, now()) + interval '14 days';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_trial_end_date_trigger
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_trial_end_date();
