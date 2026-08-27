import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [{ data: settings }, { data: rules }, { data: daily }] = await Promise.all([
    supabase.from('user_settings').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('trading_rules').select('*').eq('user_id', user.id).order('created_at'),
    supabase.from('daily_goals').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(1).maybeSingle(),
  ])
  return NextResponse.json({ settings, rules: rules ?? [], daily_goal: daily ?? null })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  // Upsert user_settings
  if (body.settings) {
    const { data, error } = await supabase.from('user_settings').upsert({ user_id: user.id, ...body.settings }, { onConflict: 'user_id' }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }
  return NextResponse.json({ error: 'No settings provided' }, { status: 400 })
}
