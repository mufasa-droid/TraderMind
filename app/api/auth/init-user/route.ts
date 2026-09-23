import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    if (!body || !body.userId || !body.email) {
      return NextResponse.json({ error: 'Missing userId or email' }, { status: 400 })
    }

    const { userId, email, fullName } = body
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !serviceKey || url.includes('placeholder')) {
      return NextResponse.json({ success: true, mode: 'demo' })
    }

    const admin = createSupabaseClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // 1. Ensure user row exists in public.users
    const { error: userErr } = await admin.from('users').upsert(
      {
        id: userId,
        email,
        full_name: fullName || 'Trader',
        timezone: 'UTC',
        plan: 'free',
        broker_connected: false,
        onboarding_completed: false,
      },
      { onConflict: 'id' }
    )

    if (userErr) {
      console.warn('Admin user profile init warning:', userErr.message)
    }

    // 2. Ensure default user_settings exist
    const { error: settingsErr } = await admin.from('user_settings').upsert(
      {
        user_id: userId,
        max_risk_per_trade_pct: 2.0,
        max_daily_loss_pct: 3.0,
        preferred_sessions: ['london', 'new_york'],
      },
      { onConflict: 'user_id' }
    )

    if (settingsErr) {
      console.warn('Admin user_settings init warning:', settingsErr.message)
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
