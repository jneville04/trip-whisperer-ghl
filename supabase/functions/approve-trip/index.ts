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
    const { tripId, selectionSummary, totalPrice, depositAmount, sectionDetails, currency, pricingMode, approvedAt } =
      await req.json();

    if (!tripId) {
      return new Response(JSON.stringify({ error: "Missing tripId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // 1. FETCH THE TRIP
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
    const tripName = publishedData?.tripName || publishedData?.destination || "Untitled Trip";
    const travelerName = publishedData?.travelerName || publishedData?.clientName || "Traveler";
    const agentEmail = publishedData?.agent?.email;
    const agentName = publishedData?.agent?.name || "Travel Advisor";
    const deposit = depositAmount || 0;

    // 2. UPDATE TRIP STATUS
    const { error: updateError } = await supabase
      .from("trips")
      .update({
        status: "approved",
        published_data: {
          ...publishedData,
          approvedAt: approvedAt || new Date().toISOString(),
          approvedSelections: sectionDetails || [],
          approvedTotal: totalPrice,
          approvedDeposit: deposit,
        },
      })
      .eq("id", tripId);

    if (updateError) {
      console.error("Failed to update trip status:", updateError);
    }

    // 3. CREATE SNAPSHOT
    try {
      await supabase.from("snapshots").insert({
        trip_id: tripId,
        frozen_content: publishedData || {},
        final_price: totalPrice || 0,
        selection_summary: selectionSummary || "",
      });
    } catch (snapErr) {
      console.error("Snapshot insert failed:", snapErr);
    }

    // 4. SEND AGENT EMAIL via Resend
    const resendApiKey = Deno.env.get("RESEND_SECRET_API");
    let emailSent = false;

    if (resendApiKey && agentEmail) {
      try {
        const emailResp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Journeys with Joi <updates@updates.journeyswithjoi.com>",
            to: [agentEmail],
            reply_to: agentEmail,
            subject: `Trip Approved: ${tripName} - ${travelerName}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #0c7d69; margin-bottom: 16px;">New Approval Received!</h2>
                <p><strong>Traveler:</strong> ${travelerName}</p>
                <p><strong>Trip:</strong> ${tripName}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"/>
                <p><strong>Selections:</strong><br/>${selectionSummary || "Standard package selected."}</p>
                <p><strong>Final Total:</strong> $${totalPrice || 0}</p>
                <p><strong>Deposit Due:</strong> $${deposit}</p>
                <br/>
                <a href="https://studio.journeyswithjoi.com/${trip.public_slug}" style="display: inline-block; background-color: #0c7d69; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Proposal</a>
              </div>
            `,
          }),
        });

        const resendData = await emailResp.json();
        console.log("Resend API Response:", resendData);
        emailSent = emailResp.ok;
      } catch (err) {
        console.error("Email fetch failed:", err);
      }
    } else {
      console.warn("Email not sent — missing RESEND_SECRET_API or agentEmail", {
        hasKey: !!resendApiKey,
        agentEmail,
      });
    }

    // 5. FIRE GHL WEBHOOK if configured
    const { data: settings } = await supabase.from("app_settings").select("ghl_webhook_approve").eq("id", 1).single();

    if (settings?.ghl_webhook_approve) {
      try {
        await fetch(settings.ghl_webhook_approve, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "approval",
            tripId,
            tripName,
            travelerName,
            selectionSummary: selectionSummary || "",
            totalPrice: totalPrice || 0,
            deposit,
            currency: currency || "USD",
            pricingMode: pricingMode || "fixed",
            sectionDetails: sectionDetails || [],
            status: "approved",
            approvedAt: approvedAt || new Date().toISOString(),
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (err) {
        console.error("GHL webhook failed:", err);
      }
    }

    // 6. FIRE ORG WEBHOOK if configured
    if (trip.org_id) {
      const { data: org } = await supabase.from("organizations").select("webhook_url").eq("id", trip.org_id).single();

      if (org?.webhook_url) {
        try {
          await fetch(org.webhook_url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "approved",
              trip_name: tripName,
              traveler_name: travelerName,
              selection_summary: selectionSummary || "",
              total_price: totalPrice || 0,
              deposit,
              timestamp: new Date().toISOString(),
            }),
          });
        } catch (err) {
          console.error("Org webhook failed:", err);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, emailSent }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in approve-trip:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
