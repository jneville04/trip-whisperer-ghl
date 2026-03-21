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
    const { tripId, selectionSummary, totalPrice, depositAmount, sectionDetails, currency, pricingMode, approvedAt } = await req.json();

    if (!tripId) {
      return new Response(JSON.stringify({ error: "Missing tripId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fetch the trip
    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .select("id, published_data, org_id, public_slug, status")
      .eq("id", tripId)
      .single();

    if (tripError || !trip) {
      return new Response(JSON.stringify({ error: "Trip not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const publishedData = trip.published_data as Record<string, any> | null;
    const tripName = publishedData?.tripName || "Untitled Trip";

    // 1. Create snapshot
    const snapshotUrl = `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.supabase.co')}/view/${trip.public_slug}`;
    const { data: snapshot, error: snapError } = await supabase
      .from("snapshots")
      .insert({
        trip_id: tripId,
        frozen_content: trip.published_data || {},
        selection_summary: selectionSummary || null,
        final_price: totalPrice ? parseFloat(String(totalPrice)) : null,
      })
      .select("id")
      .single();

    if (snapError) {
      console.error("Failed to create snapshot:", snapError);
      return new Response(JSON.stringify({ error: "Failed to create snapshot" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Update trip status to approved
    const { error: updateError } = await supabase
      .from("trips")
      .update({ status: "approved" })
      .eq("id", tripId);

    if (updateError) {
      console.error("Failed to update trip status:", updateError);
    }

    // 3. Fire webhook if org has a webhook_url
    let webhookFired = false;
    if (trip.org_id) {
      const { data: org } = await supabase
        .from("organizations")
        .select("webhook_url")
        .eq("id", trip.org_id)
        .single();

      if (org?.webhook_url) {
        try {
          const webhookPayload = {
            trip_name: tripName,
            total_price: totalPrice || 0,
            deposit_amount: depositAmount || 0,
            selection_summary: selectionSummary || "",
            snapshot_url: snapshotUrl,
            snapshot_id: snapshot?.id,
            timestamp: new Date().toISOString(),
          };

          const webhookResp = await fetch(org.webhook_url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(webhookPayload),
          });

          webhookFired = webhookResp.ok;
          if (!webhookResp.ok) {
            console.error(`Webhook failed [${webhookResp.status}]:`, await webhookResp.text());
          }
        } catch (err) {
          console.error("Webhook call failed:", err);
        }
      }
    }

    // Also fire GHL webhook if configured
    const { data: settings } = await supabase
      .from("app_settings")
      .select("ghl_webhook_approve")
      .eq("id", 1)
      .single();

    if (settings?.ghl_webhook_approve) {
      try {
        await fetch(settings.ghl_webhook_approve, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "approve",
            tripId,
            tripName,
            totalPrice: totalPrice || 0,
            selectionSummary: selectionSummary || "",
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (err) {
        console.error("GHL webhook failed:", err);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        snapshotId: snapshot?.id,
        webhookFired,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in approve-trip:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
