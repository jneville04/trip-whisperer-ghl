DROP VIEW IF EXISTS public.trip_summaries;

CREATE VIEW public.trip_summaries WITH (security_invoker = on) AS
SELECT
  id,
  created_at,
  status,
  trip_type,
  public_slug,
  archived_at,
  trashed_at,
  owner_id,
  org_id,
  traveler_email,
  traveler_phone,
  current_occupancy,
  max_capacity,
  deleted_at,
  draft_data ->> 'tripName' AS trip_name,
  draft_data ->> 'clientName' AS client_name,
  draft_data ->> 'destination' AS destination,
  draft_data ->> 'startDate' AS start_date,
  draft_data ->> 'endDate' AS end_date,
  draft_data ->> 'travelerCount' AS number_of_travelers,
  CASE
    WHEN (draft_data ->> 'heroImageUrl') IS NOT NULL
      AND (draft_data ->> 'heroImageUrl') NOT LIKE 'data:%'
    THEN draft_data ->> 'heroImageUrl'
    ELSE NULL
  END AS hero_image_url,
  CASE
    WHEN (draft_data -> 'heroImageUrls') IS NOT NULL
      AND jsonb_array_length(COALESCE(draft_data -> 'heroImageUrls', '[]'::jsonb)) > 0
      AND ((draft_data -> 'heroImageUrls') ->> 0) NOT LIKE 'data:%'
    THEN (draft_data -> 'heroImageUrls') ->> 0
    ELSE NULL
  END AS hero_first_url,
  draft_data ->> 'heroVideoUrl' AS hero_video_url,
  draft_data ->> 'heroVideoThumbnailUrl' AS hero_video_thumbnail_url,
  draft_data ->> 'heroMediaType' AS hero_media_type,
  draft_data ->> 'proposalType' AS proposal_type
FROM trips;