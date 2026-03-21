
-- Add archived_at column for soft archive
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone DEFAULT NULL;

-- Update the status check constraint to include 'reopened'
ALTER TABLE public.trips DROP CONSTRAINT IF EXISTS trips_status_check;
ALTER TABLE public.trips ADD CONSTRAINT trips_status_check CHECK (status IN ('draft', 'published', 'sent', 'unpublished', 'approved', 'revision_requested', 'reopened'));
