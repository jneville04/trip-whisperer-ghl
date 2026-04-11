import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * sync-ghl-contact
 *
 * Accepts: { email, firstName, lastName, phone, tripId? }
 *
 * 1. Searches GHL for existing contact by email
 * 2. If not found → creates the contact in GHL
 * 3. Returns { contactId, created: boolean }
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const email = (body.email || "").trim().toLowerCase();
    const firstName = (body.firstName || "").trim();
    const lastName = (body.lastName || "").trim();
    const phone = (body.phone || "").trim();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Resolve GHL credentials ──
    let ghlApiKey = (Deno.env.get("GHL_API_KEY") || "").trim().replace(/^Bearer\s+/i, "");
    let ghlLocationId = (Deno.env.get("GHL_LOCATION_ID") || "").trim();

    if (!ghlApiKey || !ghlLocationId) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const { data: agentRow } = await supabase
        .from("agent_settings")
        .select("ghl_access_token, ghl_location_id")
        .neq("ghl_access_token", "")
        .neq("ghl_location_id", "")
        .limit(1)
        .maybeSingle();

      if (!ghlApiKey) ghlApiKey = (agentRow?.ghl_access_token || "").trim().replace(/^Bearer\s+/i, "");
      if (!ghlLocationId) ghlLocationId = (agentRow?.ghl_location_id || "").trim();
    }

    if (!ghlApiKey || !ghlLocationId) {
      return new Response(
        JSON.stringify({ error: "GHL not configured. Add GHL API Key and Location ID in Settings." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const isJwt = ghlApiKey.startsWith("eyJ");

    console.log("sync-ghl-contact called", {
      email,
      firstName,
      lastName,
      tokenLength: ghlApiKey.length,
      tokenPrefix: ghlApiKey.substring(0, 4),
      isJwt,
      locationId: ghlLocationId,
    });

    // ── Step 1: Search for existing contact by email ──
    let existingContactId: string | null = null;

    if (isJwt) {
      // v1 API
      const searchUrl = `https://rest.gohighlevel.com/v1/contacts/?query=${encodeURIComponent(email)}&limit=1`;
      const searchRes = await fetch(searchUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${ghlApiKey}`,
          "Content-Type": "application/json",
        },
      });

      console.log("GHL v1 search status:", searchRes.status);

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const contacts = searchData.contacts || [];
        const match = contacts.find(
          (c: any) => (c.email || "").toLowerCase() === email,
        );
        if (match) existingContactId = match.id;
      } else {
        const errText = await searchRes.text();
        console.error("GHL v1 search error:", searchRes.status, errText);
      }
    } else {
      // v2 API
      const searchUrl = `https://services.leadconnectorhq.com/contacts/?locationId=${encodeURIComponent(ghlLocationId)}&query=${encodeURIComponent(email)}&limit=1`;
      const searchRes = await fetch(searchUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${ghlApiKey}`,
          Version: "2021-07-28",
          Accept: "application/json",
        },
      });

      console.log("GHL v2 search status:", searchRes.status);

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const contacts = searchData.contacts || [];
        const match = contacts.find(
          (c: any) => (c.email || "").toLowerCase() === email,
        );
        if (match) existingContactId = match.id;
      } else {
        const errText = await searchRes.text();
        console.error("GHL v2 search error:", searchRes.status, errText);
        return new Response(
          JSON.stringify({
            error: `GHL search failed: ${searchRes.status}`,
            details: errText,
          }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // ── Step 2: If contact exists, return it ──
    if (existingContactId) {
      console.log("Contact already exists in GHL:", existingContactId);
      return new Response(
        JSON.stringify({ contactId: existingContactId, created: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Step 3: Create new contact ──
    console.log("Contact not found, creating new contact for:", email);

    let createUrl: string;
    let createHeaders: Record<string, string>;
    let createBody: Record<string, any>;

    if (isJwt) {
      // v1 API
      createUrl = "https://rest.gohighlevel.com/v1/contacts/";
      createHeaders = {
        Authorization: `Bearer ${ghlApiKey}`,
        "Content-Type": "application/json",
      };
      createBody = {
        email,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phone: phone || undefined,
      };
    } else {
      // v2 API
      createUrl = "https://services.leadconnectorhq.com/contacts/";
      createHeaders = {
        Authorization: `Bearer ${ghlApiKey}`,
        Version: "2021-07-28",
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      createBody = {
        locationId: ghlLocationId,
        email,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phone: phone || undefined,
      };
    }

    // Remove undefined fields
    Object.keys(createBody).forEach((k) => {
      if (createBody[k] === undefined) delete createBody[k];
    });

    const createRes = await fetch(createUrl, {
      method: "POST",
      headers: createHeaders,
      body: JSON.stringify(createBody),
    });

    const createData = await createRes.json();
    console.log("GHL create contact status:", createRes.status, JSON.stringify(createData));

    if (!createRes.ok) {
      return new Response(
        JSON.stringify({
          error: `Failed to create contact: ${createRes.status}`,
          details: createData,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const newContactId = createData.contact?.id || createData.id || null;

    return new Response(
      JSON.stringify({ contactId: newContactId, created: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("sync-ghl-contact error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
