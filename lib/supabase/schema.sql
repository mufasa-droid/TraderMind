-- ============================================================
-- TRADERMIND — COMPLETE DATABASE SCHEMA
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for text search

-- ── USERS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  broker_connected BOOLEAN NOT NULL DEFAULT FALSE,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── USER SETTINGS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  max_daily_loss_pct DECIMAL(5,2) NOT NULL DEFAULT 3.0,
  max_risk_per_trade_pct DECIMAL(5,2) NOT NULL DEFAULT 2.0,
  preferred_sessions TEXT[] NOT NULL DEFAULT ARRAY['london','new_york'],
  weekly_target_pct DECIMAL(5,2) NOT NULL DEFAULT 5.0,
  notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
  default_currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── TRADING RULES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trading_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('risk', 'session', 'emotional', 'strategy', 'frequency')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  violation_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── BROKER CONNECTIONS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS broker_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('mt4','mt5','binance','bybit','ctrader','tradingview','dxtrade')),
  account_id TEXT NOT NULL,
  account_name TEXT NOT NULL DEFAULT '',
  server TEXT,
  api_key_encrypted TEXT,
  api_secret_encrypted TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,
  balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  equity DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, platform, account_id)
);

-- ── TRADES ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  broker_connection_id UUID REFERENCES broker_connections(id) ON DELETE SET NULL,
  external_trade_id TEXT,

  -- Instrument
  symbol TEXT NOT NULL,
  instrument_type TEXT NOT NULL DEFAULT 'forex'
    CHECK (instrument_type IN ('forex','crypto','commodities','indices','stocks')),

  -- Execution
  direction TEXT NOT NULL CHECK (direction IN ('long','short')),
  status TEXT NOT NULL DEFAULT 'closed' CHECK (status IN ('open','closed','pending')),
  entry_price DECIMAL(20,8) NOT NULL,
  exit_price DECIMAL(20,8),
  stop_loss DECIMAL(20,8),
  take_profit DECIMAL(20,8),
  lot_size DECIMAL(10,4) NOT NULL DEFAULT 0.01,
  position_size_usd DECIMAL(15,2),

  -- Risk
  risk_pct DECIMAL(6,3),
  reward_risk_ratio DECIMAL(8,3),
  pip_value DECIMAL(10,4),

  -- Timing
  session TEXT CHECK (session IN ('asian','london','new_york','overlap')),
  opened_at TIMESTAMPTZ NOT NULL,
  closed_at TIMESTAMPTZ,
  duration_minutes INTEGER,

  -- Performance
  gross_pnl DECIMAL(12,2),
  net_pnl DECIMAL(12,2),
  commission DECIMAL(10,4) DEFAULT 0,
  swap DECIMAL(10,4) DEFAULT 0,
  pips DECIMAL(10,2),

  -- Strategy
  strategy_name TEXT,
  setup_type TEXT,
  timeframe TEXT,

  -- Behavioral scores (computed by engine)
  alignment_score INTEGER CHECK (alignment_score BETWEEN 0 AND 100),
  discipline_score INTEGER CHECK (discipline_score BETWEEN 0 AND 100),
  risk_warning_level TEXT CHECK (risk_warning_level IN ('low','medium','high','critical')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast analytics queries
CREATE INDEX IF NOT EXISTS idx_trades_user_opened ON trades(user_id, opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_user_status ON trades(user_id, status);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(user_id, symbol);
CREATE INDEX IF NOT EXISTS idx_trades_session ON trades(user_id, session);

-- ── BEHAVIORAL LOGS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS behavioral_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trade_id UUID REFERENCES trades(id) ON DELETE SET NULL,
  log_type TEXT NOT NULL CHECK (log_type IN ('pre_trade','post_trade','daily','session')),

  -- Emotion
  emotion TEXT NOT NULL DEFAULT 'neutral'
    CHECK (emotion IN ('calm','focused','fearful','revenge_trading','fomo','overconfident','hesitant','stressed','neutral')),
  confidence_level INTEGER NOT NULL DEFAULT 5 CHECK (confidence_level BETWEEN 1 AND 10),
  fear_level INTEGER NOT NULL DEFAULT 5 CHECK (fear_level BETWEEN 1 AND 10),
  stress_level INTEGER NOT NULL DEFAULT 5 CHECK (stress_level BETWEEN 1 AND 10),
  focus_level INTEGER NOT NULL DEFAULT 5 CHECK (focus_level BETWEEN 1 AND 10),

  -- Notes
  setup_notes TEXT,
  strategy_used TEXT,
  pre_trade_reasoning TEXT,
  post_trade_reflection TEXT,
  lesson_learned TEXT,
  screenshot_url TEXT,

  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_behavioral_logs_user ON behavioral_logs(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_behavioral_logs_trade ON behavioral_logs(trade_id);

-- ── BEHAVIORAL FLAGS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS behavioral_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trade_id UUID REFERENCES trades(id) ON DELETE SET NULL,
  flag_type TEXT NOT NULL CHECK (flag_type IN (
    'revenge_trading','overtrading','emotional_instability','excessive_risk',
    'impulse_trading','strategy_inconsistency','poor_session_timing',
    'rule_violation','post_win_risk_creep','loss_chasing','early_exit','late_entry'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high')),
  description TEXT NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_acknowledged BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_behavioral_flags_user ON behavioral_flags(user_id, detected_at DESC);

-- ── AI REPORTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('weekly','monthly','quarterly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Raw analytics snapshot (JSONB for flexibility)
  analytics JSONB NOT NULL DEFAULT '{}',

  -- AI narratives
  behavioral_analysis TEXT,
  psychological_patterns TEXT,
  discipline_feedback TEXT,
  risk_analysis TEXT,
  strategy_consistency TEXT,
  improvement_suggestions JSONB DEFAULT '[]',
  key_insights JSONB DEFAULT '[]',

  -- Scores
  overall_discipline_score INTEGER CHECK (overall_discipline_score BETWEEN 0 AND 100),
  behavioral_consistency_score INTEGER CHECK (behavioral_consistency_score BETWEEN 0 AND 100),
  risk_quality_score INTEGER CHECK (risk_quality_score BETWEEN 0 AND 100),
  emotional_stability_score INTEGER CHECK (emotional_stability_score BETWEEN 0 AND 100),

  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, period, period_start)
);

CREATE INDEX IF NOT EXISTS idx_ai_reports_user ON ai_reports(user_id, period_start DESC);

-- ── TRADE SCREENSHOTS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trade_screenshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trade_id UUID REFERENCES trades(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  label TEXT,
  notes TEXT,
  timeframe TEXT,
  trade_type TEXT CHECK (trade_type IN ('entry','exit','setup','review')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_screenshots_user ON trade_screenshots(user_id, created_at DESC);

-- ── COACHING INSIGHTS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coaching_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('pattern','warning','achievement','suggestion')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  priority INTEGER NOT NULL DEFAULT 5,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insights_user ON coaching_insights(user_id, generated_at DESC);

-- ── DAILY GOALS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  max_trades INTEGER NOT NULL DEFAULT 5,
  max_daily_loss_usd DECIMAL(12,2) NOT NULL DEFAULT 200,
  target_pnl_usd DECIMAL(12,2) NOT NULL DEFAULT 100,
  is_trading_day BOOLEAN NOT NULL DEFAULT TRUE,
  trades_taken INTEGER NOT NULL DEFAULT 0,
  current_pnl DECIMAL(12,2) NOT NULL DEFAULT 0,
  goal_status TEXT NOT NULL DEFAULT 'on_track'
    CHECK (goal_status IN ('on_track','at_risk','breached','achieved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_screenshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_goals ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users own data" ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users own settings" ON user_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own rules" ON trading_rules FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own broker connections" ON broker_connections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own trades" ON trades FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own behavioral logs" ON behavioral_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own behavioral flags" ON behavioral_flags FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own ai reports" ON ai_reports FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own screenshots" ON trade_screenshots FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own insights" ON coaching_insights FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own daily goals" ON daily_goals FOR ALL USING (auth.uid() = user_id);

-- ── FUNCTIONS ─────────────────────────────────────────────────

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_broker_connections_updated_at BEFORE UPDATE ON broker_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create user settings + default rules on new user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_settings (user_id) VALUES (NEW.id);
  -- Default trading rules
  INSERT INTO trading_rules (user_id, name, description, rule_type) VALUES
    (NEW.id, 'Max 2% risk per trade', 'Never risk more than 2% of account on a single trade', 'risk'),
    (NEW.id, 'No trading during news', 'Avoid trading 30 minutes before/after major news events', 'session'),
    (NEW.id, 'No revenge trading', 'Do not enter a trade immediately after a loss out of emotion', 'emotional'),
    (NEW.id, 'Max 5 trades per day', 'Limit daily trades to maintain quality over quantity', 'frequency'),
    (NEW.id, 'Respect daily loss limit', 'Stop trading when daily loss exceeds the max daily loss setting', 'risk');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── VIEWS ─────────────────────────────────────────────────────

-- Quick win/loss summary per user per period
CREATE OR REPLACE VIEW trade_summary AS
SELECT
  user_id,
  DATE_TRUNC('month', opened_at) AS month,
  COUNT(*) AS total_trades,
  COUNT(*) FILTER (WHERE net_pnl > 0) AS winning_trades,
  COUNT(*) FILTER (WHERE net_pnl < 0) AS losing_trades,
  ROUND(AVG(risk_pct)::numeric, 3) AS avg_risk_pct,
  ROUND(SUM(net_pnl)::numeric, 2) AS total_net_pnl,
  ROUND(AVG(reward_risk_ratio)::numeric, 2) AS avg_rr
FROM trades
WHERE status = 'closed'
GROUP BY user_id, DATE_TRUNC('month', opened_at);
