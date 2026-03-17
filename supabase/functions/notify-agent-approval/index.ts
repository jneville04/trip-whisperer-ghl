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
    const { agentEmail, agentName, loginUrl } = await req.json()

    if (!agentEmail) {
      return new Response(JSON.stringify({ error: 'Missing agentEmail' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get app settings for dynamic branding
    const { data: appSettings } = await supabase
      .from('app_settings')
      .select('app_name, primary_color, logo_url')
      .eq('id', 1)
      .single()

    const appName = appSettings?.app_name || 'Proposal Builder'
    const primaryColor = appSettings?.primary_color || '#0c7d69'
    const logoUrl = appSettings?.logo_url || ''
    const displayName = agentName || 'there'
    const signInUrl = loginUrl || ''

    const messageId = crypto.randomUUID()

    const logoHtml = logoUrl
      ? `<img src="${logoUrl}" alt="${appName}" style="max-height: 48px; margin-bottom: 16px;" /><br/>`
      : ''

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        ${logoHtml}
        <h2 style="color: ${primaryColor}; margin-bottom: 16px;">Your Account Has Been Approved!</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.6;">
          Hi ${displayName},
        </p>
        <p style="color: #555; font-size: 15px; line-height: 1.6;">
          Great news! Your account on <strong>${appName}</strong> has been approved. You can now sign in and start creating proposals.
        </p>
        ${signInUrl ? `
        <div style="margin: 28px 0; text-align: center;">
          <a href="${signInUrl}" style="display: inline-block; background-color: ${primaryColor}; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-size: 15px; font-weight: 600;">
            Sign In to ${appName}
          </a>
        </div>
        ` : ''}
        <p style="color: #888; font-size: 13px; margin-top: 24px;">
          If you have any questions, simply reply to this email or contact support.
        </p>
      </div>
    `

    const { error } = await supabase.rpc('enqueue_email', {
      queue_name: 'transactional_emails',
      payload: {
        run_id: messageId,
        message_id: messageId,
        to: agentEmail,
        from: `${appName} <noreply@notify.journeyswithjoi.com>`,
        sender_domain: 'notify.journeyswithjoi.com',
        subject: `Welcome to ${appName} — Your Account is Approved`,
        html,
        text: `Hi ${displayName},\n\nGreat news! Your account on ${appName} has been approved. You can now sign in and start creating proposals.\n\n${signInUrl ? `Sign in here: ${signInUrl}` : ''}\n\nIf you have any questions, simply reply to this email or contact support.`,
        purpose: 'transactional',
        label: 'agent_approval',
        queued_at: new Date().toISOString(),
      },
    })

    if (error) {
      console.error('Failed to enqueue approval email', { error })
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
