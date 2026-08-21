'use client'

import { useState } from 'react'
import { Search, Filter, Plus, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const c = {
  green: '#3ecf8e', red: '#ff5f5f', amber: '#f5a623',
  accent: 'hsl(226,100%,71%)', purple: '#b48eff',
  surface: 'hsl(224,18%,8%)', surface2: 'hsl(224,16%,11%)', surface3: 'hsl(224,14%,14%)',
  border: 'hsl(220,12%,14%)', text: 'hsl(220,15%,92%)',
  text2: 'hsl(220,10%,55%)', text3: 'hsl(220,10%,35%)', mono: "'DM Mono', monospace",
}
const panel = { background: c.surface, border: `1px solid ${c.border}`, borderRadius: '10px', overflow: 'hidden' }

const ALL_TRADES = [
  { id: 1, symbol: 'EURUSD', direction: 'Long', pnl: 312, rr: 2.4, risk: 1.2, emotion: 'Focused', alignment: 91, session: 'London', strategy: 'Breakout', opened: '2026-05-26 08:32', duration: '2h 14m', status: 'closed' },
  { id: 2, symbol: 'GBPJPY', direction: 'Short', pnl: -180, rr: -1.0, risk: 2.8, emotion: 'Revenge', alignment: 31, session: 'London', strategy: 'Impulse', opened: '2026-05-26 09:15', duration: '0h 45m', status: 'closed' },
  { id: 3, symbol: 'XAUUSD', direction: 'Long', pnl: 540, rr: 3.1, risk: 1.5, emotion: 'Calm', alignment: 88, session: 'Overlap', strategy: 'Breakout', opened: '2026-05-25 12:44', duration: '3h 02m', status: 'closed' },
  { id: 4, symbol: 'BTCUSD', direction: 'Long', pnl: -95, rr: -0.6, risk: 1.0, emotion: 'FOMO', alignment: 54, session: 'New York', strategy: 'Range', opened: '2026-05-25 14:20', duration: '1h 30m', status: 'closed' },
  { id: 5, symbol: 'USDJPY', direction: 'Short', pnl: 228, rr: 1.9, risk: 1.1, emotion: 'Focused', alignment: 82, session: 'London', strategy: 'Breakout', opened: '2026-05-24 10:05', duration: '2h 45m', status: 'closed' },
  { id: 6, symbol: 'GBPUSD', direction: 'Long', pnl: -142, rr: -1.0, risk: 1.8, emotion: 'Overconfident', alignment: 48, session: 'New York', strategy: 'Trend', opened: '2026-05-24 14:10', duration: '1h 15m', status: 'closed' },
  { id: 7, symbol: 'EURUSD', direction: 'Short', pnl: 187, rr: 1.7, risk: 0.9, emotion: 'Calm', alignment: 85, session: 'London', strategy: 'Breakout', opened: '2026-05-23 09:30', duration: '3h 10m', status: 'closed' },
  { id: 8, symbol: 'ETHBTC', direction: 'Long', pnl: 430, rr: 2.8, risk: 1.3, emotion: 'Focused', alignment: 89, session: 'Asian', strategy: 'Range', opened: '2026-05-23 04:15', duration: '4h 30m', status: 'closed' },
]

const pnlByDay = [
  { date: 'May 20', pnl: 145 }, { date: 'May 21', pnl: -87 }, { date: 'May 22', pnl: 310 },
  { date: 'May 23', pnl: 617 }, { date: 'May 24', pnl: 86 }, { date: 'May 25', pnl: 445 }, { date: 'May 26', pnl: 132 },
]

const FILTERS = ['All', 'Wins', 'Losses', 'Flagged', 'London', 'New York']

export default function TradesPage() {
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [showEval, setShowEval] = useState(false)

  const filtered = ALL_TRADES.filter(t => {
    if (filter === 'Wins') return t.pnl > 0
    if (filter === 'Losses') return t.pnl < 0
    if (filter === 'Flagged') return t.alignment < 55
    if (filter === 'London') return t.session === 'London'
    if (filter === 'New York') return t.session === 'New York'
    return true
  }).filter(t => t.symbol.toLowerCase().includes(search.toLowerCase()))

  const totalPnl = filtered.reduce((s, t) => s + t.pnl, 0)
  const winRate = Math.round((filtered.filter(t => t.pnl > 0).length / filtered.length) * 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.6px' }}>Trade History</h1>
          <p style={{ fontSize: '12px', color: c.text3, marginTop: '3px', fontFamily: c.mono }}>
            {ALL_TRADES.length} trades · May 2026
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowEval(!showEval)} style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
            borderRadius: '8px', background: 'rgba(108,142,255,0.1)', border: `1px solid rgba(108,142,255,0.3)`,
            color: c.accent, fontSize: '12px', fontWeight: 600, cursor: 'pointer',
          }}>
            <TrendingUp size={13} /> Evaluate Trade
          </button>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
            borderRadius: '8px', background: c.accent, border: 'none',
            color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
          }}>
            <Plus size={13} /> Log Trade
          </button>
        </div>
      </div>

      {/* Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
        {[
          { label: 'Total Trades', value: ALL_TRADES.length, mono: true },
          { label: 'Win Rate', value: `${winRate}%`, color: c.green },
          { label: 'Net P&L', value: `${totalPnl >= 0 ? '+' : ''}$${Math.abs(totalPnl).toLocaleString()}`, color: totalPnl >= 0 ? c.green : c.red },
          { label: 'Avg R:R', value: '2.1R', color: c.amber },
          { label: 'Avg Alignment', value: `${Math.round(filtered.reduce((s, t) => s + t.alignment, 0) / filtered.length)}/100`, color: c.accent },
        ].map(s => (
          <div key={s.label} style={{ ...panel, padding: '12px 14px' }}>
            <div style={{ fontSize: '10px', color: c.text3, fontFamily: c.mono, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{s.label}</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: s.color ?? c.text, letterSpacing: '-0.5px', marginTop: '4px' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Trade Eval Panel (shown conditionally) */}
      {showEval && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(108,142,255,0.06), rgba(180,142,255,0.04))',
          border: `1px solid rgba(108,142,255,0.2)`, borderRadius: '10px', padding: '20px',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '14px' }}>Pre-Trade Evaluation</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '14px' }}>
            {[
              { label: 'Symbol', placeholder: 'EURUSD' },
              { label: 'Direction', placeholder: 'Long / Short' },
              { label: 'Risk %', placeholder: '1.0%' },
              { label: 'Session', placeholder: 'London' },
              { label: 'Strategy', placeholder: 'Breakout' },
            ].map(f => (
              <div key={f.label}>
                <div style={{ fontSize: '10px', color: c.text3, fontFamily: c.mono, marginBottom: '5px' }}>{f.label}</div>
                <input placeholder={f.placeholder} style={{
                  width: '100%', background: c.surface3, border: `1px solid ${c.border}`,
                  borderRadius: '7px', padding: '8px 10px', fontSize: '12px', color: c.text,
                  fontFamily: c.mono, outline: 'none',
                }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button style={{ padding: '8px 16px', borderRadius: '8px', background: c.accent, border: 'none', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              Evaluate
            </button>
            <div style={{
              flex: 1, padding: '10px 14px', borderRadius: '8px',
              background: 'rgba(62,207,142,0.08)', border: `1px solid rgba(62,207,142,0.2)`,
              fontSize: '12px', color: c.text2, lineHeight: 1.5,
            }}>
              ✓ <strong style={{ color: c.text }}>Alignment: 79/100</strong> — This trade aligns with your London breakout pattern. Risk at 1.0% is within your optimal range.
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '14px' }}>
        {/* Trades Table */}
        <div style={panel}>
          {/* Controls */}
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${c.border}`, display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: c.text3 }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search symbol..."
                style={{ width: '100%', paddingLeft: '30px', background: c.surface2, border: `1px solid ${c.border}`, borderRadius: '7px', padding: '7px 10px 7px 30px', fontSize: '12px', color: c.text, outline: 'none', fontFamily: c.mono }}
              />
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {FILTERS.map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontFamily: c.mono,
                  border: `1px solid ${filter === f ? `rgba(108,142,255,0.3)` : c.border}`,
                  background: filter === f ? 'rgba(108,142,255,0.1)' : 'transparent',
                  color: filter === f ? c.accent : c.text3, cursor: 'pointer',
                }}>{f}</button>
              ))}
            </div>
          </div>

          {/* Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Pair', 'P&L', 'R:R', 'Risk %', 'Emotion', 'Alignment', 'Session', 'Strategy', 'Duration'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', fontSize: '10px', fontWeight: 600, color: c.text3, textTransform: 'uppercase', letterSpacing: '0.8px', textAlign: 'left', fontFamily: c.mono, borderBottom: `1px solid ${c.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(trade => (
                <tr key={trade.id} style={{ cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = c.surface2)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '10px 12px', borderTop: `1px solid ${c.border}40` }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', fontFamily: c.mono }}>{trade.symbol}</div>
                    <div style={{ fontSize: '10px', color: trade.direction === 'Long' ? c.green : c.red, fontFamily: c.mono }}>{trade.direction}</div>
                  </td>
                  <td style={{ padding: '10px 12px', borderTop: `1px solid ${c.border}40`, color: trade.pnl >= 0 ? c.green : c.red, fontFamily: c.mono, fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      {trade.pnl >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                      {trade.pnl >= 0 ? '+' : ''}${Math.abs(trade.pnl)}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', borderTop: `1px solid ${c.border}40`, color: c.text2, fontFamily: c.mono, fontSize: '12px' }}>{trade.rr}R</td>
                  <td style={{ padding: '10px 12px', borderTop: `1px solid ${c.border}40`, color: trade.risk > 2 ? c.amber : c.text2, fontFamily: c.mono, fontSize: '12px' }}>{trade.risk}%</td>
                  <td style={{ padding: '10px 12px', borderTop: `1px solid ${c.border}40` }}>
                    <span style={{ fontSize: '11px', color: trade.emotion === 'Focused' || trade.emotion === 'Calm' ? c.green : trade.emotion === 'Revenge' ? c.red : c.amber }}>{trade.emotion}</span>
                  </td>
                  <td style={{ padding: '10px 12px', borderTop: `1px solid ${c.border}40` }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontFamily: c.mono, fontWeight: 500,
                      background: trade.alignment >= 75 ? 'rgba(62,207,142,0.1)' : trade.alignment >= 50 ? 'rgba(245,166,35,0.1)' : 'rgba(255,95,95,0.1)',
                      color: trade.alignment >= 75 ? c.green : trade.alignment >= 50 ? c.amber : c.red,
                    }}>● {trade.alignment}</span>
                  </td>
                  <td style={{ padding: '10px 12px', borderTop: `1px solid ${c.border}40`, color: c.text3, fontFamily: c.mono, fontSize: '11px' }}>{trade.session}</td>
                  <td style={{ padding: '10px 12px', borderTop: `1px solid ${c.border}40`, color: c.text3, fontFamily: c.mono, fontSize: '11px' }}>{trade.strategy}</td>
                  <td style={{ padding: '10px 12px', borderTop: `1px solid ${c.border}40`, color: c.text3, fontFamily: c.mono, fontSize: '11px' }}>{trade.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right: Daily PnL chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={panel}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${c.border}`, fontSize: '13px', fontWeight: 600 }}>Daily P&L</div>
            <div style={{ padding: '12px 8px 4px' }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={pnlByDay} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: c.text3, fontFamily: c.mono }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: c.text3, fontFamily: c.mono }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: c.surface2, border: `1px solid ${c.border}`, borderRadius: '8px', fontSize: '11px', fontFamily: c.mono }}
                    formatter={(v: any) => [`${v >= 0 ? '+' : ''}$${v}`, 'P&L']}
                  />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]} fill={c.accent}
                    label={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Strategy breakdown */}
          <div style={panel}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${c.border}`, fontSize: '13px', fontWeight: 600 }}>Strategy Performance</div>
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { name: 'Breakout', wr: 71, trades: 14, pnl: 1247 },
                { name: 'Range', wr: 55, trades: 8, pnl: 335 },
                { name: 'Trend', wr: 48, trades: 6, pnl: -142 },
              ].map(s => (
                <div key={s.name} style={{ padding: '10px 12px', background: c.surface2, borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{s.name}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: s.wr >= 60 ? c.green : s.wr >= 50 ? c.amber : c.red, fontFamily: c.mono }}>{s.wr}%</span>
                  </div>
                  <div style={{ height: '3px', background: c.surface3, borderRadius: '2px' }}>
                    <div style={{ height: '3px', borderRadius: '2px', background: s.wr >= 60 ? c.green : s.wr >= 50 ? c.amber : c.red, width: `${s.wr}%` }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '10px', color: c.text3, fontFamily: c.mono }}>
                    <span>{s.trades} trades</span>
                    <span style={{ color: s.pnl >= 0 ? c.green : c.red }}>{s.pnl >= 0 ? '+' : ''}${s.pnl}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
