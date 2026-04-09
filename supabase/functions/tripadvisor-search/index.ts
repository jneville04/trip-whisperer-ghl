const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TRIPADVISOR_API_KEY = '16740D56D6A540FFA27DC653FCCF3259';
const BASE_URL = 'https://api.content.tripadvisor.com/api/v1';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, action } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: "search" (default) = search hotels by name
    // Action: "details" = get details by location_id (pass location_id as query)
    // Action: "photos" = get photos by location_id (pass location_id as query)

    if (action === 'details') {
      // Get location details
      const detailsUrl = `${BASE_URL}/location/${query}/details?key=${TRIPADVISOR_API_KEY}&language=en&currency=USD`;
      const resp = await fetch(detailsUrl, {
        headers: { 'Accept': 'application/json' },
      });

      if (!resp.ok) {
        const errText = await resp.text();
        console.error('TripAdvisor details error:', resp.status, errText);
        return new Response(
          JSON.stringify({ success: false, error: `TripAdvisor API error: ${resp.status}`, fallback: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const details = await resp.json();
      return new Response(
        JSON.stringify({ success: true, data: details }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'photos') {
      // Get location photos
      const photosUrl = `${BASE_URL}/location/${query}/photos?key=${TRIPADVISOR_API_KEY}&language=en&limit=10`;
      const resp = await fetch(photosUrl, {
        headers: { 'Accept': 'application/json' },
      });

      if (!resp.ok) {
        const errText = await resp.text();
        console.error('TripAdvisor photos error:', resp.status, errText);
        return new Response(
          JSON.stringify({ success: false, error: `TripAdvisor API error: ${resp.status}`, fallback: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const photos = await resp.json();
      return new Response(
        JSON.stringify({ success: true, data: photos }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Default: search locations
    const searchUrl = `${BASE_URL}/location/search?key=${TRIPADVISOR_API_KEY}&searchQuery=${encodeURIComponent(query)}&category=hotels&language=en`;
    
    console.log('TripAdvisor search:', query);
    
    const searchResp = await fetch(searchUrl, {
      headers: { 'Accept': 'application/json' },
    });

    if (!searchResp.ok) {
      const errText = await searchResp.text();
      console.error('TripAdvisor search error:', searchResp.status, errText);
      return new Response(
        JSON.stringify({ success: false, error: `TripAdvisor API error: ${searchResp.status}`, fallback: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchData = await searchResp.json();
    const locations = searchData.data || [];

    console.log(`Found ${locations.length} results for "${query}"`);

    // Enrich each result with details and photos
    const enriched = await Promise.all(
      locations.slice(0, 5).map(async (loc: any) => {
        const locationId = loc.location_id;
        
        // Fetch details and photos in parallel
        const [detailsResp, photosResp] = await Promise.all([
          fetch(`${BASE_URL}/location/${locationId}/details?key=${TRIPADVISOR_API_KEY}&language=en&currency=USD`, {
            headers: { 'Accept': 'application/json' },
          }).catch(() => null),
          fetch(`${BASE_URL}/location/${locationId}/photos?key=${TRIPADVISOR_API_KEY}&language=en&limit=10`, {
            headers: { 'Accept': 'application/json' },
          }).catch(() => null),
        ]);

        let details: any = {};
        let photos: any[] = [];

        if (detailsResp?.ok) {
          details = await detailsResp.json();
        }
        if (photosResp?.ok) {
          const photosData = await photosResp.json();
          photos = photosData.data || [];
        }

        return {
          location_id: locationId,
          name: loc.name || details.name || '',
          location: details.address_obj
            ? `${details.address_obj.city || ''}, ${details.address_obj.country || ''}`.replace(/^, |, $/g, '')
            : (loc.address_obj ? `${loc.address_obj.city || ''}, ${loc.address_obj.country || ''}`.replace(/^, |, $/g, '') : ''),
          description: details.description || '',
          rating: details.rating || '',
          num_reviews: details.num_reviews || '',
          price_level: details.price_level || '',
          amenities: details.amenities || [],
          check_in: details.check_in || '',
          check_out: details.check_out || '',
          web_url: details.web_url || loc.web_url || '',
          photos: photos.map((p: any) => ({
            url: p.images?.large?.url || p.images?.medium?.url || p.images?.original?.url || '',
            caption: p.caption || '',
          })).filter((p: any) => p.url),
        };
      })
    );

    return new Response(
      JSON.stringify({ success: true, data: enriched }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('TripAdvisor proxy error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
