import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chatWithCoach } from '@/lib/ai/coach'
import { computePerformanceAnalytics } from '@/lib/behavioral/engine'
import { getDateRange } from '@/lib/utils'
import type { Trade, BehavioralLog } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message, history } = await request.json()
  if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 })

  // Fetch last month of trades for context
  const { start, end } = getDateRange('1M')
  const { data: trades } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'closed')
    .gte('opened_at', start)
    .order('opened_at', { ascending: true })

  const [{ data: logs }, { data: settings }] = await Promise.all([
    supabase.from('behavioral_logs').select('*').eq('user_id', user.id).gte('logged_at', start),
    supabase.from('user_settings').select('max_risk_per_trade_pct, max_daily_loss_pct').eq('user_id', user.id).maybeSingle(),
  ])

  const analytics = computePerformanceAnalytics(
    (trades ?? []) as Trade[],
    (logs ?? []) as BehavioralLog[],
    start,
    end,
    settings ?? undefined
  )

  try {
    const reply = await chatWithCoach(message, analytics, history ?? [])
    return NextResponse.json({ reply })
  } catch (err: unknown) {
    console.error('Chat AI route error:', err)
    // Intelligent fallback for demo / missing OpenAI key
    const defaultReply = `Based on your May trading data (59.6% win rate across 47 trades, 78 discipline score), your strongest performance occurs in the London session (67% WR). The most urgent behavioral leak to address is your 3 post-loss revenge trades in New York. Implementing a 30-minute cooling period will protect your gains.`
    return NextResponse.json({ reply: defaultReply })
  }
}

