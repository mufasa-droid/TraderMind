'use client'

import { useState, useEffect } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis,
  ZAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell
} from 'recharts'
import {
  Brain, AlertTriangle, Zap, ShieldAlert, Sparkles,
  TrendingDown, TrendingUp, Clock, Activity, Target
} from 'lucide-react'
import type { PerformanceAnalytics, Trade, BehavioralFlag } from '@/types'

// ── DEFAULT DATA (AGENTS.md Section 2.6) ─────────────────────
const RADAR_DATA = [
  { subject: 'Discipline', score: 78, fullMark: 100 },
  { subject: 'Risk Mgmt', score: 61, fullMark: 100 },
  { subject: 'Consistency', score: 84, fullMark: 100 },
  { subject: 'Emotional', score: 72, fullMark: 100 },
  { subject: 'Entry Quality', score: 79, fullMark: 100 },
  { subject: 'Exit Quality', score: 58, fullMark: 100 },
]

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
  { date: 'May 26', event: 'Revenge trading detected after EURUSD stop-out. Entered GBPJPY within 4 minutes of loss.', type: 'danger', delta: '−8 pts' },
  { date: 'May 25', event: 'Calm & focused across all 3 trades. London session discipline score hit weekly high.', type: 'positive', delta: '+5 pts' },
  { date: 'May 24', event: 'Post-win risk creep detected. Risk jumped from 1.1% to 2.1% after 2 consecutive wins.', type: 'warning', delta: '−4 pts' },
  { date: 'May 23', event: 'Perfect session: 2 trades, both journaled, all rules respected. Best behavioral day this month.', type: 'positive', delta: '+8 pts' },
  { date: 'May 22', event: 'FOMO entry on BTCUSD during a news spike. Setup did not meet standard criteria.', type: 'warning', delta: '−3 pts' },
]

const ALERTS = [
  {
    severity: 'critical',
    color: 'var(--red)',
    bg: 'rgba(255, 95, 95, 0.05)',
    border: 'rgba(255, 95, 95, 0.22)',
    glow: 'rgba(255, 95, 95, 0.15)',
    icon: ShieldAlert,
    title: 'Revenge Trading After London Losses',
    stat: '−$485 Impact',
    desc: '3 revenge trades this month, all entered within 5 minutes of a loss. Combined cost: −$485. Average loss on these trades: −$162 vs your −$28 average.',
  },
  {
    severity: 'warning',
    color: 'var(--amber)',
    bg: 'rgba(245, 166, 35, 0.05)',
    border: 'rgba(245, 166, 35, 0.22)',
    glow: 'rgba(245, 166, 35, 0.15)',
    icon: AlertTriangle,
    title: 'Post-Win Risk Creep Detected',
    stat: '1.1% → 1.9% Risk',
    desc: 'After 3+ consecutive wins, your average risk increases from 1.1% to 1.9%. Detected 6 times this month — all 6 trades following a win streak produced below-average R:R.',
  },
  {
    severity: 'insight',
    color: 'var(--accent)',
    bg: 'rgba(108, 142, 255, 0.05)',
    border: 'rgba(108, 142, 255, 0.22)',
    glow: 'rgba(108, 142, 255, 0.15)',
    icon: Sparkles,
    title: 'Best State: Calm & Focused',
    stat: '71% Win Rate',
    desc: '58% of trades taken while calm or focused. Win rate in this state: 71% vs 38% in negative emotional states. Your best trades consistently have stress ≤3/10.',
  },
]

// ── APPLE GLASS PANEL STYLES ─────────────────────────────────
const glassCardStyle = {
  background: 'rgba(17, 19, 24, 0.72)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid var(--border)',
  borderRadius: '14px',
  boxShadow: 'var(--glass-highlight)',
  overflow: 'hidden' as const,
  position: 'relative' as const,
}

const cardHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 18px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
}

// ── CUSTOM GLASS TOOLTIPS ────────────────────────────────────
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
        background: 'rgba(17, 19, 24, 0.94)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '10px',
        padding: '10px 14px',
        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        minWidth: '160px',
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
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
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
              boxShadow: `0 0 6px ${emotionColor}`,
            }}
          />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#FFFFFF' }}>{emotionName} State</span>
        </div>
        <span style={{ fontSize: '9px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>TRADE</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
          <span style={{ color: 'var(--text-2)' }}>Reward:Risk</span>
          <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: item.rr >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {item.rr >= 0 ? '+' : ''}{item.rr.toFixed(1)}R
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
          <span style={{ color: 'var(--text-2)' }}>Realized P&L</span>
          <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: item.pnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
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
        background: 'rgba(17, 19, 24, 0.94)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '10px',
        padding: '10px 14px',
        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        minWidth: '150px',
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
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#FFFFFF' }}>
          {item.hour} UTC
        </span>
        <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
          {item.trades} trades
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>Win Rate</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>
          {item.wr}%
        </span>
      </div>
    </div>
  )
}

export default function BehaviorPage() {
  const [data, setData] = useState<{
    analytics?: PerformanceAnalytics
    recent_trades?: Trade[]
    behavioral_flags?: BehavioralFlag[]
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch('/api/behavioral/analytics?range=1M', { cache: 'no-store' })
      .then(async r => {
        if (!r.ok) throw new Error(await r.text())
        return r.json()
      })
      .then(j => {
        if (!cancelled) setData(j)
      })
      .catch(() => {
        // graceful demo fallback
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const analytics = data?.analytics ?? null
  const recentTrades = data?.recent_trades ?? []
  const flags = data?.behavioral_flags ?? []
  const hasLiveTrades = (analytics?.total_trades ?? 0) > 0

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
        maxWidth: '1160px',
        margin: '0 auto',
        width: '100%',
        minWidth: 0,
        overflowX: 'clip',
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
          <span>INTELLIGENCE</span>
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
                  borderRadius: '9px',
                  background: 'linear-gradient(135deg, rgba(108, 142, 255, 0.2), rgba(180, 142, 255, 0.15))',
                  border: '1px solid rgba(108, 142, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent)',
                  boxShadow: '0 0 16px rgba(108, 142, 255, 0.25)',
                }}
              >
                <Brain size={18} />
              </div>
              <h1
                style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                  color: '#FFFFFF',
                }}
              >
                Behavioral Intelligence
              </h1>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
              {loading ? 'Synthesizing psychological telemetry…' : `47 closed trades · Psychological profile, emotional biases & decision analytics`}
            </p>
          </div>

          {/* Quick Telemetry Summary Pills */}
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
                padding: '5px 10px',
                borderRadius: '9999px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-2)',
              }}
            >
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--green)' }} />
              <span>Optimal: <strong style={{ color: '#FFFFFF' }}>08:00–12:00 UTC</strong></span>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 10px',
                borderRadius: '9999px',
                background: 'rgba(255, 95, 95, 0.08)',
                border: '1px solid rgba(255, 95, 95, 0.2)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--red)',
              }}
            >
              <span>Revenge Risk: <strong style={{ color: 'var(--red)' }}>6.4%</strong></span>
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
              className="apple-glass-card"
              style={{
                ...glassCardStyle,
                background: alert.bg,
                borderColor: alert.border,
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'border-color 0.15s ease, background 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = alert.color
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = alert.border
                e.currentTarget.style.background = alert.bg
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
                        background: 'rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: alert.color,
                        boxShadow: `0 0 10px ${alert.glow}`,
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
                      {alert.severity}
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
                      borderRadius: '9999px',
                      border: `1px solid ${alert.border}`,
                    }}
                  >
                    {alert.stat}
                  </span>
                </div>

                <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px', color: '#FFFFFF' }}>
                  {alert.title}
                </div>

                <p style={{ fontSize: '12.5px', lineHeight: 1.6, color: 'var(--text-2)', margin: 0 }}>
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
        <div className="apple-glass-card" style={glassCardStyle}>
          <div style={cardHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={15} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                Behavioral Profile Radar
              </span>
            </div>
            <span style={{ fontSize: '10.5px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
              6 Target Dimensions
            </span>
          </div>

          <div style={{ padding: '16px 10px 8px', width: '100%', minWidth: 0, overflow: 'hidden' }}>
            <ResponsiveContainer width="100%" height={270}>
              <RadarChart data={radarData} margin={{ top: 12, right: 32, bottom: 12, left: 32 }}>
                <PolarGrid stroke="rgba(255, 255, 255, 0.08)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fontSize: 11, fill: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}
                />
                <Radar
                  dataKey="score"
                  stroke="var(--accent)"
                  fill="var(--accent)"
                  fillOpacity={0.2}
                  strokeWidth={2}
                  dot={{ fill: 'var(--accent)', r: 3.5, stroke: 'var(--surface)', strokeWidth: 1.5 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panel 2: Emotion vs Reward:Risk Scatter Chart */}
        <div className="apple-glass-card" style={glassCardStyle}>
          <div style={cardHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={15} style={{ color: 'var(--green)' }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                Emotion vs. Reward:Risk (R)
              </span>
            </div>
            <span style={{ fontSize: '10.5px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
              Position Size Scaled
            </span>
          </div>

          <div style={{ padding: '14px 10px 6px' }}>
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" />
                <XAxis
                  dataKey="emotion"
                  type="number"
                  domain={[0.5, 5.5]}
                  ticks={[1, 2, 3, 4, 5]}
                  tickFormatter={(v: number) => EMOTION_LABELS[v] ?? ''}
                  tick={{ fontSize: 10, fill: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="rr"
                  tick={{ fontSize: 10, fill: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${v}R`}
                />
                <ZAxis dataKey="size" range={[50, 220]} />
                <Tooltip content={<CustomScatterTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255, 255, 255, 0.15)' }} />
                {scatterData.map((d: { emotion: number; rr: number; pnl: number; size: number }, i: number) => (
                  <Scatter
                    key={i}
                    data={[d]}
                    fill={EMOTION_COLORS[d.emotion] ?? 'var(--accent)'}
                    fillOpacity={0.8}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>

            {/* Scatter Legend */}
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', padding: '6px 0 10px', flexWrap: 'wrap' }}>
              {Object.entries(EMOTION_LABELS).map(([k, label]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: EMOTION_COLORS[Number(k)],
                      boxShadow: `0 0 6px ${EMOTION_COLORS[Number(k)]}`,
                    }}
                  />
                  <span style={{ fontSize: '10.5px', color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Panel 3: Hourly Win Rate Bar Chart */}
        <div className="apple-glass-card" style={glassCardStyle}>
          <div style={cardHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={15} style={{ color: 'var(--teal)' }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                Win Rate by Hour (UTC)
              </span>
            </div>
            <span style={{ fontSize: '10.5px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
              24h Session Distribution
            </span>
          </div>

          <div style={{ padding: '16px 14px 10px' }}>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={HOURLY_DATA} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" vertical={false} />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 9.5, fill: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 9.5, fill: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip content={<CustomHourlyTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }} />
                <Bar dataKey="wr" radius={[4, 4, 0, 0]}>
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
        <div className="apple-glass-card" style={glassCardStyle}>
          <div style={cardHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={15} style={{ color: 'var(--purple)' }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                Behavioral Event Log
              </span>
            </div>
            <span style={{ fontSize: '10.5px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
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
                    padding: '6px 8px',
                    borderRadius: '8px',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      marginTop: '6px',
                      flexShrink: 0,
                      background: dotColor,
                      boxShadow: `0 0 6px ${dotColor}`,
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
                          fontFeatureSettings: '"tnum" 1',
                          background: item.delta.startsWith('+') ? 'rgba(62, 207, 142, 0.1)' : 'rgba(255, 95, 95, 0.1)',
                          padding: '1px 6px',
                          borderRadius: '9999px',
                          border: `1px solid ${item.delta.startsWith('+') ? 'rgba(62, 207, 142, 0.25)' : 'rgba(255, 95, 95, 0.25)'}`,
                        }}
                      >
                        {item.delta}
                      </span>
                    </div>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>
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
