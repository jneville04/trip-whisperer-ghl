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
}: {
  logoUrl: string;
  businessName: string;
  primaryColor: string;
  heading: string;
  introText: string;
  detailsRows: { label: string; value: string }[];
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
  const resendApiKey = Deno.env.get('RESEND_API_KEY')

  const supabase = createClient(supabaseUrl, serviceKey)

  try {
    const { agentName, agentEmail } = await req.json()

    if (!agentEmail) {
      return new Response(JSON.stringify({ error: 'Missing agentEmail' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured — cannot send admin notification')
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Find admin user(s)
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')

    if (!adminRoles?.length) {
      console.warn('No admin users found to notify')
      return new Response(JSON.stringify({ ok: true, notified: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const adminIds = adminRoles.map((r) => r.user_id)
    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('email')
      .in('id', adminIds)

    const adminEmails = (adminProfiles || [])
      .map((p) => p.email)
      .filter(Boolean) as string[]

    if (!adminEmails.length) {
      console.warn('No admin emails found')
      return new Response(JSON.stringify({ ok: true, notified: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: appSettings } = await supabase
      .from('app_settings')
      .select('app_name, logo_url, primary_color')
      .eq('id', 1)
      .single()

    const appName = appSettings?.app_name || 'Proposal Builder'
    const logoUrl = appSettings?.logo_url || ''
    const primaryColor = appSettings?.primary_color || '#03989e'
    const displayName = agentName || 'Unknown'

    const html = buildBrandedEmailHtml({
      logoUrl,
      businessName: appName,
      primaryColor,
      heading: 'New Agent Signup',
      introText: `A new travel agent has signed up on ${appName} and is awaiting your approval.`,
      detailsRows: [
        { label: 'Name', value: displayName },
        { label: 'Email', value: agentEmail },
        { label: 'Status', value: '<span style="color:#b45309;font-weight:600;">Pending Approval</span>' },
      ],
    })

    let notified = 0
    for (const adminEmail of adminEmails) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `${appName} <updates@updates.journeyswithjoi.com>`,
            to: [adminEmail],
            subject: `New Agent Signup: ${displayName} (${agentEmail})`,
            html,
          }),
        })

        if (!res.ok) {
          const errText = await res.text()
          console.error('Resend error', { status: res.status, body: errText })
        } else {
          notified++
          console.log('Admin notification sent', { adminEmail })
        }
      } catch (err) {
        console.error('Failed to send admin notification', { adminEmail, error: err })
      }
    }

    return new Response(JSON.stringify({ ok: true, notified }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('notify-admin-signup error', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})