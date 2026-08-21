import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computePerformanceAnalytics, evaluateTrade } from '@/lib/behavioral/engine'
import { getDateRange } from '@/lib/utils'
import type { Trade, BehavioralLog, TradeEvaluationRequest } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: TradeEvaluationRequest = await request.json()

  // Fetch user settings
  const { data: settings } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!settings) return NextResponse.json({ error: 'User settings not found' }, { status: 404 })

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
    end
  )

  const result = evaluateTrade(body, analytics, {
    max_risk_per_trade_pct: settings.max_risk_per_trade_pct,
    preferred_sessions: settings.preferred_sessions,
  })

  return NextResponse.json({ data: result })
}
