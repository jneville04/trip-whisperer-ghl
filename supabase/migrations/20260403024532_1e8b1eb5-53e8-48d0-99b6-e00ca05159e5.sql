
-- Create the app-assets storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-assets', 'app-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view files (public bucket)
CREATE POLICY "Public can view app-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'app-assets');

-- Authenticated users can upload files
CREATE POLICY "Authenticated users can upload to app-assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'app-assets');

-- Authenticated users can update their uploads
CREATE POLICY "Authenticated users can update app-assets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'app-assets');

-- Authenticated users can delete their uploads
CREATE POLICY "Authenticated users can delete from app-assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'app-assets');
