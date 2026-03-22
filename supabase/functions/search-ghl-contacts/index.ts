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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get GHL credentials from agent_settings (first match with ghl keys set)
    const { data: agentRow } = await supabase
      .from("agent_settings")
      .select("ghl_access_token, ghl_location_id")
      .neq("ghl_access_token", "")
      .neq("ghl_location_id", "")
      .limit(1)
      .maybeSingle();

    if (!agentRow?.ghl_access_token || !agentRow?.ghl_location_id) {
      console.log("No GHL credentials configured in agent_settings");
      return new Response(JSON.stringify({ contacts: [], error: "GHL not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ghlApiKey = agentRow.ghl_access_token;
    const ghlLocationId = agentRow.ghl_location_id;

    const url = `https://services.leadconnectorhq.com/contacts/?locationId=${encodeURIComponent(ghlLocationId)}&query=${encodeURIComponent(query.trim())}&limit=10`;

    console.log("Searching GHL contacts:", query.trim());

    const ghlRes = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${ghlApiKey}`,
        Version: "2021-07-28",
        Accept: "application/json",
      },
    });

    if (!ghlRes.ok) {
      const errBody = await ghlRes.text();
      console.error(`GHL API error [${ghlRes.status}]:`, errBody);
      return new Response(JSON.stringify({ contacts: [], error: `GHL API error: ${ghlRes.status}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ghlData = await ghlRes.json();
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
