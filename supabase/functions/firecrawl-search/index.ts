const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, options } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Searching for hotels:', query);

    // Step 1: Search with scrapeOptions to get markdown content
    const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `${query} hotel official site photos rooms`,
        limit: options?.limit || 5,
        lang: options?.lang,
        country: options?.country,
        scrapeOptions: {
          formats: ['markdown'],
          onlyMainContent: true,
        },
      }),
    });

    const searchData = await searchResponse.json();

    if (!searchResponse.ok) {
      console.error('Firecrawl search error:', searchData);
      return new Response(
        JSON.stringify({ success: false, error: searchData.error || `Search failed with status ${searchResponse.status}` }),
        { status: searchResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Process results and extract images from markdown
    const results = searchData.data || [];
    console.log(`Raw results count: ${results.length}`);

    const enrichedResults = results.map((result: any) => {
      const markdown = result.markdown || '';
      
      // Extract image URLs from markdown ![alt](url) patterns
      const imageMatches = [...markdown.matchAll(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g)];
      const mdImages = imageMatches
        .map((m: any) => ({ alt: m[1], url: m[2] }))
        .filter((img: any) => {
          const url = img.url.toLowerCase();
          return !url.includes('icon') && 
                 !url.includes('logo') && 
                 !url.includes('pixel') &&
                 !url.includes('.svg') &&
                 !url.includes('1x1') &&
                 !url.includes('badge') &&
                 !url.includes('flag') &&
                 !url.includes('avatar') &&
                 !url.includes('emoji') &&
                 !url.includes('sprite');
        });
      
      // Extract raw image URLs from content
      const rawImageMatches = [...markdown.matchAll(/https?:\/\/[^\s"')\]>]+\.(?:jpg|jpeg|png|webp)(?:\?[^\s"')\]>]*)?/gi)];
      const rawImages = rawImageMatches
        .map((m: any) => ({ alt: '', url: m[0] }))
        .filter((img: any) => {
          const url = img.url.toLowerCase();
          return !url.includes('icon') && !url.includes('logo') && !url.includes('pixel') && 
                 !url.includes('.svg') && !url.includes('avatar') && !url.includes('sprite') &&
                 !url.includes('1x1');
        });
      
      // Also check for og:image or meta image patterns
      const ogImageMatch = markdown.match(/(?:og:image|twitter:image|meta.*image)[^"]*"(https?:\/\/[^"]+)"/i);
      
      // Combine and deduplicate
      const allImages: { alt: string; url: string }[] = [];
      const seen = new Set<string>();
      
      for (const img of [...mdImages, ...rawImages]) {
        if (!seen.has(img.url)) {
          seen.add(img.url);
          allImages.push(img);
        }
      }
      
      if (ogImageMatch && !seen.has(ogImageMatch[1])) {
        allImages.unshift({ alt: 'Hotel photo', url: ogImageMatch[1] });
      }

      console.log(`Result "${result.title}": found ${allImages.length} images`);

      return {
        url: result.url || '',
        title: result.title || '',
        description: result.description || '',
        markdown: markdown,
        images: allImages.slice(0, 15),
      };
    });

    console.log(`Search successful, found ${enrichedResults.length} results`);
    return new Response(
      JSON.stringify({ success: true, data: enrichedResults }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error searching:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to search';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
