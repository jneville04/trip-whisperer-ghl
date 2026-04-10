import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function buildBrandedEmailHtml({
  logoUrl,
  businessName,
  primaryColor,
  heading,
  introText,
  detailsRows,
  ctaUrl,
  ctaLabel,
}: {
  logoUrl: string;
  businessName: string;
  primaryColor: string;
  heading: string;
  introText: string;
  detailsRows: { label: string; value: string }[];
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
    ${ctaBlock}
  </div>
  <p style="text-align:center;font-size:11px;color:#9ca3af;margin:20px 0 0;">This notification was sent from ${businessName}</p>
</div>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const resendApiKey = Deno.env.get('RESEND_SECRET_API')
  const supabase = createClient(supabaseUrl, serviceKey)

  try {
    const { agentEmail, agentName, loginUrl } = await req.json()

    if (!agentEmail) {
      return new Response(JSON.stringify({ error: 'Missing agentEmail' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured — cannot send approval email')
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: appSettings } = await supabase
      .from('app_settings')
      .select('app_name, primary_color, logo_url')
      .eq('id', 1)
      .single()

    const appName = appSettings?.app_name || 'Proposal Builder'
    const primaryColor = appSettings?.primary_color || '#03989e'
    const logoUrl = appSettings?.logo_url || ''
    const displayName = agentName || 'there'
    const signInUrl = loginUrl || ''

    const html = buildBrandedEmailHtml({
      logoUrl,
      businessName: appName,
      primaryColor,
      heading: 'Your Account Has Been Approved!',
      introText: `Hi ${displayName}, great news! Your account on ${appName} has been approved. You can now sign in and start creating proposals.`,
      detailsRows: [],
      ctaUrl: signInUrl || undefined,
      ctaLabel: signInUrl ? `Sign In to ${appName}` : undefined,
    })

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${appName} <updates@updates.journeyswithjoi.com>`,
          to: [agentEmail],
          subject: `Welcome to ${appName} — Your Account is Approved`,
          html,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        console.error('Resend error', { status: res.status, body: errText })
        return new Response(JSON.stringify({ error: 'Failed to send email' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      console.log('Approval email sent', { agentEmail })
    } catch (sendErr) {
      console.error('Failed to send approval email', { agentEmail, error: sendErr })
      return new Response(JSON.stringify({ error: 'Failed to send email' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('notify-agent-approval error', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})