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

  const supabase = createClient(supabaseUrl, serviceKey)

  try {
    const { agentName, agentEmail } = await req.json()

    if (!agentEmail) {
      return new Response(JSON.stringify({ error: 'Missing agentEmail' }), {
        status: 400,
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

    // Get admin emails from profiles
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

    // Get app settings for branding
    const { data: appSettings } = await supabase
      .from('app_settings')
      .select('app_name')
      .eq('id', 1)
      .single()

    const appName = appSettings?.app_name || 'Proposal Builder'
    const displayName = agentName || 'Unknown'

    // Enqueue notification email for each admin
    let notified = 0
    for (const adminEmail of adminEmails) {
      const messageId = crypto.randomUUID()
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

      const { error } = await supabase.rpc('enqueue_email', {
        queue_name: 'transactional_emails',
        payload: {
          run_id: crypto.randomUUID(),
          message_id: messageId,
          to: adminEmail,
          from: `${appName} <noreply@notify.journeyswithjoi.com>`,
          sender_domain: 'notify.journeyswithjoi.com',
          subject: `New Agent Signup: ${displayName} (${agentEmail})`,
          html,
          text: `New agent signup on ${appName}.\n\nName: ${displayName}\nEmail: ${agentEmail}\nStatus: Pending Approval\n\nLog in to the Admin Panel to approve or reject this agent.`,
          purpose: 'transactional',
          label: 'admin_new_signup',
          queued_at: new Date().toISOString(),
        },
      })

      if (error) {
        console.error('Failed to enqueue admin notification', { adminEmail, error })
      } else {
        notified++
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
