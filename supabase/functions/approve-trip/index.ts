import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildBrandedEmailHtml({
  logoUrl,
  businessName,
  primaryColor,
  heading,
  introText,
  detailsRows,
  summaryHtml,
  ctaUrl,
  ctaLabel,
}: {
  logoUrl: string;
  businessName: string;
  primaryColor: string;
  heading: string;
  introText: string;
  detailsRows: { label: string; value: string }[];
  summaryHtml?: string;
  ctaUrl?: string;
  ctaLabel?: string;
}) {
  const logoBlock = logoUrl
    ? `<img src="${logoUrl}" alt="${businessName}" style="max-height:50px;max-width:200px;display:block;margin:0 auto 16px;" />`
    : `<h1 style="font-family:'Playfair Display',Georgia,serif;font-size:22px;font-weight:700;color:#1a1a1a;text-align:center;margin:0 0 16px;">${businessName}</h1>`;

  const rows = detailsRows
    .filter(r => r.value)
    .map(r => `<tr><td style="padding:8px 12px;color:#6b7280;font-size:13px;width:150px;vertical-align:top;">${r.label}</td><td style="padding:8px 12px;font-size:14px;color:#1a1a1a;font-weight:500;">${r.value}</td></tr>`)
    .join("");

  const ctaBlock = ctaUrl && ctaLabel
    ? `<div style="text-align:center;margin:28px 0 0;"><a href="${ctaUrl}" style="display:inline-block;background-color:${primaryColor};color:#ffffff;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">${ctaLabel}</a></div>`
    : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="margin:0;padding:0;background-color:#f8fafc;font-family:'DM Sans',Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;padding:0 0 24px;">${logoBlock}</div>
  <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,0.04);padding:32px 28px;">
    <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:20px;font-weight:700;color:${primaryColor};margin:0 0 8px;">${heading}</h2>
    <p style="font-size:14px;color:#6b7280;margin:0 0 24px;line-height:1.5;">${introText}</p>
    <table style="width:100%;border-collapse:collapse;">${rows}</table>
    ${summaryHtml ? `<div style="margin:24px 0 0;padding:16px;background:#f9fafb;border-radius:8px;border:1px solid #f0f0f0;">${summaryHtml}</div>` : ""}
    ${ctaBlock}
  </div>
  <p style="text-align:center;font-size:11px;color:#9ca3af;margin:20px 0 0;">This notification was sent from ${businessName}</p>
</div>
</body></html>`;
}

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
      .select("id, published_data, org_id, public_slug, status, traveler_email, traveler_phone")
      .eq("id", tripId)
      .single();

    if (tripError || !trip) {
      return new Response(JSON.stringify({ error: "Trip not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // FETCH APP SETTINGS for branding
    const { data: appSettings } = await supabase
      .from("app_settings")
      .select("app_name, logo_url, primary_color")
      .eq("id", 1)
      .single();

    const businessName = appSettings?.app_name || "Travel Advisor";
    const logoUrl = appSettings?.logo_url || "";
    const primaryColor = appSettings?.primary_color || "#0c7d69";

    const publishedData = trip.published_data as Record<string, any> | null;
    const tripName = publishedData?.tripName || publishedData?.destination || "Untitled Trip";
    const travelerName = publishedData?.travelerName || publishedData?.clientName || "Traveler";
    const agentEmail = publishedData?.agent?.email;
    const agentName = publishedData?.agent?.name || "Travel Advisor";
    const deposit = depositAmount || 0;

    // Build public proposal URL using the published app URL pattern
    const siteUrl = Deno.env.get("SITE_URL") || "https://trip-whisperer-ghl.lovable.app";
    const proposalUrl = `${siteUrl}/view/${trip.public_slug}`;

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

    // 4. SEND AGENT EMAIL via Resend with branded template
    const resendApiKey = Deno.env.get("RESEND_SECRET_API");
    let emailSent = false;

    if (resendApiKey && agentEmail) {
      try {
        const detailsRows = [
          { label: "Traveler", value: travelerName },
          { label: "Trip", value: tripName },
          { label: "Status", value: "Approved ✓" },
          { label: "Approved At", value: new Date(approvedAt || Date.now()).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) },
          { label: "Final Total", value: `<span style="color:${primaryColor};font-weight:700;font-size:16px;">$${totalPrice || 0}</span>` },
          { label: "Deposit Due", value: `$${deposit}` },
          { label: "Currency", value: currency || "USD" },
        ];

        const selectionsHtml = sectionDetails && sectionDetails.length > 0
          ? `<p style="font-size:12px;text-transform:uppercase;color:#9ca3af;margin:0 0 8px;letter-spacing:0.5px;">Approved Selections</p>` +
            sectionDetails.map((d: any) => `<p style="font-size:13px;color:#374151;margin:2px 0;">• <strong>${d.section}:</strong> ${d.selectedName}</p>`).join("")
          : "";

        const emailHtml = buildBrandedEmailHtml({
          logoUrl,
          businessName,
          primaryColor,
          heading: "New Approval Received!",
          introText: `${travelerName} has approved their proposal for ${tripName}.`,
          detailsRows,
          summaryHtml: selectionsHtml,
          ctaUrl: proposalUrl,
          ctaLabel: "View Proposal",
        });

        const emailResp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `${businessName} <updates@updates.journeyswithjoi.com>`,
            to: [agentEmail],
            reply_to: agentEmail,
            subject: `Trip Approved: ${tripName} — ${travelerName}`,
            html: emailHtml,
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

    // 5. FIRE GHL WEBHOOK if configured (check agent_settings first, then app_settings)
    let ghlWebhookUrl = "";

    // Try agent-level webhook from agent_settings (set in Settings → Integrations)
    if (agentEmail) {
      const { data: agentRow } = await supabase
        .from("agent_settings")
        .select("ghl_webhook_url")
        .eq("agent_email", agentEmail)
        .maybeSingle();
      if (agentRow?.ghl_webhook_url) {
        ghlWebhookUrl = agentRow.ghl_webhook_url;
        console.log("Using agent-level GHL webhook URL");
      }
    }

    // Fallback to app-level webhook from app_settings
    if (!ghlWebhookUrl) {
      const { data: appRow } = await supabase.from("app_settings").select("ghl_webhook_approve").eq("id", 1).single();
      if (appRow?.ghl_webhook_approve) {
        ghlWebhookUrl = appRow.ghl_webhook_approve;
        console.log("Using app-level GHL webhook URL");
      }
    }

    if (ghlWebhookUrl) {
      try {
        console.log("Sending GHL webhook to:", ghlWebhookUrl);
        const webhookPayload = {
          type: "approval",
          tripId,
          tripName,
          traveler_name: travelerName,
          traveler_email: trip.traveler_email || "",
          traveler_phone: trip.traveler_phone || "",
          trip_name: tripName,
          total_price: totalPrice || 0,
          selectionSummary: selectionSummary || "",
          totalPrice: totalPrice || 0,
          depositAmount: deposit,
          currency: currency || "USD",
          pricingMode: pricingMode || "fixed",
          sectionDetails: sectionDetails || [],
          status: "approved",
          approvedAt: approvedAt || new Date().toISOString(),
          timestamp: new Date().toISOString(),
        };
        const webhookResp = await fetch(ghlWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webhookPayload),
        });
        console.log("GHL webhook response status:", webhookResp.status);
        const respText = await webhookResp.text();
        console.log("GHL webhook response body:", respText);
      } catch (err) {
        console.error("GHL webhook failed:", err);
      }
    } else {
      console.warn("No GHL webhook URL configured (checked agent_settings and app_settings)");
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
