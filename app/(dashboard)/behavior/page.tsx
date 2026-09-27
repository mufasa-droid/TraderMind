'use client'

import { useState, useEffect } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis,
  ZAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell
} from 'recharts'
import {
  Brain, AlertTriangle, ShieldAlert, Sparkles,
  Activity, Target, Clock, RefreshCw
} from 'lucide-react'
import type { PerformanceAnalytics, Trade, BehavioralFlag } from '@/types'

// ── DEFAULT DEMO DATA (AGENTS.md Section 2.6 & Section 10) ────
const RADAR_DATA = [
  { subject: 'Discipline', score: 78, fullMark: 100 },
  { subject: 'Risk Mgmt', score: 61, fullMark: 100 },
  { subject: 'Consistency', score: 84, fullMark: 100 },
  { subject: 'Emotional', score: 72, fullMark: 100 },
  { subject: 'Entry Quality', score: 79, fullMark: 100 },
  { subject: 'Exit Quality', score: 58, fullMark: 100 },
]

const EMOTION_LABELS: Record<number, string> = {
  1: 'Calm',
  2: 'Neutral',
  3: 'FOMO',
  4: 'Revenge',
  5: 'Stressed',
}

const EMOTION_COLORS: Record<number, string> = {
  1: 'var(--green)',
  2: 'var(--accent)',
  3: 'var(--amber)',
  4: 'var(--red)',
  5: 'var(--red)',
}

const SCATTER_DATA = [
  { emotion: 1, rr: 2.4, pnl: 312, size: 100 },
  { emotion: 1, rr: 3.1, pnl: 540, size: 120 },
  { emotion: 1, rr: 1.9, pnl: 228, size: 90 },
  { emotion: 1, rr: 1.7, pnl: 187, size: 80 },
  { emotion: 2, rr: 2.8, pnl: 430, size: 110 },
  { emotion: 3, rr: -0.6, pnl: -95, size: 70 },
  { emotion: 3, rr: -1.0, pnl: -142, size: 80 },
  { emotion: 4, rr: -1.0, pnl: -180, size: 90 },
  { emotion: 5, rr: -1.0, pnl: -220, size: 100 },
]

const HOURLY_DATA = [
  { hour: '00:00', wr: 48, trades: 1 },
  { hour: '02:00', wr: 45, trades: 1 },
  { hour: '04:00', wr: 55, trades: 2 },
  { hour: '06:00', wr: 52, trades: 2 },
  { hour: '08:00', wr: 65, trades: 8 },  // London open
  { hour: '10:00', wr: 70, trades: 7 },  // London peak
  { hour: '12:00', wr: 68, trades: 6 },  // Overlap
  { hour: '14:00', wr: 50, trades: 5 },  // NY open
  { hour: '16:00', wr: 44, trades: 4 },  // NY afternoon
  { hour: '18:00', wr: 38, trades: 2 },
  { hour: '20:00', wr: 42, trades: 1 },
  { hour: '22:00', wr: 40, trades: 1 },
]

interface TimelineItem {
  date: string
  event: string
  type: 'danger' | 'warning' | 'positive'
  delta: string
}

const TIMELINE: TimelineItem[] = [
  { date: 'May 26', event: 'Revenge trading detected after EURUSD stop-out. Entered GBPJPY within 4 minutes of loss. Violated 30-minute rule.', type: 'danger', delta: '−8 pts' },
  { date: 'May 25', event: 'Calm and focused across all 3 trades. London session discipline score hit weekly high of 84.', type: 'positive', delta: '+5 pts' },
  { date: 'May 24', event: 'Post-win risk creep detected. Risk jumped from 1.1% to 2.1% after 2 consecutive wins.', type: 'warning', delta: '−4 pts' },
  { date: 'May 23', event: 'Perfect session: 2 trades, both journaled, all rules respected. Best behavioral day this month.', type: 'positive', delta: '+8 pts' },
  { date: 'May 22', event: 'FOMO entry on BTCUSD during a news spike. Setup did not meet standard entry criteria.', type: 'warning', delta: '−3 pts' },
]

const ALERTS = [
  {
    type: 'critical',
    icon: ShieldAlert,
    color: 'var(--red)',
    bg: 'rgba(255, 95, 95, 0.06)',
    border: 'rgba(255, 95, 95, 0.22)',
    title: 'Revenge Trading After London Losses',
    stat: '−$485 Impact',
    desc: '3 revenge trades this month, all entered within 5 minutes of a loss. Combined cost: −$485. Average loss on these trades: −$162 vs your −$28 average on planned trades.',
  },
  {
    type: 'warning',
    icon: AlertTriangle,
    color: 'var(--amber)',
    bg: 'rgba(245, 166, 35, 0.06)',
    border: 'rgba(245, 166, 35, 0.22)',
    title: 'Post-Win Risk Creep Detected',
    stat: '1.1% → 1.9% Risk',
    desc: 'After 3+ consecutive wins, your average risk increases from 1.1% to 1.9% — a 73% increase. Detected 6 times this month. All 6 produced below-average R:R results.',
  },
  {
    type: 'insight',
    icon: Sparkles,
    color: 'var(--accent)',
    bg: 'rgba(108, 142, 255, 0.06)',
    border: 'rgba(108, 142, 255, 0.22)',
    title: 'Best State: Calm & Focused',
    stat: '71% Win Rate',
    desc: '58% of trades taken while calm or focused produce a 71% win rate vs 38% in negative emotional states. Trades entered with stress ≤3/10 are your statistically strongest setups.',
  },
]

type RangeLabel = '1W' | '1M' | '3M' | 'YTD' | 'ALL'
const RANGES: RangeLabel[] = ['1W', '1M', '3M', 'YTD', 'ALL']

// ── CUSTOM INSTITUTIONAL TOOLTIPS (SOLID OPAQUE, ZERO BLUR) ───
interface CustomScatterTooltipProps {
  active?: boolean
  payload?: Array<{
    payload: {
      emotion: number
      rr: number
      pnl: number
      size: number
    }
  }>
}

function CustomScatterTooltip({ active, payload }: CustomScatterTooltipProps) {
  if (!active || !payload || !payload.length) return null
  const item = payload[0]?.payload
  if (!item) return null

  const emotionName = EMOTION_LABELS[item.emotion] ?? 'Unknown'
  const emotionColor = EMOTION_COLORS[item.emotion] ?? 'var(--accent)'

  return (
    <div
      style={{
        background: '#161920',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        padding: '10px 14px',
        boxShadow: '0 12px 28px rgba(0, 0, 0, 0.6)',
        minWidth: '160px',
        fontFamily: 'var(--font-mono)',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          paddingBottom: '6px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
          marginBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: emotionColor,
            }}
          />
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text)' }}>{emotionName} State</span>
        </div>
        <span style={{ fontSize: '9px', color: 'var(--text-3)' }}>EXECUTION</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
          <span style={{ color: 'var(--text-2)' }}>Reward:Risk</span>
          <span style={{ fontWeight: 700, color: item.rr >= 0 ? 'var(--green)' : 'var(--red)', fontVariantNumeric: 'tabular-nums' }}>
            {item.rr >= 0 ? '+' : ''}{item.rr.toFixed(1)}R
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
          <span style={{ color: 'var(--text-2)' }}>Realized P&L</span>
          <span style={{ fontWeight: 700, color: item.pnl >= 0 ? 'var(--green)' : 'var(--red)', fontVariantNumeric: 'tabular-nums' }}>
            {item.pnl >= 0 ? `+$${item.pnl}` : `-$${Math.abs(item.pnl)}`}
          </span>
        </div>
      </div>
    </div>
  )
}

interface CustomHourlyTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    payload: {
      hour: string
      wr: number
      trades: number
    }
  }>
}

function CustomHourlyTooltip({ active, payload }: CustomHourlyTooltipProps) {
  if (!active || !payload || !payload.length) return null
  const item = payload[0]?.payload
  if (!item) return null

  const color = item.wr >= 65 ? 'var(--green)' : item.wr >= 50 ? 'var(--accent)' : 'var(--red)'

  return (
    <div
      style={{
        background: '#161920',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        padding: '10px 14px',
        boxShadow: '0 12px 28px rgba(0, 0, 0, 0.6)',
        minWidth: '150px',
        fontFamily: 'var(--font-mono)',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
          paddingBottom: '5px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text)' }}>
          {item.hour} UTC
        </span>
        <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>
          {item.trades} trades
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>Win Rate</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
          {item.wr}%
        </span>
      </div>
    </div>
  )
}

export default function BehaviorPage() {
  const [range, setRange] = useState<RangeLabel>('1M')
  const [data, setData] = useState<{
    analytics?: PerformanceAnalytics
    recent_trades?: Trade[]
    behavioral_flags?: BehavioralFlag[]
  } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    fetch(`/api/behavioral/analytics?range=${range}`)
      .then(async r => {
        if (!r.ok) throw new Error(await r.text())
        return r.json()
      })
      .then(j => {
        if (!cancelled && j && j.analytics) {
          setData(j)
        }
      })
      .catch(() => {
        // graceful demo fallback
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [range])

  const analytics = data?.analytics ?? null
  const recentTrades = data?.recent_trades ?? []
  const flags = data?.behavioral_flags ?? []
  const hasLiveTrades = Boolean(analytics && analytics.total_trades > 0)

  // Calibrated or live radar data
  const radarData = hasLiveTrades ? [
    { subject: 'Discipline', score: analytics!.discipline_score, fullMark: 100 },
    { subject: 'Risk Mgmt', score: analytics!.risk_quality_score, fullMark: 100 },
    { subject: 'Consistency', score: analytics!.behavioral_consistency_score, fullMark: 100 },
    { subject: 'Emotional', score: analytics!.emotional_stability_score, fullMark: 100 },
    { subject: 'Entry Quality', score: Math.min(100, Math.round(50 + analytics!.win_rate * 0.5)), fullMark: 100 },
    { subject: 'Exit Quality', score: Math.min(100, Math.round(40 + (analytics!.avg_reward_risk || 1.5) * 15)), fullMark: 100 },
  ] : RADAR_DATA

  // Calibrated or live scatter data
  const scatterData = hasLiveTrades && recentTrades.length > 0
    ? recentTrades.slice(0, 9).map((t: Trade) => {
        const rr = t.reward_risk_ratio ?? (t.net_pnl && t.net_pnl > 0 ? 1.5 : -1)
        const pnl = t.net_pnl ?? 0
        let emotion = 1
        if (pnl < 0 && (t.risk_pct ?? 0) > 2) emotion = 4
        else if (pnl < 0) emotion = 3
        else if ((t.risk_pct ?? 0) > 1.8) emotion = 2
        return { emotion, rr, pnl, size: 70 + Math.min(60, Math.abs(pnl) / 10) }
      })
    : SCATTER_DATA

  // Calibrated or live timeline
  const timelineItems: TimelineItem[] = hasLiveTrades && flags.length > 0
    ? flags.slice(0, 5).map((f: BehavioralFlag) => ({
        date: new Date(f.detected_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        event: f.description,
        type: (f.severity === 'high' ? 'danger' : f.severity === 'medium' ? 'warning' : 'positive') as 'danger' | 'warning' | 'positive',
        delta: f.severity === 'high' ? '−8 pts' : f.severity === 'medium' ? '−4 pts' : '+2 pts',
      }))
    : TIMELINE

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        minWidth: 0,
      }}
    >
      <style>{`
        @media (max-width: 767px) {
          .behavior-alerts-grid { grid-template-columns: 1fr !important; gap: 10px !important; }
          .behavior-charts-grid { grid-template-columns: 1fr !important; gap: 14px !important; }
          .behavior-header-row { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .behavior-alerts-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 10px !important; }
          .behavior-charts-grid { grid-template-columns: 1fr !important; gap: 14px !important; }
        }
        @media (min-width: 1024px) {
          .behavior-alerts-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 14px !important; }
          .behavior-charts-grid { grid-template-columns: 1fr 1fr !important; gap: 16px !important; }
        }
      `}</style>

      {/* ── 1. HEADER ROW ── */}
      <div>
        <div
          style={{
            fontSize: '10px',
            fontWeight: 700,
            color: 'var(--accent)',
            letterSpacing: '0.8px',
            fontFamily: 'var(--font-mono)',
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            textTransform: 'uppercase',
          }}
        >
          <span>TRADERMIND</span>
          <span style={{ color: 'var(--text-3)' }}>/</span>
          <span>BEHAVIORAL INTELLIGENCE</span>
        </div>

        <div
          className="behavior-header-row"
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent)',
                }}
              >
                <Brain size={18} />
              </div>
              <h1
                style={{
                  fontSize: '26px',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                  color: 'var(--text)',
                }}
              >
                Behavioral Intelligence
              </h1>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
              {loading ? 'Synthesizing psychological telemetry…' : `Deep psychological analysis · Cognitive patterns & decision biases`}
            </p>
          </div>

          {/* Quick Telemetry & Date Range Picker */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-2)',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)' }} />
              <span>Optimal: <strong style={{ color: 'var(--text)' }}>08:00–12:00 UTC</strong></span>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(255, 95, 95, 0.08)',
                border: '1px solid rgba(255, 95, 95, 0.2)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--red)',
              }}
            >
              <span>Revenge Risk: <strong>6.4%</strong></span>
            </div>

            {/* Date Range Picker */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '2px',
              }}
            >
              {RANGES.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  style={{
                    padding: '4px 9px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                    background: range === r ? 'var(--surface-3)' : 'transparent',
                    color: range === r ? 'var(--text)' : 'var(--text-3)',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. TOP 3 PATTERN ALERT CARDS ── */}
      <div className="behavior-alerts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
        {ALERTS.map(alert => {
          const Icon = alert.icon
          return (
            <div
              key={alert.title}
              style={{
                background: alert.bg,
                border: `1px solid ${alert.border}`,
                borderRadius: '10px',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: alert.color,
                      }}
                    >
                      <Icon size={14} />
                    </div>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        color: alert.color,
                        fontFamily: 'var(--font-mono)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.8px',
                      }}
                    >
                      {alert.type}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '10.5px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: alert.color,
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      border: `1px solid ${alert.border}`,
                    }}
                  >
                    {alert.stat}
                  </span>
                </div>

                <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: 'var(--text)' }}>
                  {alert.title}
                </div>

                <p style={{ fontSize: '12px', lineHeight: 1.6, color: 'var(--text-2)', margin: 0 }}>
                  {alert.desc}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── 3. 2x2 CORE CHARTS GRID ── */}
      <div className="behavior-charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Panel 1: Behavioral Profile Radar Chart */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={14} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                Behavioral Profile Radar
              </span>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
              6 Target Dimensions
            </span>
          </div>

          <div style={{ padding: '16px 12px 8px', width: '100%', minWidth: 0, overflow: 'hidden' }}>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid stroke="rgba(255, 255, 255, 0.07)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fontSize: 11, fill: '#8B90A0', fontFamily: 'var(--font-mono)' }}
                />
                <Radar
                  dataKey="score"
                  stroke="var(--accent)"
                  fill="var(--accent)"
                  fillOpacity={0.15}
                  strokeWidth={1.5}
                  dot={{ fill: 'var(--accent)', r: 3 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panel 2: Emotion vs Reward:Risk Scatter Chart */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={14} style={{ color: 'var(--green)' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                Emotion vs. Reward:Risk (R)
              </span>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
              Position Size Scaled
            </span>
          </div>

          <div style={{ padding: '14px 12px 6px' }}>
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" />
                <XAxis
                  dataKey="emotion"
                  type="number"
                  domain={[0.5, 5.5]}
                  ticks={[1, 2, 3, 4, 5]}
                  tickFormatter={(v: number) => EMOTION_LABELS[v] ?? ''}
                  tick={{ fontSize: 10, fill: '#8B90A0', fontFamily: 'var(--font-mono)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="rr"
                  tick={{ fontSize: 10, fill: '#8B90A0', fontFamily: 'var(--font-mono)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${v}R`}
                />
                <ZAxis dataKey="size" range={[60, 220]} />
                <Tooltip content={<CustomScatterTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255, 255, 255, 0.15)' }} />
                {scatterData.map((d: { emotion: number; rr: number; pnl: number; size: number }, i: number) => (
                  <Scatter
                    key={i}
                    data={[d]}
                    fill={EMOTION_COLORS[d.emotion] ?? 'var(--accent)'}
                    fillOpacity={0.85}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>

            {/* Scatter Legend Below Chart */}
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', padding: '8px 0 6px', flexWrap: 'wrap' }}>
              {Object.entries(EMOTION_LABELS).map(([k, label]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: EMOTION_COLORS[Number(k)],
                    }}
                  />
                  <span style={{ fontSize: '10.5px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Panel 3: Hourly Win Rate Bar Chart */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={14} style={{ color: 'var(--teal)' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                Win Rate by Hour (UTC)
              </span>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
              24h Session Distribution
            </span>
          </div>

          <div style={{ padding: '16px 14px 10px' }}>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={HOURLY_DATA} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" vertical={false} />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 9.5, fill: '#8B90A0', fontFamily: 'var(--font-mono)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 9.5, fill: '#8B90A0', fontFamily: 'var(--font-mono)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip content={<CustomHourlyTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }} />
                <Bar dataKey="wr" radius={[3, 3, 0, 0]}>
                  {HOURLY_DATA.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.wr >= 65 ? 'var(--green)' : entry.wr >= 50 ? 'var(--accent)' : 'var(--red)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panel 4: Behavioral Patterns Timeline */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={14} style={{ color: 'var(--purple)' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                Behavioral Event Log
              </span>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
              May 2026 Audit Trail
            </span>
          </div>

          <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {timelineItems.map((item, i) => {
              const dotColor = item.type === 'danger' ? 'var(--red)' : item.type === 'warning' ? 'var(--amber)' : 'var(--green)'
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                    padding: '4px 0',
                  }}
                >
                  <div
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      marginTop: '6px',
                      flexShrink: 0,
                      background: dotColor,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                        {item.date}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: item.delta.startsWith('+') ? 'var(--green)' : 'var(--red)',
                          fontFamily: 'var(--font-mono)',
                          fontVariantNumeric: 'tabular-nums',
                          background: item.delta.startsWith('+') ? 'rgba(62, 207, 142, 0.1)' : 'rgba(255, 95, 95, 0.1)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          border: `1px solid ${item.delta.startsWith('+') ? 'rgba(62, 207, 142, 0.25)' : 'rgba(255, 95, 95, 0.25)'}`,
                        }}
                      >
                        {item.delta}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>
                      {item.event}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
