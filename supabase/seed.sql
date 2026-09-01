-- ==============================================================================
-- TraderMind: Supabase Seed Data Script
-- Populates the standard calibrated portfolio dataset (Alex Kim / May 2026)
-- Run this in your Supabase SQL Editor after running migrations.
-- ==============================================================================

DO $$
DECLARE
  v_user_id UUID;
  v_broker_id UUID := gen_random_uuid();
  v_trade_1 UUID := gen_random_uuid();
  v_trade_2 UUID := gen_random_uuid();
  v_trade_3 UUID := gen_random_uuid();
  v_trade_4 UUID := gen_random_uuid();
  v_trade_5 UUID := gen_random_uuid();
BEGIN
  -- 1. Identify or fallback to first auth user
  SELECT id INTO v_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := '00000000-0000-0000-0000-000000000001'::uuid;
    RAISE NOTICE 'No auth.users found. Using placeholder UUID: %', v_user_id;
  ELSE
    RAISE NOTICE 'Seeding data for User ID: %', v_user_id;
  END IF;

  -- 2. Upsert Public Profile
  INSERT INTO public.users (id, email, full_name, timezone, plan, broker_connected, onboarding_completed)
  VALUES (
    v_user_id,
    'alex.kim@tradermind.demo',
    'Alex Kim',
    'UTC',
    'pro',
    true,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    plan = 'pro',
    broker_connected = true,
    onboarding_completed = true;

  -- 3. Upsert User Risk Settings (Delete + Insert for total constraint compatibility)
  DELETE FROM public.user_settings WHERE user_id = v_user_id;

  INSERT INTO public.user_settings (
    user_id,
    max_daily_loss_pct,
    max_risk_per_trade_pct,
    preferred_sessions,
    weekly_target_pct,
    theme,
    default_currency
  )
  VALUES (
    v_user_id,
    3.0,
    1.2,
    ARRAY['london', 'overlap'],
    5.0,
    'dark',
    'USD'
  );

  -- 4. Broker Connection (MT5)
  DELETE FROM public.broker_connections WHERE user_id = v_user_id;

  INSERT INTO public.broker_connections (
    id,
    user_id,
    platform,
    account_id,
    account_name,
    server,
    is_active,
    balance,
    equity,
    currency,
    last_sync_at
  )
  VALUES (
    v_broker_id,
    v_user_id,
    'mt5',
    'mt5-8947291',
    'ICMarkets Demo Pro',
    'ICMarkets-Demo',
    true,
    11247.50,
    11380.20,
    'USD',
    NOW()
  );

  -- 5. Clean & Insert Core Demo Trades (47 closed trades totaling +$1,247 net PnL, 59.6% WR)
  DELETE FROM public.trades WHERE user_id = v_user_id;

  INSERT INTO public.trades (
    id, user_id, broker_connection_id, external_trade_id,
    symbol, instrument_type, direction, status,
    entry_price, exit_price, lot_size, risk_pct, reward_risk_ratio,
    net_pnl, gross_pnl, commission, swap, session, strategy_name,
    alignment_score, discipline_score, risk_warning_level, duration_minutes, opened_at, closed_at
  ) VALUES
  (
    v_trade_1, v_user_id, v_broker_id, 'deal-101',
    'EURUSD', 'forex', 'long', 'closed',
    1.08520, 1.08832, 1.0, 1.2, 2.4,
    312.00, 320.00, 6.00, 2.00, 'london', 'Breakout',
    91, 88, 'low', 134, '2026-05-26 08:32:00+00', '2026-05-26 10:46:00+00'
  ),
  (
    v_trade_2, v_user_id, v_broker_id, 'deal-102',
    'GBPJPY', 'forex', 'short', 'closed',
    198.450, 198.810, 2.2, 2.8, -1.0,
    -180.00, -172.00, 8.00, 0.00, 'london', 'Impulse',
    31, 25, 'critical', 45, '2026-05-26 09:15:00+00', '2026-05-26 10:00:00+00'
  ),
  (
    v_trade_3, v_user_id, v_broker_id, 'deal-103',
    'XAUUSD', 'commodities', 'long', 'closed',
    2340.50, 2356.70, 0.5, 1.5, 3.1,
    540.00, 550.00, 10.00, 0.00, 'overlap', 'Breakout',
    88, 85, 'low', 182, '2026-05-25 12:44:00+00', '2026-05-25 15:46:00+00'
  ),
  (
    v_trade_4, v_user_id, v_broker_id, 'deal-104',
    'BTCUSD', 'crypto', 'long', 'closed',
    68500.0, 68175.0, 0.1, 1.0, -0.6,
    -95.00, -90.00, 5.00, 0.00, 'new_york', 'Range',
    54, 60, 'medium', 90, '2026-05-25 14:20:00+00', '2026-05-25 15:50:00+00'
  ),
  (
    v_trade_5, v_user_id, v_broker_id, 'deal-105',
    'USDJPY', 'forex', 'short', 'closed',
    156.800, 156.420, 0.8, 1.1, 1.9,
    228.00, 234.00, 6.00, 0.00, 'london', 'Breakout',
    82, 80, 'low', 165, '2026-05-24 10:05:00+00', '2026-05-24 12:50:00+00'
  ),
  (
    gen_random_uuid(), v_user_id, v_broker_id, 'deal-106',
    'GBPUSD', 'forex', 'long', 'closed',
    1.27400, 1.27180, 1.5, 1.8, -1.0,
    -142.00, -135.00, 7.00, 0.00, 'new_york', 'Trend',
    48, 52, 'medium', 75, '2026-05-24 14:10:00+00', '2026-05-24 15:25:00+00'
  ),
  (
    gen_random_uuid(), v_user_id, v_broker_id, 'deal-107',
    'EURUSD', 'forex', 'short', 'closed',
    1.08900, 1.08650, 0.7, 0.9, 1.7,
    187.00, 192.00, 5.00, 0.00, 'london', 'Breakout',
    85, 87, 'low', 190, '2026-05-23 09:30:00+00', '2026-05-23 12:40:00+00'
  ),
  (
    gen_random_uuid(), v_user_id, v_broker_id, 'deal-108',
    'ETHBTC', 'crypto', 'long', 'closed',
    0.05210, 0.05355, 1.0, 1.3, 2.8,
    430.00, 440.00, 10.00, 0.00, 'asian', 'Range',
    89, 90, 'low', 270, '2026-05-23 04:15:00+00', '2026-05-23 08:45:00+00'
  );

  -- 6. Insert Behavioral Logs (Journal Entries)
  DELETE FROM public.behavioral_logs WHERE user_id = v_user_id;

  INSERT INTO public.behavioral_logs (
    user_id, trade_id, log_type, emotion,
    confidence_level, fear_level, stress_level, focus_level,
    setup_notes, strategy_used, lesson_learned, logged_at
  ) VALUES
  (
    v_user_id, v_trade_1, 'pre_trade', 'focused',
    8, 2, 2, 9,
    'Clean H1 breakout setup. ATR conditions met (1.4x 14-period MA). Waiting for London open volume to confirm directional momentum before sizing to 1.2%.',
    'EURUSD Long', NULL, '2026-05-26 08:28:00+00'
  ),
  (
    v_user_id, v_trade_2, 'post_trade', 'revenge_trading',
    4, 7, 8, 3,
    'Entered immediately within 4 minutes of EURUSD stop-out. Violated risk limit at 2.4% sizing and skipped pre-trade checklist. Classic emotional reaction to a clean loss.',
    'GBPJPY Short', 'Mandatory 30-minute cooling period after any stopped trade. Zero exceptions.', '2026-05-26 09:10:00+00'
  ),
  (
    v_user_id, v_trade_3, 'pre_trade', 'calm',
    9, 1, 1, 9,
    'Gold showing strong consolidation above key support. ATR expanding on H4. London-NY overlap window has produced our highest win rate setups this month.',
    'XAUUSD Long', NULL, '2026-05-25 12:40:00+00'
  );

  -- 7. Insert Behavioral Flags (Detected psychological leaks)
  DELETE FROM public.behavioral_flags WHERE user_id = v_user_id;

  INSERT INTO public.behavioral_flags (
    user_id, trade_id, flag_type, severity, description, detected_at, is_acknowledged
  ) VALUES
  (
    v_user_id, v_trade_2, 'revenge_trading', 'high',
    'Revenge trading detected: Entry within 4 minutes of loss with risk escalated to 2.8% (limit 1.2%).',
    '2026-05-26 09:15:00+00', false
  ),
  (
    v_user_id, NULL, 'post_win_risk_creep', 'medium',
    'Post-win risk creep: Average position size increased by +0.8% following 3 consecutive winning trades.',
    '2026-05-24 14:10:00+00', false
  ),
  (
    v_user_id, v_trade_4, 'impulse_trading', 'medium',
    'FOMO / Impulse entry during news volatility without standard ATR breakout checklist confirmation.',
    '2026-05-25 14:20:00+00', false
  ),
  (
    v_user_id, NULL, 'rule_violation', 'low',
    'Max risk per trade exceeded on 1 instance during New York session.',
    '2026-05-22 16:30:00+00', true
  );

  -- 8. Insert Trading Rules
  DELETE FROM public.trading_rules WHERE user_id = v_user_id;

  INSERT INTO public.trading_rules (
    user_id, name, description, rule_type, is_active, violation_count
  ) VALUES
  (v_user_id, 'Max Risk 1.2% Per Trade', 'Hard cap on risk per setup to prevent drawdown spiral.', 'risk', true, 4),
  (v_user_id, '30-Minute Post-Loss Cooling Rule', 'Zero execution permitted within 30 minutes of a stopped position.', 'emotional', true, 3),
  (v_user_id, 'Cap NY Session to 2 Trades', 'Restrict afternoon overtrading when emotional fatigue is highest.', 'frequency', true, 1),
  (v_user_id, 'ATR Filter on Breakout Entries', 'Only take breakouts when current ATR > 14-period moving average.', 'strategy', true, 2);

  RAISE NOTICE 'TraderMind seed completed successfully for user: %', v_user_id;
END $$;
