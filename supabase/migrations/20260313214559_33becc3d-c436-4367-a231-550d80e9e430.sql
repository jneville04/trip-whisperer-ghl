ALTER TABLE public.app_settings 
  ADD COLUMN ghl_webhook_approve text DEFAULT '',
  ADD COLUMN ghl_webhook_revision text DEFAULT '';