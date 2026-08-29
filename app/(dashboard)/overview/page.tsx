'use client'

import { useState, useEffect } from 'react'
import {
  AreaChart, Area, Line, LineChart, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import type { PerformanceAnalytics, Trade, BehavioralFlag } from '@/types'

type RangeLabel = '1W' | '1M' | '3M' | 'YTD'
const RANGE_OPTIONS: RangeLabel[] = ['1W', '1M', '3M', 'YTD']

type AnalyticsResponse = {
  analytics: PerformanceAnalytics
  recent_trades: Trade[]
  behavioral_flags: BehavioralFlag[]
  equity_curve: { date: string; daily_pnl: number; cumulative: number }[]
  range: { start: string; end: string; label: string }
}

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
  { session: 'NY', wr: 48, trades: 15 },
  { session: 'Overlap', wr: 71, trades: 5 },
]
const DEMO_TRADES = [
  { id: '1', symbol: 'EURUSD', direction: 'Long', pnl: 312, rr: 2.4, risk: 1.2, alignment: 91, session: 'London' },
  { id: '2', symbol: 'GBPJPY', direction: 'Short', pnl: -180, rr: -1.0, risk: 2.8, alignment: 31, session: 'London' },
  { id: '3', symbol: 'XAUUSD', direction: 'Long', pnl: 540, rr: 3.1, risk: 1.5, alignment: 88, session: 'Overlap' },
  { id: '4', symbol: 'BTCUSD', direction: 'Long', pnl: -95, rr: -0.6, risk: 1.0, alignment: 54, session: 'New York' },
  { id: '5', symbol: 'USDJPY', direction: 'Short', pnl: 228, rr: 1.9, risk: 1.1, alignment: 82, session: 'London' },
]
const DEMO_FLAGS = [
  { type: 'Revenge Trading', count: 3, severity: 'high' as const },
  { type: 'Post-Win Risk Creep', count: 6, severity: 'medium' as const },
  { type: 'FOMO Entry', count: 2, severity: 'medium' as const },
  { type: 'Rule Violations', count: 1, severity: 'low' as const },
]

const c = {
  green: '#3ecf8e',
  red: '#ff5f5f',
  amber: '#f5a623',
  accent: 'hsl(226, 100%, 71%)',
  purple: '#b48eff',
  bg: 'hsl(222, 20%, 5%)',
  surface: 'hsl(224, 18%, 8%)',
  surface2: 'hsl(224, 16%, 11%)',
  surface3: 'hsl(224, 14%, 14%)',
  border: 'hsl(220, 12%, 14%)',
  text: 'hsl(220, 15%, 92%)',
  text2: 'hsl(220, 10%, 55%)',
  text3: 'hsl(220, 10%, 35%)',
  mono: "'DM Mono', monospace",
  sans: "'Syne', system-ui, sans-serif",
}

const panel = {
  background: c.surface,
  border: `1px solid ${c.border}`,
  borderRadius: '10px',
  overflow: 'hidden' as const,
}
const ph = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '12px 16px', borderBottom: `1px solid ${c.border}`,
}

function ScoreCard({ label, value, delta, barColor }: { label: string; value: number; delta: string; barColor: string }) {
  const isDown = delta.includes('↘') || delta.includes('↓')
  const deltaColor = isDown ? c.red : c.green
  return (
    <div style={{ ...panel, position: 'relative', padding: '16px 16px 14px', overflow: 'hidden' as const }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: barColor, borderRadius: '2px 2px 0 0' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '10px', fontWeight: 600, color: c.text3, textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: c.mono }}>{label}</span>
        <span style={{ fontSize: '11px', fontWeight: 600, color: deltaColor, fontFamily: c.mono }}>{delta}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '8px' }}>
        <span style={{ fontSize: '28px', fontWeight: 800, color: c.text, letterSpacing: '-1.2px', lineHeight: 1 }}>{value}</span>
        <span style={{ fontSize: '14px', fontWeight: 600, color: c.text3 }}>/100</span>
      </div>
      <div style={{ marginTop: '12px', height: '3px', background: c.surface3, borderRadius: '2px' }}>
        <div style={{ height: '3px', borderRadius: '2px', background: barColor, width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  )
}

export default function OverviewPage() {
  const [range, setRange] = useState<RangeLabel>('1M')
  const [data, setData] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/behavioral/analytics?range=${range}`, { cache: 'no-store' })
      .then(async r => { if (!r.ok) throw new Error(await r.text()); return r.json() })
      .then((j: AnalyticsResponse) => { if (!cancelled) setData(j) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [range])

  const a = data?.analytics
  const discipline = a?.discipline_score ?? 78
  const consistency = a?.behavioral_consistency_score ?? 84
  const risk = a?.risk_quality_score ?? 61
  const emotional = a?.emotional_stability_score ?? 72

  const sessionData = a
    ? Object.values(a.session_performance).map(s => ({
        session: s.session === 'new_york' ? 'NY' : s.session.charAt(0).toUpperCase() + s.session.slice(1),
        wr: Math.round(s.win_rate * 10) / 10,
        trades: s.total_trades,
      }))
    : DEMO_SESSION

  const equityData = data?.equity_curve?.length
    ? data.equity_curve.map(p => ({ date: p.date.slice(5), equity: 10000 + p.cumulative, discipline }))
    : DEMO_EQUITY

  const trades = data?.recent_trades?.length
    ? data.recent_trades.slice(0, 5).map(t => ({
        id: t.id, symbol: t.symbol, direction: t.direction === 'long' ? 'Long' : 'Short', pnl: Math.round(t.net_pnl ?? 0),
        rr: t.reward_risk_ratio ?? 0, risk: t.risk_pct ?? 0, alignment: t.alignment_score ?? 50,
        session: t.session === 'new_york' ? 'New York' : t.session.charAt(0).toUpperCase() + t.session.slice(1),
      }))
    : DEMO_TRADES

  const flags = a
    ? Object.entries(a.behavioral_flags).filter(([, v]) => (v as number) > 0).sort((x, y) => (y[1] as number) - (x[1] as number)).slice(0, 4).map(([k, v]) => ({
        type: k.replace(/_/g, ' ').replace(/\b\w/g, s => s.toUpperCase()),
        count: v as number,
        severity: (v as number) > 3 ? 'high' as const : (v as number) > 1 ? 'medium' as const : 'low' as const,
      }))
    : DEMO_FLAGS

  const emotionRows = a?.emotion_distribution
    ? [
        { label: 'Calm / Focused', pct: Math.round(((a.emotion_distribution.calm ?? 0) + (a.emotion_distribution.focused ?? 0)) * 10) / 10, color: c.green },
        { label: 'Overconfident', pct: a.emotion_distribution.overconfident ?? 0, color: c.amber },
        { label: 'FOMO', pct: a.emotion_distribution.fomo ?? 0, color: c.purple },
        { label: 'Revenge / Fear', pct: Math.round(((a.emotion_distribution.revenge_trading ?? 0) + (a.emotion_distribution.fearful ?? 0) + (a.emotion_distribution.stressed ?? 0)) * 10) / 10, color: c.red },
      ]
    : [
        { label: 'Calm / Focused', pct: 58, color: c.green },
        { label: 'Overconfident', pct: 19, color: c.amber },
        { label: 'FOMO', pct: 12, color: c.purple },
        { label: 'Revenge / Fear', pct: 11, color: c.red },
      ]

  const avgRisk = a?.avg_risk_per_trade ?? 1.64

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '1100px', fontFamily: c.sans }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: '10px', fontWeight: 600, color: c.accent, letterSpacing: '1px', fontFamily: c.mono, marginBottom: '6px' }}>
          TRADERMIND <span style={{ color: c.text3 }}>/</span> OVERVIEW
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' as const }}>
          <div>
            <h1 style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.8px', lineHeight: 1, color: c.text }}>Performance Overview</h1>
            <p style={{ fontSize: '11px', color: c.text3, marginTop: '6px', fontFamily: c.mono }}>
              {loading ? 'Loading…' : `May 2026 · ${a?.total_trades ?? 47} trades · ${data ? 'live' : 'MTS synced'}`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '2px', background: c.surface2, padding: '3px', borderRadius: '8px', border: `1px solid ${c.border}` }}>
            {RANGE_OPTIONS.map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                style={{
                  padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, fontFamily: c.mono, border: 'none', cursor: 'pointer', minWidth: '36px',
                  background: range === r ? c.accent : 'transparent',
                  color: range === r ? '#fff' : c.text3,
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Score Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        <ScoreCard label="Discipline Score" value={discipline} delta="↗ 3%" barColor={c.accent} />
        <ScoreCard label="Behavioral Consistency" value={consistency} delta="↗ 7%" barColor={c.green} />
        <ScoreCard label="Risk Quality" value={risk} delta="↘ 4%" barColor={c.amber} />
        <ScoreCard label="Emotional Stability" value={emotional} delta="↗ 11%" barColor={c.purple} />
      </div>

      {/* AI Coach */}
      <div style={{ background: c.surface2, border: `1px solid ${c.border}`, borderRadius: '10px', padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: c.accent, fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px', fontFamily: c.mono }}>
            <span style={{ fontSize: '12px' }}>✦</span> AI COACH · WEEKLY INSIGHT
          </div>
          <a href="/ai-coach" style={{ fontSize: '11px', color: c.accent, textDecoration: 'none', fontFamily: c.mono }}>Full report →</a>
        </div>
        <p style={{ fontSize: '13px', lineHeight: 1.65, color: c.text2 }}>
          Your London session performance is up <span style={{ color: c.green, fontWeight: 700 }}>63%</span> this month. Protect the edge by slowing down after wins — your best results come when you validate every setup before sizing up.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
          <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontFamily: c.mono, fontWeight: 700, letterSpacing: '0.3px', background: 'rgba(62,207,142,0.12)', color: c.green, border: '1px solid rgba(62,207,142,0.25)' }}>LONDON SESSION +63%</span>
          <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontFamily: c.mono, fontWeight: 700, letterSpacing: '0.3px', background: 'rgba(255,95,95,0.10)', color: c.red, border: '1px solid rgba(255,95,95,0.22)' }}>POST-WIN RISK CREEP</span>
          <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontFamily: c.mono, fontWeight: 700, letterSpacing: '0.3px', background: 'rgba(62,207,142,0.12)', color: c.green, border: '1px solid rgba(62,207,142,0.25)' }}>BREAKOUT WR 71%</span>
          <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontFamily: c.mono, fontWeight: 700, letterSpacing: '0.3px', background: 'rgba(255,95,95,0.10)', color: c.red, border: '1px solid rgba(255,95,95,0.22)' }}>REVENGE TRADING ×3</span>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px' }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Equity */}
          <div style={panel}>
            <div style={ph}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Equity Curve</span>
              <div style={{ display: 'flex', gap: '16px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: c.text3, fontFamily: c.mono }}><span style={{ width: '12px', height: '2px', background: c.green, display: 'inline-block' }} />Equity</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: c.text3, fontFamily: c.mono }}><span style={{ width: '12px', height: '2px', background: c.accent, display: 'inline-block' }} />Discipline</span>
              </div>
            </div>
            <div style={{ padding: '12px 8px 4px' }}>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={equityData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="eqGrad3" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c.green} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={c.green} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: c.text3, fontFamily: c.mono }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="equity" domain={['auto', 'auto']} tick={{ fontSize: 10, fill: c.text3, fontFamily: c.mono }} axisLine={false} tickLine={false} tickFormatter={v => `$${(Number(v) / 1000).toFixed(1)}k`} />
                  <YAxis yAxisId="disc" orientation="right" domain={[50, 100]} tick={{ fontSize: 10, fill: c.text3, fontFamily: c.mono }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: c.surface2, border: `1px solid ${c.border}`, borderRadius: '8px', fontSize: '11px', fontFamily: c.mono }} />
                  <Area yAxisId="equity" type="monotone" dataKey="equity" stroke={c.green} strokeWidth={1.5} fill="url(#eqGrad3)" dot={false} />
                  <Line yAxisId="disc" type="monotone" dataKey="discipline" stroke={c.accent} strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Trades */}
          <div style={panel}>
            <div style={ph}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Recent Trades</span>
              <a href="/trades" style={{ fontSize: '11px', color: c.accent, textDecoration: 'none', fontFamily: c.mono }}>view all →</a>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Pair', 'P&L', 'R:R', 'Risk', 'Session', 'Alignment'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', fontSize: '10px', fontWeight: 600, color: c.text3, textTransform: 'uppercase', letterSpacing: '0.8px', textAlign: 'left', fontFamily: c.mono, borderBottom: `1px solid ${c.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(trades as any[]).slice(0, 5).map((t: any) => (
                  <tr key={t.id}>
                    <td style={{ padding: '10px 12px', borderTop: `1px solid ${c.border}20` }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', fontFamily: c.mono }}>{t.symbol}</div>
                      <div style={{ fontSize: '10px', color: t.direction === 'Long' ? c.green : c.red, fontFamily: c.mono }}>{t.direction}</div>
                    </td>
                    <td style={{ padding: '10px 12px', borderTop: `1px solid ${c.border}20`, color: t.pnl >= 0 ? c.green : c.red, fontFamily: c.mono, fontWeight: 600 }}>{t.pnl >= 0 ? '+' : ''}${t.pnl}</td>
                    <td style={{ padding: '10px 12px', borderTop: `1px solid ${c.border}20`, color: c.text2, fontFamily: c.mono, fontSize: '12px' }}>{t.rr}R</td>
                    <td style={{ padding: '10px 12px', borderTop: `1px solid ${c.border}20`, color: t.risk > 2 ? c.amber : c.text2, fontFamily: c.mono, fontSize: '12px' }}>{t.risk}%</td>
                    <td style={{ padding: '10px 12px', borderTop: `1px solid ${c.border}20`, color: c.text3, fontFamily: c.mono, fontSize: '11px' }}>{t.session}</td>
                    <td style={{ padding: '10px 12px', borderTop: `1px solid ${c.border}20` }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontFamily: c.mono, fontWeight: 500, background: t.alignment >= 75 ? 'rgba(62,207,142,0.1)' : t.alignment >= 50 ? 'rgba(245,166,35,0.1)' : 'rgba(255,95,95,0.1)', color: t.alignment >= 75 ? c.green : t.alignment >= 50 ? c.amber : c.red }}>● {t.alignment}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Flags */}
          <div style={panel}>
            <div style={ph}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Behavioral Flags</span>
              <span style={{ fontSize: '11px', color: c.accent, fontFamily: c.mono }}>details</span>
            </div>
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(flags as any[]).map(f => (
                <div key={f.type} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', background: c.surface2, borderRadius: '8px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: f.severity === 'high' ? c.red : f.severity === 'medium' ? c.amber : c.green, flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ flex: 1, fontSize: '12px', fontWeight: 500 }}>{f.type}</span>
                  <span style={{ fontSize: '11px', color: c.text3, fontFamily: c.mono }}>×{f.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Session */}
          <div style={panel}>
            <div style={ph}><span style={{ fontSize: '13px', fontWeight: 600 }}>Session Performance</span></div>
            <div style={{ padding: '12px' }}>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={sessionData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="session" tick={{ fontSize: 10, fill: c.text3, fontFamily: c.mono }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: c.text3, fontFamily: c.mono }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: c.surface2, border: `1px solid ${c.border}`, borderRadius: '8px', fontSize: '11px', fontFamily: c.mono }} formatter={(v: any) => [`${v}%`, 'Win Rate']} />
                  <Bar dataKey="wr" radius={[4, 4, 0, 0]} fill={c.accent} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '8px' }}>
                {sessionData.map(s => (
                  <div key={s.session} style={{ background: c.surface2, borderRadius: '7px', padding: '8px 10px' }}>
                    <div style={{ fontSize: '10px', color: c.text3, fontFamily: c.mono }}>{s.session}</div>
                    <div style={{ fontSize: '17px', fontWeight: 700, color: s.wr >= 65 ? c.green : s.wr >= 55 ? c.text : c.amber, letterSpacing: '-0.5px' }}>{s.wr}%</div>
                    <div style={{ fontSize: '10px', color: c.text3, fontFamily: c.mono }}>{s.trades} trades</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Emotional */}
          <div style={panel}>
            <div style={ph}><span style={{ fontSize: '13px', fontWeight: 600 }}>Emotional State</span></div>
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {emotionRows.map(e => (
                <div key={e.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '11px', color: c.text2 }}>{e.label}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: e.color, fontFamily: c.mono }}>{e.pct}%</span>
                  </div>
                  <div style={{ height: '3px', background: c.surface3, borderRadius: '2px' }}>
                    <div style={{ height: '3px', borderRadius: '2px', background: e.color, width: `${Math.min(100, e.pct)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk */}
          <div style={panel}>
            <div style={ph}><span style={{ fontSize: '13px', fontWeight: 600 }}>Avg Risk Per Trade</span></div>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', color: c.text3, fontFamily: c.mono }}>Monthly average</span>
                <span style={{ fontSize: '24px', fontWeight: 800, color: avgRisk > 2 ? c.red : avgRisk > 1.5 ? c.amber : c.green, letterSpacing: '-0.5px' }}>{avgRisk.toFixed(2)}%</span>
              </div>
              <div style={{ height: '6px', background: c.surface3, borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '6px', borderRadius: '3px', background: `linear-gradient(90deg, ${c.green}, ${c.amber}, ${c.red})`, width: `${Math.min(100, (avgRisk / 3) * 100)}%` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '10px', color: c.text3, fontFamily: c.mono }}>
                <span>0%</span>
                <span style={{ color: c.green }}>optimal ≤1.2%</span>
                <span>3%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
        {[
          { label: 'Win Rate', value: a ? `${a.win_rate}%` : '59.6%', color: a && a.win_rate >= 55 ? c.green : c.amber },
          { label: 'Avg R:R', value: a ? `${a.avg_reward_risk}R` : '2.3R', color: c.green },
          { label: 'Max Drawdown', value: a ? `${a.max_drawdown_pct}%` : '−4.2%', color: c.red },
          { label: 'Profit Factor', value: a ? `${a.profit_factor}` : '1.87', color: c.amber },
          { label: 'Net P&L', value: a ? `${a.net_pnl >= 0 ? '+' : ''}$${Math.round(a.net_pnl).toLocaleString()}` : '+$1,247', color: a ? (a.net_pnl >= 0 ? c.green : c.red) : c.green },
          { label: 'Best Streak', value: a ? `${a.max_win_streak} wins` : '6 wins', color: c.green },
        ].map(s => (
          <div key={s.label} style={{ ...panel, padding: '12px 14px' }}>
            <div style={{ fontSize: '10px', color: c.text3, fontFamily: c.mono, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{s.label}</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: s.color, letterSpacing: '-0.5px', marginTop: '4px' }}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
