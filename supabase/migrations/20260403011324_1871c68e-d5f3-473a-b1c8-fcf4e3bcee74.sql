
-- Enable RLS on trips
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- Owners can do everything with their own trips
CREATE POLICY "Owners can view own trips"
  ON public.trips FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can create trips"
  ON public.trips FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update own trips"
  ON public.trips FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete own trips"
  ON public.trips FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Public can view published trips by slug (for client/traveler view)
CREATE POLICY "Public can view published trips by slug"
  ON public.trips FOR SELECT
  TO anon
  USING (public_slug IS NOT NULL AND status IN ('published', 'sent', 'approved', 'revision_requested'));

-- Admins can view all trips
CREATE POLICY "Admins can view all trips"
  ON public.trips FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
