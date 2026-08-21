// ============================================================
// TRADERMIND — CORE TYPE DEFINITIONS
// ============================================================

// ── USER ────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  timezone: string
  plan: 'free' | 'pro'
  broker_connected: boolean
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface UserSettings {
  id: string
  user_id: string
  max_daily_loss_pct: number
  max_risk_per_trade_pct: number
  preferred_sessions: TradingSession[]
  trading_rules: TradingRule[]
  weekly_target_pct: number
  notifications_enabled: boolean
  theme: 'dark' | 'light'
  default_currency: string
}

// ── BROKER ───────────────────────────────────────────────────
export type BrokerPlatform =
  | 'mt4'
  | 'mt5'
  | 'binance'
  | 'bybit'
  | 'ctrader'
  | 'tradingview'
  | 'dxtrade'

export interface BrokerConnection {
  id: string
  user_id: string
  platform: BrokerPlatform
  account_id: string
  account_name: string
  server?: string
  is_active: boolean
  last_sync_at?: string
  balance: number
  equity: number
  currency: string
  created_at: string
}

// ── TRADES ───────────────────────────────────────────────────
export type TradeDirection = 'long' | 'short'
export type TradeStatus = 'open' | 'closed' | 'pending'
export type TradingSession = 'asian' | 'london' | 'new_york' | 'overlap'

export interface Trade {
  id: string
  user_id: string
  broker_connection_id: string
  external_trade_id?: string

  // Instrument
  symbol: string
  instrument_type: 'forex' | 'crypto' | 'commodities' | 'indices' | 'stocks'

  // Execution
  direction: TradeDirection
  status: TradeStatus
  entry_price: number
  exit_price?: number
  stop_loss?: number
  take_profit?: number
  lot_size: number
  position_size_usd: number

  // Risk Metrics
  risk_pct: number
  reward_risk_ratio?: number
  pip_value?: number

  // Timing
  session: TradingSession
  opened_at: string
  closed_at?: string
  duration_minutes?: number

  // Performance
  gross_pnl?: number
  net_pnl?: number
  commission?: number
  swap?: number
  pips?: number

  // Strategy
  strategy_name?: string
  setup_type?: string
  timeframe?: string

  // Behavioral scores (computed)
  alignment_score?: number
  discipline_score?: number
  risk_warning_level?: 'low' | 'medium' | 'high' | 'critical'

  created_at: string
  updated_at: string
}

// ── BEHAVIORAL LOG ───────────────────────────────────────────
export type EmotionType =
  | 'calm'
  | 'focused'
  | 'fearful'
  | 'revenge_trading'
  | 'fomo'
  | 'overconfident'
  | 'hesitant'
  | 'stressed'
  | 'neutral'

export interface BehavioralLog {
  id: string
  user_id: string
  trade_id?: string
  log_type: 'pre_trade' | 'post_trade' | 'daily' | 'session'

  // Emotion tracking
  emotion: EmotionType
  confidence_level: number   // 1–10
  fear_level: number         // 1–10
  stress_level: number       // 1–10
  focus_level: number        // 1–10

  // Notes
  setup_notes?: string
  strategy_used?: string
  pre_trade_reasoning?: string
  post_trade_reflection?: string
  lesson_learned?: string

  // Screenshot
  screenshot_url?: string

  logged_at: string
  created_at: string
}

// ── BEHAVIORAL FLAGS ─────────────────────────────────────────
export type BehavioralFlagType =
  | 'revenge_trading'
  | 'overtrading'
  | 'emotional_instability'
  | 'excessive_risk'
  | 'impulse_trading'
  | 'strategy_inconsistency'
  | 'poor_session_timing'
  | 'rule_violation'
  | 'post_win_risk_creep'
  | 'loss_chasing'
  | 'early_exit'
  | 'late_entry'

export interface BehavioralFlag {
  id: string
  user_id: string
  trade_id?: string
  flag_type: BehavioralFlagType
  severity: 'low' | 'medium' | 'high'
  description: string
  detected_at: string
  is_acknowledged: boolean
}

// ── AI REPORTS ───────────────────────────────────────────────
export type ReportPeriod = 'weekly' | 'monthly' | 'quarterly'

export interface AIReport {
  id: string
  user_id: string
  period: ReportPeriod
  period_start: string
  period_end: string

  // Computed analytics (deterministic)
  analytics: PerformanceAnalytics

  // AI-generated narratives
  behavioral_analysis: string
  psychological_patterns: string
  discipline_feedback: string
  risk_analysis: string
  strategy_consistency: string
  improvement_suggestions: string[]
  key_insights: string[]

  // Scores
  overall_discipline_score: number
  behavioral_consistency_score: number
  risk_quality_score: number
  emotional_stability_score: number

  generated_at: string
  created_at: string
}

// ── PERFORMANCE ANALYTICS (Deterministic) ────────────────────
export interface PerformanceAnalytics {
  period_start: string
  period_end: string
  total_trades: number
  winning_trades: number
  losing_trades: number
  win_rate: number

  // PnL
  gross_pnl: number
  net_pnl: number
  profit_factor: number
  expected_value: number

  // Risk
  avg_risk_per_trade: number
  max_risk_per_trade: number
  avg_reward_risk: number
  max_drawdown: number
  max_drawdown_pct: number

  // Streaks
  current_win_streak: number
  current_loss_streak: number
  max_win_streak: number
  max_loss_streak: number

  // Session breakdown
  session_performance: Record<TradingSession, SessionStats>

  // Instrument breakdown
  instrument_performance: InstrumentStats[]

  // Strategy breakdown
  strategy_performance: StrategyStats[]

  // Temporal
  best_day_of_week: string
  worst_day_of_week: string
  best_hour: number
  worst_hour: number

  // Behavioral counts
  behavioral_flags: Record<BehavioralFlagType, number>
  emotion_distribution: Record<EmotionType, number>

  // Computed scores
  discipline_score: number
  behavioral_consistency_score: number
  risk_quality_score: number
  emotional_stability_score: number
}

export interface SessionStats {
  session: TradingSession
  total_trades: number
  win_rate: number
  avg_pnl: number
  total_pnl: number
  avg_rr: number
}

export interface InstrumentStats {
  symbol: string
  total_trades: number
  win_rate: number
  total_pnl: number
  avg_rr: number
  avg_risk_pct: number
}

export interface StrategyStats {
  strategy_name: string
  total_trades: number
  win_rate: number
  total_pnl: number
  avg_rr: number
  best_session: TradingSession
}

// ── TRADE EVALUATION (Real-time) ─────────────────────────────
export interface TradeEvaluationRequest {
  user_id: string
  symbol: string
  direction: TradeDirection
  risk_pct: number
  strategy_name?: string
  session: TradingSession
  emotion?: EmotionType
  setup_notes?: string
}

export interface TradeEvaluationResult {
  alignment_score: number
  discipline_score: number
  risk_warning_level: 'low' | 'medium' | 'high' | 'critical'
  behavioral_consistency_score: number
  session_fit: 'excellent' | 'good' | 'poor' | 'avoid'

  warnings: EvaluationWarning[]
  strengths: string[]
  verdict: string  // e.g. "This trade aligns with your historically profitable behavior"
}

export interface EvaluationWarning {
  type: string
  severity: 'info' | 'warning' | 'critical'
  message: string
}

// ── GOALS & RULES ─────────────────────────────────────────────
export interface TradingRule {
  id: string
  user_id: string
  name: string
  description: string
  rule_type: 'risk' | 'session' | 'emotional' | 'strategy' | 'frequency'
  is_active: boolean
  violation_count: number
  created_at: string
}

export interface DailyGoal {
  id: string
  user_id: string
  date: string
  max_trades: number
  max_daily_loss_usd: number
  target_pnl_usd: number
  is_trading_day: boolean
  trades_taken: number
  current_pnl: number
  goal_status: 'on_track' | 'at_risk' | 'breached' | 'achieved'
}

// ── SCREENSHOTS ───────────────────────────────────────────────
export interface TradeScreenshot {
  id: string
  user_id: string
  trade_id?: string
  url: string
  thumbnail_url: string
  label?: string
  notes?: string
  timeframe?: string
  trade_type?: 'entry' | 'exit' | 'setup' | 'review'
  created_at: string
}

// ── COACHING INSIGHTS ─────────────────────────────────────────
export interface CoachingInsight {
  id: string
  user_id: string
  insight_type: 'pattern' | 'warning' | 'achievement' | 'suggestion'
  title: string
  body: string
  is_read: boolean
  priority: number
  generated_at: string
}

// ── DASHBOARD STATE ───────────────────────────────────────────
export interface DashboardData {
  user: User
  analytics: PerformanceAnalytics
  recent_trades: Trade[]
  behavioral_flags: BehavioralFlag[]
  latest_ai_report?: AIReport
  broker_connections: BrokerConnection[]
  coaching_insights: CoachingInsight[]
  live_evaluation?: TradeEvaluationResult
}

// ── API RESPONSES ─────────────────────────────────────────────
export interface APIResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

export type DateRange = {
  start: string
  end: string
  label: '1W' | '1M' | '3M' | 'YTD' | 'ALL'
}
