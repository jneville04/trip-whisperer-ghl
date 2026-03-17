import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
      .select('app_name')
      .eq('id', 1)
      .single()

    const appName = appSettings?.app_name || 'Proposal Builder'
    const displayName = agentName || 'Unknown'

    let notified = 0
    for (const adminEmail of adminEmails) {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #333; margin-bottom: 16px;">New Agent Signup</h2>
          <p style="color: #555; font-size: 15px; line-height: 1.6;">
            A new travel agent has signed up on <strong>${appName}</strong> and is awaiting your approval.
          </p>
          <table style="margin: 20px 0; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 16px 8px 0; color: #888; font-size: 14px;">Name:</td>
              <td style="padding: 8px 0; font-size: 14px; color: #333; font-weight: 600;">${displayName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 16px 8px 0; color: #888; font-size: 14px;">Email:</td>
              <td style="padding: 8px 0; font-size: 14px; color: #333; font-weight: 600;">${agentEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px 16px 8px 0; color: #888; font-size: 14px;">Status:</td>
              <td style="padding: 8px 0; font-size: 14px; color: #b45309; font-weight: 600;">Pending Approval</td>
            </tr>
          </table>
          <p style="color: #555; font-size: 14px;">
            Log in to the Admin Panel to approve or reject this agent.
          </p>
        </div>
      `

      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `${appName} <noreply@notify.journeyswithjoi.com>`,
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
