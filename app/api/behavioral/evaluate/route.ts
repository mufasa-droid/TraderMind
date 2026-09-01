import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computePerformanceAnalytics, evaluateTrade } from '@/lib/behavioral/engine'
import { getDateRange } from '@/lib/utils'
import type { Trade, BehavioralLog, TradeEvaluationRequest } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body: TradeEvaluationRequest = await request.json()

    // Fetch user settings — fallback to defaults if not set
    const { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    const maxRisk = settings?.max_risk_per_trade_pct ?? 1.2
    const maxDailyLoss = settings?.max_daily_loss_pct ?? 3.0
    const preferredSessions = settings?.preferred_sessions ?? ['london', 'overlap']

    // Fetch historical trades for context
    const { start, end } = getDateRange('3M')
    const { data: trades } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'closed')
      .gte('opened_at', start)
      .order('opened_at', { ascending: true })

    const { data: logs } = await supabase
      .from('behavioral_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('logged_at', start)

    const analytics = computePerformanceAnalytics(
      (trades ?? []) as Trade[],
      (logs ?? []) as BehavioralLog[],
      start,
      end,
      { max_risk_per_trade_pct: maxRisk, max_daily_loss_pct: maxDailyLoss }
    )

    const result = evaluateTrade(body, analytics, {
      max_risk_per_trade_pct: maxRisk,
      preferred_sessions: preferredSessions,
    })

    return NextResponse.json({ data: result })
  } catch (err: unknown) {
    console.error('Trade evaluation API error:', err)
    return NextResponse.json({ error: 'Evaluation failed' }, { status: 500 })
  }
}

