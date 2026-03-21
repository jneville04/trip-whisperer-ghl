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
    const { tripId, selectionSummary, totalPrice } = await req.json();
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!tripId) {
      return new Response(JSON.stringify({ error: "Missing tripId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

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
    const agentEmail = publishedData?.agent?.email || "";
    const travelerName = publishedData?.travelerName || "Traveler";
    const deposit = publishedData?.depositAmount || "0";

    // 1. Create snapshot
    const snapshotUrl = `https://your-app-url.com{trip.public_slug}`;
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

    // 2. Update trip status to approved
    await supabase.from("trips").update({ status: "approved" }).eq("id", tripId);

    // 3. SEND THE EMAIL (NEW LOGIC)
    let emailSent = false;
    if (resendApiKey && agentEmail) {
      try {
        const emailResp = await fetch("https://api.resend.com", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Updates @ Journeys with Joi <updates@journeyswithjoi.com>",
            to: [agentEmail],
            reply_to: agentEmail,
            subject: `Trip Approved: ${tripName} - ${travelerName}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px;">
                <h2 style="color: #0c7d69;">New Approval Received!</h2>
                <p><strong>Traveler:</strong> ${travelerName}</p>
                <p><strong>Trip:</strong> ${tripName}</p>
                <hr/>
                <p><strong>Selections:</strong><br/>${selectionSummary || "No specific selections recorded."}</p>
                <p><strong>Final Total:</strong> $${totalPrice || 0}</p>
                <p><strong>Deposit Due:</strong> $${deposit}</p>
                <br/>
                <a href="${snapshotUrl}" style="background-color: #0c7d69; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Proposal Snapshot</a>
              </div>
            `,
          }),
        });
        emailSent = emailResp.ok;
      } catch (err) {
        console.error("Email failed to send:", err);
      }
    }

    // 4. Fire webhooks (Internal & GHL)
    // ... (Keep your existing webhook logic here)

    return new Response(
      JSON.stringify({
        success: true,
        snapshotId: snapshot?.id,
        emailSent,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in approve-trip:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
