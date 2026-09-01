'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  AreaChart, Area, BarChart, Bar, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import {
  Brain, TrendingUp, AlertTriangle, Shield,
  Zap, Clock, Target, ArrowUpRight, ArrowDownRight,
  ChevronRight, Sparkles, Activity
} from 'lucide-react'
import type { PerformanceAnalytics, Trade, BehavioralFlag } from '@/types'

// ── DEMO DATA (AGENTS.md Section 11) ──────────────────────────
const DEMO_EQUITY = [
  { date: 'May 1', equity: 10200, discipline: 72 },
  { date: 'May 3', equity: 10380, discipline: 74 },
  { date: 'May 5', equity: 10290, discipline: 70 },
  { date: 'May 7', equity: 10510, discipline: 76 },
  { date: 'May 9', equity: 10450, discipline: 68 },
  { date: 'May 11', equity: 10720, discipline: 80 },
  { date: 'May 13', equity: 10640, discipline: 75 },
  { date: 'May 15', equity: 10880, discipline: 82 },
  { date: 'May 17', equity: 10760, discipline: 77 },
  { date: 'May 19', equity: 11020, discipline: 81 },
  { date: 'May 21', equity: 10940, discipline: 78 },
  { date: 'May 23', equity: 11180, discipline: 83 },
  { date: 'May 25', equity: 11350, discipline: 84 },
  { date: 'May 26', equity: 11450, discipline: 83 },
]

const DEMO_SESSION = [
  { session: 'Asian', wr: 55, trades: 8 },
  { session: 'London', wr: 67, trades: 19 },
  { session: 'New York', wr: 48, trades: 15 },
  { session: 'Overlap', wr: 71, trades: 5 },
]

const DEMO_TRADES = [
  { id: 1, symbol: 'EURUSD', direction: 'Long', pnl: 312, rr: 2.4, risk: 1.2, emotion: 'Focused', alignment: 91, session: 'London', time: '08:32' },
  { id: 2, symbol: 'GBPJPY', direction: 'Short', pnl: -180, rr: -1.0, risk: 2.8, emotion: 'Revenge', alignment: 31, session: 'London', time: '09:15' },
  { id: 3, symbol: 'XAUUSD', direction: 'Long', pnl: 540, rr: 3.1, risk: 1.5, emotion: 'Calm', alignment: 88, session: 'Overlap', time: '12:44' },
  { id: 4, symbol: 'BTCUSD', direction: 'Long', pnl: -95, rr: -0.6, risk: 1.0, emotion: 'FOMO', alignment: 54, session: 'New York', time: '14:20' },
  { id: 5, symbol: 'USDJPY', direction: 'Short', pnl: 228, rr: 1.9, risk: 1.1, emotion: 'Focused', alignment: 82, session: 'London', time: '10:05' },
]

const DEMO_FLAGS = [
  { type: 'Revenge Trading', count: 3, severity: 'high' as const },
  { type: 'Post-Win Risk Creep', count: 6, severity: 'medium' as const },
  { type: 'FOMO Entry', count: 2, severity: 'medium' as const },
  { type: 'Rule Violations', count: 1, severity: 'low' as const },
]

const DEMO_EMOTIONS = [
  { label: 'Calm / Focused', pct: 58, color: 'var(--green)' },
  { label: 'Overconfident', pct: 19, color: 'var(--amber)' },
  { label: 'FOMO', pct: 12, color: 'var(--purple)' },
  { label: 'Revenge / Fear', pct: 11, color: 'var(--red)' },
]

const RANGE_OPTIONS = ['1W', '1M', '3M', 'YTD'] as const
type RangeLabel = typeof RANGE_OPTIONS[number]

type AnalyticsResponse = {
  analytics: PerformanceAnalytics
  recent_trades: Trade[]
  behavioral_flags: BehavioralFlag[]
  equity_curve: { date: string; daily_pnl: number; cumulative: number }[]
  range: { start: string; end: string; label: string }
}

// ── DESIGN SYSTEM STYLES ──────────────────────────────────────
const panelStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  overflow: 'hidden' as const,
}

const panelHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  borderBottom: '1px solid var(--border)',
}

const tooltipStyle = {
  contentStyle: {
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    fontSize: '11px',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text)',
  },
  labelStyle: { color: 'var(--text-2)', fontSize: '10px', marginBottom: '4px' },
  itemStyle: { color: 'var(--text)' },
}

// ── SCORE CARD COMPONENT (prompts/build-dashboard.md) ─────────
function ScoreCard({
  label, value, delta, deltaPositive, color, barColor
}: {
  label: string
  value: number
  delta: string
  deltaPositive: boolean
  color: string
  barColor: string
}) {
  return (
    <div style={{
      ...panelStyle,
      padding: '16px 18px 14px',
      position: 'relative',
    }}>
      {/* 2px Colored Top Accent Bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: barColor }} />
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: '10px',
          fontWeight: 700,
          color: 'var(--text-3)',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          fontFamily: 'var(--font-mono)',
        }}>
          {label}
        </span>
        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          color: deltaPositive ? 'var(--green)' : 'var(--red)',
        }}>
          {deltaPositive ? '↑ ' : '↓ '}{delta}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '8px' }}>
        <span style={{
          fontSize: '32px',
          fontWeight: 800,
          color,
          letterSpacing: '-1.2px',
          lineHeight: 1,
          fontFamily: 'var(--font-mono)',
          fontFeatureSettings: '"tnum" 1, "zero" 1',
        }}>
          {value}
        </span>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
          /100
        </span>
      </div>

      <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
        vs last month
      </div>

      {/* Progress Bar */}
      <div style={{ marginTop: '12px', height: '3px', background: 'var(--surface-3)', borderRadius: '2px' }}>
        <div style={{
          height: '3px',
          borderRadius: '2px',
          background: barColor,
          width: `${Math.min(100, Math.max(0, value))}%`,
          transition: 'width 0.6s ease-out'
        }} />
      </div>
    </div>
  )
}

function AlignmentBadge({ score }: { score: number }) {
  const color = score >= 75 ? 'var(--green)' : score >= 50 ? 'var(--amber)' : 'var(--red)'
  const bg = score >= 75 ? 'rgba(62,207,142,0.12)' : score >= 50 ? 'rgba(245,166,35,0.12)' : 'rgba(255,95,95,0.12)'
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '2px 8px',
      borderRadius: '4px',
      background: bg,
      color,
      fontSize: '11px',
      fontFamily: 'var(--font-mono)',
      fontWeight: 600,
      fontFeatureSettings: '"tnum" 1, "zero" 1',
    }}>
      ● {score}
    </span>
  )
}

function EmotionBadge({ emotion }: { emotion: string }) {
  const colors: Record<string, string> = {
    Focused: 'var(--green)',
    Calm: 'var(--green)',
    Revenge: 'var(--red)',
    FOMO: 'var(--amber)',
    Hesitant: 'var(--text-2)',
  }
  return (
    <span style={{
      fontSize: '11px',
      fontWeight: 500,
      color: colors[emotion] ?? 'var(--text-2)',
      fontFamily: 'var(--font-sans)',
    }}>
      {emotion}
    </span>
  )
}

export default function DashboardPage() {
  const [range, setRange] = useState<RangeLabel>('1M')
  const [data, setData] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/behavioral/analytics?range=${range}`, { cache: 'no-store' })
      .then(async r => {
        if (!r.ok) throw new Error(`${r.status}`)
        return r.json()
      })
      .then((json: AnalyticsResponse) => {
        if (!cancelled && json?.analytics) setData(json)
      })
      .catch(() => {
        // Safe fallback to demo data
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [range])

  const analytics = data?.analytics ?? null
  const discipline = analytics?.discipline_score ?? 78
  const consistency = analytics?.behavioral_consistency_score ?? 84
  const riskQuality = analytics?.risk_quality_score ?? 61
  const emotional = analytics?.emotional_stability_score ?? 72

  const sessionDataLive = analytics
    ? Object.values(analytics.session_performance).map(s => ({
        session: s.session === 'new_york' ? 'New York' : s.session.charAt(0).toUpperCase() + s.session.slice(1),
        wr: Math.round(s.win_rate * 10) / 10,
        trades: s.total_trades,
      }))
    : DEMO_SESSION

  const equityChartData = data?.equity_curve?.length
    ? data.equity_curve.map(p => ({
        date: p.date.slice(5),
        equity: 10000 + p.cumulative,
        discipline: discipline,
      }))
    : DEMO_EQUITY

  const tradesLive = data?.recent_trades?.length ? data.recent_trades : null
  const flagsLive = analytics?.behavioral_flags ?? null

  const emotionRows = analytics?.emotion_distribution
    ? [
        { label: 'Calm / Focused', pct: Math.round(((analytics.emotion_distribution.calm ?? 0) + (analytics.emotion_distribution.focused ?? 0)) * 10) / 10, color: 'var(--green)' },
        { label: 'Overconfident', pct: analytics.emotion_distribution.overconfident ?? 0, color: 'var(--amber)' },
        { label: 'FOMO', pct: analytics.emotion_distribution.fomo ?? 0, color: 'var(--purple)' },
        { label: 'Revenge / Fear', pct: Math.round(((analytics.emotion_distribution.revenge_trading ?? 0) + (analytics.emotion_distribution.fearful ?? 0) + (analytics.emotion_distribution.stressed ?? 0)) * 10) / 10, color: 'var(--red)' },
      ]
    : DEMO_EMOTIONS

  const avgRiskLive = analytics?.avg_risk_per_trade ?? 1.64

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '1140px', margin: '0 auto' }}>
      
      {/* ── 1. PAGE HEADER ROW (Title + Date Range Picker) ── */}
      <div>
        <div style={{
          fontSize: '10px',
          fontWeight: 700,
          color: 'var(--accent)',
          letterSpacing: '1px',
          fontFamily: 'var(--font-mono)',
          marginBottom: '6px'
        }}>
          TRADERMIND <span style={{ color: 'var(--text-3)' }}>/</span> OVERVIEW
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.8px', lineHeight: 1, color: 'var(--text)' }}>
              Performance Overview
            </h1>
            <p style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
              {loading ? 'Updating…' : `May 2026 · ${analytics?.total_trades ?? 47} trades · MetaTrader 5 synced`}
            </p>
          </div>
          <div style={{
            display: 'flex',
            gap: '3px',
            background: 'var(--surface-2)',
            padding: '3px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            flexShrink: 0
          }}>
            {RANGE_OPTIONS.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-mono)',
                  border: `1px solid ${range === r ? 'var(--accent)' : 'transparent'}`,
                  cursor: 'pointer',
                  minWidth: '38px',
                  background: range === r ? 'var(--accent)' : 'transparent',
                  color: range === r ? '#FFFFFF' : 'var(--text-3)',
                  boxShadow: range === r ? '0 1px 6px rgba(108,142,255,0.35)' : 'none',
                  transition: 'all 0.15s ease',
                }}
                aria-pressed={range === r}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 2. SCORE CARDS (4 Grid Cards) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        <ScoreCard
          label="Discipline Score"
          value={discipline}
          delta="+3"
          deltaPositive={true}
          color="var(--accent)"
          barColor="var(--accent)"
        />
        <ScoreCard
          label="Behavioral Consistency"
          value={consistency}
          delta="+7"
          deltaPositive={true}
          color="var(--green)"
          barColor="var(--green)"
        />
        <ScoreCard
          label="Risk Quality"
          value={riskQuality}
          delta="-4"
          deltaPositive={false}
          color="var(--amber)"
          barColor="var(--amber)"
        />
        <ScoreCard
          label="Emotional Stability"
          value={emotional}
          delta="+11"
          deltaPositive={true}
          color="var(--purple)"
          barColor="var(--purple)"
        />
      </div>

      {/* ── 3. AI COACH INSIGHT PANEL ── */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '16px 20px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '3px',
          background: 'linear-gradient(180deg, var(--accent), var(--teal))',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--accent)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.8px',
            fontFamily: 'var(--font-mono)',
          }}>
            <span>✦</span> AI COACH · WEEKLY BEHAVIORAL INSIGHT
          </div>
          <Link
            href="/ai-coach"
            style={{
              fontSize: '11px',
              color: 'var(--accent)',
              textDecoration: 'none',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
            }}
          >
            Full AI Report →
          </Link>
        </div>
        <p style={{ fontSize: '13px', lineHeight: 1.65, color: 'var(--text-2)' }}>
          Your London session win rate is <span style={{ color: 'var(--green)', fontWeight: 700 }}>67%</span> (19 points above average). Protect your edge by maintaining risk sizing after winning streaks — your best results occur when stress levels remain ≤ 3/10.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px' }}>
          {[
            { label: 'LONDON SESSION 67% WR', bg: 'rgba(62,207,142,0.12)', color: 'var(--green)', border: 'rgba(62,207,142,0.25)' },
            { label: 'POST-WIN RISK CREEP ×6', bg: 'rgba(245,166,35,0.12)', color: 'var(--amber)', border: 'rgba(245,166,35,0.25)' },
            { label: 'BREAKOUT WR 71%', bg: 'rgba(62,207,142,0.12)', color: 'var(--green)', border: 'rgba(62,207,142,0.25)' },
            { label: 'REVENGE TRADING ×3', bg: 'rgba(255,95,95,0.12)', color: 'var(--red)', border: 'rgba(255,95,95,0.25)' },
          ].map(tag => (
            <span
              key={tag.label}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                letterSpacing: '0.4px',
                background: tag.bg,
                color: tag.color,
                border: `1px solid ${tag.border}`,
              }}
            >
              {tag.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── 4. MAIN 2-COLUMN GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 330px', gap: '16px' }}>

        {/* ── LEFT COLUMN: Equity Chart + Trade Table ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Dual-Axis Equity + Discipline Chart */}
          <div style={panelStyle}>
            <div style={panelHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={15} style={{ color: 'var(--green)' }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                  Equity Curve & Discipline Overlay
                </span>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                  <div style={{ width: '12px', height: '2px', background: 'var(--green)' }} />
                  Equity
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                  <div style={{ width: '12px', height: '2px', background: 'var(--accent)', borderTop: '2px dashed var(--accent)' }} />
                  Discipline
                </div>
              </div>
            </div>
            <div style={{ padding: '14px 12px 6px' }}>
              <ResponsiveContainer width="100%" height={210}>
                <ComposedChart data={equityChartData} margin={{ top: 6, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="equityGradMain" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--green)" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="var(--green)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="equity"
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 10, fill: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `$${(Number(v) / 1000).toFixed(1)}k`}
                  />
                  <YAxis
                    yAxisId="disc"
                    orientation="right"
                    domain={[50, 100]}
                    tick={{ fontSize: 10, fill: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(v: any, name: any) => [name === 'Equity' ? `$${Number(v).toLocaleString()}` : `${v}/100`, name]}
                  />
                  <Area
                    yAxisId="equity"
                    type="monotone"
                    dataKey="equity"
                    stroke="var(--green)"
                    strokeWidth={1.8}
                    fill="url(#equityGradMain)"
                    name="Equity"
                    dot={false}
                    activeDot={{ r: 4, fill: 'var(--green)' }}
                  />
                  <Line
                    yAxisId="disc"
                    type="monotone"
                    dataKey="discipline"
                    stroke="var(--accent)"
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    name="Discipline"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Trades Table */}
          <div style={panelStyle}>
            <div style={panelHeaderStyle}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                Recent Trades
              </span>
              <Link
                href="/trades"
                style={{
                  fontSize: '11px',
                  color: 'var(--accent)',
                  textDecoration: 'none',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                }}
              >
                View all trades →
              </Link>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)' }}>
                    {['Pair', 'P&L', 'R:R', 'Risk %', 'Emotion', 'Session', 'Alignment'].map(h => (
                      <th
                        key={h}
                        style={{
                          padding: '10px 14px',
                          fontSize: '10px',
                          fontWeight: 700,
                          color: 'var(--text-3)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.8px',
                          fontFamily: 'var(--font-mono)',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(tradesLive
                    ? tradesLive.map(t => ({
                        id: t.id,
                        symbol: t.symbol,
                        direction: t.direction === 'long' ? 'Long' : 'Short',
                        pnl: Math.round(t.net_pnl ?? 0),
                        rr: t.reward_risk_ratio ?? 0,
                        risk: t.risk_pct ?? 0,
                        emotion: '—',
                        session: t.session === 'new_york' ? 'New York' : t.session.charAt(0).toUpperCase() + t.session.slice(1),
                        alignment: t.alignment_score ?? 50,
                      }))
                    : DEMO_TRADES
                  ).map(trade => (
                    <tr
                      key={trade.id}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>
                          {trade.symbol}
                        </div>
                        <div style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          color: trade.direction === 'Long' ? 'var(--green)' : 'var(--red)',
                          fontFamily: 'var(--font-mono)',
                          textTransform: 'uppercase',
                        }}>
                          {trade.direction}
                        </div>
                      </td>
                      <td style={{
                        padding: '12px 14px',
                        color: trade.pnl >= 0 ? 'var(--green)' : 'var(--red)',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        fontSize: '13px',
                        fontFeatureSettings: '"tnum" 1, "zero" 1',
                      }}>
                        {trade.pnl >= 0 ? '+' : ''}${trade.pnl}
                      </td>
                      <td style={{
                        padding: '12px 14px',
                        color: 'var(--text-2)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        fontFeatureSettings: '"tnum" 1, "zero" 1',
                      }}>
                        {Number(trade.rr).toFixed(1)}R
                      </td>
                      <td style={{
                        padding: '12px 14px',
                        color: trade.risk > 2 ? 'var(--amber)' : 'var(--text-2)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        fontFeatureSettings: '"tnum" 1, "zero" 1',
                      }}>
                        {trade.risk}%
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {trade.emotion === '—' ? (
                          <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>—</span>
                        ) : (
                          <EmotionBadge emotion={trade.emotion} />
                        )}
                      </td>
                      <td style={{
                        padding: '12px 14px',
                        color: 'var(--text-3)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                      }}>
                        {trade.session}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <AlignmentBadge score={trade.alignment} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Live Eval, Flags, Sessions, Emotions, Risk ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Live Trade Evaluation Widget */}
          <div style={{
            ...panelStyle,
            background: 'var(--surface-2)',
            padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}>Live Trade Evaluation</span>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>EURUSD · Long</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              {[
                { label: 'Alignment', value: '79', color: 'var(--green)' },
                { label: 'Discipline', value: '82', color: 'var(--accent)' },
                { label: 'Risk Level', value: 'MOD', color: 'var(--amber)' },
                { label: 'Session Fit', value: 'HIGH', color: 'var(--green)' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--surface)', borderRadius: '8px', padding: '9px 12px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{s.label}</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: s.color, fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              background: 'rgba(245,166,35,0.08)',
              border: '1px solid rgba(245,166,35,0.22)',
              borderRadius: '7px',
              padding: '10px 12px',
              fontSize: '12px',
              lineHeight: 1.55,
              color: 'var(--text-2)',
            }}>
              ⚠️ Matches your London breakout pattern, but risk at <strong style={{ color: 'var(--text)' }}>1.8%</strong> exceeds optimal <strong style={{ color: 'var(--text)' }}>1.2%</strong> threshold.
            </div>
          </div>

          {/* Behavioral Flags */}
          <div style={panelStyle}>
            <div style={panelHeaderStyle}>
              <span style={{ fontSize: '13px', fontWeight: 700 }}>Behavioral Flags</span>
              <Link href="/behavior" style={{ fontSize: '11px', color: 'var(--accent)', textDecoration: 'none', fontFamily: 'var(--font-mono)' }}>
                Details →
              </Link>
            </div>
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(flagsLive
                ? Object.entries(flagsLive)
                    .filter(([, count]) => (count as number) > 0)
                    .sort((a, b) => (b[1] as number) - (a[1] as number))
                    .slice(0, 4)
                    .map(([type, count]) => ({
                      type: type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                      count: count as number,
                      severity: (count as number) > 3 ? ('high' as const) : (count as number) > 1 ? ('medium' as const) : ('low' as const),
                    }))
                : DEMO_FLAGS
              ).map(flag => (
                <div
                  key={flag.type}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    background: 'var(--surface-2)',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: flag.severity === 'high' ? 'var(--red)' : flag.severity === 'medium' ? 'var(--amber)' : 'var(--green)'
                  }} />
                  <div style={{ flex: 1, fontSize: '12px', fontWeight: 500, color: 'var(--text)' }}>
                    {flag.type}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                    ×{flag.count}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Session Performance */}
          <div style={panelStyle}>
            <div style={panelHeaderStyle}>
              <span style={{ fontSize: '13px', fontWeight: 700 }}>Session Performance</span>
            </div>
            <div style={{ padding: '14px' }}>
              <ResponsiveContainer width="100%" height={125}>
                <BarChart data={sessionDataLive} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="session" tick={{ fontSize: 9, fill: 'var(--text-3)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: 'var(--text-3)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} formatter={(v: any) => [`${v}%`, 'Win Rate']} />
                  <Bar dataKey="wr" radius={[4, 4, 0, 0]}>
                    {sessionDataLive.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.wr >= 65 ? 'var(--green)' : entry.wr >= 55 ? 'var(--accent)' : 'var(--amber)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '10px' }}>
                {sessionDataLive.map(s => (
                  <div key={s.session} style={{ background: 'var(--surface-2)', borderRadius: '7px', padding: '8px 10px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{s.session}</div>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      color: s.wr >= 65 ? 'var(--green)' : s.wr >= 55 ? 'var(--accent)' : 'var(--amber)',
                      fontFeatureSettings: '"tnum" 1, "zero" 1',
                    }}>
                      {s.wr}%
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                      {s.trades} trades
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Emotional State */}
          <div style={panelStyle}>
            <div style={panelHeaderStyle}>
              <span style={{ fontSize: '13px', fontWeight: 700 }}>Emotional Breakdown</span>
            </div>
            <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {emotionRows.map(e => (
                <div key={e.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>{e.label}</span>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: e.color,
                      fontFamily: 'var(--font-mono)',
                      fontFeatureSettings: '"tnum" 1, "zero" 1',
                    }}>
                      {e.pct}%
                    </span>
                  </div>
                  <div style={{ height: '3px', background: 'var(--surface-3)', borderRadius: '2px' }}>
                    <div style={{
                      height: '3px',
                      borderRadius: '2px',
                      background: e.color,
                      width: `${Math.min(100, e.pct)}%`,
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Meter */}
          <div style={panelStyle}>
            <div style={panelHeaderStyle}>
              <span style={{ fontSize: '13px', fontWeight: 700 }}>Avg Risk Per Trade</span>
            </div>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>Monthly Average</span>
                <span style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: avgRiskLive > 2 ? 'var(--red)' : avgRiskLive > 1.5 ? 'var(--amber)' : 'var(--green)',
                  fontFamily: 'var(--font-mono)',
                  fontFeatureSettings: '"tnum" 1, "zero" 1',
                }}>
                  {avgRiskLive.toFixed(2)}%
                </span>
              </div>
              <div style={{ height: '6px', background: 'var(--surface-3)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  height: '6px',
                  borderRadius: '3px',
                  background: 'linear-gradient(90deg, var(--green), var(--amber), var(--red))',
                  width: `${Math.min(100, (avgRiskLive / 3) * 100)}%`
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                <span>0.0%</span>
                <span style={{ color: 'var(--green)', fontWeight: 600 }}>optimal ≤ 1.2%</span>
                <span>3.0%</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── 5. BOTTOM STATS STRIP (6 Metrics) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
        {[
          { label: 'Win Rate', value: analytics ? `${analytics.win_rate}%` : '59.6%', color: 'var(--green)' },
          { label: 'Avg R:R', value: analytics ? `${analytics.avg_reward_risk}R` : '2.3R', color: 'var(--green)' },
          { label: 'Max Drawdown', value: analytics ? `${analytics.max_drawdown_pct}%` : '-4.2%', color: 'var(--red)' },
          { label: 'Profit Factor', value: analytics ? `${analytics.profit_factor}` : '1.87', color: 'var(--amber)' },
          { label: 'Net P&L', value: analytics ? `${analytics.net_pnl >= 0 ? '+' : ''}$${Math.round(analytics.net_pnl).toLocaleString()}` : '+$1,247', color: 'var(--green)' },
          { label: 'Best Streak', value: analytics ? `${analytics.max_win_streak} wins` : '6 wins', color: 'var(--green)' },
        ].map(stat => (
          <div key={stat.label} style={{ ...panelStyle, padding: '14px 16px' }}>
            <div style={{
              fontSize: '10px',
              fontWeight: 700,
              color: 'var(--text-3)',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
            }}>
              {stat.label}
            </div>
            <div style={{
              fontSize: '20px',
              fontWeight: 800,
              color: stat.color,
              fontFamily: 'var(--font-mono)',
              fontFeatureSettings: '"tnum" 1, "zero" 1',
              marginTop: '5px',
            }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
