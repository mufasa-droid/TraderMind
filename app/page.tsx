'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// ── TYPES ────────────────────────────────────────────────────
type AISandboxScenario = {
  label: string
  flag: string
  severity: 'critical' | 'warning'
  response: string
}

// ── CONSTANTS ────────────────────────────────────────────────
const TECH_STACK = [
  { name: 'Next.js 15', icon: '▲', color: '#fff' },
  { name: 'TypeScript', icon: 'TS', color: '#3178C6' },
  { name: 'Tailwind CSS', icon: '✦', color: '#38BDF8' },
  { name: 'Supabase', icon: '⚡', color: '#3ECF8E' },
  { name: 'OpenAI GPT-4o', icon: '◎', color: '#74AA9C' },
  { name: 'Recharts', icon: '📊', color: '#8884d8' },
  { name: 'MetaAPI', icon: '⬡', color: '#F5A623' },
  { name: 'Vercel', icon: '▲', color: '#fff' },
]

const BROKERS = ['MT4', 'MT5', 'Binance', 'Bybit', 'cTrader', 'TradingView', 'DXTrade']

const FEATURES = [
  {
    icon: '🧠',
    iconLabel: 'brain',
    color: '#6C8EFF',
    bg: 'rgba(108,142,255,0.1)',
    title: 'AI Behavioral Coaching',
    desc: 'Weekly AI analysis of your psychology, emotional patterns, and decision quality — insights no market tool can deliver.',
  },
  {
    icon: '⚡',
    iconLabel: 'lightning',
    color: '#3ECF8E',
    bg: 'rgba(62,207,142,0.1)',
    title: 'Real-Time Trade Evaluation',
    desc: 'Get an alignment score, risk rating, and behavioral check based on your own historical data — before you enter.',
  },
  {
    icon: '🛡',
    iconLabel: 'shield',
    color: '#F5A623',
    bg: 'rgba(245,166,35,0.1)',
    title: 'Behavioral Intelligence Engine',
    desc: 'Automatically detects revenge trading, FOMO entries, post-win risk creep, overtrading, and 8 other damaging patterns.',
  },
  {
    icon: '📊',
    iconLabel: 'chart',
    color: '#B48EFF',
    bg: 'rgba(180,142,255,0.1)',
    title: 'Performance Analytics',
    desc: 'Session-by-session, instrument-by-instrument, strategy-by-strategy — know exactly when, where, and how you perform best.',
  },
  {
    icon: '🎯',
    iconLabel: 'target',
    color: '#1DE9C2',
    bg: 'rgba(29,233,194,0.1)',
    title: 'Goals & Rule Enforcement',
    desc: 'Define your trading rules. The platform monitors compliance and flags every violation, keeping you accountable.',
  },
  {
    icon: '🔗',
    iconLabel: 'link',
    color: '#3ECF8E',
    bg: 'rgba(62,207,142,0.1)',
    title: 'Live Broker Sync',
    desc: 'MT4, MT5, Binance, Bybit, cTrader — trades sync automatically with zero manual logging friction.',
  },
]

const AI_SANDBOX_SCENARIOS: AISandboxScenario[] = [
  {
    label: '5 trades in 10 min after a big loss',
    flag: 'Revenge Trading + Overtrading',
    severity: 'critical',
    response: '🚨 Critical: You have entered 5 trades within 10 minutes of a significant loss. This is a textbook revenge trading pattern — your average P&L in this state is −$247. Historical data shows 89% of post-loss flurries result in further losses. Stop trading for 30 minutes. Your discipline score would drop from 78 to 52 if you continue.',
  },
  {
    label: 'Risking 4% after 3 consecutive wins',
    flag: 'Post-Win Risk Creep',
    severity: 'critical',
    response: '⚠️ Critical: Risk at 4% is 3.3× your optimal threshold of 1.2%. After win streaks of 3+, you historically increase risk by an average of 0.8% — this is 3.2% above that. Your last 6 over-risked trades after win streaks produced an average loss of −$312. Reduce to 1.2% or this trade will be flagged.',
  },
  {
    label: 'Trading during a news event you missed',
    flag: 'Poor Session Timing',
    severity: 'warning',
    response: '⚠️ Warning: A major economic event (NFP) is scheduled in the next 18 minutes. Your win rate drops to 31% in the 30 minutes surrounding high-impact news events. This setup may be valid, but the timing is poor. Consider waiting for the spike to settle. Your London breakout strategy performs 2.4× better when entered 30+ minutes after major news.',
  },
  {
    label: 'Entering a trade feeling fearful',
    flag: 'Emotional State — Fearful',
    severity: 'warning',
    response: '⚠️ Warning: Trades entered in a fearful emotional state have a 38% win rate in your history — significantly below your 60% baseline. Fear-state entries also show early exit behavior, cutting average R:R from 2.1R to 0.7R. Consider journaling what is driving this feeling before proceeding. If the setup is valid, the fear may resolve once you see price respect your level.',
  },
  {
    label: 'Skipping a stop loss on this trade',
    flag: 'Rule Violation — No Stop Loss',
    severity: 'critical',
    response: '🚨 Rule Violation: Trading without a stop loss violates your own Rule #1. Your 3 previous no-SL trades produced an average loss of −$890 — 5.8× your typical losing trade. This is not a risk management decision, it is a discipline failure. The platform will flag this trade and it will reduce your discipline score by 12 points. Set a stop loss before entering.',
  },
]

const ROTATING_INSIGHTS = [
  '"You perform best during London sessions — 67% win rate vs 48% in New York."',
  '"Most losses occur after consecutive wins. Risk creep detected on 6 trades."',
  '"Your breakout strategy has a 71% win rate when ATR conditions are met."',
  '"You have entered 3 trades within 5 minutes of a loss — revenge trading pattern."',
  '"Emotional stability score improved 11 points. Your discipline is building."',
]

// ── STYLES (inline for portability) ──────────────────────────
const S = {
  bg: '#0A0B0E',
  surface: '#111318',
  surface2: '#161920',
  border: 'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.12)',
  text: '#E8EAF0',
  text2: '#8B90A0',
  text3: '#555C6E',
  accent: '#6C8EFF',
  green: '#3ECF8E',
  red: '#FF5F5F',
  amber: '#F5A623',
  purple: '#B48EFF',
  mono: "'DM Mono', 'Courier New', monospace",
  sans: "'Syne', system-ui, sans-serif",
}

// ── DASHBOARD MOCKUP ─────────────────────────────────────────
function DashboardMockup() {
  return (
    <div style={{
      background: S.surface,
      border: `1px solid ${S.border2}`,
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
      fontFamily: S.sans,
    }}>
      {/* Mock topbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', background: S.surface,
        borderBottom: `1px solid ${S.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '5px', background: S.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 800, color: '#fff' }}>TM</div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: S.text }}>TraderMind</span>
          <span style={{ fontSize: '10px', color: S.text3, fontFamily: S.mono }}>/ Overview</span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['Overview', 'Behavior', 'AI Coach', 'Trades'].map((tab, i) => (
            <span key={tab} style={{
              fontSize: '10px', padding: '3px 8px', borderRadius: '4px', fontWeight: 500,
              background: i === 0 ? S.surface2 : 'transparent',
              color: i === 0 ? S.text : S.text3,
            }}>{tab}</span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: S.green }} />
          <span style={{ fontSize: '10px', color: S.text3, fontFamily: S.mono }}>MT5 synced</span>
        </div>
      </div>

      {/* Score cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', padding: '12px 14px 8px' }}>
        {[
          { label: 'Discipline Score', value: '78', color: S.accent },
          { label: 'Consistency', value: '84', color: S.green },
          { label: 'Risk Quality', value: '61', color: S.amber },
          { label: 'Emotional Stability', value: '72', color: S.purple },
        ].map(card => (
          <div key={card.label} style={{
            background: '#0D0F14', borderRadius: '7px', padding: '10px 12px',
            border: `1px solid ${S.border}`,
          }}>
            <div style={{ fontSize: '9px', color: S.text3, fontFamily: S.mono, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '4px' }}>{card.label}</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: card.color, letterSpacing: '-0.5px' }}>{card.value}</div>
            <div style={{ height: '2px', background: S.surface2, borderRadius: '1px', marginTop: '6px' }}>
              <div style={{ height: '2px', borderRadius: '1px', background: card.color, width: `${card.value}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* AI Coach insight */}
      <div style={{ margin: '0 14px 8px', padding: '10px 12px', borderRadius: '7px', background: 'rgba(108,142,255,0.06)', border: '1px solid rgba(108,142,255,0.2)' }}>
        <div style={{ fontSize: '9px', fontWeight: 700, color: S.accent, fontFamily: S.mono, letterSpacing: '0.8px', marginBottom: '5px' }}>✦ AI COACH · WEEKLY INSIGHT</div>
        <div style={{ fontSize: '11px', lineHeight: 1.6, color: S.text2 }}>
          <span style={{ color: S.text, fontWeight: 600 }}>Your London session win rate is 19 points above NY.</span> After 3+ consecutive wins, risk creep detected on 6 trades averaging +0.8% above your limit.
        </div>
        <div style={{ display: 'flex', gap: '5px', marginTop: '7px', flexWrap: 'wrap' }}>
          {['London +67%', 'Risk creep ×6', 'Breakout WR 71%'].map((tag, i) => (
            <span key={tag} style={{
              fontSize: '9px', padding: '2px 7px', borderRadius: '10px', fontFamily: S.mono,
              background: i === 0 ? 'rgba(62,207,142,0.1)' : i === 1 ? 'rgba(255,95,95,0.1)' : 'rgba(62,207,142,0.1)',
              color: i === 0 ? S.green : i === 1 ? S.red : S.green,
            }}>{tag}</span>
          ))}
        </div>
      </div>

      {/* Mini trade table */}
      <div style={{ margin: '0 14px 14px', borderRadius: '7px', overflow: 'hidden', border: `1px solid ${S.border}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', background: S.surface2 }}>
          {['Pair', 'P&L', 'R:R', 'Emotion', 'Alignment'].map(h => (
            <div key={h} style={{ padding: '5px 8px', fontSize: '9px', color: S.text3, fontFamily: S.mono, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</div>
          ))}
        </div>
        {[
          { pair: 'EURUSD', pnl: '+$312', rr: '2.4R', emotion: 'Focused', align: 91, pos: true },
          { pair: 'GBPJPY', pnl: '−$180', rr: '−1R', emotion: 'Revenge', align: 31, pos: false },
          { pair: 'XAUUSD', pnl: '+$540', rr: '3.1R', emotion: 'Calm', align: 88, pos: true },
          { pair: 'BTCUSD', pnl: '−$95', rr: '−0.6R', emotion: 'FOMO', align: 54, pos: false },
        ].map((row, i) => (
          <div key={row.pair} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', borderTop: `1px solid ${S.border}`, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
            <div style={{ padding: '6px 8px', fontSize: '10px', fontFamily: S.mono, fontWeight: 600, color: S.text }}>{row.pair}</div>
            <div style={{ padding: '6px 8px', fontSize: '10px', fontFamily: S.mono, color: row.pos ? S.green : S.red, fontWeight: 600 }}>{row.pnl}</div>
            <div style={{ padding: '6px 8px', fontSize: '10px', fontFamily: S.mono, color: S.text2 }}>{row.rr}</div>
            <div style={{ padding: '6px 8px', fontSize: '10px', color: row.emotion === 'Focused' || row.emotion === 'Calm' ? S.green : row.emotion === 'Revenge' ? S.red : S.amber }}>{row.emotion}</div>
            <div style={{ padding: '6px 8px' }}>
              <span style={{
                fontSize: '9px', padding: '2px 6px', borderRadius: '3px', fontFamily: S.mono, fontWeight: 600,
                background: row.align >= 75 ? 'rgba(62,207,142,0.1)' : row.align >= 50 ? 'rgba(245,166,35,0.1)' : 'rgba(255,95,95,0.1)',
                color: row.align >= 75 ? S.green : row.align >= 50 ? S.amber : S.red,
              }}>● {row.align}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── AI SANDBOX ───────────────────────────────────────────────
function AISandbox() {
  const [selected, setSelected] = useState<number | null>(null)
  const [showing, setShowing] = useState(false)
  const [text, setText] = useState('')

  const handleSelect = (i: number) => {
    setSelected(i)
    setShowing(false)
    setText('')
    const full = AI_SANDBOX_SCENARIOS[i].response
    let idx = 0
    const interval = setInterval(() => {
      idx++
      setText(full.slice(0, idx))
      if (idx >= full.length) { clearInterval(interval); setShowing(true) }
    }, 12)
  }

  const scenario = selected !== null ? AI_SANDBOX_SCENARIOS[selected] : null

  return (
    <div style={{
      background: S.surface, border: `1px solid ${S.border2}`, borderRadius: '12px',
      overflow: 'hidden', fontFamily: S.sans,
    }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: S.green, animation: 'pulse 1.5s infinite' }} />
        <span style={{ fontSize: '13px', fontWeight: 600, color: S.text }}>AI Behavioral Engine — Live Demo</span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: S.text3, fontFamily: S.mono }}>click a scenario below</span>
      </div>

      {/* Scenarios */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {AI_SANDBOX_SCENARIOS.map((s, i) => (
          <button key={i} onClick={() => handleSelect(i)} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '8px', textAlign: 'left', cursor: 'pointer',
            background: selected === i ? 'rgba(108,142,255,0.1)' : S.surface2,
            border: `1px solid ${selected === i ? 'rgba(108,142,255,0.35)' : 'transparent'}`,
            fontFamily: S.sans, transition: 'all 0.15s',
          }}>
            <span style={{
              fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px',
              fontFamily: S.mono, letterSpacing: '0.5px', flexShrink: 0,
              background: s.severity === 'critical' ? 'rgba(255,95,95,0.1)' : 'rgba(245,166,35,0.1)',
              color: s.severity === 'critical' ? S.red : S.amber,
            }}>{s.severity.toUpperCase()}</span>
            <span style={{ fontSize: '12px', color: S.text2 }}>{s.label}</span>
          </button>
        ))}
      </div>

      {/* AI Response */}
      <div style={{
        margin: '0 16px 16px', minHeight: '120px', padding: '14px',
        background: selected !== null ? 'rgba(108,142,255,0.05)' : S.surface2,
        borderRadius: '8px',
        border: `1px solid ${selected !== null ? 'rgba(108,142,255,0.2)' : 'transparent'}`,
        transition: 'all 0.3s',
      }}>
        {selected === null ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px', color: S.text3, fontSize: '13px', fontFamily: S.mono }}>
            ↑ Click a scenario to see the AI response
          </div>
        ) : (
          <>
            <div style={{ fontSize: '10px', fontWeight: 700, color: S.accent, fontFamily: S.mono, letterSpacing: '0.8px', marginBottom: '8px' }}>
              ✦ AI COACH · {scenario!.flag.toUpperCase()}
            </div>
            <div style={{ fontSize: '13px', lineHeight: 1.7, color: S.text2 }}>
              {text}
              {!showing && <span style={{ display: 'inline-block', width: '2px', height: '14px', background: S.accent, marginLeft: '2px', animation: 'blink 0.8s infinite', verticalAlign: 'middle' }} />}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── FLOW DIAGRAM (SVG) ────────────────────────────────────────
function FlowDiagram() {
  return (
    <svg width="100%" viewBox="0 0 720 280" aria-label="Two-layer AI architecture: raw trades flow into the deterministic engine producing scores, which feed the AI interpretation layer producing coaching insights">
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="#555C6E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>

      {/* Layer 1 box */}
      <rect x="20" y="60" width="200" height="160" rx="10" fill="rgba(62,207,142,0.07)" stroke="rgba(62,207,142,0.3)" strokeWidth="1" />
      <text x="120" y="88" textAnchor="middle" fill="#8B90A0" fontSize="9" fontFamily="'DM Mono', monospace" letterSpacing="1">LAYER 01</text>
      <text x="120" y="108" textAnchor="middle" fill="#E8EAF0" fontSize="13" fontWeight="600" fontFamily="Syne, system-ui">Deterministic</text>
      <text x="120" y="124" textAnchor="middle" fill="#E8EAF0" fontSize="13" fontWeight="600" fontFamily="Syne, system-ui">Engine</text>
      {['Win rate / RR / streaks', 'Behavioral flag detection', 'Discipline scoring', 'Risk quality scoring', 'Trade alignment'].map((item, i) => (
        <g key={item}>
          <circle cx="38" cy={150 + i * 18} r="2" fill="#3ECF8E" />
          <text x="46" y={154 + i * 18} fill="#8B90A0" fontSize="10" fontFamily="Syne, system-ui">{item}</text>
        </g>
      ))}

      {/* Arrow 1 */}
      <line x1="220" y1="140" x2="276" y2="140" stroke="#555C6E" strokeWidth="1.5" markerEnd="url(#arr)" />
      <text x="248" y="132" textAnchor="middle" fill="#555C6E" fontSize="9" fontFamily="'DM Mono', monospace">scores</text>

      {/* Middle: Analytics object */}
      <rect x="280" y="90" width="160" height="100" rx="8" fill="rgba(108,142,255,0.08)" stroke="rgba(108,142,255,0.25)" strokeWidth="1" />
      <text x="360" y="116" textAnchor="middle" fill="#8B90A0" fontSize="9" fontFamily="'DM Mono', monospace" letterSpacing="1">ANALYTICS</text>
      {['discipline: 78', 'consistency: 84', 'flags: 3', 'patterns: 6'].map((line, i) => (
        <text key={line} x="300" y={138 + i * 15} fill="#6C8EFF" fontSize="10" fontFamily="'DM Mono', monospace">{line}</text>
      ))}

      {/* Arrow 2 */}
      <line x1="440" y1="140" x2="496" y2="140" stroke="#555C6E" strokeWidth="1.5" markerEnd="url(#arr)" />
      <text x="468" y="132" textAnchor="middle" fill="#555C6E" fontSize="9" fontFamily="'DM Mono', monospace">interprets</text>

      {/* Layer 2 box */}
      <rect x="500" y="60" width="200" height="160" rx="10" fill="rgba(108,142,255,0.07)" stroke="rgba(108,142,255,0.3)" strokeWidth="1" />
      <text x="600" y="88" textAnchor="middle" fill="#8B90A0" fontSize="9" fontFamily="'DM Mono', monospace" letterSpacing="1">LAYER 02</text>
      <text x="600" y="108" textAnchor="middle" fill="#E8EAF0" fontSize="13" fontWeight="600" fontFamily="Syne, system-ui">AI Interpretation</text>
      <text x="600" y="124" textAnchor="middle" fill="#E8EAF0" fontSize="13" fontWeight="600" fontFamily="Syne, system-ui">Layer</text>
      {['Weekly coaching reports', 'Behavioral narratives', 'Chat coach (GPT-4o)', 'Proactive insights', 'Trade narratives'].map((item, i) => (
        <g key={item}>
          <circle cx="518" cy={150 + i * 18} r="2" fill="#6C8EFF" />
          <text x="526" y={154 + i * 18} fill="#8B90A0" fontSize="10" fontFamily="Syne, system-ui">{item}</text>
        </g>
      ))}

      {/* Raw trades input (top) */}
      <rect x="64" y="10" width="112" height="30" rx="6" fill="#161920" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      <text x="120" y="29" textAnchor="middle" fill="#8B90A0" fontSize="10" fontFamily="'DM Mono', monospace">Raw trade data</text>
      <line x1="120" y1="40" x2="120" y2="58" stroke="#555C6E" strokeWidth="1" markerEnd="url(#arr)" strokeDasharray="4 2" />

      {/* Output (bottom right) */}
      <rect x="544" y="240" width="112" height="30" rx="6" fill="#161920" stroke="rgba(108,142,255,0.25)" strokeWidth="1" />
      <text x="600" y="259" textAnchor="middle" fill="#6C8EFF" fontSize="10" fontFamily="'DM Mono', monospace">Coaching output</text>
      <line x1="600" y1="220" x2="600" y2="238" stroke="#555C6E" strokeWidth="1" markerEnd="url(#arr)" strokeDasharray="4 2" />

      {/* No signals note */}
      <rect x="248" y="228" width="224" height="26" rx="5" fill="rgba(245,166,35,0.08)" stroke="rgba(245,166,35,0.2)" strokeWidth="0.5" />
      <text x="360" y="245" textAnchor="middle" fill="#F5A623" fontSize="10" fontFamily="'DM Mono', monospace">⚠ No buy/sell signals — ever</text>
    </svg>
  )
}

// ── MAIN PAGE ────────────────────────────────────────────────
export default function LandingPage() {
  const [insightIdx, setInsightIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setInsightIdx(i => (i + 1) % ROTATING_INSIGHTS.length), 3500)
    return () => clearInterval(t)
  }, [])

  const styles = {
    page: {
      background: S.bg,
      color: S.text,
      fontFamily: S.sans,
      minHeight: '100vh',
      overflowX: 'hidden' as const,
    },
    nav: {
      position: 'sticky' as const, top: 0, zIndex: 50,
      background: 'rgba(10,11,14,0.88)',
      backdropFilter: 'blur(16px)',
      borderBottom: `1px solid ${S.border}`,
    },
    navInner: {
      maxWidth: '1120px', margin: '0 auto', padding: '0 24px',
      height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    },
    logo: { display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' },
    logoMark: {
      width: '28px', height: '28px', borderRadius: '7px', background: S.accent,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '12px', fontWeight: 800, color: '#fff',
    },
    logoText: { fontSize: '16px', fontWeight: 700, letterSpacing: '-0.3px', color: S.text },
    navLinks: { display: 'flex', gap: '28px' },
    navLink: { fontSize: '14px', color: S.text2, textDecoration: 'none', fontWeight: 500 },
    navCtas: { display: 'flex', gap: '10px' },
    btnOutline: {
      padding: '8px 16px', borderRadius: '7px', fontSize: '13px', fontWeight: 600,
      color: S.text2, textDecoration: 'none', border: `1px solid ${S.border2}`,
      background: 'transparent',
    },
    btnAccent: {
      padding: '8px 16px', borderRadius: '7px', fontSize: '13px', fontWeight: 700,
      background: S.accent, color: '#fff', textDecoration: 'none',
      boxShadow: '0 0 20px rgba(108,142,255,0.25)',
    },
    section: { maxWidth: '1120px', margin: '0 auto', padding: '0 24px' },
    divider: { height: '1px', background: S.border, margin: '0' },
  }

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .insight-text { animation: fadeUp 0.4s ease-out; }
        .feature-card:hover { border-color: rgba(108,142,255,0.3) !important; transform: translateY(-2px); }
        .feature-card { transition: all 0.2s; }
        .cta-primary:hover { box-shadow: 0 0 40px rgba(108,142,255,0.4) !important; transform: translateY(-1px); }
        .cta-primary { transition: all 0.2s; }
        .nav-link:hover { color: #E8EAF0 !important; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          <Link href="/" style={styles.logo}>
            <div style={styles.logoMark}>TM</div>
            <span style={styles.logoText}>TraderMind</span>
          </Link>
          <div style={styles.navLinks}>
            {[['#features', 'Features'], ['#demo', 'Demo'], ['#how-it-works', 'How It Works'], ['#pricing', 'Pricing']].map(([href, label]) => (
              <a key={href} href={href} className="nav-link" style={styles.navLink}>{label}</a>
            ))}
          </div>
          <div style={styles.navCtas}>
            <Link href="/auth/login" style={styles.btnOutline}>Log in</Link>
            <Link href="/auth/login" className="cta-primary" style={styles.btnAccent}>Try Demo →</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ ...styles.section, paddingTop: '100px', paddingBottom: '80px', textAlign: 'center', position: 'relative' }}>
        {/* Glow */}
        <div style={{ position: 'absolute', top: '40px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '300px', background: 'radial-gradient(ellipse, rgba(108,142,255,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 14px', borderRadius: '20px', marginBottom: '28px', background: 'rgba(108,142,255,0.1)', border: '1px solid rgba(108,142,255,0.25)', fontSize: '12px', fontWeight: 600, color: S.accent, fontFamily: S.mono }}>
          ⚡ AI-Powered Trading Performance Coach
        </div>

        <h1 style={{ fontSize: 'clamp(36px, 5.5vw, 68px)', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1.05, marginBottom: '24px' }}>
          Most trading tools analyze the market.<br />
          <span style={{ background: `linear-gradient(135deg, ${S.accent}, ${S.purple})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>We analyze the trader.</span>
        </h1>

        <p style={{ fontSize: '18px', color: S.text2, maxWidth: '560px', margin: '0 auto 40px', lineHeight: 1.7 }}>
          TraderMind identifies psychological patterns, scores your discipline, and coaches you to trade your best — consistently.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
          <Link href="/auth/login" className="cta-primary" style={{ ...styles.btnAccent, padding: '14px 28px', fontSize: '15px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            Try Guest Demo — No Signup →
          </Link>
          <Link href="/dashboard" style={{ ...styles.btnOutline, padding: '14px 24px', fontSize: '15px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            View Live Dashboard
          </Link>
        </div>
        <p style={{ fontSize: '12px', color: S.text3, fontFamily: S.mono }}>Pre-filled credentials · Full Pro access · No credit card</p>

        {/* Rotating AI insight */}
        <div style={{ maxWidth: '640px', margin: '56px auto 0', padding: '16px 24px', borderRadius: '10px', background: 'rgba(108,142,255,0.06)', border: '1px solid rgba(108,142,255,0.18)', display: 'flex', alignItems: 'center', gap: '10px', minHeight: '64px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: S.green, flexShrink: 0, animation: 'pulse 1.5s infinite' }} />
          <p key={insightIdx} className="insight-text" style={{ fontSize: '14px', fontStyle: 'italic', color: S.text2, lineHeight: 1.6, textAlign: 'left' }}>
            {ROTATING_INSIGHTS[insightIdx]}
          </p>
        </div>

        {/* Broker badges */}
        <div style={{ marginTop: '48px' }}>
          <p style={{ fontSize: '11px', color: S.text3, fontFamily: S.mono, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>Connects with</p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {BROKERS.map(b => (
              <span key={b} style={{ padding: '5px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, fontFamily: S.mono, background: S.surface, border: `1px solid ${S.border2}`, color: S.text2 }}>{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── DASHBOARD MOCKUP ── */}
      <section id="demo" style={{ ...styles.section, paddingBottom: '80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <p style={{ fontSize: '11px', fontFamily: S.mono, color: S.accent, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '12px' }}>Product Preview</p>
          <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 800, letterSpacing: '-0.8px' }}>
            The behavioral intelligence dashboard
          </h2>
          <p style={{ fontSize: '15px', color: S.text2, marginTop: '10px', maxWidth: '500px', margin: '10px auto 0' }}>
            Every metric is about you — not the market. Discipline scores, behavioral flags, emotional patterns, session analytics.
          </p>
        </div>
        <DashboardMockup />
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link href="/auth/login" className="cta-primary" style={{ ...styles.btnAccent, padding: '12px 24px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            Explore the full dashboard →
          </Link>
        </div>
      </section>

      <div style={styles.divider} />

      {/* ── FEATURES ── */}
      <section id="features" style={{ ...styles.section, paddingTop: '80px', paddingBottom: '80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <p style={{ fontSize: '11px', fontFamily: S.mono, color: S.accent, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '12px' }}>Platform Features</p>
          <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 800, letterSpacing: '-0.8px' }}>Built for serious traders.</h2>
          <p style={{ fontSize: '15px', color: S.text2, marginTop: '10px' }}>Not beginners. Not signal seekers. Traders who want to improve.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {FEATURES.map(f => (
            <div key={f.title} className="feature-card" style={{ padding: '24px', borderRadius: '12px', background: S.surface, border: `1px solid ${S.border}` }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '16px' }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: S.text }}>{f.title}</h3>
              <p style={{ fontSize: '14px', color: S.text2, lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div style={styles.divider} />

      {/* ── AI SANDBOX ── */}
      <section style={{ ...styles.section, paddingTop: '80px', paddingBottom: '80px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <p style={{ fontSize: '11px', fontFamily: S.mono, color: S.accent, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '12px' }}>Interactive Demo</p>
          <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 800, letterSpacing: '-0.8px' }}>See the AI coach in action</h2>
          <p style={{ fontSize: '15px', color: S.text2, marginTop: '10px', maxWidth: '520px', margin: '10px auto 0' }}>
            Pick a real trading mistake below and watch TraderMind analyze it in real time — using your behavioral history as context.
          </p>
        </div>
        <div style={{ maxWidth: '780px', margin: '0 auto' }}>
          <AISandbox />
        </div>
      </section>

      <div style={styles.divider} />

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ background: S.surface, borderTop: `1px solid ${S.border}`, borderBottom: `1px solid ${S.border}`, padding: '80px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', fontFamily: S.mono, color: S.accent, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '12px' }}>Architecture</p>
          <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 800, letterSpacing: '-0.8px', marginBottom: '12px' }}>Two layers. One system.</h2>
          <p style={{ fontSize: '15px', color: S.text2, marginBottom: '48px', maxWidth: '560px', margin: '0 auto 48px' }}>
            All calculations are deterministic — no AI guesswork in the numbers. The AI only interprets the patterns in plain English.
          </p>
          <FlowDiagram />
          <div style={{ marginTop: '24px', display: 'inline-block', padding: '12px 20px', borderRadius: '8px', background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)', fontSize: '13px', color: S.text2, fontFamily: S.mono }}>
            ⚠ The AI never generates buy/sell signals. It only interprets your behavior.
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ maxWidth: '820px', margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <p style={{ fontSize: '11px', fontFamily: S.mono, color: S.accent, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '12px' }}>Pricing</p>
          <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 800, letterSpacing: '-0.8px' }}>Simple pricing.</h2>
          <p style={{ fontSize: '13px', color: S.text3, marginTop: '8px', fontFamily: S.mono }}>* Portfolio demo — both plans accessible via the guest demo</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {[
            {
              name: 'Free', price: '$0', period: 'forever', highlight: false, cta: 'Get Started Free', href: '/auth/login',
              features: ['Manual trade logging', 'Basic performance stats', 'Behavioral journal', 'Session breakdown', '1 broker connection'],
            },
            {
              name: 'Pro', price: '$29', period: 'per month', highlight: true, cta: 'Try Demo — Full Access', href: '/auth/login',
              features: ['Everything in Free', 'AI weekly & monthly reports', 'Real-time trade evaluation', 'Behavioral intelligence engine', 'All broker integrations', 'Goals & rule enforcement'],
            },
          ].map(plan => (
            <div key={plan.name} style={{ padding: '28px', borderRadius: '14px', background: plan.highlight ? 'linear-gradient(135deg,rgba(108,142,255,0.1),rgba(180,142,255,0.06))' : S.surface, border: `1px solid ${plan.highlight ? 'rgba(108,142,255,0.35)' : S.border}`, position: 'relative' }}>
              {plan.highlight && (
                <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', padding: '4px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: S.accent, color: '#fff', fontFamily: S.mono, whiteSpace: 'nowrap' }}>Most Popular</div>
              )}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: S.text2 }}>{plan.name}</div>
                <div style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-1.5px', color: S.text }}>{plan.price}</div>
                <div style={{ fontSize: '12px', color: S.text3, fontFamily: S.mono }}>{plan.period}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: plan.highlight ? S.accent : S.green, fontSize: '14px' }}>✓</span>
                    <span style={{ fontSize: '13px', color: S.text2 }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link href={plan.href} style={{ display: 'block', textAlign: 'center', padding: '11px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, textDecoration: 'none', background: plan.highlight ? S.accent : 'transparent', border: `1px solid ${plan.highlight ? S.accent : S.border2}`, color: plan.highlight ? '#fff' : S.text2 }}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <div style={styles.divider} />

      {/* ── FOOTER ── */}
      <footer style={{ padding: '40px 24px 32px', background: S.surface }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          {/* Tech stack */}
          <div style={{ marginBottom: '32px', textAlign: 'center' }}>
            <p style={{ fontSize: '11px', color: S.text3, fontFamily: S.mono, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Built with</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {TECH_STACK.map(t => (
                <span key={t.name} style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontFamily: S.mono, background: '#0D0F14', border: `1px solid ${S.border}`, color: S.text2, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: t.color, fontSize: '10px' }}>{t.icon}</span>
                  {t.name}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', paddingTop: '24px', borderTop: `1px solid ${S.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '5px', background: S.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: '#fff' }}>TM</div>
              <span style={{ fontSize: '14px', fontWeight: 600, color: S.text }}>TraderMind</span>
              <span style={{ fontSize: '11px', color: S.text3, fontFamily: S.mono }}>· Portfolio Project · 2026</span>
            </div>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <a href="https://github.com/mufasa-droid/TraderMind" target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: S.text3, textDecoration: 'none', fontFamily: S.mono, display: 'flex', alignItems: 'center', gap: '5px', border: `1px solid ${S.border}`, padding: '5px 12px', borderRadius: '6px' }}>
                ⌥ GitHub Repository
              </a>
              <span style={{ fontSize: '12px', color: S.text3, fontFamily: S.mono }}>Next.js · TypeScript · Supabase · OpenAI</span>
            </div>
            <p style={{ fontSize: '12px', color: S.text3, fontFamily: S.mono }}>We analyze the trader, not the market</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
