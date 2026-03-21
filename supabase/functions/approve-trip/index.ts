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
    const tripName = publishedData?.tripName || publishedData?.destination || "Untitled Trip";
    const agentEmail = publishedData?.agent?.email;
    const agentName = publishedData?.agent?.name || "Travel Advisor";
    const clientName = publishedData?.clientName || "Traveler";

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
            currency: currency || "USD",
            pricing_mode: pricingMode || "fixed",
            selection_summary: selectionSummary || "",
            section_details: sectionDetails || [],
            snapshot_url: snapshotUrl,
            snapshot_id: snapshot?.id,
            status: "approved",
            approved_at: approvedAt || new Date().toISOString(),
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
            depositAmount: depositAmount || 0,
            currency: currency || "USD",
            selectionSummary: selectionSummary || "",
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

    // Send agent email notification via Resend
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey && agentEmail) {
      try {
        const currSymbol = currency === "USD" ? "$" : currency + " ";
        const sectionLines = (sectionDetails || [])
          .map((s: any) => `<tr><td style="padding:4px 0;color:#888;width:120px;">${s.section}</td><td style="padding:4px 0;font-weight:600;">${s.selectedName}${s.price ? ` — ${currSymbol}${parseFloat(s.price).toLocaleString()}` : ""}</td></tr>`)
          .join("");

        const emailHtml = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <h2 style="color:#0c7d69;margin-bottom:4px;">Proposal Approved! 🎉</h2>
            <p style="color:#666;font-size:14px;margin-top:0;">A traveler has approved their proposal.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
            <table style="width:100%;font-size:14px;color:#333;">
              <tr><td style="padding:6px 0;color:#888;width:140px;">Proposal</td><td style="padding:6px 0;font-weight:600;">${tripName}</td></tr>
              <tr><td style="padding:6px 0;color:#888;">Traveler</td><td style="padding:6px 0;">${clientName}</td></tr>
              <tr><td style="padding:6px 0;color:#888;">Approved At</td><td style="padding:6px 0;">${new Date(approvedAt || Date.now()).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</td></tr>
            </table>
            ${sectionLines ? `
            <div style="margin:20px 0;">
              <p style="font-size:12px;text-transform:uppercase;color:#888;margin:0 0 8px;letter-spacing:0.5px;">Selected Options</p>
              <table style="width:100%;font-size:14px;color:#333;">${sectionLines}</table>
            </div>` : ""}
            <div style="background:#f0fdf4;border-radius:8px;padding:16px;margin:20px 0;">
              <table style="width:100%;font-size:14px;color:#333;">
                <tr><td style="padding:4px 0;color:#888;">Total</td><td style="padding:4px 0;font-weight:700;font-size:18px;color:#0c7d69;">${currSymbol}${(totalPrice || 0).toLocaleString()}</td></tr>
                ${depositAmount ? `<tr><td style="padding:4px 0;color:#888;">Deposit Due</td><td style="padding:4px 0;font-weight:600;">${currSymbol}${depositAmount.toLocaleString()}</td></tr>` : ""}
              </table>
            </div>
            <p style="font-size:12px;color:#aaa;margin-top:30px;">This notification was sent automatically from your proposal system.</p>
          </div>
        `;

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "noreply@notify.journeyswithjoi.com",
            to: [agentEmail],
            subject: `Proposal Approved: ${tripName}`,
            html: emailHtml,
          }),
        });
      } catch (emailErr) {
        console.error("Failed to send agent approval email:", emailErr);
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
