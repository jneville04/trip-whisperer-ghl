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
  messageHtml,
}: {
  logoUrl: string;
  businessName: string;
  primaryColor: string;
  heading: string;
  introText: string;
  detailsRows: { label: string; value: string }[];
  messageHtml?: string;
}) {
  const logoBlock = logoUrl
    ? `<img src="${logoUrl}" alt="${businessName}" style="max-height:50px;max-width:200px;display:block;margin:0 auto 16px;" />`
    : `<h1 style="font-family:'Playfair Display',Georgia,serif;font-size:22px;font-weight:700;color:#1a1a1a;text-align:center;margin:0 0 16px;">${businessName}</h1>`;

  const rows = detailsRows
    .filter(r => r.value)
    .map(r => `<tr><td style="padding:8px 12px;color:#6b7280;font-size:13px;width:150px;vertical-align:top;">${r.label}</td><td style="padding:8px 12px;font-size:14px;color:#1a1a1a;font-weight:500;">${r.value}</td></tr>`)
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="margin:0;padding:0;background-color:#f8fafc;font-family:'DM Sans',Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;padding:0 0 24px;">${logoBlock}</div>
  <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,0.04);padding:32px 28px;">
    <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:20px;font-weight:700;color:${primaryColor};margin:0 0 8px;">${heading}</h2>
    <p style="font-size:14px;color:#6b7280;margin:0 0 24px;line-height:1.5;">${introText}</p>
    <table style="width:100%;border-collapse:collapse;">${rows}</table>
    ${messageHtml ? `<div style="margin:24px 0 0;padding:16px;background:#f9fafb;border-radius:8px;border:1px solid #f0f0f0;">${messageHtml}</div>` : ""}
  </div>
  <p style="text-align:center;font-size:11px;color:#9ca3af;margin:20px 0 0;">This notification was sent from ${businessName}</p>
</div>
</body></html>`;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function getTripLookupCandidates(payload: Record<string, any>) {
  return [payload.tripId, payload.trip_id, payload.proposalId, payload.shareId, payload.share, payload.publicSlug, payload.slug]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim());
}

async function resolveTripContext(supabase: any, payload: Record<string, any>) {
  const tripSelect = "id, owner_id, public_slug, published_data";

  for (const candidate of getTripLookupCandidates(payload)) {
    if (isUuid(candidate)) {
      const { data: tripById } = await supabase
        .from("trips")
        .select(tripSelect)
        .eq("id", candidate)
        .maybeSingle();

      if (tripById) return tripById;
    }

    const { data: tripBySlug } = await supabase
      .from("trips")
      .select(tripSelect)
      .eq("public_slug", candidate)
      .maybeSingle();

    if (tripBySlug) return tripBySlug;
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, payload } = await req.json();

    if (!type || !payload) {
      return new Response(JSON.stringify({ error: "Missing type or payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fetch app settings for branding + webhook URLs
    const { data: settings, error: settingsError } = await supabase
      .from("app_settings")
      .select("ghl_webhook_approve, ghl_webhook_revision, app_name, logo_url, primary_color")
      .eq("id", 1)
      .single();

    if (settingsError) {
      console.error("Failed to fetch settings:", settingsError);
      return new Response(JSON.stringify({ error: "Failed to fetch settings" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── QUESTION / REVISION TYPE: send email to agent ──
    if (type === "question" || type === "revision") {
      const resendApiKey = Deno.env.get("RESEND_SECRET_API");
      let emailSent = false;
      let agentEmail: string | null = null;
      let tripOwnerId: string | null = null;

      // Find agent email from the trip's published_data
      if (payload.tripId) {
        const { data: trip } = await supabase
          .from("trips")
          .select("published_data, owner_id")
          .eq("id", payload.tripId)
          .maybeSingle();

        const pubData = trip?.published_data as Record<string, any> | null;
        agentEmail = pubData?.agent?.email || null;
        tripOwnerId = trip?.owner_id || null;
      }

      // Fallback: check agent_settings for the trip owner first, then any
      if (!agentEmail && tripOwnerId) {
        const { data: agentSettings } = await supabase
          .from("agent_settings")
          .select("agent_email")
          .eq("user_id", tripOwnerId)
          .maybeSingle();
        agentEmail = agentSettings?.agent_email || null;
      }
      if (!agentEmail) {
        const { data: agentSettings } = await supabase
          .from("agent_settings")
          .select("agent_email")
          .neq("agent_email", "")
          .limit(1)
          .maybeSingle();
        agentEmail = agentSettings?.agent_email || null;
      }

      if (resendApiKey && agentEmail) {
        const businessName = settings?.app_name || "Travel Advisor";
        const logoUrl = settings?.logo_url || "";
        const primaryColor = settings?.primary_color || "#0c7d69";

        const travelerName = payload.name || "A traveler";
        const travelerEmail = payload.email || "Not provided";
        const tripName = payload.tripName || "a trip";
        const message = payload.message || "";

        const isRevision = type === "revision";
        const heading = isRevision ? "Revision Request" : "New Question from Traveler";
        const introText = isRevision
          ? `${travelerName} has requested revisions for ${tripName}.`
          : `${travelerName} has a question about ${tripName}.`;
        const subjectLine = isRevision
          ? `Revision Request: ${tripName} — ${travelerName}`
          : `New Question: ${tripName} — ${travelerName}`;

        const detailsRows = [
          { label: "From", value: travelerName },
          { label: "Email", value: `<a href="mailto:${travelerEmail}" style="color:${primaryColor};text-decoration:none;">${travelerEmail}</a>` },
          { label: "Trip", value: tripName },
        ];

        const messageHtml = message
          ? `<p style="font-size:12px;text-transform:uppercase;color:#9ca3af;margin:0 0 8px;letter-spacing:0.5px;">${isRevision ? "Revision Notes" : "Message"}</p><p style="font-size:14px;color:#374151;margin:0;line-height:1.6;white-space:pre-wrap;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`
          : "";

        const emailHtml = buildBrandedEmailHtml({
          logoUrl,
          businessName,
          primaryColor,
          heading,
          introText,
          detailsRows,
          messageHtml,
        });

        try {
          const emailResp = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: `${businessName} <updates@updates.journeyswithjoi.com>`,
              to: [agentEmail],
              reply_to: travelerEmail !== "Not provided" ? travelerEmail : agentEmail,
              subject: subjectLine,
              html: emailHtml,
            }),
          });

          const resendData = await emailResp.json();
          console.log(`${type} email response:`, resendData);
          emailSent = emailResp.ok;
        } catch (err) {
          console.error(`${type} email failed:`, err);
        }
      } else {
        console.warn(`${type} email not sent — missing RESEND_SECRET_API or agentEmail`, {
          hasKey: !!resendApiKey,
          agentEmail,
        });
      }

      // Also forward to GHL webhook if configured
      const webhookUrl = type === "revision"
        ? settings?.ghl_webhook_revision
        : settings?.ghl_webhook_revision;
      if (webhookUrl) {
        try {
          await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, ...payload, timestamp: new Date().toISOString() }),
          });
        } catch (err) {
          console.error(`GHL webhook for ${type} failed:`, err);
        }
      }

      return new Response(JSON.stringify({ success: true, emailSent }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── APPROVE / REVISION TYPES: forward to GHL webhook ──
    const webhookUrl =
      type === "approve"
        ? settings?.ghl_webhook_approve
        : settings?.ghl_webhook_revision;

    if (!webhookUrl) {
      console.log(`No GHL webhook configured for type: ${type}`);
      return new Response(JSON.stringify({ success: true, webhook: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ghlResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        ...payload,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!ghlResponse.ok) {
      console.error(`GHL webhook failed [${ghlResponse.status}]:`, await ghlResponse.text());
      return new Response(JSON.stringify({ success: true, webhook: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, webhook: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in ghl-webhook:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
