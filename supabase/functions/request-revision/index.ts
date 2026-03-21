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
    const { tripId, revisionNote, travelerName, travelerEmail, categories, currentSelections } = await req.json();

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
    const tripName = publishedData?.tripName || publishedData?.destination || "Untitled Trip";
    const agentEmail = publishedData?.agent?.email;
    const agentName = publishedData?.agent?.name || "Travel Advisor";

    // 1. Update trip status to revision_requested
    const { error: updateError } = await supabase
      .from("trips")
      .update({ status: "revision_requested" })
      .eq("id", tripId);

    if (updateError) {
      console.error("Failed to update trip status:", updateError);
    }

    // 2. Send agent email notification via Resend
    const resendKey = Deno.env.get("RESEND_SECRET_API");
    console.log("Email check:", { hasResendKey: !!resendKey, agentEmail: agentEmail || "none" });
    if (resendKey && agentEmail) {
      try {
        const selectionsText = currentSelections
          ? currentSelections.map((s: any) => `${s.section}: ${s.selectedName}`).join("\n  ")
          : "No selections made yet";

        const proposalUrl = `${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".supabase.co")}/view/${trip.public_slug}`;

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #0c7d69; margin-bottom: 4px;">Revision Request Received</h2>
            <p style="color: #666; font-size: 14px; margin-top: 0;">A traveler has requested changes to a proposal.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <table style="width: 100%; font-size: 14px; color: #333;">
              <tr><td style="padding: 6px 0; color: #888; width: 140px;">Proposal</td><td style="padding: 6px 0; font-weight: 600;">${tripName}</td></tr>
              ${travelerName ? `<tr><td style="padding: 6px 0; color: #888;">Traveler</td><td style="padding: 6px 0;">${travelerName}</td></tr>` : ""}
              ${travelerEmail ? `<tr><td style="padding: 6px 0; color: #888;">Email</td><td style="padding: 6px 0;">${travelerEmail}</td></tr>` : ""}
              <tr><td style="padding: 6px 0; color: #888;">Requested At</td><td style="padding: 6px 0;">${new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</td></tr>
            </table>
            <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="font-size: 12px; text-transform: uppercase; color: #888; margin: 0 0 8px; letter-spacing: 0.5px;">Revision Note</p>
              <p style="font-size: 14px; color: #333; margin: 0; white-space: pre-wrap;">${revisionNote || "No details provided"}</p>
            </div>
            ${categories && categories.length > 0 ? `
            <div style="margin-bottom: 20px;">
              <p style="font-size: 12px; text-transform: uppercase; color: #888; margin: 0 0 8px; letter-spacing: 0.5px;">Categories</p>
              <p style="font-size: 14px; color: #333; margin: 0;">${categories.join(", ")}</p>
            </div>` : ""}
            ${currentSelections && currentSelections.length > 0 ? `
            <div style="margin-bottom: 20px;">
              <p style="font-size: 12px; text-transform: uppercase; color: #888; margin: 0 0 8px; letter-spacing: 0.5px;">Current Selections</p>
              ${currentSelections.map((s: any) => `<p style="font-size: 14px; color: #333; margin: 2px 0;">• ${s.section}: ${s.selectedName}</p>`).join("")}
            </div>` : ""}
            <p style="font-size: 12px; color: #aaa; margin-top: 30px;">This notification was sent automatically from your proposal system.</p>
          </div>
        `;

        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Updates @ Journeys with Joi <updates@updates.journeyswithjoi.com>",
            to: [agentEmail],
            subject: `Revision Requested: ${tripName}`,
            html: emailHtml,
          }),
        });
        const resendBody = await resendRes.text();
        console.log("Resend response:", { status: resendRes.status, body: resendBody });
      } catch (emailErr) {
        console.error("Failed to send agent email:", emailErr);
      }
    }

    // 3. Fire GHL webhook if configured
    const { data: settings } = await supabase
      .from("app_settings")
      .select("ghl_webhook_revision")
      .eq("id", 1)
      .single();

    if (settings?.ghl_webhook_revision) {
      try {
        await fetch(settings.ghl_webhook_revision, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "revision",
            tripId,
            tripName,
            travelerName: travelerName || "",
            travelerEmail: travelerEmail || "",
            revisionNote: revisionNote || "",
            categories: categories || [],
            currentSelections: currentSelections || [],
            status: "revision_requested",
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (err) {
        console.error("GHL webhook failed:", err);
      }
    }

    // 4. Fire org webhook if configured
    if (trip.org_id) {
      const { data: org } = await supabase
        .from("organizations")
        .select("webhook_url")
        .eq("id", trip.org_id)
        .single();

      if (org?.webhook_url) {
        try {
          await fetch(org.webhook_url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "revision_requested",
              trip_name: tripName,
              traveler_name: travelerName || "",
              traveler_email: travelerEmail || "",
              revision_note: revisionNote || "",
              categories: categories || [],
              timestamp: new Date().toISOString(),
            }),
          });
        } catch (err) {
          console.error("Org webhook failed:", err);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in request-revision:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
