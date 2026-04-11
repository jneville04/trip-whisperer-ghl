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
    .filter((r) => r.value)
    .map(
      (r) =>
        `<tr><td style="padding:8px 12px;color:#6b7280;font-size:13px;width:150px;vertical-align:top;">${r.label}</td><td style="padding:8px 12px;font-size:14px;color:#1a1a1a;font-weight:500;">${r.value}</td></tr>`,
    )
    .join("");

  const ctaBlock =
    ctaUrl && ctaLabel
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
    const { tripId, revisionNote, travelerName, travelerEmail, categories, currentSelections } = await req.json();

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
      .select("id, published_data, org_id, public_slug, status, owner_id")
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
    let agentEmail = publishedData?.agent?.email || null;

    if (!agentEmail && trip.owner_id) {
      const { data: ownerSettings } = await supabase
        .from("agent_settings")
        .select("agent_email")
        .eq("user_id", trip.owner_id)
        .maybeSingle();
      agentEmail = ownerSettings?.agent_email || null;
    }

    if (!agentEmail) {
      const { data: fallbackSettings } = await supabase
        .from("agent_settings")
        .select("agent_email")
        .neq("agent_email", "")
        .limit(1)
        .maybeSingle();
      agentEmail = fallbackSettings?.agent_email || null;
    }

    const siteUrl = Deno.env.get("SITE_URL") || "https://trip-whisperer-ghl.lovable.app";
    // Agent CTA links to internal editor route, not public traveler view
    const editorUrl = `${siteUrl}/#/editor/${trip.id}`;

    // 1. Update trip status to revision_requested
    const { error: updateError } = await supabase
      .from("trips")
      .update({ status: "revision_requested" })
      .eq("id", tripId);

    if (updateError) {
      console.error("Failed to update trip status:", updateError);
    }

    // 2. Send agent email notification via Resend with branded template
    const resendKey = Deno.env.get("RESEND_SECRET_API");
    console.log("Email check:", { hasResendKey: !!resendKey, agentEmail: agentEmail || "none" });

    if (resendKey && agentEmail) {
      try {
        const detailsRows = [
          { label: "Proposal", value: tripName },
          { label: "Traveler", value: travelerName || "" },
          { label: "Email", value: travelerEmail || "" },
          {
            label: "Requested At",
            value: new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
          },
        ];

        const revisionNoteHtml = revisionNote
          ? `<p style="font-size:12px;text-transform:uppercase;color:#9ca3af;margin:0 0 8px;letter-spacing:0.5px;">Revision Note</p><p style="font-size:14px;color:#374151;margin:0;white-space:pre-wrap;">${revisionNote}</p>`
          : "";

        const categoriesHtml =
          categories && categories.length > 0
            ? `<p style="font-size:12px;text-transform:uppercase;color:#9ca3af;margin:16px 0 8px;letter-spacing:0.5px;">Categories</p><p style="font-size:13px;color:#374151;margin:0;">${categories.join(", ")}</p>`
            : "";

        // Resolve human-readable names from published_data
        const resolvedSelections = (currentSelections || []).map((s: any) => {
          let displayName = s.selectedName || "Selected";
          const sKey = s.sectionKey || s.section;
          const selId = s.selectedId || s.selectedName;
          if (publishedData && selId) {
            const arr = publishedData[sKey];
            if (Array.isArray(arr)) {
              const item = arr.find((i: any) => i.id === selId);
              if (item) {
                if (sKey === "flights") displayName = item.legs?.[0]?.airline || item.legs?.map((l: any) => `${l.departureCode}→${l.arrivalCode}`).join(", ") || "Flight";
                else if (sKey === "accommodations") displayName = item.hotelName || "Hotel";
                else if (sKey === "cruiseShips") displayName = item.shipName || "Cruise";
                else if (sKey === "busTrips") displayName = item.routeName || "Bus";
                else displayName = item.name || item.title || "Selected";
              }
            }
          }
          // If displayName still looks like a UUID, try harder
          if (/^[0-9a-f]{8}-/.test(displayName) && publishedData) {
            for (const key of ["flights", "accommodations", "cruiseShips", "busTrips"]) {
              const arr = publishedData[key];
              if (Array.isArray(arr)) {
                const item = arr.find((i: any) => i.id === displayName);
                if (item) {
                  displayName = item.hotelName || item.shipName || item.routeName || item.legs?.[0]?.airline || item.name || "Selected";
                  break;
                }
              }
            }
          }
          const sectionLabel = s.section && !/^[a-z]+[A-Z]/.test(s.section) ? s.section : sKey?.replace(/([A-Z])/g, " $1").replace(/^./, (c: string) => c.toUpperCase()) || s.section;
          return { section: sectionLabel, selectedName: displayName };
        });

        const selectionsHtml =
          resolvedSelections.length > 0
            ? `<p style="font-size:12px;text-transform:uppercase;color:#9ca3af;margin:16px 0 8px;letter-spacing:0.5px;">Current Selections</p>` +
              resolvedSelections
                .map(
                  (s: any) =>
                    `<p style="font-size:13px;color:#374151;margin:2px 0;">• ${s.section}: ${s.selectedName}</p>`,
                )
                .join("")
            : "";

        const emailHtml = buildBrandedEmailHtml({
          logoUrl,
          businessName,
          primaryColor,
          heading: "Revision Request Received",
          introText: "A traveler has requested changes to a proposal.",
          detailsRows,
          summaryHtml: [revisionNoteHtml, categoriesHtml, selectionsHtml].filter(Boolean).join(""),
          ctaUrl: editorUrl,
          ctaLabel: "Open in Editor",
        });

        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `${businessName} <updates@updates.journeyswithjoi.com>`,
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
    const { data: settings } = await supabase.from("app_settings").select("ghl_webhook_revision").eq("id", 1).single();

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
      const { data: org } = await supabase.from("organizations").select("webhook_url").eq("id", trip.org_id).single();

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

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in request-revision:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
