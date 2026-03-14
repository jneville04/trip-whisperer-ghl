ALTER TABLE public.app_settings 
  ADD COLUMN IF NOT EXISTS login_hero_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS login_hero_position text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS login_button_color text DEFAULT '',
  ADD COLUMN IF NOT EXISTS helpdesk_email text DEFAULT '',
  ADD COLUMN IF NOT EXISTS helpdesk_phone text DEFAULT '',
  ADD COLUMN IF NOT EXISTS helpdesk_message text DEFAULT '';