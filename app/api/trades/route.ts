import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { detectBehavioralFlags } from '@/lib/behavioral/engine'
import { detectTradingSession } from '@/lib/utils'
import type { Trade } from '@/types'

// GET /api/trades — list trades for current user
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') ?? '50')
  const offset = parseInt(searchParams.get('offset') ?? '0')
  const start = searchParams.get('start')
  const end = searchParams.get('end')
  const symbol = searchParams.get('symbol')
  const session = searchParams.get('session')
  const status = searchParams.get('status') ?? 'closed'

  let query = supabase
    .from('trades')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .eq('status', status)
    .order('opened_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (start) query = query.gte('opened_at', start)
  if (end) query = query.lte('opened_at', end)
  if (symbol) query = query.eq('symbol', symbol)
  if (session) query = query.eq('session', session)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, total: count, limit, offset })
}

// POST /api/trades — create a new trade manually
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  // Auto-detect session if not provided
  if (!body.session && body.opened_at) {
    body.session = detectTradingSession(body.opened_at)
  }

  // Calculate duration if both timestamps present
  if (body.opened_at && body.closed_at) {
    const opened = new Date(body.opened_at)
    const closed = new Date(body.closed_at)
    body.duration_minutes = Math.round((closed.getTime() - opened.getTime()) / 1000 / 60)
  }

  // Calculate pips for forex
  if (body.entry_price && body.exit_price && body.instrument_type === 'forex') {
    const pipMultiplier = body.symbol?.includes('JPY') ? 100 : 10000
    const direction = body.direction === 'long' ? 1 : -1
    body.pips = Math.round(((body.exit_price - body.entry_price) * pipMultiplier * direction) * 10) / 10
  }

  const { data: trade, error } = await supabase
    .from('trades')
    .insert({ ...body, user_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Run behavioral flag detection on new trade
  if (trade.status === 'closed') {
    await runBehavioralDetection(supabase, user.id, trade as Trade)
  }

  return NextResponse.json({ data: trade }, { status: 201 })
}

async function runBehavioralDetection(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  newTrade: Trade
) {
  try {
    // Fetch recent trades for context
    const { data: recentTrades } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'closed')
      .order('opened_at', { ascending: false })
      .limit(20)

    const { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    const { data: recentLogs } = await supabase
      .from('behavioral_logs')
      .select('*')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false })
      .limit(20)

    if (recentTrades && settings) {
      const flags = detectBehavioralFlags(
        recentTrades as Trade[],
        recentLogs ?? [],
        {
          max_risk_per_trade_pct: settings.max_risk_per_trade_pct,
          max_daily_loss_pct: settings.max_daily_loss_pct,
        }
      )

      // Only insert flags for this specific new trade
      const tradeFlags = flags.filter(f => f.trade_id === newTrade.id || !f.trade_id)
      if (tradeFlags.length > 0) {
        await supabase.from('behavioral_flags').insert(
          tradeFlags.map(f => ({ ...f, user_id: userId }))
        )
      }

      // Update trade alignment and discipline scores
      const alignmentScore = computeQuickAlignmentScore(newTrade, settings)
      await supabase
        .from('trades')
        .update({ alignment_score: alignmentScore })
        .eq('id', newTrade.id)
    }
  } catch (err) {
    console.error('Behavioral detection error:', err)
  }
}

function computeQuickAlignmentScore(
  trade: Trade,
  settings: { max_risk_per_trade_pct: number }
): number {
  let score = 70
  if ((trade.risk_pct ?? 0) <= settings.max_risk_per_trade_pct) score += 10
  else score -= 15
  if ((trade.reward_risk_ratio ?? 0) >= 2) score += 10
  else if ((trade.reward_risk_ratio ?? 0) < 1) score -= 15
  return Math.max(0, Math.min(100, score))
}
