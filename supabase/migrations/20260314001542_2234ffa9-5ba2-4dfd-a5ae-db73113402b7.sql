ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS ghl_form_approve text DEFAULT '';
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS ghl_form_revision text DEFAULT '';