// ============================================================
// TRADERMIND — BEHAVIORAL ANALYTICS ENGINE
// Pure deterministic logic — no AI/LLM here.
// Calculates all scores, flags, and patterns from raw trade data.
// ============================================================

import type {
  Trade,
  BehavioralLog,
  PerformanceAnalytics,
  SessionStats,
  InstrumentStats,
  StrategyStats,
  BehavioralFlagType,
  EmotionType,
  TradingSession,
  TradeEvaluationRequest,
  TradeEvaluationResult,
  EvaluationWarning,
  BehavioralFlag,
} from '@/types'

// ── PERFORMANCE ANALYTICS ────────────────────────────────────
export function computePerformanceAnalytics(
  trades: Trade[],
  logs: BehavioralLog[],
  periodStart: string,
  periodEnd: string
): PerformanceAnalytics {
  const closed = trades.filter(t => t.status === 'closed' && t.net_pnl !== null)

  const winningTrades = closed.filter(t => (t.net_pnl ?? 0) > 0)
  const losingTrades = closed.filter(t => (t.net_pnl ?? 0) < 0)

  const grossPnl = closed.reduce((s, t) => s + (t.gross_pnl ?? 0), 0)
  const netPnl = closed.reduce((s, t) => s + (t.net_pnl ?? 0), 0)
  const winPnl = winningTrades.reduce((s, t) => s + (t.net_pnl ?? 0), 0)
  const lossPnl = Math.abs(losingTrades.reduce((s, t) => s + (t.net_pnl ?? 0), 0))

  const profitFactor = lossPnl > 0 ? winPnl / lossPnl : winPnl > 0 ? Infinity : 0
  const winRate = closed.length > 0 ? winningTrades.length / closed.length : 0
  const avgRR = closed.filter(t => t.reward_risk_ratio).reduce((s, t, _, arr) =>
    s + (t.reward_risk_ratio ?? 0) / arr.length, 0)

  // Max Drawdown
  const { maxDrawdown, maxDrawdownPct } = computeMaxDrawdown(closed)

  // Streaks
  const streaks = computeStreaks(closed)

  // Session breakdown
  const sessions: TradingSession[] = ['asian', 'london', 'new_york', 'overlap']
  const sessionPerformance: Record<TradingSession, SessionStats> = {} as Record<TradingSession, SessionStats>
  for (const session of sessions) {
    const sessionTrades = closed.filter(t => t.session === session)
    const sessionWins = sessionTrades.filter(t => (t.net_pnl ?? 0) > 0)
    sessionPerformance[session] = {
      session,
      total_trades: sessionTrades.length,
      win_rate: sessionTrades.length > 0 ? sessionWins.length / sessionTrades.length : 0,
      avg_pnl: sessionTrades.length > 0
        ? sessionTrades.reduce((s, t) => s + (t.net_pnl ?? 0), 0) / sessionTrades.length
        : 0,
      total_pnl: sessionTrades.reduce((s, t) => s + (t.net_pnl ?? 0), 0),
      avg_rr: computeAvgRR(sessionTrades),
    }
  }

  // Instrument breakdown
  const instrumentPerformance = computeInstrumentStats(closed)

  // Strategy breakdown
  const strategyPerformance = computeStrategyStats(closed)

  // Temporal analysis
  const { bestDay, worstDay, bestHour, worstHour } = computeTemporalAnalysis(closed)

  // Emotion distribution from logs
  const emotionDistribution = computeEmotionDistribution(logs)

  // Behavioral flag counts
  const behavioralFlags = computeBehavioralFlagCounts(closed, logs)

  // Scores (0–100)
  const disciplineScore = computeDisciplineScore(closed, logs, behavioralFlags)
  const behavioralConsistencyScore = computeConsistencyScore(closed, logs)
  const riskQualityScore = computeRiskQualityScore(closed)
  const emotionalStabilityScore = computeEmotionalStabilityScore(logs, behavioralFlags)

  return {
    period_start: periodStart,
    period_end: periodEnd,
    total_trades: closed.length,
    winning_trades: winningTrades.length,
    losing_trades: losingTrades.length,
    win_rate: Math.round(winRate * 1000) / 10,
    gross_pnl: Math.round(grossPnl * 100) / 100,
    net_pnl: Math.round(netPnl * 100) / 100,
    profit_factor: Math.round(profitFactor * 100) / 100,
    expected_value: closed.length > 0 ? Math.round((netPnl / closed.length) * 100) / 100 : 0,
    avg_risk_per_trade: computeAvgRisk(closed),
    max_risk_per_trade: closed.reduce((m, t) => Math.max(m, t.risk_pct ?? 0), 0),
    avg_reward_risk: Math.round(avgRR * 100) / 100,
    max_drawdown: Math.round(maxDrawdown * 100) / 100,
    max_drawdown_pct: Math.round(maxDrawdownPct * 100) / 100,
    current_win_streak: streaks.currentWinStreak,
    current_loss_streak: streaks.currentLossStreak,
    max_win_streak: streaks.maxWinStreak,
    max_loss_streak: streaks.maxLossStreak,
    session_performance: sessionPerformance,
    instrument_performance: instrumentPerformance,
    strategy_performance: strategyPerformance,
    best_day_of_week: bestDay,
    worst_day_of_week: worstDay,
    best_hour: bestHour,
    worst_hour: worstHour,
    behavioral_flags: behavioralFlags,
    emotion_distribution: emotionDistribution,
    discipline_score: disciplineScore,
    behavioral_consistency_score: behavioralConsistencyScore,
    risk_quality_score: riskQualityScore,
    emotional_stability_score: emotionalStabilityScore,
  }
}

// ── MAX DRAWDOWN ──────────────────────────────────────────────
function computeMaxDrawdown(trades: Trade[]): { maxDrawdown: number; maxDrawdownPct: number } {
  if (!trades.length) return { maxDrawdown: 0, maxDrawdownPct: 0 }
  let peak = 0
  let runningPnl = 0
  let maxDD = 0
  let maxDDPct = 0

  for (const trade of trades) {
    runningPnl += trade.net_pnl ?? 0
    if (runningPnl > peak) peak = runningPnl
    const dd = peak - runningPnl
    const ddPct = peak > 0 ? (dd / peak) * 100 : 0
    if (dd > maxDD) { maxDD = dd; maxDDPct = ddPct }
  }
  return { maxDrawdown: maxDD, maxDrawdownPct: maxDDPct }
}

// ── STREAKS ───────────────────────────────────────────────────
function computeStreaks(trades: Trade[]) {
  let currentWinStreak = 0
  let currentLossStreak = 0
  let maxWinStreak = 0
  let maxLossStreak = 0
  let ws = 0, ls = 0

  for (const t of trades) {
    if ((t.net_pnl ?? 0) > 0) {
      ws++; ls = 0
      if (ws > maxWinStreak) maxWinStreak = ws
    } else {
      ls++; ws = 0
      if (ls > maxLossStreak) maxLossStreak = ls
    }
  }
  // Current streaks: look from end
  for (let i = trades.length - 1; i >= 0; i--) {
    if ((trades[i].net_pnl ?? 0) > 0) { currentWinStreak++; break }
    else currentLossStreak++
    break
  }
  return { currentWinStreak, currentLossStreak, maxWinStreak, maxLossStreak }
}

// ── INSTRUMENT STATS ──────────────────────────────────────────
function computeInstrumentStats(trades: Trade[]): InstrumentStats[] {
  const map: Record<string, Trade[]> = {}
  for (const t of trades) {
    if (!map[t.symbol]) map[t.symbol] = []
    map[t.symbol].push(t)
  }
  return Object.entries(map).map(([symbol, ts]) => ({
    symbol,
    total_trades: ts.length,
    win_rate: Math.round((ts.filter(t => (t.net_pnl ?? 0) > 0).length / ts.length) * 1000) / 10,
    total_pnl: Math.round(ts.reduce((s, t) => s + (t.net_pnl ?? 0), 0) * 100) / 100,
    avg_rr: computeAvgRR(ts),
    avg_risk_pct: computeAvgRisk(ts),
  })).sort((a, b) => b.total_pnl - a.total_pnl)
}

// ── STRATEGY STATS ────────────────────────────────────────────
function computeStrategyStats(trades: Trade[]): StrategyStats[] {
  const map: Record<string, Trade[]> = {}
  for (const t of trades) {
    const key = t.strategy_name ?? 'Untagged'
    if (!map[key]) map[key] = []
    map[key].push(t)
  }
  return Object.entries(map).map(([strategy_name, ts]) => {
    const sessionCounts: Record<string, number> = {}
    for (const t of ts.filter(t => (t.net_pnl ?? 0) > 0)) {
      sessionCounts[t.session ?? 'unknown'] = (sessionCounts[t.session ?? 'unknown'] ?? 0) + 1
    }
    const bestSession = Object.entries(sessionCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] as TradingSession ?? 'london'
    return {
      strategy_name,
      total_trades: ts.length,
      win_rate: Math.round((ts.filter(t => (t.net_pnl ?? 0) > 0).length / ts.length) * 1000) / 10,
      total_pnl: Math.round(ts.reduce((s, t) => s + (t.net_pnl ?? 0), 0) * 100) / 100,
      avg_rr: computeAvgRR(ts),
      best_session: bestSession,
    }
  }).sort((a, b) => b.win_rate - a.win_rate)
}

// ── TEMPORAL ANALYSIS ─────────────────────────────────────────
function computeTemporalAnalysis(trades: Trade[]) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayPnl: Record<number, number> = {}
  const hourPnl: Record<number, number> = {}

  for (const t of trades) {
    const d = new Date(t.opened_at)
    const day = d.getDay()
    const hour = d.getHours()
    dayPnl[day] = (dayPnl[day] ?? 0) + (t.net_pnl ?? 0)
    hourPnl[hour] = (hourPnl[hour] ?? 0) + (t.net_pnl ?? 0)
  }

  const sortedDays = Object.entries(dayPnl).sort((a, b) => Number(b[1]) - Number(a[1]))
  const sortedHours = Object.entries(hourPnl).sort((a, b) => Number(b[1]) - Number(a[1]))

  return {
    bestDay: days[Number(sortedDays[0]?.[0] ?? 1)],
    worstDay: days[Number(sortedDays[sortedDays.length - 1]?.[0] ?? 5)],
    bestHour: Number(sortedHours[0]?.[0] ?? 9),
    worstHour: Number(sortedHours[sortedHours.length - 1]?.[0] ?? 16),
  }
}

// ── EMOTION DISTRIBUTION ──────────────────────────────────────
function computeEmotionDistribution(logs: BehavioralLog[]): Record<EmotionType, number> {
  const emotions: EmotionType[] = ['calm','focused','fearful','revenge_trading','fomo','overconfident','hesitant','stressed','neutral']
  const dist = {} as Record<EmotionType, number>
  for (const e of emotions) {
    const count = logs.filter(l => l.emotion === e).length
    dist[e] = logs.length > 0 ? Math.round((count / logs.length) * 1000) / 10 : 0
  }
  return dist
}

// ── BEHAVIORAL FLAG COUNTS ────────────────────────────────────
export function detectBehavioralFlags(
  trades: Trade[],
  logs: BehavioralLog[],
  userSettings: { max_risk_per_trade_pct: number; max_daily_loss_pct: number }
): BehavioralFlag[] {
  const flags: BehavioralFlag[] = []
  const now = new Date().toISOString()

  // 1. Revenge trading detection: loss followed by immediate trade <5min
  for (let i = 1; i < trades.length; i++) {
    const prev = trades[i - 1]
    const curr = trades[i]
    if ((prev.net_pnl ?? 0) < 0 && curr.opened_at && prev.closed_at) {
      const gap = (new Date(curr.opened_at).getTime() - new Date(prev.closed_at).getTime()) / 1000 / 60
      if (gap < 5) {
        flags.push({
          id: crypto.randomUUID(),
          user_id: curr.user_id,
          trade_id: curr.id,
          flag_type: 'revenge_trading',
          severity: 'high',
          description: `Trade opened ${Math.round(gap)} minutes after a loss — possible revenge trading pattern.`,
          detected_at: now,
          is_acknowledged: false,
        })
      }
    }
  }

  // 2. Post-win risk creep: risk increases after 2+ consecutive wins
  for (let i = 2; i < trades.length; i++) {
    const prev2 = trades[i - 2]
    const prev1 = trades[i - 1]
    const curr = trades[i]
    if ((prev2.net_pnl ?? 0) > 0 && (prev1.net_pnl ?? 0) > 0) {
      const avgPrevRisk = ((prev2.risk_pct ?? 0) + (prev1.risk_pct ?? 0)) / 2
      if ((curr.risk_pct ?? 0) > avgPrevRisk * 1.3) {
        flags.push({
          id: crypto.randomUUID(),
          user_id: curr.user_id,
          trade_id: curr.id,
          flag_type: 'post_win_risk_creep',
          severity: 'medium',
          description: `Risk increased by ${Math.round(((curr.risk_pct ?? 0) / avgPrevRisk - 1) * 100)}% following a win streak — possible overconfidence.`,
          detected_at: now,
          is_acknowledged: false,
        })
      }
    }
  }

  // 3. Excessive risk
  for (const trade of trades) {
    if ((trade.risk_pct ?? 0) > userSettings.max_risk_per_trade_pct * 1.5) {
      flags.push({
        id: crypto.randomUUID(),
        user_id: trade.user_id,
        trade_id: trade.id,
        flag_type: 'excessive_risk',
        severity: 'high',
        description: `Risk of ${trade.risk_pct}% significantly exceeds your maximum rule of ${userSettings.max_risk_per_trade_pct}%.`,
        detected_at: now,
        is_acknowledged: false,
      })
    }
  }

  // 4. Overtrading: more than 8 trades in a single day
  const tradeDays: Record<string, Trade[]> = {}
  for (const t of trades) {
    const day = t.opened_at.split('T')[0]
    if (!tradeDays[day]) tradeDays[day] = []
    tradeDays[day].push(t)
  }
  for (const [, dayTrades] of Object.entries(tradeDays)) {
    if (dayTrades.length > 8) {
      const last = dayTrades[dayTrades.length - 1]
      flags.push({
        id: crypto.randomUUID(),
        user_id: last.user_id,
        trade_id: last.id,
        flag_type: 'overtrading',
        severity: 'medium',
        description: `${dayTrades.length} trades taken in a single day — exceeds healthy trading frequency.`,
        detected_at: now,
        is_acknowledged: false,
      })
    }
  }

  // 5. FOMO entries from logs
  for (const log of logs) {
    if (log.emotion === 'fomo' && log.trade_id) {
      flags.push({
        id: crypto.randomUUID(),
        user_id: log.user_id,
        trade_id: log.trade_id,
        flag_type: 'impulse_trading',
        severity: 'medium',
        description: 'Trade entered with FOMO emotion — may indicate impulse decision-making.',
        detected_at: now,
        is_acknowledged: false,
      })
    }
  }

  return flags
}

function computeBehavioralFlagCounts(
  trades: Trade[],
  logs: BehavioralLog[]
): Record<BehavioralFlagType, number> {
  const flagTypes: BehavioralFlagType[] = [
    'revenge_trading','overtrading','emotional_instability','excessive_risk',
    'impulse_trading','strategy_inconsistency','poor_session_timing',
    'rule_violation','post_win_risk_creep','loss_chasing','early_exit','late_entry'
  ]
  const counts = {} as Record<BehavioralFlagType, number>
  const flags = detectBehavioralFlags(trades, logs, { max_risk_per_trade_pct: 2, max_daily_loss_pct: 3 })
  for (const ft of flagTypes) {
    counts[ft] = flags.filter(f => f.flag_type === ft).length
  }
  return counts
}

// ── SCORING ALGORITHMS ────────────────────────────────────────

export function computeDisciplineScore(
  trades: Trade[],
  logs: BehavioralLog[],
  flagCounts: Record<BehavioralFlagType, number>
): number {
  if (!trades.length) return 50
  let score = 100

  // Penalize behavioral flags
  score -= (flagCounts.revenge_trading ?? 0) * 8
  score -= (flagCounts.overtrading ?? 0) * 5
  score -= (flagCounts.excessive_risk ?? 0) * 7
  score -= (flagCounts.rule_violation ?? 0) * 6
  score -= (flagCounts.post_win_risk_creep ?? 0) * 3

  // Reward consistent risk sizing
  const risks = trades.map(t => t.risk_pct ?? 0).filter(r => r > 0)
  if (risks.length > 1) {
    const avgRisk = risks.reduce((s, r) => s + r, 0) / risks.length
    const variance = risks.reduce((s, r) => s + Math.pow(r - avgRisk, 2), 0) / risks.length
    const stdDev = Math.sqrt(variance)
    if (stdDev < 0.3) score += 5   // Very consistent sizing
    else if (stdDev > 1.0) score -= 10 // Very inconsistent
  }

  // Reward journaling
  const journaledTrades = logs.filter(l => l.trade_id).length
  const journalRate = trades.length > 0 ? journaledTrades / trades.length : 0
  score += Math.round(journalRate * 10)

  return Math.max(0, Math.min(100, score))
}

export function computeConsistencyScore(trades: Trade[], logs: BehavioralLog[]): number {
  if (!trades.length) return 50
  let score = 70

  // Strategy consistency
  const strategies = trades.map(t => t.strategy_name).filter(Boolean)
  const uniqueStrategies = new Set(strategies).size
  if (uniqueStrategies === 1) score += 15
  else if (uniqueStrategies <= 3) score += 8
  else score -= 5

  // Session consistency
  const sessions = trades.map(t => t.session).filter(Boolean)
  const uniqueSessions = new Set(sessions).size
  if (uniqueSessions <= 2) score += 10
  else score -= 5

  // Emotional consistency
  const calmFocused = logs.filter(l => l.emotion === 'calm' || l.emotion === 'focused').length
  const emotionalRate = logs.length > 0 ? calmFocused / logs.length : 0.5
  score += Math.round(emotionalRate * 15)

  return Math.max(0, Math.min(100, score))
}

export function computeRiskQualityScore(trades: Trade[]): number {
  if (!trades.length) return 50
  let score = 70

  const avgRisk = computeAvgRisk(trades)
  // Optimal risk: 0.5–1.5%
  if (avgRisk >= 0.5 && avgRisk <= 1.5) score += 20
  else if (avgRisk > 2.5) score -= 20
  else if (avgRisk < 0.3) score -= 5

  const avgRR = computeAvgRR(trades.filter(t => t.status === 'closed'))
  if (avgRR >= 2.0) score += 15
  else if (avgRR >= 1.5) score += 8
  else if (avgRR < 1.0) score -= 15

  return Math.max(0, Math.min(100, score))
}

export function computeEmotionalStabilityScore(
  logs: BehavioralLog[],
  flagCounts: Record<BehavioralFlagType, number>
): number {
  if (!logs.length) return 50
  let score = 70

  const negativeEmotions = logs.filter(l =>
    ['fearful','revenge_trading','fomo','stressed'].includes(l.emotion)
  ).length
  const negativeRate = negativeEmotions / logs.length
  score -= Math.round(negativeRate * 40)

  score -= (flagCounts.emotional_instability ?? 0) * 8
  score -= (flagCounts.revenge_trading ?? 0) * 5

  const avgStress = logs.reduce((s, l) => s + l.stress_level, 0) / logs.length
  if (avgStress < 4) score += 10
  else if (avgStress > 7) score -= 10

  return Math.max(0, Math.min(100, score))
}

// ── REAL-TIME TRADE EVALUATION ────────────────────────────────
export function evaluateTrade(
  request: TradeEvaluationRequest,
  historicalAnalytics: PerformanceAnalytics,
  userSettings: { max_risk_per_trade_pct: number; preferred_sessions: string[] }
): TradeEvaluationResult {
  const warnings: EvaluationWarning[] = []
  const strengths: string[] = []
  let alignmentScore = 70
  let disciplineScore = 80

  // 1. Risk check
  const riskDiff = request.risk_pct - userSettings.max_risk_per_trade_pct
  if (riskDiff > 1.0) {
    warnings.push({
      type: 'excessive_risk',
      severity: 'critical',
      message: `Risk of ${request.risk_pct}% exceeds your max rule of ${userSettings.max_risk_per_trade_pct}% by ${riskDiff.toFixed(1)}%.`,
    })
    alignmentScore -= 25
    disciplineScore -= 20
  } else if (riskDiff > 0) {
    warnings.push({
      type: 'risk_warning',
      severity: 'warning',
      message: `Risk slightly above your optimal threshold of ${userSettings.max_risk_per_trade_pct}%.`,
    })
    alignmentScore -= 10
  } else {
    strengths.push(`Risk sizing within your optimal range.`)
    alignmentScore += 5
  }

  // 2. Session check
  const sessionStats = historicalAnalytics.session_performance[request.session]
  if (sessionStats && sessionStats.total_trades >= 5) {
    if (sessionStats.win_rate >= 60) {
      strengths.push(`${capitalize(request.session)} session has your best win rate (${sessionStats.win_rate.toFixed(0)}%).`)
      alignmentScore += 10
    } else if (sessionStats.win_rate < 45) {
      warnings.push({
        type: 'poor_session',
        severity: 'warning',
        message: `Your win rate in ${capitalize(request.session)} session is only ${sessionStats.win_rate.toFixed(0)}% historically.`,
      })
      alignmentScore -= 10
    }
  }

  // 3. Emotion check
  if (request.emotion) {
    if (['revenge_trading', 'fearful', 'stressed'].includes(request.emotion)) {
      warnings.push({
        type: 'emotional_state',
        severity: 'critical',
        message: `Current emotional state (${formatEmotion(request.emotion)}) is associated with poor decision quality. Consider waiting.`,
      })
      alignmentScore -= 20
      disciplineScore -= 15
    } else if (request.emotion === 'fomo') {
      warnings.push({
        type: 'fomo',
        severity: 'warning',
        message: 'FOMO-driven entries historically underperform your average. Verify setup quality.',
      })
      alignmentScore -= 10
    } else if (['calm', 'focused'].includes(request.emotion)) {
      strengths.push('Optimal emotional state — calm and focused entries are your best performers.')
      alignmentScore += 8
    }
  }

  // 4. Strategy alignment
  if (request.strategy_name) {
    const stratStats = historicalAnalytics.strategy_performance.find(s =>
      s.strategy_name === request.strategy_name
    )
    if (stratStats) {
      if (stratStats.win_rate >= 60) {
        strengths.push(`${request.strategy_name} strategy has a ${stratStats.win_rate.toFixed(0)}% historical win rate.`)
        alignmentScore += 8
      } else if (stratStats.win_rate < 45) {
        warnings.push({
          type: 'strategy_performance',
          severity: 'warning',
          message: `Your ${request.strategy_name} strategy has underperformed recently (${stratStats.win_rate.toFixed(0)}% win rate).`,
        })
        alignmentScore -= 8
      }
    }
  }

  // 5. Post-win risk creep check
  if (historicalAnalytics.current_win_streak >= 3 && request.risk_pct > userSettings.max_risk_per_trade_pct) {
    warnings.push({
      type: 'post_win_risk_creep',
      severity: 'warning',
      message: `You are on a ${historicalAnalytics.current_win_streak}-trade win streak. Historical data shows risk tends to creep up in this pattern.`,
    })
    alignmentScore -= 5
  }

  const finalAlignment = Math.max(0, Math.min(100, alignmentScore))
  const finalDiscipline = Math.max(0, Math.min(100, disciplineScore))

  const riskWarningLevel =
    request.risk_pct > userSettings.max_risk_per_trade_pct * 2 ? 'critical' :
    request.risk_pct > userSettings.max_risk_per_trade_pct * 1.5 ? 'high' :
    request.risk_pct > userSettings.max_risk_per_trade_pct ? 'medium' : 'low'

  const sessionFit =
    (historicalAnalytics.session_performance[request.session]?.win_rate ?? 50) >= 65 ? 'excellent' :
    (historicalAnalytics.session_performance[request.session]?.win_rate ?? 50) >= 55 ? 'good' :
    (historicalAnalytics.session_performance[request.session]?.win_rate ?? 50) >= 45 ? 'poor' : 'avoid'

  const verdict = generateVerdict(finalAlignment, warnings.length, strengths.length)

  return {
    alignment_score: finalAlignment,
    discipline_score: finalDiscipline,
    risk_warning_level: riskWarningLevel,
    behavioral_consistency_score: Math.max(0, Math.min(100, 75 - warnings.length * 8 + strengths.length * 6)),
    session_fit: sessionFit,
    warnings,
    strengths,
    verdict,
  }
}

function generateVerdict(alignment: number, warningCount: number, strengthCount: number): string {
  if (alignment >= 80 && warningCount === 0) return 'This trade aligns strongly with your historically profitable behavior.'
  if (alignment >= 65 && warningCount <= 1) return 'This trade is reasonably aligned with your historical patterns. Minor concerns noted.'
  if (alignment < 50) return 'This trade does not align with your historically profitable behavior. Review warnings before proceeding.'
  return 'This trade shows moderate alignment. Address the flagged concerns before entry.'
}

// ── HELPERS ───────────────────────────────────────────────────
function computeAvgRisk(trades: Trade[]): number {
  const risks = trades.map(t => t.risk_pct ?? 0).filter(r => r > 0)
  if (!risks.length) return 0
  return Math.round((risks.reduce((s, r) => s + r, 0) / risks.length) * 100) / 100
}

function computeAvgRR(trades: Trade[]): number {
  const rrs = trades.map(t => t.reward_risk_ratio ?? 0).filter(r => r > 0)
  if (!rrs.length) return 0
  return Math.round((rrs.reduce((s, r) => s + r, 0) / rrs.length) * 100) / 100
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')
}

function formatEmotion(e: string) {
  return e.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
