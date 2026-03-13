
-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create has_role security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. RLS policies for user_roles (admin only)
CREATE POLICY "Admins can select user_roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert user_roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update user_roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete user_roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can check their own roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 5. Create app_settings table (single-row)
CREATE TABLE public.app_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  app_name text NOT NULL DEFAULT 'Proposal Builder',
  tagline text NOT NULL DEFAULT 'Create beautiful travel proposals',
  logo_url text DEFAULT NULL,
  favicon_url text DEFAULT NULL,
  primary_color text NOT NULL DEFAULT '#0c7d69',
  secondary_color text NOT NULL DEFAULT '#e07a2f',
  accent_color text NOT NULL DEFAULT '#d4a853',
  font_display text NOT NULL DEFAULT 'Playfair Display',
  font_body text NOT NULL DEFAULT 'Inter',
  login_message text DEFAULT NULL,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Seed default row
INSERT INTO public.app_settings (id) VALUES (1);

-- RLS: everyone can read
CREATE POLICY "Anyone can read app_settings" ON public.app_settings
  FOR SELECT USING (true);

-- RLS: admins can update
CREATE POLICY "Admins can update app_settings" ON public.app_settings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 6. Add status column to profiles
ALTER TABLE public.profiles ADD COLUMN status text NOT NULL DEFAULT 'pending';

-- 7. Add RLS policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 8. Add RLS policy for admins to update any profile (for approve/reject)
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 9. Create storage bucket for app assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-assets', 'app-assets', true);

-- Storage RLS: anyone can read
CREATE POLICY "Public read app-assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'app-assets');

-- Storage RLS: admins can upload
CREATE POLICY "Admins can upload app-assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'app-assets' AND public.has_role(auth.uid(), 'admin'));

-- Storage RLS: admins can update
CREATE POLICY "Admins can update app-assets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'app-assets' AND public.has_role(auth.uid(), 'admin'));

-- Storage RLS: admins can delete
CREATE POLICY "Admins can delete app-assets" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'app-assets' AND public.has_role(auth.uid(), 'admin'));
