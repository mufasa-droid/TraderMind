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

  const reply = await chatWithCoach(message, analytics, history ?? [])

  return NextResponse.json({ reply })
}
