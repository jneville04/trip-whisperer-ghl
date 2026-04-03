
-- Enable RLS on organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view organizations"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (true);

-- Enable RLS on snapshots
ALTER TABLE public.snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view snapshots"
  ON public.snapshots FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create snapshots"
  ON public.snapshots FOR INSERT
  TO authenticated
  WITH CHECK (true);
