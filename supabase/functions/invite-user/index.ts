import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function generatePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let pwd = ''
  for (let i = 0; i < 12; i++) pwd += chars[Math.floor(Math.random() * chars.length)]
  return pwd
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      'https://bvfwcmsadxymgwujqudw.supabase.co',
      Deno.env.get('SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { email, name, initials, phone, company, role } = await req.json()

    if (!email || !name) {
      return new Response(JSON.stringify({ error: 'Email and name are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const tempPassword = generatePassword()

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    })

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (data.user) {
      await supabaseAdmin.from('profiles').upsert({
        id: data.user.id,
        email,
        name,
        initials: (initials || name.split(' ').map((n) => n[0]).join('')).toUpperCase().slice(0, 3),
        phone: phone || '',
        company: company || '',
        role: role || 'user',
        permissions: {},
      })

      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
      const loginUrl = 'https://listing-tracker-lyart.vercel.app'
      const html = `<div style="font-family:system-ui,sans-serif;max-width:500px;margin:0 auto"><div style="background:#1a2744;padding:16px 20px;border-radius:8px 8px 0 0"><div style="color:white;font-size:16px;font-weight:700">Listing Tracker</div><div style="color:rgba(255,255,255,0.6);font-size:12px">Backyard Home Buyers</div></div><div style="padding:24px;border:1px solid #eee;border-top:none;border-radius:0 0 8px 8px"><p style="font-size:15px;color:#333;margin:0 0 16px">Hi ${name},</p><p style="font-size:14px;color:#333;margin:0 0 16px">You've been invited to Listing Tracker. Here are your login credentials:</p><div style="background:#f8f8f8;border-radius:8px;padding:16px;margin-bottom:20px"><div style="font-size:13px;color:#666;margin-bottom:8px"><strong>Email:</strong> ${email}</div><div style="font-size:13px;color:#666"><strong>Temporary password:</strong> <span style="font-family:monospace;background:#e8e8e8;padding:2px 6px;border-radius:4px">${tempPassword}</span></div></div><p style="font-size:13px;color:#888;margin:0 0 20px">Please log in and change your password in Settings.</p><a href="${loginUrl}" style="display:inline-block;background:#1a2744;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600">Log in to Listing Tracker →</a></div></div>`

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'Listing Tracker <notifications@backyardhomebuyers.com>', to: email, subject: "You've been invited to Listing Tracker", html }),
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
