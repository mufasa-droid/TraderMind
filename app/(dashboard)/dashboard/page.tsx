'use client'

import { useState } from 'react'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine
} from 'recharts'
import {
  Brain, TrendingUp, AlertTriangle, Shield,
  Zap, Clock, Target, ArrowUpRight, ArrowDownRight,
  ChevronRight, Sparkles, Activity
} from 'lucide-react'

// ── DEMO DATA ────────────────────────────────────────────────
const equityData = [
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

const sessionData = [
  { session: 'Asian', wr: 55, trades: 8 },
  { session: 'London', wr: 67, trades: 19 },
  { session: 'NY', wr: 48, trades: 15 },
  { session: 'Overlap', wr: 71, trades: 5 },
]

const recentTrades = [
  { id: 1, symbol: 'EURUSD', direction: 'Long', pnl: 312, rr: 2.4, risk: 1.2, emotion: 'Focused', alignment: 91, session: 'London', time: '08:32' },
  { id: 2, symbol: 'GBPJPY', direction: 'Short', pnl: -180, rr: -1.0, risk: 2.8, emotion: 'Revenge', alignment: 31, session: 'London', time: '09:15' },
  { id: 3, symbol: 'XAUUSD', direction: 'Long', pnl: 540, rr: 3.1, risk: 1.5, emotion: 'Calm', alignment: 88, session: 'Overlap', time: '12:44' },
  { id: 4, symbol: 'BTCUSD', direction: 'Long', pnl: -95, rr: -0.6, risk: 1.0, emotion: 'FOMO', alignment: 54, session: 'New York', time: '14:20' },
  { id: 5, symbol: 'USDJPY', direction: 'Short', pnl: 228, rr: 1.9, risk: 1.1, emotion: 'Focused', alignment: 82, session: 'London', time: '10:05' },
]

const behaviorFlags = [
  { type: 'Revenge Trading', count: 3, severity: 'high' },
  { type: 'Post-Win Risk Creep', count: 6, severity: 'medium' },
  { type: 'FOMO Entry', count: 2, severity: 'medium' },
  { type: 'Rule Violations', count: 1, severity: 'low' },
]

const RANGE_OPTIONS = ['1W', '1M', '3M', 'YTD']

// ── STYLES ────────────────────────────────────────────────────
const c = {
  green: '#3ecf8e',
  red: '#ff5f5f',
  amber: '#f5a623',
  accent: 'hsl(226,100%,71%)',
  purple: '#b48eff',
  bg: 'hsl(222,20%,5%)',
  surface: 'hsl(224,18%,8%)',
  surface2: 'hsl(224,16%,11%)',
  surface3: 'hsl(224,14%,14%)',
  border: 'hsl(220,12%,14%)',
  text: 'hsl(220,15%,92%)',
  text2: 'hsl(220,10%,55%)',
  text3: 'hsl(220,10%,35%)',
  mono: "'DM Mono', monospace",
}

const panel = {
  background: c.surface,
  border: `1px solid ${c.border}`,
  borderRadius: '10px',
  overflow: 'hidden',
}

const ph = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '12px 16px', borderBottom: `1px solid ${c.border}`,
}

function ScoreCard({ label, value, delta, color, barColor }: { label: string; value: number; delta: string; color: string; barColor: string }) {
  return (
    <div style={{ ...panel, position: 'relative', padding: '16px' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: barColor }} />
      <div style={{ fontSize: '10px', fontWeight: 600, color: c.text3, textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: c.mono }}>{label}</div>
      <div style={{ fontSize: '32px', fontWeight: 800, color, letterSpacing: '-1.5px', lineHeight: 1, marginTop: '6px' }}>{value}</div>
      <div style={{ fontSize: '11px', color: c.text3, marginTop: '6px', fontFamily: c.mono }}>{delta}</div>
      <div style={{ marginTop: '10px', height: '3px', background: c.surface3, borderRadius: '2px' }}>
        <div style={{ height: '3px', borderRadius: '2px', background: barColor, width: `${value}%` }} />
      </div>
    </div>
  )
}

function AlignmentBadge({ score }: { score: number }) {
  const color = score >= 75 ? c.green : score >= 50 ? c.amber : c.red
  const bg = score >= 75 ? 'rgba(62,207,142,0.1)' : score >= 50 ? 'rgba(245,166,35,0.1)' : 'rgba(255,95,95,0.1)'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', background: bg, color, fontSize: '11px', fontFamily: c.mono, fontWeight: 500 }}>
      ● {score}
    </span>
  )
}

function EmotionBadge({ emotion }: { emotion: string }) {
  const colors: Record<string, string> = {
    Focused: c.green, Calm: c.green, Revenge: c.red, FOMO: c.amber, Hesitant: c.text2
  }
  return <span style={{ fontSize: '11px', color: colors[emotion] ?? c.text2 }}>{emotion}</span>
}

const tooltipStyle = {
  contentStyle: { background: c.surface2, border: `1px solid ${c.border}`, borderRadius: '8px', fontSize: '11px', fontFamily: c.mono },
  labelStyle: { color: c.text2, fontSize: '10px' },
}

export default function DashboardPage() {
  const [range, setRange] = useState('1M')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.6px' }}>Performance Overview</h1>
          <p style={{ fontSize: '12px', color: c.text3, marginTop: '3px', fontFamily: c.mono }}>
            May 2026 · 47 trades · MT5 synced
          </p>
        </div>
        <div style={{ display: 'flex', gap: '4px', background: c.surface2, padding: '3px', borderRadius: '8px' }}>
          {RANGE_OPTIONS.map(r => (
            <button key={r} onClick={() => setRange(r)} style={{
              padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
              fontFamily: c.mono, border: 'none', cursor: 'pointer',
              background: range === r ? c.surface3 : 'transparent',
              color: range === r ? c.accent : c.text3,
            }}>{r}</button>
          ))}
        </div>
      </div>

      {/* Score Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        <ScoreCard label="Discipline Score" value={78} delta="↑3 vs last month" color={c.accent} barColor={c.accent} />
        <ScoreCard label="Behavioral Consistency" value={84} delta="↑7 vs last month" color={c.green} barColor={c.green} />
        <ScoreCard label="Risk Quality" value={61} delta="↓4 vs last month" color={c.amber} barColor={c.amber} />
        <ScoreCard label="Emotional Stability" value={72} delta="↑11 vs last month" color={c.purple} barColor={c.purple} />
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px' }}>

        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* AI Coach Insight */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(108,142,255,0.06), rgba(180,142,255,0.04))',
            border: `1px solid rgba(108,142,255,0.2)`,
            borderRadius: '10px', padding: '18px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'rgba(108,142,255,0.15)', color: c.accent,
                fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px',
                fontFamily: c.mono, letterSpacing: '0.5px',
              }}>
                <Sparkles size={10} /> AI COACH · WEEKLY INSIGHT
              </div>
              <button style={{ fontSize: '11px', color: c.accent, background: 'none', border: 'none', cursor: 'pointer', fontFamily: c.mono }}>
                Full report →
              </button>
            </div>
            <p style={{ fontSize: '13px', lineHeight: 1.75, color: 'hsl(220,10%,70%)' }}>
              <strong style={{ color: c.text }}>Your London session performance is significantly stronger than your NY session.</strong> 63% of your winning trades occurred between 08:00–12:00 UTC. After consecutive wins (3+), your risk per trade increases by an average of <strong style={{ color: c.text }}>0.8%</strong> — a pattern consistent with overconfidence bias. Your breakout strategy shows a 71% win rate, but only when ATR conditions are met.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '14px' }}>
              {[
                { label: 'London session +63%', type: 'pos' },
                { label: 'Post-win risk creep', type: 'neg' },
                { label: 'Breakout WR 71%', type: 'pos' },
                { label: 'Revenge trading ×3', type: 'neg' },
                { label: 'Avg hold: 2h 14m', type: 'neu' },
              ].map(tag => (
                <span key={tag.label} style={{
                  padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontFamily: c.mono, fontWeight: 500,
                  background: tag.type === 'pos' ? 'rgba(62,207,142,0.1)' : tag.type === 'neg' ? 'rgba(255,95,95,0.1)' : 'rgba(139,144,160,0.1)',
                  color: tag.type === 'pos' ? c.green : tag.type === 'neg' ? c.red : c.text2,
                }}>{tag.label}</span>
              ))}
            </div>
          </div>

          {/* Equity Chart */}
          <div style={panel}>
            <div style={ph}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Equity Curve</span>
              <div style={{ display: 'flex', gap: '16px' }}>
                {[{ color: c.green, label: 'Equity' }, { color: c.accent, label: 'Discipline' }].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: c.text3, fontFamily: c.mono }}>
                    <div style={{ width: '12px', height: '2px', background: l.color }} />
                    {l.label}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '12px 8px 4px' }}>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={equityData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c.green} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={c.green} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: c.text3, fontFamily: c.mono }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="equity" domain={['auto', 'auto']} tick={{ fontSize: 10, fill: c.text3, fontFamily: c.mono }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(1)}k`} />
                  <YAxis yAxisId="disc" orientation="right" domain={[50, 100]} tick={{ fontSize: 10, fill: c.text3, fontFamily: c.mono }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} formatter={(v: any, name: any) => [name === 'Equity' ? `$${Number(v).toLocaleString()}` : `${v}/100`, name]} />
                  <Area yAxisId="equity" type="monotone" dataKey="equity" stroke={c.green} strokeWidth={1.5} fill="url(#equityGrad)" name="Equity" dot={false} />
                  <Line yAxisId="disc" type="monotone" dataKey="discipline" stroke={c.accent} strokeWidth={1.5} strokeDasharray="5 3" name="Discipline" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trade Table */}
          <div style={panel}>
            <div style={ph}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Recent Trades</span>
              <button style={{ fontSize: '11px', color: c.accent, background: 'none', border: 'none', cursor: 'pointer', fontFamily: c.mono }}>view all →</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Pair', 'P&L', 'R:R', 'Risk', 'Emotion', 'Session', 'Alignment'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', fontSize: '10px', fontWeight: 600, color: c.text3, textTransform: 'uppercase', letterSpacing: '0.8px', textAlign: 'left', fontFamily: c.mono, borderBottom: `1px solid ${c.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentTrades.map(trade => (
                  <tr key={trade.id} style={{ cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = c.surface2)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '10px 12px', borderTop: `1px solid ${c.border}40` }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', fontFamily: c.mono }}>{trade.symbol}</div>
                      <div style={{ fontSize: '10px', color: trade.direction === 'Long' ? c.green : c.red, fontFamily: c.mono }}>{trade.direction}</div>
                    </td>
                    <td style={{ padding: '10px 12px', borderTop: `1px solid ${c.border}40`, color: trade.pnl >= 0 ? c.green : c.red, fontFamily: c.mono, fontWeight: 600 }}>
                      {trade.pnl >= 0 ? '+' : ''}${trade.pnl}
                    </td>
                    <td style={{ padding: '10px 12px', borderTop: `1px solid ${c.border}40`, color: c.text2, fontFamily: c.mono, fontSize: '12px' }}>{trade.rr}R</td>
                    <td style={{ padding: '10px 12px', borderTop: `1px solid ${c.border}40`, color: trade.risk > 2 ? c.amber : c.text2, fontFamily: c.mono, fontSize: '12px' }}>{trade.risk}%</td>
                    <td style={{ padding: '10px 12px', borderTop: `1px solid ${c.border}40` }}><EmotionBadge emotion={trade.emotion} /></td>
                    <td style={{ padding: '10px 12px', borderTop: `1px solid ${c.border}40`, color: c.text3, fontFamily: c.mono, fontSize: '11px' }}>{trade.session}</td>
                    <td style={{ padding: '10px 12px', borderTop: `1px solid ${c.border}40` }}><AlignmentBadge score={trade.alignment} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Live Trade Eval */}
          <div style={{
            background: c.surface2, border: `1px solid ${c.border}`, borderRadius: '10px', padding: '14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: c.green, animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: '12px', fontWeight: 600 }}>Live Trade Evaluation</span>
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: c.text3, fontFamily: c.mono }}>EURUSD · Long</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              {[
                { label: 'Alignment', value: '79', color: c.green },
                { label: 'Discipline', value: '82', color: c.accent },
                { label: 'Risk Level', value: 'MOD', color: c.amber },
                { label: 'Session Fit', value: 'HIGH', color: c.green },
              ].map(s => (
                <div key={s.label} style={{ background: c.surface, borderRadius: '7px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '10px', color: c.text3, fontFamily: c.mono }}>{s.label}</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: s.color, letterSpacing: '-0.5px', marginTop: '2px' }}>{s.value}</div>
                </div>
              ))}
            </div>
            <div style={{
              background: 'rgba(245,166,35,0.08)', border: `1px solid rgba(245,166,35,0.2)`,
              borderRadius: '7px', padding: '10px 12px', fontSize: '12px', lineHeight: 1.6, color: c.text2,
            }}>
              ⚠ Matches your London breakout pattern, but risk at <strong style={{ color: c.text }}>1.8%</strong> is above your optimal <strong style={{ color: c.text }}>1.2%</strong> threshold.
            </div>
          </div>

          {/* Behavior Flags */}
          <div style={panel}>
            <div style={ph}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Behavioral Flags</span>
              <span style={{ fontSize: '11px', color: c.accent, cursor: 'pointer', fontFamily: c.mono }}>details</span>
            </div>
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {behaviorFlags.map(flag => (
                <div key={flag.type} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', background: c.surface2, borderRadius: '8px' }}>
                  <div style={{
                    width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
                    background: flag.severity === 'high' ? c.red : flag.severity === 'medium' ? c.amber : c.green
                  }} />
                  <div style={{ flex: 1, fontSize: '12px', fontWeight: 500 }}>{flag.type}</div>
                  <div style={{ fontSize: '11px', color: c.text3, fontFamily: c.mono }}>×{flag.count}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Session Performance */}
          <div style={panel}>
            <div style={ph}><span style={{ fontSize: '13px', fontWeight: 600 }}>Session Performance</span></div>
            <div style={{ padding: '12px' }}>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={sessionData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="session" tick={{ fontSize: 10, fill: c.text3, fontFamily: c.mono }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: c.text3, fontFamily: c.mono }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} formatter={(v: any) => [`${v}%`, 'Win Rate']} />
                  <Bar dataKey="wr" radius={[4, 4, 0, 0]} fill={c.accent} opacity={0.8} />
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

          {/* Emotional State */}
          <div style={panel}>
            <div style={ph}><span style={{ fontSize: '13px', fontWeight: 600 }}>Emotional State</span></div>
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Calm / Focused', pct: 58, color: c.green },
                { label: 'Overconfident', pct: 19, color: c.amber },
                { label: 'FOMO', pct: 12, color: c.purple },
                { label: 'Revenge / Fear', pct: 11, color: c.red },
              ].map(e => (
                <div key={e.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '11px', color: c.text2 }}>{e.label}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: e.color, fontFamily: c.mono }}>{e.pct}%</span>
                  </div>
                  <div style={{ height: '3px', background: c.surface3, borderRadius: '2px' }}>
                    <div style={{ height: '3px', borderRadius: '2px', background: e.color, width: `${e.pct}%`, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Meter */}
          <div style={panel}>
            <div style={ph}><span style={{ fontSize: '13px', fontWeight: 600 }}>Avg Risk Per Trade</span></div>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', color: c.text3, fontFamily: c.mono }}>Monthly average</span>
                <span style={{ fontSize: '24px', fontWeight: 800, color: c.amber, letterSpacing: '-0.5px' }}>1.64%</span>
              </div>
              <div style={{ height: '6px', background: c.surface3, borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '6px', borderRadius: '3px', background: `linear-gradient(90deg, ${c.green}, ${c.amber}, ${c.red})`, width: '64%' }} />
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

      {/* Bottom Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
        {[
          { label: 'Win Rate', value: '59.6%', color: c.green },
          { label: 'Avg R:R Won', value: '2.3R', color: c.green },
          { label: 'Max Drawdown', value: '−4.2%', color: c.red },
          { label: 'Profit Factor', value: '1.87', color: c.amber },
          { label: 'Net P&L', value: '+$1,247', color: c.green },
          { label: 'Best Streak', value: '6 wins', color: c.green },
        ].map(stat => (
          <div key={stat.label} style={{ ...panel, padding: '12px 14px' }}>
            <div style={{ fontSize: '10px', color: c.text3, fontFamily: c.mono, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{stat.label}</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: stat.color, letterSpacing: '-0.5px', marginTop: '4px' }}>{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
