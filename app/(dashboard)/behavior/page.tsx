'use client'

import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis,
  ZAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell
} from 'recharts'
import { AlertTriangle, TrendingDown, Brain, Zap } from 'lucide-react'

const c = {
  green: '#3ecf8e', red: '#ff5f5f', amber: '#f5a623',
  accent: 'hsl(226,100%,71%)', purple: '#b48eff',
  surface: 'hsl(224,18%,8%)', surface2: 'hsl(224,16%,11%)', surface3: 'hsl(224,14%,14%)',
  border: 'hsl(220,12%,14%)', text: 'hsl(220,15%,92%)',
  text2: 'hsl(220,10%,55%)', text3: 'hsl(220,10%,35%)', mono: "'DM Mono', monospace",
}
const panel = { background: c.surface, border: `1px solid ${c.border}`, borderRadius: '10px', overflow: 'hidden' }

const radarData = [
  { subject: 'Discipline', score: 78 },
  { subject: 'Risk Mgmt', score: 61 },
  { subject: 'Consistency', score: 84 },
  { subject: 'Emotional', score: 72 },
  { subject: 'Entry Quality', score: 79 },
  { subject: 'Exit Quality', score: 58 },
]

const scatterData = [
  { emotion: 1, rr: 2.4, pnl: 312, size: 100 },
  { emotion: 1, rr: 3.1, pnl: 540, size: 120 },
  { emotion: 1, rr: 1.9, pnl: 228, size: 90 },
  { emotion: 1, rr: 1.7, pnl: 187, size: 80 },
  { emotion: 2, rr: 2.8, pnl: 430, size: 110 },
  { emotion: 3, rr: -0.6, pnl: -95, size: 70 },
  { emotion: 4, rr: -1.0, pnl: -142, size: 80 },
  { emotion: 4, rr: -1.0, pnl: -180, size: 90 },
  { emotion: 5, rr: -1.0, pnl: -220, size: 100 },
]

const hourlyData = Array.from({ length: 24 }, (_, h) => ({
  hour: `${h.toString().padStart(2, '0')}:00`,
  wr: h >= 8 && h <= 12 ? 62 + Math.random() * 15 : h >= 13 && h <= 17 ? 42 + Math.random() * 12 : 45 + Math.random() * 10,
  trades: h >= 8 && h <= 17 ? Math.floor(3 + Math.random() * 5) : Math.floor(Math.random() * 2),
}))

const emotionColors: Record<number, string> = {
  1: c.green,   // Calm/Focused
  2: c.accent,  // Neutral
  3: c.amber,   // FOMO
  4: c.red,     // Revenge
  5: c.red,     // Stressed
}
const emotionLabels: Record<number, string> = {
  1: 'Calm', 2: 'Neutral', 3: 'FOMO', 4: 'Revenge', 5: 'Stressed'
}

export default function BehaviorPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.6px' }}>Behavioral Intelligence</h1>
        <p style={{ fontSize: '12px', color: c.text3, marginTop: '3px', fontFamily: c.mono }}>Deep analysis of your trading psychology and behavioral patterns</p>
      </div>

      {/* Pattern Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          { icon: AlertTriangle, color: c.red, label: 'Critical Pattern', title: 'Revenge Trading After London Losses', desc: '3 revenge trades this month, all within 5 min of a loss. Average loss: $160.' },
          { icon: TrendingDown, color: c.amber, label: 'Warning Pattern', title: 'Post-Win Risk Creep', desc: 'After 3+ consecutive wins, average risk increases from 1.1% to 1.9%. Detected 6 times.' },
          { icon: Brain, color: c.accent, label: 'Behavioral Insight', title: 'Best State: Calm & Focused', desc: '58% of trades taken in calm/focused state. Win rate in this state: 71% vs 38% otherwise.' },
        ].map(alert => (
          <div key={alert.title} style={{ ...panel, padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <alert.icon size={13} color={alert.color} />
              <span style={{ fontSize: '10px', fontWeight: 600, color: alert.color, fontFamily: c.mono, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{alert.label}</span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>{alert.title}</div>
            <p style={{ fontSize: '12px', color: c.text2, lineHeight: 1.6 }}>{alert.desc}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Radar */}
        <div style={panel}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${c.border}`, fontSize: '13px', fontWeight: 600 }}>Behavioral Profile</div>
          <div style={{ padding: '12px 0 0' }}>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid stroke="rgba(255,255,255,0.07)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: c.text3, fontFamily: c.mono }} />
                <Radar dataKey="score" stroke={c.accent} fill={c.accent} fillOpacity={0.15} strokeWidth={1.5} dot={{ fill: c.accent, r: 3 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Emotion vs RR Scatter */}
        <div style={panel}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${c.border}`, fontSize: '13px', fontWeight: 600 }}>Emotion vs. Reward:Risk</div>
          <div style={{ padding: '12px 8px 4px' }}>
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="emotion" type="number" domain={[0.5, 5.5]} ticks={[1, 2, 3, 4, 5]}
                  tickFormatter={v => emotionLabels[v] ?? ''}
                  tick={{ fontSize: 10, fill: c.text3, fontFamily: c.mono }} axisLine={false} tickLine={false} />
                <YAxis dataKey="rr" tick={{ fontSize: 10, fill: c.text3, fontFamily: c.mono }} axisLine={false} tickLine={false} />
                <ZAxis dataKey="size" range={[40, 200]} />
                <Tooltip
                  contentStyle={{ background: c.surface2, border: `1px solid ${c.border}`, borderRadius: '8px', fontSize: '11px', fontFamily: c.mono }}
                  formatter={(v: any, name: any) => {
                    if (name === 'rr') return [`${v}R`, 'R:R']
                    if (name === 'pnl') return [`$${v}`, 'P&L']
                    return [v, name]
                  }}
                />
                {scatterData.map((d, i) => (
                  <Scatter key={i} data={[d]} fill={emotionColors[d.emotion]} fillOpacity={0.7} />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', padding: '0 0 8px', flexWrap: 'wrap' }}>
              {Object.entries(emotionLabels).map(([k, label]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: emotionColors[Number(k)] }} />
                  <span style={{ fontSize: '10px', color: c.text3, fontFamily: c.mono }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hourly Win Rate */}
        <div style={panel}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${c.border}`, fontSize: '13px', fontWeight: 600 }}>Win Rate by Hour (UTC)</div>
          <div style={{ padding: '12px 8px 4px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hourlyData.filter((_, i) => i % 2 === 0)} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 9, fill: c.text3, fontFamily: c.mono }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: c.text3, fontFamily: c.mono }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: c.surface2, border: `1px solid ${c.border}`, borderRadius: '8px', fontSize: '11px', fontFamily: c.mono }} formatter={(v: any) => [`${v.toFixed(0)}%`, 'Win Rate']} />
                <Bar dataKey="wr" radius={[3, 3, 0, 0]}>
                  {hourlyData.filter((_, i) => i % 2 === 0).map((entry, i) => (
                    <Cell key={i} fill={entry.wr >= 60 ? c.green : entry.wr >= 50 ? c.accent : c.red} opacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Behavioral Timeline */}
        <div style={panel}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${c.border}`, fontSize: '13px', fontWeight: 600 }}>Behavioral Patterns This Month</div>
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { date: 'May 26', event: 'Revenge trading detected after EURUSD stop-out', type: 'danger', score: '−8 pts' },
              { date: 'May 25', event: 'Calm & focused across all 3 trades. London session discipline', type: 'positive', score: '+5 pts' },
              { date: 'May 24', event: 'Post-win risk creep detected. Risk jumped from 1.1% to 2.1%', type: 'warning', score: '−4 pts' },
              { date: 'May 23', event: 'Perfect session: 2 trades, journaled both, respected all rules', type: 'positive', score: '+8 pts' },
              { date: 'May 22', event: 'FOMO entry on BTCUSD during news spike', type: 'warning', score: '−3 pts' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', marginTop: '6px', flexShrink: 0, background: item.type === 'danger' ? c.red : item.type === 'warning' ? c.amber : c.green }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{ fontSize: '10px', color: c.text3, fontFamily: c.mono }}>{item.date}</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: item.type === 'positive' ? c.green : item.type === 'danger' ? c.red : c.amber, fontFamily: c.mono }}>{item.score}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: c.text2, lineHeight: 1.5 }}>{item.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
