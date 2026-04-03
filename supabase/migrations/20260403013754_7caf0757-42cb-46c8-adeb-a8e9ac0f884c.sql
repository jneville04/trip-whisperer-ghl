
CREATE OR REPLACE VIEW public.trip_summaries AS
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
  draft_data->>'tripName' AS trip_name,
  draft_data->>'clientName' AS client_name,
  draft_data->>'destination' AS destination,
  draft_data->>'heroImageUrl' AS hero_image_url,
  draft_data->'heroImageUrls' AS hero_image_urls,
  draft_data->>'heroVideoUrl' AS hero_video_url,
  draft_data->>'heroVideoThumbnailUrl' AS hero_video_thumbnail_url,
  draft_data->>'heroMediaType' AS hero_media_type,
  draft_data->>'proposalType' AS proposal_type
FROM public.trips;
