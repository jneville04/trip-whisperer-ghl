import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return new Response(JSON.stringify({ contacts: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try env secrets first (most reliable), then agent_settings
    let ghlApiKey = (Deno.env.get("GHL_API_KEY") || "").trim().replace(/^Bearer\s+/i, "");
    let ghlLocationId = (Deno.env.get("GHL_LOCATION_ID") || "").trim();
    let credentialSource = "secrets";

    if (!ghlApiKey || !ghlLocationId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceRoleKey);

      // Try agent_settings
      const { data: agentRow } = await supabase
        .from("agent_settings")
        .select("ghl_access_token, ghl_location_id")
        .neq("ghl_access_token", "")
        .neq("ghl_location_id", "")
        .limit(1)
        .maybeSingle();

      const agentToken = (agentRow?.ghl_access_token || "").trim().replace(/^Bearer\s+/i, "");
      const agentLocation = (agentRow?.ghl_location_id || "").trim();

      if (!ghlApiKey && agentToken) {
        ghlApiKey = agentToken;
        credentialSource = "agent_settings";
      }
      if (!ghlLocationId && agentLocation) {
        ghlLocationId = agentLocation;
      }
    }

    if (!ghlApiKey || !ghlLocationId) {
      console.log("No GHL credentials found in secrets or agent_settings");
      return new Response(JSON.stringify({ contacts: [], error: "GHL not configured. Check GHL API Key in Settings." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (ghlApiKey.length < 20) {
      console.error("GHL API key looks malformed. tokenLength:", ghlApiKey.length);
      return new Response(JSON.stringify({ contacts: [], error: "GHL API key format looks invalid. Re-save key in Settings." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Detect if token is a JWT (Location API key → use v1) or opaque (Private Integration → use v2)
    const isJwt = ghlApiKey.startsWith("eyJ");

    const searchQuery = query.trim();
    let url: string;
    let headers: Record<string, string>;

    if (isJwt) {
      // v1 API for Location API keys
      url = `https://rest.gohighlevel.com/v1/contacts/?query=${encodeURIComponent(searchQuery)}&limit=10`;
      headers = {
        Authorization: `Bearer ${ghlApiKey}`,
        "Content-Type": "application/json",
      };
      console.log("Using GHL v1 API (Location key)", "query:", searchQuery, "source:", credentialSource, "tokenLength:", ghlApiKey.length);
    } else {
      // v2 API for Private Integration / OAuth tokens
      url = `https://services.leadconnectorhq.com/contacts/?locationId=${encodeURIComponent(ghlLocationId)}&query=${encodeURIComponent(searchQuery)}&limit=10`;
      headers = {
        Authorization: `Bearer ${ghlApiKey}`,
        Version: "2021-07-28",
        Accept: "application/json",
      };
      console.log("Using GHL v2 API (Integration key)", "query:", searchQuery, "locationId:", ghlLocationId, "source:", credentialSource, "tokenLength:", ghlApiKey.length);
    }

    const ghlRes = await fetch(url, { method: "GET", headers });

    console.log("GHL response status:", ghlRes.status);

    if (!ghlRes.ok) {
      const errBody = await ghlRes.text();
      console.error(`GHL API error [${ghlRes.status}]:`, errBody);
      const errorMsg = ghlRes.status === 401
        ? "Unauthorized. Check GHL API Key in Settings."
        : ghlRes.status === 403
        ? "Forbidden. Check GHL permissions."
        : ghlRes.status === 429
        ? "Rate limited. Try again shortly."
        : `GHL API error: ${ghlRes.status}`;
      return new Response(JSON.stringify({ contacts: [], error: errorMsg, statusCode: ghlRes.status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ghlData = await ghlRes.json();
    console.log("GHL contacts found:", (ghlData.contacts || []).length);

    const contacts = (ghlData.contacts || []).map((c: any) => ({
      id: c.id,
      name: [c.firstNameLowerCase || c.firstName || "", c.lastNameLowerCase || c.lastName || ""]
        .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
        .filter(Boolean)
        .join(" "),
      email: c.email || "",
      phone: c.phone || "",
    }));

    return new Response(JSON.stringify({ contacts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("search-ghl-contacts error:", err);
    return new Response(JSON.stringify({ contacts: [], error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
