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
  ChevronRight, Sparkles, Activity, Layers
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

// ── 71UI INSTITUTIONAL PANEL STYLES (NO GLASSMORPHISM) ────────
const institutionalCardStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  overflow: 'hidden' as const,
  position: 'relative' as const,
}

const cardHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  background: 'var(--surface-2)',
  borderBottom: '1px solid var(--border)',
}

// ── DUAL-AXIS TOOLTIP ─────────────────────────────────────────
interface CustomEquityTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    payload: {
      date: string
      equity: number
      discipline: number
    }
  }>
  label?: string
}

function CustomEquityTooltip({ active, payload, label }: CustomEquityTooltipProps) {
  if (!active || !payload || !payload.length) return null

  const item = payload[0]?.payload
  if (!item) return null

  return (
    <div
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border-2)',
        borderRadius: '8px',
        padding: '10px 14px',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.7)',
        minWidth: '170px',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          fontSize: '10px',
          fontWeight: 700,
          color: 'var(--text-3)',
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
          marginBottom: '8px',
          paddingBottom: '6px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>{label || item.date}</span>
        <span style={{ fontSize: '9px', color: 'var(--accent)' }}>OVERLAY</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green)' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>
              Equity:
            </span>
          </div>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--green)',
              fontFamily: 'var(--font-mono)',
              fontFeatureSettings: '"tnum" 1, "zero" 1',
            }}
          >
            ${item.equity.toLocaleString()}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>
              Discipline:
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--accent)',
                fontFamily: 'var(--font-mono)',
                fontFeatureSettings: '"tnum" 1, "zero" 1',
              }}
            >
              {item.discipline}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
              /100
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MINI SPARKLINES COMPONENT ─────────────────────────────────
function MiniSparkline({ data, color, id }: { data: number[]; color: string; id: string }) {
  if (!data || data.length < 2) return null

  const width = 42
  const height = 16
  const pad = 1

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min === 0 ? 1 : max - min

  const points = data.map((val, idx) => {
    const x = pad + (idx / (data.length - 1)) * (width - pad * 2)
    const y = height - pad - ((val - min) / range) * (height - pad * 2)
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 }
  })

  const pathD = points.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`
  }, '')

  const fillD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`
  const lastPoint = points[points.length - 1]
  const gradId = `spark-${id}`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ overflow: 'visible', display: 'block', flexShrink: 0 }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#${gradId})`} />
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastPoint.x} cy={lastPoint.y} r={2} fill={color} />
    </svg>
  )
}

// ── 71UI SCORE CARD WITH 2px TOP BORDER (AGENTS.md Section 2.5) ─
function ScoreCard({
  label, value, delta, deltaPositive, color, barColor, sparkline, id
}: {
  label: string
  value: number
  delta: string
  deltaPositive: boolean
  color: string
  barColor: string
  sparkline?: number[]
  id: string
}) {
  return (
    <div
      className="dashboard-score-card"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderTop: `2px solid ${barColor}`,
        borderRadius: '10px',
        padding: '16px 18px',
        position: 'relative',
        minWidth: 0,
        overflow: 'hidden',
        transition: 'border-color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', minWidth: 0 }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--text-3)',
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            fontFamily: 'var(--font-mono)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minWidth: 0,
            flex: 1,
          }}
        >
          {label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {sparkline && <MiniSparkline data={sparkline} color={barColor} id={id} />}
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: deltaPositive ? 'var(--green)' : 'var(--red)',
              background: deltaPositive ? 'rgba(62, 207, 142, 0.1)' : 'rgba(255, 95, 95, 0.1)',
              padding: '2px 6px',
              borderRadius: '4px',
              border: `1px solid ${deltaPositive ? 'rgba(62, 207, 142, 0.25)' : 'rgba(255, 95, 95, 0.25)'}`,
              display: 'inline-flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            {deltaPositive ? '↑ ' : '↓ '}{delta}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '10px' }}>
        <span
          style={{
            fontSize: '32px',
            fontWeight: 700,
            color,
            letterSpacing: '-1px',
            lineHeight: 1,
            fontFamily: 'var(--font-mono)',
            fontFeatureSettings: '"tnum" 1, "zero" 1',
          }}
        >
          {value}
        </span>
        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
          /100
        </span>
      </div>

      <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
        vs last month
      </div>

      {/* Progress Track */}
      <div style={{ marginTop: '12px', height: '3px', background: 'var(--surface-3)', borderRadius: '2px', overflow: 'hidden' }}>
        <div
          style={{
            height: '3px',
            borderRadius: '2px',
            background: barColor,
            width: `${Math.min(100, Math.max(0, value))}%`,
            transition: 'width 0.4s var(--ease-out)',
          }}
        />
      </div>
    </div>
  )
}

// ── ALIGNMENT BADGE ───────────────────────────────────────────
function AlignmentBadge({ score }: { score: number }) {
  const isHigh = score >= 75
  const isMed = score >= 50
  const color = isHigh ? 'var(--green)' : isMed ? 'var(--amber)' : 'var(--red)'
  const bg = isHigh ? 'rgba(62, 207, 142, 0.1)' : isMed ? 'rgba(245, 166, 35, 0.1)' : 'rgba(255, 95, 95, 0.1)'
  const border = isHigh ? 'rgba(62, 207, 142, 0.25)' : isMed ? 'rgba(245, 166, 35, 0.25)' : 'rgba(255, 95, 95, 0.25)'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '2px 8px',
        borderRadius: '4px',
        background: bg,
        border: `1px solid ${border}`,
        color,
        fontSize: '11px',
        fontFamily: 'var(--font-mono)',
        fontWeight: 650,
        fontFeatureSettings: '"tnum" 1, "zero" 1',
      }}
    >
      <span
        style={{
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          background: color,
        }}
      />
      {score}%
    </span>
  )
}

// ── EMOTION BADGE ─────────────────────────────────────────────
function EmotionBadge({ emotion }: { emotion: string }) {
  const isGood = emotion === 'Focused' || emotion === 'Calm'
  const isBad = emotion === 'Revenge' || emotion === 'Fear'
  const color = isGood ? 'var(--green)' : isBad ? 'var(--red)' : 'var(--amber)'

  return (
    <span
      style={{
        fontSize: '11px',
        fontFamily: 'var(--font-mono)',
        color,
        fontWeight: 600,
      }}
    >
      {emotion}
    </span>
  )
}

// ── RISK EXPOSURE METER ───────────────────────────────────────
function RiskMeter({ currentAvg = 1.64, optimal = 1.2, maxAllowed = 3.0 }: { currentAvg?: number; optimal?: number; maxAllowed?: number }) {
  const pct = Math.min(100, Math.round((currentAvg / maxAllowed) * 100))
  const optPct = Math.round((optimal / maxAllowed) * 100)
  const isOver = currentAvg > optimal

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>Avg Risk / Trade</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontSize: '13px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: isOver ? 'var(--amber)' : 'var(--green)',
              fontFeatureSettings: '"tnum" 1',
            }}
          >
            {currentAvg.toFixed(2)}%
          </span>
          <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
            (opt: {optimal}%)
          </span>
        </div>
      </div>

      <div style={{ position: 'relative', height: '8px', background: 'var(--surface-3)', borderRadius: '4px', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: isOver
              ? 'linear-gradient(90deg, var(--green) 0%, var(--amber) 70%, var(--red) 100%)'
              : 'var(--green)',
            borderRadius: '4px',
            transition: 'width 0.4s var(--ease-out)',
          }}
        />
        {/* Optimal threshold vertical tick */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${optPct}%`,
            width: '2px',
            background: '#FFFFFF',
            opacity: 0.7,
          }}
          title={`Optimal threshold: ${optimal}%`}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
        <span>0%</span>
        <span style={{ color: 'var(--accent)' }}>Optimal {optimal}%</span>
        <span>Max {maxAllowed}%</span>
      </div>
    </div>
  )
}

// ── MAIN DASHBOARD PAGE COMPONENT ─────────────────────────────
export default function DashboardPage() {
  const [range, setRange] = useState<RangeLabel>('1M')
  const [data, setData] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    fetch(`/api/analytics?range=${range}`)
      .then(res => (res.ok ? res.json() : null))
      .then((json: AnalyticsResponse | null) => {
        if (!cancelled && json && json.analytics) {
          setData(json)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [range])

  const analytics = data?.analytics
  const hasLiveTrades = Boolean(analytics && analytics.total_trades > 0)
  const tradesLive = data?.recent_trades && data.recent_trades.length > 0 ? data.recent_trades.slice(0, 5) : null

  // Fallbacks
  const discipline = hasLiveTrades ? (analytics?.discipline_score ?? 78) : 78
  const consistency = hasLiveTrades ? (analytics?.behavioral_consistency_score ?? 84) : 84
  const riskQuality = hasLiveTrades ? (analytics?.risk_quality_score ?? 61) : 61
  const emotional = hasLiveTrades ? (analytics?.emotional_stability_score ?? 72) : 72

  // Equity Curve Data
  const equityChartData =
    data?.equity_curve && data.equity_curve.length > 1
      ? data.equity_curve.map((pt, idx) => ({
          date: pt.date,
          equity: Math.round(10000 + pt.cumulative),
          discipline: DEMO_EQUITY[idx % DEMO_EQUITY.length]?.discipline ?? 75,
        }))
      : DEMO_EQUITY

  // Session Data
  const sessionChartData =
    hasLiveTrades && analytics?.session_performance
      ? [
          { session: 'Asian', wr: Math.round((analytics.session_performance.asian?.win_rate ?? 0.55) * 100), trades: analytics.session_performance.asian?.total_trades ?? 8 },
          { session: 'London', wr: Math.round((analytics.session_performance.london?.win_rate ?? 0.67) * 100), trades: analytics.session_performance.london?.total_trades ?? 19 },
          { session: 'New York', wr: Math.round((analytics.session_performance.new_york?.win_rate ?? 0.48) * 100), trades: analytics.session_performance.new_york?.total_trades ?? 15 },
          { session: 'Overlap', wr: Math.round((analytics.session_performance.overlap?.win_rate ?? 0.71) * 100), trades: analytics.session_performance.overlap?.total_trades ?? 5 },
        ]
      : DEMO_SESSION

  // Flags Data
  const flagsList =
    data?.behavioral_flags && data.behavioral_flags.length > 0
      ? data.behavioral_flags.slice(0, 4).map(f => ({
          type: f.flag_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          count: 1,
          severity: f.severity,
        }))
      : DEMO_FLAGS

  // Emotions Data
  const emotionsList =
    hasLiveTrades && analytics?.emotion_distribution
      ? [
          { label: 'Calm / Focused', pct: Math.round(((analytics.emotion_distribution.calm ?? 0) + (analytics.emotion_distribution.focused ?? 0)) * 10) / 10, color: 'var(--green)' },
          { label: 'Overconfident', pct: analytics.emotion_distribution.overconfident ?? 0, color: 'var(--amber)' },
          { label: 'FOMO', pct: analytics.emotion_distribution.fomo ?? 0, color: 'var(--purple)' },
          { label: 'Revenge / Fear', pct: Math.round(((analytics.emotion_distribution.revenge_trading ?? 0) + (analytics.emotion_distribution.fearful ?? 0) + (analytics.emotion_distribution.stressed ?? 0)) * 10) / 10, color: 'var(--red)' },
        ]
      : DEMO_EMOTIONS

  const avgRiskLive = hasLiveTrades ? (analytics?.avg_risk_per_trade ?? 1.64) : 1.64

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        maxWidth: '1160px',
        width: '100%',
        minWidth: 0,
        margin: '0 auto',
        overflowX: 'clip',
      }}
    >
      <style>{`
        @media (max-width: 639px) {
          .dashboard-score-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 10px !important; }
          .dashboard-main-grid { grid-template-columns: minmax(0, 1fr) !important; gap: 16px !important; }
          .dashboard-bottom-strip { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 10px !important; }
          .dashboard-score-card { padding: 14px 12px !important; min-width: 0 !important; overflow: hidden !important; }
          .dashboard-stat-card { padding: 12px 14px !important; min-width: 0 !important; overflow: hidden !important; }
          .dashboard-header-row { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
        }
        @media (min-width: 640px) and (max-width: 1023px) {
          .dashboard-score-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 12px !important; }
          .dashboard-main-grid { grid-template-columns: minmax(0, 1fr) !important; gap: 16px !important; }
          .dashboard-bottom-strip { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; gap: 12px !important; }
        }
        @media (min-width: 1024px) {
          .dashboard-score-grid { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; gap: 12px !important; }
          .dashboard-main-grid { grid-template-columns: minmax(0, 1fr) 340px !important; gap: 16px !important; }
          .dashboard-bottom-strip { grid-template-columns: repeat(6, minmax(0, 1fr)) !important; gap: 12px !important; }
        }
      `}</style>

      {/* ── 1. PAGE HEADER ROW ── */}
      <div>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--accent)',
            letterSpacing: '0.8px',
            fontFamily: 'var(--font-mono)',
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>TRADERMIND</span>
          <span style={{ color: 'var(--text-3)' }}>/</span>
          <span>OVERVIEW</span>
        </div>
        <div
          className="dashboard-header-row"
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '26px',
                fontWeight: 700,
                letterSpacing: '-0.025em',
                lineHeight: 1.1,
                color: '#FFFFFF',
              }}
            >
              Performance Overview
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
              {loading ? 'Updating…' : `May 2026 · ${analytics?.total_trades ?? 47} trades · MetaTrader 5 synced`}
            </p>
          </div>

          {/* Institutional Segmented Range Control */}
          <div
            style={{
              display: 'flex',
              gap: '2px',
              background: 'var(--surface)',
              padding: '2px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              flexShrink: 0,
            }}
          >
            {RANGE_OPTIONS.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className="interactive-btn"
                style={{
                  padding: '5px 12px',
                  borderRadius: '4px',
                  fontSize: '11.5px',
                  fontWeight: 650,
                  fontFamily: 'var(--font-mono)',
                  border: range === r ? '1px solid var(--border-2)' : '1px solid transparent',
                  cursor: 'pointer',
                  minWidth: '38px',
                  background: range === r ? 'var(--surface-2)' : 'transparent',
                  color: range === r ? '#FFFFFF' : 'var(--text-3)',
                }}
                aria-pressed={range === r}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 2. SCORE CARDS (4 Grid Cards with 2px Top Border per AGENTS.md 2.5) ── */}
      <div className="dashboard-score-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        <ScoreCard
          label="Discipline Score"
          value={discipline}
          delta="+3"
          deltaPositive={true}
          color="var(--accent)"
          barColor="var(--accent)"
          sparkline={[71, 72, 70, 74, 73, 75, 74, 76, 75, 78, 77, 79, 77, 78]}
          id="discipline"
        />
        <ScoreCard
          label="Behavioral Consistency"
          value={consistency}
          delta="+7"
          deltaPositive={true}
          color="var(--green)"
          barColor="var(--green)"
          sparkline={[74, 75, 76, 78, 77, 79, 80, 81, 80, 82, 83, 83, 84, 84]}
          id="consistency"
        />
        <ScoreCard
          label="Risk Quality"
          value={riskQuality}
          delta="-4"
          deltaPositive={false}
          color="var(--amber)"
          barColor="var(--amber)"
          sparkline={[66, 65, 67, 65, 64, 63, 64, 62, 63, 62, 61, 60, 62, 61]}
          id="risk"
        />
        <ScoreCard
          label="Emotional Stability"
          value={emotional}
          delta="+11"
          deltaPositive={true}
          color="var(--purple)"
          barColor="var(--purple)"
          sparkline={[59, 60, 58, 62, 61, 64, 65, 66, 68, 67, 70, 71, 71, 72]}
          id="emotional"
        />
      </div>

      {/* ── 3. AI COACH INSIGHT PANEL ── */}
      <div
        style={{
          ...institutionalCardStyle,
          padding: '16px 20px',
          borderLeft: '3px solid var(--accent)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--accent)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.8px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <Sparkles size={13} />
            <span>AI COACH · WEEKLY BEHAVIORAL INSIGHT</span>
          </div>
          <Link
            href="/ai-coach"
            className="interactive-btn"
            style={{
              fontSize: '11.5px',
              color: 'var(--accent)',
              textDecoration: 'none',
              fontFamily: 'var(--font-mono)',
              fontWeight: 650,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>Full AI Report</span>
            <ChevronRight size={13} />
          </Link>
        </div>

        <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text)', margin: '0 0 12px' }}>
          Your London session win rate is <strong style={{ color: 'var(--green)', fontWeight: 700 }}>67%</strong> (19 points above average). Protect your edge by maintaining risk sizing after winning streaks — your best results occur when stress levels remain ≤ 3/10.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {[
            { label: 'LONDON SESSION 67% WR', bg: 'rgba(62, 207, 142, 0.08)', color: 'var(--green)', border: 'rgba(62, 207, 142, 0.25)' },
            { label: 'POST-WIN RISK CREEP ×6', bg: 'rgba(245, 166, 35, 0.08)', color: 'var(--amber)', border: 'rgba(245, 166, 35, 0.25)' },
            { label: 'BREAKOUT WR 71%', bg: 'rgba(62, 207, 142, 0.08)', color: 'var(--green)', border: 'rgba(62, 207, 142, 0.25)' },
            { label: 'REVENGE TRADING ×3', bg: 'rgba(255, 95, 95, 0.08)', color: 'var(--red)', border: 'rgba(255, 95, 95, 0.25)' },
          ].map(tag => (
            <span
              key={tag.label}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '10.5px',
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
      <div
        className="dashboard-main-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 340px',
          gap: '16px',
          minWidth: 0,
          maxWidth: '100%',
        }}
      >
        {/* ── LEFT COLUMN: Equity Chart + Trade Table ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>

          {/* Dual-Axis Equity + Discipline Chart */}
          <div style={institutionalCardStyle}>
            <div style={cardHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={14} style={{ color: 'var(--green)' }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                  Equity Curve & Discipline Overlay
                </span>
              </div>
              <div style={{ display: 'flex', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>
                  <div style={{ width: '10px', height: '2px', background: 'var(--green)', borderRadius: '1px' }} />
                  Equity
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>
                  <div style={{ width: '10px', height: '2px', background: 'var(--accent)', borderTop: '2px dashed var(--accent)' }} />
                  Discipline
                </div>
              </div>
            </div>

            <div style={{ padding: '16px 14px 8px', width: '100%', minWidth: 0, overflow: 'hidden' }}>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={equityChartData} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="equityGradMain" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--green)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--green)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" vertical={false} />
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
                    content={<CustomEquityTooltip />}
                    cursor={{
                      stroke: 'rgba(255, 255, 255, 0.16)',
                      strokeWidth: 1,
                      strokeDasharray: '3 3',
                    }}
                  />
                  <Area
                    yAxisId="equity"
                    type="monotone"
                    dataKey="equity"
                    stroke="var(--green)"
                    strokeWidth={2}
                    fill="url(#equityGradMain)"
                    name="Equity"
                    dot={false}
                    activeDot={{ r: 4, fill: 'var(--green)', stroke: 'var(--surface)', strokeWidth: 2 }}
                  />
                  <Line
                    yAxisId="disc"
                    type="monotone"
                    dataKey="discipline"
                    stroke="var(--accent)"
                    strokeWidth={1.6}
                    strokeDasharray="4 3"
                    name="Discipline"
                    dot={false}
                    activeDot={{ r: 4, fill: 'var(--accent)', stroke: 'var(--surface)', strokeWidth: 2 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Trades Table */}
          <div style={institutionalCardStyle}>
            <div style={cardHeaderStyle}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                Recent Trades
              </span>
              <Link
                href="/trades"
                className="interactive-btn"
                style={{
                  fontSize: '11.5px',
                  color: 'var(--accent)',
                  textDecoration: 'none',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 650,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>View all trades</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%', maxWidth: '100%' }}>
              <table style={{ width: '100%', minWidth: '540px', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
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
                        borderBottom: '1px solid var(--border)',
                        transition: 'background var(--dur-fast) var(--ease-out)',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 700, fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>
                          {trade.symbol}
                        </div>
                        <div
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 700,
                            color: trade.direction === 'Long' ? 'var(--green)' : 'var(--red)',
                            fontFamily: 'var(--font-mono)',
                            textTransform: 'uppercase',
                          }}
                        >
                          {trade.direction}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '10px 14px',
                          color: trade.pnl >= 0 ? 'var(--green)' : 'var(--red)',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          fontSize: '13px',
                          fontFeatureSettings: '"tnum" 1, "zero" 1',
                        }}
                      >
                        {trade.pnl >= 0 ? `+$${trade.pnl}` : `-$${Math.abs(trade.pnl)}`}
                      </td>
                      <td
                        style={{
                          padding: '10px 14px',
                          color: 'var(--text-2)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '12px',
                          fontFeatureSettings: '"tnum" 1, "zero" 1',
                        }}
                      >
                        {Number(trade.rr).toFixed(1)}R
                      </td>
                      <td
                        style={{
                          padding: '10px 14px',
                          color: trade.risk > 2 ? 'var(--amber)' : 'var(--text-2)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '12px',
                          fontFeatureSettings: '"tnum" 1, "zero" 1',
                        }}
                      >
                        {trade.risk}%
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {trade.emotion === '—' ? (
                          <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>—</span>
                        ) : (
                          <EmotionBadge emotion={trade.emotion} />
                        )}
                      </td>
                      <td
                        style={{
                          padding: '10px 14px',
                          color: 'var(--text-3)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                        }}
                      >
                        {trade.session}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>

          {/* Live Trade Evaluation Widget */}
          <div
            style={{
              ...institutionalCardStyle,
              padding: '16px 18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--green)',
                    animation: 'pulse 1.8s infinite',
                    display: 'inline-block',
                  }}
                />
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#FFFFFF' }}>Live Trade Evaluation</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>EURUSD · Long</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              {[
                { label: 'Alignment', value: '79', color: 'var(--green)' },
                { label: 'Discipline', value: '82', color: 'var(--accent)' },
                { label: 'Risk Level', value: 'MOD', color: 'var(--amber)' },
                { label: 'Session Fit', value: 'HIGH', color: 'var(--green)' },
              ].map(s => (
                <div
                  key={s.label}
                  style={{
                    background: 'var(--surface-2)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{s.label}</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: s.color, fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                background: 'rgba(245, 166, 35, 0.08)',
                border: '1px solid rgba(245, 166, 35, 0.25)',
                borderRadius: '6px',
                padding: '10px 12px',
                fontSize: '11.5px',
                lineHeight: 1.5,
                color: 'var(--text-2)',
              }}
            >
              ⚠️ Matches your London breakout pattern, but risk at <strong style={{ color: 'var(--text)' }}>1.8%</strong> exceeds optimal <strong style={{ color: 'var(--text)' }}>1.2%</strong> threshold.
            </div>
          </div>

          {/* Behavioral Flags */}
          <div style={institutionalCardStyle}>
            <div style={cardHeaderStyle}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>Behavioral Flags</span>
              <Link
                href="/behavior"
                className="interactive-btn"
                style={{
                  fontSize: '11px',
                  color: 'var(--accent)',
                  textDecoration: 'none',
                  fontFamily: 'var(--font-mono)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>Analysis</span>
                <ChevronRight size={13} />
              </Link>
            </div>

            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {flagsList.map(flag => {
                const isHigh = flag.severity === 'high'
                const isMed = flag.severity === 'medium'
                const dotColor = isHigh ? 'var(--red)' : isMed ? 'var(--amber)' : 'var(--green)'

                return (
                  <div
                    key={flag.type}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: dotColor,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 500 }}>
                        {flag.type}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        color: dotColor,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {flag.count} {flag.count === 1 ? 'event' : 'events'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Session Performance */}
          <div style={institutionalCardStyle}>
            <div style={cardHeaderStyle}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>Session Win Rates</span>
              <span style={{ fontSize: '10.5px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>UTC</span>
            </div>

            <div style={{ padding: '14px 14px 8px' }}>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={sessionChartData} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" vertical={false} />
                  <XAxis
                    dataKey="session"
                    tick={{ fontSize: 9.5, fill: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 9.5, fill: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border-2)',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text)',
                    }}
                    formatter={(v: any) => [`${v}%`, 'Win Rate']}
                  />
                  <Bar dataKey="wr" radius={[3, 3, 0, 0]}>
                    {sessionChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.wr >= 65 ? 'var(--green)' : entry.wr >= 55 ? 'var(--accent)' : 'var(--amber)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '6px',
                  marginTop: '10px',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border)',
                }}
              >
                {sessionChartData.map(s => (
                  <div
                    key={s.session}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: 'var(--surface-2)',
                    }}
                  >
                    <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>{s.session}</span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        color: s.wr >= 65 ? 'var(--green)' : s.wr >= 55 ? 'var(--accent)' : 'var(--amber)',
                      }}
                    >
                      {s.wr}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Emotional Breakdown */}
          <div style={institutionalCardStyle}>
            <div style={cardHeaderStyle}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>Emotional Distribution</span>
              <span style={{ fontSize: '10.5px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>% Trades</span>
            </div>

            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {emotionsList.map(e => (
                <div key={e.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-2)' }}>{e.label}</span>
                    <span style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: e.color }}>
                      {e.pct}%
                    </span>
                  </div>
                  <div style={{ height: '4px', background: 'var(--surface-3)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${e.pct}%`,
                        background: e.color,
                        borderRadius: '2px',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Exposure Meter */}
          <div style={institutionalCardStyle}>
            <div style={cardHeaderStyle}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>Risk Exposure Range</span>
              <span style={{ fontSize: '10.5px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>Guardrail</span>
            </div>
            <div style={{ padding: '14px 16px' }}>
              <RiskMeter currentAvg={avgRiskLive} optimal={1.2} maxAllowed={3.0} />
            </div>
          </div>

        </div>
      </div>

      {/* ── 5. BOTTOM STATS STRIP (6 Equal Stat Cards per AGENTS.md 2.5) ── */}
      <div
        className="dashboard-bottom-strip"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '12px',
        }}
      >
        {[
          { label: 'Win Rate', value: hasLiveTrades ? `${(analytics?.win_rate ?? 59.6).toFixed(1)}%` : '59.6%', color: 'var(--green)' },
          { label: 'Avg R:R', value: hasLiveTrades ? `${(analytics?.avg_reward_risk ?? 2.3).toFixed(1)}R` : '2.3R', color: 'var(--green)' },
          { label: 'Max Drawdown', value: hasLiveTrades ? `−${(analytics?.max_drawdown ?? 4.2).toFixed(1)}%` : '−4.2%', color: 'var(--red)' },
          { label: 'Profit Factor', value: hasLiveTrades ? (analytics?.profit_factor ?? 1.87).toFixed(2) : '1.87', color: 'var(--amber)' },
          { label: 'Net P&L', value: hasLiveTrades ? `+$${Math.round(analytics?.net_pnl ?? 1247).toLocaleString()}` : '+$1,247', color: 'var(--green)' },
          { label: 'Best Streak', value: hasLiveTrades ? `${analytics?.max_win_streak ?? 6} wins` : '6 wins', color: 'var(--green)' },
        ].map(stat => (
          <div
            key={stat.label}
            className="dashboard-stat-card"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '14px 16px',
              minWidth: 0,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                fontSize: '10.5px',
                color: 'var(--text-3)',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                marginBottom: '6px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {stat.label}
            </div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: stat.color,
                fontFamily: 'var(--font-mono)',
                fontFeatureSettings: '"tnum" 1, "zero" 1',
                lineHeight: 1.1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
