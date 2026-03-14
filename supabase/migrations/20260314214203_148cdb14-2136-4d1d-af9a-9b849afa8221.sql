
CREATE TABLE public.agent_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Brand
  primary_color text NOT NULL DEFAULT '',
  secondary_color text NOT NULL DEFAULT '',
  accent_color text NOT NULL DEFAULT '',
  logo_url text NOT NULL DEFAULT '',
  show_agency_name_with_logo boolean NOT NULL DEFAULT true,
  -- Agent Info
  agent_name text NOT NULL DEFAULT '',
  agent_title text NOT NULL DEFAULT '',
  agent_phone text NOT NULL DEFAULT '',
  agent_email text NOT NULL DEFAULT '',
  agent_website text NOT NULL DEFAULT '',
  agency_name text NOT NULL DEFAULT '',
  agent_photo_url text NOT NULL DEFAULT '',
  agency_logo_url text NOT NULL DEFAULT '',
  -- Booking Settings
  default_booking_behavior text NOT NULL DEFAULT 'stripe',
  default_payment_link text NOT NULL DEFAULT '',
  default_booking_form_url text NOT NULL DEFAULT '',
  default_checkout_url text NOT NULL DEFAULT '',
  -- Integration placeholders
  ghl_connected boolean NOT NULL DEFAULT false,
  ghl_location_id text NOT NULL DEFAULT '',
  ghl_access_token text NOT NULL DEFAULT '',
  stripe_connected boolean NOT NULL DEFAULT false,
  stripe_account_id text NOT NULL DEFAULT '',
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.agent_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON public.agent_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON public.agent_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON public.agent_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
