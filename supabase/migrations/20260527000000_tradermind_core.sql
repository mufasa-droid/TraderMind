-- TraderMind core schema — run via `supabase db push` or Supabase Dashboard SQL editor
-- All tables are user-scoped with RLS `auth.uid() = user_id`

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ── USERS (profile, extends auth.users) ─────────────────────
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default 'Trader',
  avatar_url text,
  timezone text not null default 'UTC',
  plan text not null default 'free' check (plan in ('free','pro')),
  broker_connected boolean not null default false,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.users enable row level security;
create policy "Users can view own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);

-- ── USER SETTINGS ───────────────────────────────────────────
create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  max_daily_loss_pct numeric not null default 3,
  max_risk_per_trade_pct numeric not null default 2,
  preferred_sessions text[] not null default array['london','overlap'],
  weekly_target_pct numeric not null default 5,
  notifications_enabled boolean not null default true,
  theme text not null default 'dark' check (theme in ('dark','light')),
  default_currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.user_settings enable row level security;
create policy "Settings owner" on public.user_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── BROKER CONNECTIONS ──────────────────────────────────────
create table if not exists public.broker_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('mt4','mt5','binance','bybit','ctrader','tradingview','dxtrade')),
  account_id text not null,
  account_name text not null default '',
  server text,
  is_active boolean not null default true,
  last_sync_at timestamptz,
  balance numeric not null default 0,
  equity numeric not null default 0,
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  unique(user_id, account_id)
);
alter table public.broker_connections enable row level security;
create policy "Broker owner" on public.broker_connections for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index on public.broker_connections(user_id);

-- ── TRADES ──────────────────────────────────────────────────
create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  broker_connection_id uuid references public.broker_connections(id) on delete set null,
  external_trade_id text,
  symbol text not null,
  instrument_type text not null default 'forex' check (instrument_type in ('forex','crypto','commodities','indices','stocks')),
  direction text not null check (direction in ('long','short')),
  status text not null default 'closed' check (status in ('open','closed','pending')),
  entry_price numeric not null,
  exit_price numeric,
  stop_loss numeric,
  take_profit numeric,
  lot_size numeric not null default 0.1,
  position_size_usd numeric not null default 0,
  risk_pct numeric not null default 0,
  reward_risk_ratio numeric,
  pip_value numeric,
  session text not null default 'london' check (session in ('asian','london','new_york','overlap')),
  opened_at timestamptz not null,
  closed_at timestamptz,
  duration_minutes integer,
  gross_pnl numeric,
  net_pnl numeric,
  commission numeric not null default 0,
  swap numeric not null default 0,
  pips numeric,
  strategy_name text,
  setup_type text,
  timeframe text,
  alignment_score integer check (alignment_score between 0 and 100),
  discipline_score integer check (discipline_score between 0 and 100),
  risk_warning_level text check (risk_warning_level in ('low','medium','high','critical')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, external_trade_id)
);
alter table public.trades enable row level security;
create policy "Trades owner" on public.trades for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index on public.trades(user_id, opened_at desc);
create index on public.trades(user_id, status);

-- ── BEHAVIORAL LOGS ─────────────────────────────────────────
create table if not exists public.behavioral_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trade_id uuid references public.trades(id) on delete set null,
  log_type text not null check (log_type in ('pre_trade','post_trade','daily','session')),
  emotion text not null check (emotion in ('calm','focused','fearful','revenge_trading','fomo','overconfident','hesitant','stressed','neutral')),
  confidence_level integer not null check (confidence_level between 1 and 10),
  fear_level integer not null check (fear_level between 1 and 10),
  stress_level integer not null check (stress_level between 1 and 10),
  focus_level integer not null check (focus_level between 1 and 10),
  setup_notes text,
  strategy_used text,
  pre_trade_reasoning text,
  post_trade_reflection text,
  lesson_learned text,
  screenshot_url text,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.behavioral_logs enable row level security;
create policy "Logs owner" on public.behavioral_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index on public.behavioral_logs(user_id, logged_at desc);

-- ── BEHAVIORAL FLAGS ────────────────────────────────────────
create table if not exists public.behavioral_flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trade_id uuid references public.trades(id) on delete set null,
  flag_type text not null check (flag_type in ('revenge_trading','overtrading','emotional_instability','excessive_risk','impulse_trading','strategy_inconsistency','poor_session_timing','rule_violation','post_win_risk_creep','loss_chasing','early_exit','late_entry')),
  severity text not null check (severity in ('low','medium','high')),
  description text not null,
  detected_at timestamptz not null default now(),
  is_acknowledged boolean not null default false
);
alter table public.behavioral_flags enable row level security;
create policy "Flags owner" on public.behavioral_flags for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index on public.behavioral_flags(user_id, detected_at desc);

-- ── AI REPORTS ──────────────────────────────────────────────
create table if not exists public.ai_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period text not null check (period in ('weekly','monthly','quarterly')),
  period_start date not null,
  period_end date not null,
  analytics jsonb not null,
  behavioral_analysis text not null,
  psychological_patterns text not null,
  discipline_feedback text not null,
  risk_analysis text not null,
  strategy_consistency text not null,
  improvement_suggestions jsonb not null default '[]',
  key_insights jsonb not null default '[]',
  overall_discipline_score integer not null,
  behavioral_consistency_score integer not null,
  risk_quality_score integer not null,
  emotional_stability_score integer not null,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.ai_reports enable row level security;
create policy "Reports owner" on public.ai_reports for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index on public.ai_reports(user_id, generated_at desc);

-- ── COACHING INSIGHTS ───────────────────────────────────────
create table if not exists public.coaching_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  insight_type text not null check (insight_type in ('pattern','warning','achievement','suggestion')),
  title text not null,
  body text not null,
  is_read boolean not null default false,
  priority integer not null default 5 check (priority between 1 and 10),
  generated_at timestamptz not null default now()
);
alter table public.coaching_insights enable row level security;
create policy "Insights owner" on public.coaching_insights for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index on public.coaching_insights(user_id, priority desc);

-- ── TRADING RULES ───────────────────────────────────────────
create table if not exists public.trading_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  rule_type text not null check (rule_type in ('risk','session','emotional','strategy','frequency')),
  is_active boolean not null default true,
  violation_count integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.trading_rules enable row level security;
create policy "Rules owner" on public.trading_rules for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index on public.trading_rules(user_id);

-- ── DAILY GOALS ─────────────────────────────────────────────
create table if not exists public.daily_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  max_trades integer not null default 5,
  max_daily_loss_usd numeric not null default 300,
  target_pnl_usd numeric not null default 200,
  is_trading_day boolean not null default true,
  trades_taken integer not null default 0,
  current_pnl numeric not null default 0,
  goal_status text not null default 'on_track' check (goal_status in ('on_track','at_risk','breached','achieved')),
  created_at timestamptz not null default now(),
  unique(user_id, date)
);
alter table public.daily_goals enable row level security;
create policy "Goals owner" on public.daily_goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── SCREENSHOTS ─────────────────────────────────────────────
create table if not exists public.trade_screenshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trade_id uuid references public.trades(id) on delete set null,
  url text not null,
  thumbnail_url text not null,
  label text,
  notes text,
  timeframe text,
  trade_type text check (trade_type in ('entry','exit','setup','review')),
  created_at timestamptz not null default now()
);
alter table public.trade_screenshots enable row level security;
create policy "Screenshots owner" on public.trade_screenshots for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── UPDATED_AT TRIGGERS ─────────────────────────────────────
create or replace function public.handle_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;
drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at before update on public.users for each row execute function public.handle_updated_at();
drop trigger if exists set_trades_updated_at on public.trades;
create trigger set_trades_updated_at before update on public.trades for each row execute function public.handle_updated_at();

-- ── SEED: create user_settings row on signup (optional) ────
create or replace function public.handle_new_user() returns trigger as $$
begin
  insert into public.users (id, email, full_name) values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  insert into public.user_settings (user_id) values (new.id) on conflict do nothing;
  return new;
end; $$ language plpgsql security definer;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
