import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100)
  const { data, error } = await supabase.from('behavioral_logs').select('*').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(limit)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  // basic validation
  if (!body.emotion || !body.log_type) return NextResponse.json({ error: 'emotion and log_type required' }, { status: 400 })
  const { data, error } = await supabase.from('behavioral_logs').insert({
    user_id: user.id,
    trade_id: body.trade_id ?? null,
    log_type: body.log_type,
    emotion: body.emotion,
    confidence_level: Math.min(10, Math.max(1, body.confidence_level ?? 5)),
    fear_level: Math.min(10, Math.max(1, body.fear_level ?? 5)),
    stress_level: Math.min(10, Math.max(1, body.stress_level ?? 5)),
    focus_level: Math.min(10, Math.max(1, body.focus_level ?? 5)),
    setup_notes: body.setup_notes ?? body.notes ?? null,
    strategy_used: body.strategy_used ?? null,
    pre_trade_reasoning: body.pre_trade_reasoning ?? null,
    post_trade_reflection: body.post_trade_reflection ?? null,
    lesson_learned: body.lesson_learned ?? null,
    logged_at: body.logged_at ?? new Date().toISOString(),
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
