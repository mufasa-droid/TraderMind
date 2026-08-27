import OpenAI from 'openai'
import type { PerformanceAnalytics, AIReport, CoachingInsight } from '@/types'

// ── DO NOT instantiate OpenAI at module level ──
// It runs at build time and fails without the env var.
// Create it inside each function instead.

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

const COACH_SYSTEM_PROMPT = `You are TraderMind AI — an elite trading performance coach and behavioral analyst.

Your role is NOT to predict markets or give trade signals. You analyze trader BEHAVIOR, PSYCHOLOGY, and DECISION QUALITY.

Your communication style:
- Coach-like, analytical, intelligent, concise
- Data-driven and specific — always reference the actual numbers
- Psychologically aware but never emotionally soft
- Direct but constructive — identify problems AND solutions
- Write in second person ("you", "your")
- Avoid financial jargon overload
- Never say "buy" or "sell" or give market direction
- Never say "great job" without specific backing data

Always ground every insight in the analytics data provided.`

export async function generateAIReport(
  analytics: PerformanceAnalytics,
  period: 'weekly' | 'monthly',
  userName: string
): Promise<Omit<AIReport, 'id' | 'user_id' | 'period_start' | 'period_end' | 'analytics' | 'created_at'>> {
  const openai = getOpenAI()
  const prompt = buildReportPrompt(analytics, period, userName)

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.4,
    messages: [
      { role: 'system', content: COACH_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
  })

  const raw = response.choices[0]?.message?.content ?? '{}'
  const parsed = JSON.parse(raw)

  return {
    period,
    behavioral_analysis: parsed.behavioral_analysis ?? '',
    psychological_patterns: parsed.psychological_patterns ?? '',
    discipline_feedback: parsed.discipline_feedback ?? '',
    risk_analysis: parsed.risk_analysis ?? '',
    strategy_consistency: parsed.strategy_consistency ?? '',
    improvement_suggestions: parsed.improvement_suggestions ?? [],
    key_insights: parsed.key_insights ?? [],
    overall_discipline_score: analytics.discipline_score,
    behavioral_consistency_score: analytics.behavioral_consistency_score,
    risk_quality_score: analytics.risk_quality_score,
    emotional_stability_score: analytics.emotional_stability_score,
    generated_at: new Date().toISOString(),
  }
}

function buildReportPrompt(
  analytics: PerformanceAnalytics,
  period: string,
  userName: string
): string {
  const sessionSummary = Object.entries(analytics.session_performance)
    .map(([s, d]) => `${s}: ${d.total_trades} trades, ${d.win_rate.toFixed(1)}% WR, avg PnL $${d.avg_pnl.toFixed(0)}`)
    .join('\n')

  const topInstruments = analytics.instrument_performance.slice(0, 5)
    .map(i => `${i.symbol}: ${i.total_trades} trades, ${i.win_rate}% WR, $${i.total_pnl}`)
    .join('\n')

  const flagSummary = Object.entries(analytics.behavioral_flags)
    .filter(([, count]) => count > 0)
    .map(([flag, count]) => `${flag.replace(/_/g, ' ')}: ×${count}`)
    .join(', ')

  return `
Generate a ${period} performance coaching report for trader ${userName}.

=== PERFORMANCE DATA ===
Period: ${analytics.period_start} to ${analytics.period_end}
Total Trades: ${analytics.total_trades}
Win Rate: ${analytics.win_rate}%
Net PnL: $${analytics.net_pnl}
Profit Factor: ${analytics.profit_factor}
Avg Risk/Trade: ${analytics.avg_risk_per_trade}%
Max Drawdown: ${analytics.max_drawdown_pct}%

=== SESSION PERFORMANCE ===
${sessionSummary}

=== TOP INSTRUMENTS ===
${topInstruments}

=== BEHAVIORAL FLAGS ===
${flagSummary || 'None detected'}

=== SCORES ===
Discipline Score: ${analytics.discipline_score}/100
Behavioral Consistency: ${analytics.behavioral_consistency_score}/100
Risk Quality: ${analytics.risk_quality_score}/100
Emotional Stability: ${analytics.emotional_stability_score}/100

Respond ONLY with a JSON object with these exact keys:
{
  "behavioral_analysis": "2-3 paragraphs analyzing behavioral patterns",
  "psychological_patterns": "1-2 paragraphs on psychological observations",
  "discipline_feedback": "1-2 paragraphs on rule adherence and consistency",
  "risk_analysis": "1-2 paragraphs on risk management quality",
  "strategy_consistency": "1-2 paragraphs on strategy usage",
  "improvement_suggestions": ["5-7 specific actionable suggestions"],
  "key_insights": ["3-5 most important insights referencing specific data"]
}
`
}

export async function chatWithCoach(
  userMessage: string,
  analytics: PerformanceAnalytics,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<string> {
  const openai = getOpenAI()

  const contextPrompt = `
You have access to this trader's current performance data:
- Win Rate: ${analytics.win_rate}%
- Net PnL: $${analytics.net_pnl}
- Discipline Score: ${analytics.discipline_score}/100
- Avg Risk: ${analytics.avg_risk_per_trade}%
- Best session: ${getBestSession(analytics)}
- Key behavioral flags: ${getTopFlags(analytics)}

Answer questions about their trading behavior, performance patterns, and psychology.
Do NOT predict markets. Do NOT give buy/sell signals.
`

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: COACH_SYSTEM_PROMPT + '\n\n' + contextPrompt },
    ...conversationHistory.map(m => ({ role: m.role, content: m.content } as OpenAI.ChatCompletionMessageParam)),
    { role: 'user', content: userMessage },
  ]

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.5,
    max_tokens: 600,
    messages,
  })

  return response.choices[0]?.message?.content ?? 'Unable to generate response.'
}

export async function generateProactiveInsights(
  analytics: PerformanceAnalytics,
  recentTrades: number,
  currentStreak: { type: 'win' | 'loss'; count: number }
): Promise<CoachingInsight[]> {
  const openai = getOpenAI()

  const prompt = `
Given this trader's data, generate 2-3 proactive coaching insights.

Recent context:
- Recent trades this week: ${recentTrades}
- Current streak: ${currentStreak.count} ${currentStreak.type}s
- Discipline score: ${analytics.discipline_score}/100
- Key flags: ${getTopFlags(analytics)}

Respond ONLY with a JSON object with this exact shape (required for json_object mode):
{
  "insights": [
    {
      "insight_type": "pattern|warning|achievement|suggestion",
      "title": "Short title (max 8 words)",
      "body": "Specific coaching insight (2-3 sentences)",
      "priority": 1-10
    }
  ]
}
`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.4,
    messages: [
      { role: 'system', content: COACH_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
  })

  const raw = response.choices[0]?.message?.content ?? '{"insights":[]}'
  let parsed: unknown
  try { parsed = JSON.parse(raw) } catch { parsed = { insights: [] } }
  const insightsArray = Array.isArray(parsed)
    ? parsed
    : (parsed as Record<string, unknown>).insights as unknown[] ?? (parsed as Record<string, unknown>).data as unknown[] ?? []

  return insightsArray.map((insight: Partial<CoachingInsight>) => ({
    id: crypto.randomUUID(),
    user_id: '',
    insight_type: insight.insight_type ?? 'suggestion',
    title: insight.title ?? '',
    body: insight.body ?? '',
    is_read: false,
    priority: insight.priority ?? 5,
    generated_at: new Date().toISOString(),
  }))
}

export async function generateTradeNarrative(
  trade: {
    symbol: string
    direction: string
    pnl: number
    rr: number
    emotion: string
    session: string
    alignmentScore: number
    notes?: string
  },
  analytics: PerformanceAnalytics
): Promise<string> {
  const openai = getOpenAI()
  const outcome = trade.pnl > 0 ? `win of $${trade.pnl}` : `loss of $${Math.abs(trade.pnl)}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.4,
    max_tokens: 200,
    messages: [
      { role: 'system', content: COACH_SYSTEM_PROMPT },
      { role: 'user', content: `Analyze this trade behaviorally: ${trade.symbol} ${trade.direction}, ${outcome}, emotion: ${trade.emotion}, alignment: ${trade.alignmentScore}/100. Write 2-3 sentences on decision quality, not outcome.` },
    ],
  })

  return response.choices[0]?.message?.content ?? ''
}

function getBestSession(analytics: PerformanceAnalytics): string {
  return Object.entries(analytics.session_performance)
    .sort((a, b) => b[1].win_rate - a[1].win_rate)[0]?.[0] ?? 'london'
}

function getTopFlags(analytics: PerformanceAnalytics): string {
  return Object.entries(analytics.behavioral_flags)
    .filter(([, v]) => v > 0)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 3)
    .map(([k, v]) => `${k.replace(/_/g, ' ')} (×${v})`)
    .join(', ') || 'none'
}