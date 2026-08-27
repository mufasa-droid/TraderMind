import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computePerformanceAnalytics } from '@/lib/behavioral/engine'
import { generateAIReport, generateProactiveInsights } from '@/lib/ai/coach'
import { getDateRange } from '@/lib/utils'
import type { Trade, BehavioralLog } from '@/types'

// GET /api/ai/report — fetch or generate an AI report
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const period = (searchParams.get('period') ?? 'monthly') as 'weekly' | 'monthly'

  // Check if a recent report exists (within 24h for weekly, 3 days for monthly)
  const freshness = period === 'weekly' ? 1 : 3
  const cutoff = new Date(Date.now() - freshness * 24 * 60 * 60 * 1000).toISOString()

  const { data: existingReport } = await supabase
    .from('ai_reports')
    .select('*')
    .eq('user_id', user.id)
    .eq('period', period)
    .gte('generated_at', cutoff)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingReport) {
    return NextResponse.json({ data: existingReport, cached: true })
  }

  // Generate fresh report
  return NextResponse.json({ message: 'No recent report. POST to generate.' }, { status: 404 })
}

// POST /api/ai/report — trigger report generation
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const period = (body.period ?? 'monthly') as 'weekly' | 'monthly'
  const rangeLabel = period === 'weekly' ? '1W' : '1M'
  const { start, end } = getDateRange(rangeLabel)

  // Fetch trades in period
  const { data: trades, error: tradesErr } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'closed')
    .gte('opened_at', start)
    .lte('opened_at', end)
    .order('opened_at', { ascending: true })

  if (tradesErr) return NextResponse.json({ error: tradesErr.message }, { status: 500 })
  if (!trades?.length) {
    return NextResponse.json({ error: 'No closed trades in this period to analyze.' }, { status: 400 })
  }

  // Fetch behavioral logs
  const { data: logs } = await supabase
    .from('behavioral_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('logged_at', start)
    .lte('logged_at', end)

  // Fetch user profile for name and settings
  const [{ data: profile }, { data: settings }] = await Promise.all([
    supabase.from('users').select('full_name').eq('id', user.id).maybeSingle(),
    supabase.from('user_settings').select('max_risk_per_trade_pct, max_daily_loss_pct').eq('user_id', user.id).maybeSingle(),
  ])

  // 1. Compute deterministic analytics (with real risk settings)
  const analytics = computePerformanceAnalytics(
    trades as Trade[],
    (logs ?? []) as BehavioralLog[],
    start,
    end,
    settings ?? undefined
  )

  // 2. Generate AI narratives
  const aiReport = await generateAIReport(
    analytics,
    period,
    profile?.full_name ?? 'Trader'
  )

  // 3. Save to DB
  const { data: savedReport, error: saveErr } = await supabase
    .from('ai_reports')
    .insert({
      user_id: user.id,
      period_start: start.split('T')[0],
      period_end: end.split('T')[0],
      analytics,
      ...aiReport,
    })
    .select()
    .single()

  if (saveErr) return NextResponse.json({ error: saveErr.message }, { status: 500 })

  // 4. Generate proactive coaching insights
  const currentStreak = analytics.current_win_streak > 0
    ? { type: 'win' as const, count: analytics.current_win_streak }
    : { type: 'loss' as const, count: analytics.current_loss_streak }

  const insights = await generateProactiveInsights(analytics, trades.length, currentStreak)

  if (insights.length > 0) {
    await supabase.from('coaching_insights').insert(
      insights.map(i => ({ ...i, user_id: user.id }))
    )
  }

  return NextResponse.json({ data: savedReport }, { status: 201 })
}
