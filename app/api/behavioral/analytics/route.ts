import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computePerformanceAnalytics } from '@/lib/behavioral/engine'
import { getDateRange } from '@/lib/utils'
import type { Trade, BehavioralLog } from '@/types'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const rangeLabel = (searchParams.get('range') ?? '1M') as '1W' | '1M' | '3M' | 'YTD' | 'ALL'
  const { start, end } = getDateRange(rangeLabel)

  // Parallel fetch for speed
  const [tradesRes, logsRes, flagsRes, insightsRes, brokerRes, latestReportRes] = await Promise.all([
    supabase.from('trades').select('*').eq('user_id', user.id).eq('status', 'closed')
      .gte('opened_at', start).order('opened_at', { ascending: true }),
    supabase.from('behavioral_logs').select('*').eq('user_id', user.id).gte('logged_at', start),
    supabase.from('behavioral_flags').select('*').eq('user_id', user.id)
      .eq('is_acknowledged', false).order('detected_at', { ascending: false }).limit(20),
    supabase.from('coaching_insights').select('*').eq('user_id', user.id)
      .eq('is_read', false).order('priority', { ascending: false }).limit(5),
    supabase.from('broker_connections').select('*').eq('user_id', user.id).eq('is_active', true),
    supabase.from('ai_reports').select('*').eq('user_id', user.id)
      .order('generated_at', { ascending: false }).limit(1).single(),
  ])

  const trades = (tradesRes.data ?? []) as Trade[]
  const logs = (logsRes.data ?? []) as BehavioralLog[]

  // Compute analytics deterministically
  const analytics = computePerformanceAnalytics(trades, logs, start, end)

  // Recent trades for table
  const recentTrades = trades.slice(-10).reverse()

  // Equity curve — cumulative PnL by day
  const equityCurve = buildEquityCurve(trades)

  return NextResponse.json({
    analytics,
    recent_trades: recentTrades,
    behavioral_flags: flagsRes.data ?? [],
    coaching_insights: insightsRes.data ?? [],
    broker_connections: brokerRes.data ?? [],
    latest_ai_report: latestReportRes.data ?? null,
    equity_curve: equityCurve,
    range: { start, end, label: rangeLabel },
  })
}

function buildEquityCurve(trades: Trade[]) {
  const byDay: Record<string, number> = {}
  let cumulative = 0
  for (const trade of trades) {
    const day = trade.opened_at.split('T')[0]
    byDay[day] = (byDay[day] ?? 0) + (trade.net_pnl ?? 0)
  }
  return Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, pnl]) => {
      cumulative += pnl
      return { date, daily_pnl: Math.round(pnl * 100) / 100, cumulative: Math.round(cumulative * 100) / 100 }
    })
}
