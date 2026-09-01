'use client'

import { useState, useEffect } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis,
  ZAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell
} from 'recharts'
import { AlertTriangle, TrendingDown, Brain, Zap, ShieldAlert, ArrowUpRight } from 'lucide-react'
import type { PerformanceAnalytics, Trade, BehavioralFlag } from '@/types'

const RADAR_DATA = [
  { subject: 'Discipline', score: 78 },
  { subject: 'Risk Mgmt', score: 61 },
  { subject: 'Consistency', score: 84 },
  { subject: 'Emotional', score: 72 },
  { subject: 'Entry Quality', score: 79 },
  { subject: 'Exit Quality', score: 58 },
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
  1: '#3ECF8E',
  2: '#6C8EFF',
  3: '#F5A623',
  4: '#FF5F5F',
  5: '#FF5F5F',
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

const TIMELINE = [
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
    bg: 'rgba(255,95,95,0.06)',
    border: 'rgba(255,95,95,0.2)',
    icon: '⚠',
    title: 'Revenge Trading After London Losses',
    desc: '3 revenge trades this month, all entered within 5 minutes of a loss. Combined cost: −$485. Average loss on these trades: −$162 vs your −$28 average.',
  },
  {
    severity: 'warning',
    color: 'var(--amber)',
    bg: 'rgba(245,166,35,0.06)',
    border: 'rgba(245,166,35,0.2)',
    icon: '↑',
    title: 'Post-Win Risk Creep Detected',
    desc: 'After 3+ consecutive wins, your average risk increases from 1.1% to 1.9%. Detected 6 times this month — all 6 trades following a win streak produced below-average R:R.',
  },
  {
    severity: 'insight',
    color: 'var(--accent)',
    bg: 'rgba(108,142,255,0.06)',
    border: 'rgba(108,142,255,0.2)',
    icon: '✦',
    title: 'Best State: Calm & Focused',
    desc: '58% of trades taken while calm or focused. Win rate in this state: 71% vs 38% in negative emotional states. Your best trades consistently have stress ≤3/10.',
  },
]

const tooltipStyle = {
  contentStyle: {
    background: '#161920',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '8px',
    fontSize: '11px',
    fontFamily: "'JetBrains Mono', monospace",
    color: '#E8EAF0',
  },
  labelStyle: {
    color: '#8B90A0',
    fontSize: '10px',
    marginBottom: '4px',
  },
  itemStyle: {
    color: '#E8EAF0',
  },
}

export default function BehaviorPage() {
  const [data, setData] = useState<any>(null)
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

  // Dynamic or calibrated radar data
  const radarData = analytics ? [
    { subject: 'Discipline', score: analytics.discipline_score },
    { subject: 'Risk Mgmt', score: analytics.risk_quality_score },
    { subject: 'Consistency', score: analytics.behavioral_consistency_score },
    { subject: 'Emotional', score: analytics.emotional_stability_score },
    { subject: 'Entry Quality', score: Math.min(100, Math.round(50 + analytics.win_rate * 0.5)) },
    { subject: 'Exit Quality', score: Math.min(100, Math.round(40 + (analytics.avg_reward_risk || 1.5) * 15)) },
  ] : RADAR_DATA

  // Dynamic or calibrated scatter data
  const scatterData = analytics && recentTrades.length
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

interface TimelineItem {
  date: string
  event: string
  type: 'danger' | 'warning' | 'positive'
  delta: string
}

  const timelineItems: TimelineItem[] = flags?.length
    ? flags.slice(0, 5).map((f: BehavioralFlag) => ({
        date: new Date(f.detected_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        event: f.description,
        type: (f.severity === 'high' ? 'danger' : f.severity === 'medium' ? 'warning' : 'positive') as 'danger' | 'warning' | 'positive',
        delta: f.severity === 'high' ? '−8 pts' : f.severity === 'medium' ? '−4 pts' : '+2 pts',
      }))
    : (TIMELINE as TimelineItem[])


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '6px',
              background: 'rgba(108,142,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Brain size={16} color="var(--accent)" />
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text)' }}>
              Behavioral Intelligence
            </h1>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            47 closed trades · Psychological profile, emotional biases & decision analytics
          </p>
        </div>
      </div>

      {/* 3 Pattern Alert Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
        {ALERTS.map(alert => (
          <div
            key={alert.title}
            style={{
              padding: '16px',
              borderRadius: '10px',
              background: alert.bg,
              border: `1px solid ${alert.border}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <span style={{ color: alert.color, fontSize: '13px', fontWeight: 700 }}>{alert.icon}</span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: alert.color,
                  fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px'
                }}>
                  {alert.severity}
                </span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: 'var(--text)' }}>
                {alert.title}
              </div>
              <p style={{ fontSize: '12px', lineHeight: 1.6, color: 'var(--text-2)' }}>
                {alert.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 2x2 Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        
        {/* Panel 1: Behavioral Profile Radar Chart */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--text)',
            background: 'var(--surface-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>Behavioral Profile Radar</span>
            <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>6 Dimensions</span>
          </div>
          <div style={{ padding: '12px 0 6px' }}>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid stroke="rgba(255,255,255,0.07)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fontSize: 11, fill: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}
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
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--text)',
            background: 'var(--surface-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>Emotion vs. Reward:Risk (R)</span>
            <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>P&L Scaled</span>
          </div>
          <div style={{ padding: '12px 8px 4px' }}>
            <ResponsiveContainer width="100%" height={230}>
              <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
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
                <ZAxis dataKey="size" range={[40, 200]} />
                <Tooltip
                  {...tooltipStyle}
                  formatter={(v: any, name: any) => {
                    if (name === 'rr') return [`${v}R`, 'R:R Multiple']
                    if (name === 'pnl') return [`$${v}`, 'Realized P&L']
                    return [v, name]
                  }}
                />
                {scatterData.map((d: { emotion: number; rr: number; pnl: number; size: number }, i: number) => (
                  <Scatter
                    key={i}
                    data={[d]}
                    fill={EMOTION_COLORS[d.emotion] ?? 'var(--accent)'}
                    fillOpacity={0.75}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>

            {/* Scatter Legend */}
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', padding: '0 0 10px', flexWrap: 'wrap' }}>
              {Object.entries(EMOTION_LABELS).map(([k, label]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: EMOTION_COLORS[Number(k)] }} />
                  <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Panel 3: Hourly Win Rate Bar Chart */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--text)',
            background: 'var(--surface-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>Win Rate by Hour (UTC)</span>
            <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>Session Distribution</span>
          </div>
          <div style={{ padding: '16px 12px 8px' }}>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={HOURLY_DATA} margin={{ top: 0, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="hour"
                  tick={{ fontSize: 9, fill: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 9, fill: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  {...tooltipStyle}
                  formatter={(v: any) => [`${Number(v).toFixed(0)}%`, 'Win Rate']}
                />
                <Bar dataKey="wr" radius={[3, 3, 0, 0]}>
                  {HOURLY_DATA.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.wr >= 65 ? 'var(--green)' : entry.wr >= 50 ? 'var(--accent)' : 'var(--red)'}
                      opacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panel 4: Behavioral Patterns Timeline */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--text)',
            background: 'var(--surface-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>Behavioral Event Log</span>
            <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>May 2026</span>
          </div>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {timelineItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  marginTop: '5px', flexShrink: 0,
                  background: item.type === 'danger' ? 'var(--red)' : item.type === 'warning' ? 'var(--amber)' : 'var(--green)'
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                      {item.date}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: item.delta.startsWith('+') ? 'var(--green)' : 'var(--red)',
                      fontFamily: 'var(--font-mono)',
                      fontFeatureSettings: '"tnum" 1, "zero" 1'
                    }}>
                      {item.delta}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5 }}>
                    {item.event}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
