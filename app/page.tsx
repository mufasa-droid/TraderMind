'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Brain,
  Zap,
  Shield,
  BarChart3,
  Target,
  Link2,
  Menu,
  X,
  Check,
  ArrowRight,
  ShieldCheck,
  Terminal,
  Activity,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

// ── TYPES ────────────────────────────────────────────────────
type AISandboxScenario = {
  label: string
  flag: string
  severity: 'critical' | 'warning'
  response: string
}

// ── CONSTANTS ────────────────────────────────────────────────
const BROKERS = ['MT4', 'MT5', 'Binance', 'Bybit', 'cTrader', 'TradingView', 'DXTrade']

type Feature = {
  icon: LucideIcon
  color: string
  bg: string
  title: string
  desc: string
}

const FEATURES: Feature[] = [
  {
    icon: Brain,
    color: 'var(--accent)',
    bg: 'rgba(108, 142, 255, 0.1)',
    title: 'AI Behavioral Coaching',
    desc: 'Weekly synthesis of your psychology, emotional triggers, and decision quality — actionable insights no market chart can deliver.',
  },
  {
    icon: Zap,
    color: 'var(--green)',
    bg: 'rgba(62, 207, 142, 0.1)',
    title: 'Real-Time Trade Evaluation',
    desc: 'Receive an alignment score, risk rating, and behavioral compliance check grounded in your personal trade history before execution.',
  },
  {
    icon: Shield,
    color: 'var(--amber)',
    bg: 'rgba(245, 166, 35, 0.1)',
    title: 'Behavioral Intelligence Engine',
    desc: 'Detects revenge trading, FOMO impulses, post-win risk creep, overtrading, and 8 other detrimental patterns in real time.',
  },
  {
    icon: BarChart3,
    color: 'var(--purple)',
    bg: 'rgba(180, 142, 255, 0.1)',
    title: 'Multi-Dimensional Analytics',
    desc: 'Session-by-session, instrument-by-instrument, strategy-by-strategy — pinpoint exactly when, where, and why you maintain an edge.',
  },
  {
    icon: Target,
    color: 'var(--teal)',
    bg: 'rgba(29, 233, 194, 0.1)',
    title: 'Goals & Rule Enforcement',
    desc: 'Define your institutional trading rules. The platform continuously monitors compliance and alerts you to every violation.',
  },
  {
    icon: Link2,
    color: 'var(--green)',
    bg: 'rgba(62, 207, 142, 0.1)',
    title: 'Live Broker Sync',
    desc: 'MT4, MT5, Binance, Bybit, cTrader — closed positions sync automatically via read-only channels with zero manual logging friction.',
  },
]

const AI_SANDBOX_SCENARIOS: AISandboxScenario[] = [
  {
    label: '5 trades within 10 min following a loss',
    flag: 'Revenge Trading + Overtrading',
    severity: 'critical',
    response:
      'CRITICAL: You entered 5 trades within 10 minutes of a significant loss. This matches a verified revenge trading pattern — your historical average P&L in this state is −$247. Historical data shows 89% of post-loss flurries result in compounded drawdowns. Step away from terminal for 30 minutes to preserve capital.',
  },
  {
    label: 'Risking 4.0% after 3 consecutive wins',
    flag: 'Post-Win Risk Creep',
    severity: 'critical',
    response:
      'CRITICAL: Risk at 4.0% is 3.3× your optimal threshold of 1.2%. After win streaks of 3+, you historically increase position sizing by an average of 0.8% — this setup exceeds that threshold. Your last 6 over-sized trades after win streaks produced an average loss of −$312. Reset risk to 1.2% baseline.',
  },
  {
    label: 'Executing ahead of high-impact news',
    flag: 'Poor Session Timing',
    severity: 'warning',
    response:
      'WARNING: A high-impact economic event (NFP) is scheduled within 18 minutes. Your win rate falls to 31% in the 30 minutes surrounding tier-1 news releases. While the technical setup may be valid, timing is unfavorable. Wait for post-spike liquidity stabilization before entry.',
  },
  {
    label: 'Entering a trade with elevated anxiety',
    flag: 'Emotional State — Fearful',
    severity: 'warning',
    response:
      'WARNING: Trades entered under reported fearful emotional states have a 38% historical win rate — significantly below your 60% baseline. Fear-state entries also suffer early exits, shrinking average R:R from 2.1R to 0.7R. Complete a pre-trade journal check before proceeding.',
  },
  {
    label: 'Bypassing a protective stop loss',
    flag: 'Rule Violation — No Stop Loss',
    severity: 'critical',
    response:
      'RULE VIOLATION: Trading without a stop loss violates Rule #1. Your 3 previous unhedged trades produced an average loss of −$890 — 5.8× your average loss. This is a severe discipline failure that will penalize your discipline score by 12 points. Define your invalidation level before opening.',
  },
]

const ROTATING_INSIGHTS = [
  'London session win rate is 67% vs 48% in New York across your last 60 trades.',
  'Post-win risk creep identified: position sizing increased by +0.8% after 3+ consecutive wins.',
  'Breakout strategy achieves a 71% win rate when ATR conditions are satisfied.',
  'Revenge flurry detected: 3 rapid entries within 5 minutes of a losing trade.',
  'Discipline score gained +11 points this week due to consistent stop-loss adherence.',
]

// ── DASHBOARD MOCKUP COMPONENT ───────────────────────────────
function DashboardMockup() {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-2)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5), var(--shadow-ring)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Mock Window Topbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          background: 'var(--surface-2)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '6px',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 800,
              color: '#FFFFFF',
              fontFamily: 'var(--font-mono)',
            }}
          >
            TM
          </div>
          <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>
            TraderMind
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
            / institutional-workspace
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {['Overview', 'Behavior', 'AI Coach', 'Trades'].map((tab, i) => (
            <span
              key={tab}
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '6px',
                fontWeight: 500,
                background: i === 0 ? 'var(--surface-3)' : 'transparent',
                color: i === 0 ? 'var(--text)' : 'var(--text-3)',
                border: i === 0 ? '1px solid var(--border-2)' : '1px solid transparent',
              }}
            >
              {tab}
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: 'var(--green)',
              boxShadow: '0 0 8px rgba(62, 207, 142, 0.4)',
            }}
          />
          <span style={{ fontSize: '11px', color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>
            MT5 Read-Only Sync
          </span>
        </div>
      </div>

      {/* 4 Score Cards (Deterministic Math) */}
      <div
        className="mockup-score-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px',
          padding: '16px 18px 10px',
        }}
      >
        {[
          { label: 'Discipline Score', value: '78', delta: '+6 vs last month', color: 'var(--accent)' },
          { label: 'Consistency', value: '84', delta: 'Top 10% benchmark', color: 'var(--green)' },
          { label: 'Risk Quality', value: '61', delta: 'Risk creep detected', color: 'var(--amber)' },
          { label: 'Emotional Stability', value: '72', delta: '+11% improved', color: 'var(--purple)' },
        ].map(card => (
          <div
            key={card.label}
            style={{
              background: 'var(--surface-2)',
              borderRadius: '10px',
              padding: '14px 16px',
              border: '1px solid var(--border)',
              borderTop: `2px solid ${card.color}`,
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color: 'var(--text-3)',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '6px',
              }}
            >
              {card.label}
            </div>
            <div
              style={{
                fontSize: '26px',
                fontWeight: 700,
                color: card.color,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '-0.03em',
                fontFeatureSettings: '"tnum" 1, "zero" 1',
              }}
            >
              {card.value}
            </div>
            <div style={{ height: '3px', background: 'var(--surface-3)', borderRadius: '2px', marginTop: '8px' }}>
              <div
                style={{
                  height: '3px',
                  borderRadius: '2px',
                  background: card.color,
                  width: `${card.value}%`,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
              {card.delta}
            </div>
          </div>
        ))}
      </div>

      {/* AI Coach Weekly Synthesis Banner */}
      <div
        style={{
          margin: '0 18px 12px',
          padding: '14px 16px',
          borderRadius: '10px',
          background: 'rgba(108, 142, 255, 0.05)',
          border: '1px solid rgba(108, 142, 255, 0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Sparkles size={13} color="var(--accent)" />
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: 'var(--accent)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.08em',
            }}
          >
            AI BEHAVIORAL INTERPRETATION · LAYER 2
          </span>
        </div>
        <div style={{ fontSize: '12.5px', lineHeight: 1.6, color: 'var(--text-2)' }}>
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>Your London session win rate is 19 points higher than New York.</span>{' '}
          However, after 3+ consecutive wins, post-win risk creep was detected across 6 trades averaging +0.8% above your institutional risk threshold.
        </div>
        <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
          {[
            { tag: 'London Edge: 67%', color: 'var(--green)', bg: 'rgba(62, 207, 142, 0.1)' },
            { tag: 'Risk Creep Flagged ×6', color: 'var(--red)', bg: 'rgba(255, 95, 95, 0.1)' },
            { tag: 'Breakout Alignment: 71%', color: 'var(--green)', bg: 'rgba(62, 207, 142, 0.1)' },
          ].map(pill => (
            <span
              key={pill.tag}
              style={{
                fontSize: '10px',
                padding: '2px 8px',
                borderRadius: '4px',
                fontFamily: 'var(--font-mono)',
                background: pill.bg,
                color: pill.color,
                fontWeight: 600,
              }}
            >
              {pill.tag}
            </span>
          ))}
        </div>
      </div>

      {/* Mini Trade Table with Behavioral Alignment */}
      <div
        style={{
          margin: '0 18px 18px',
          borderRadius: '10px',
          overflow: 'hidden',
          border: '1px solid var(--border)',
          overflowX: 'auto',
        }}
      >
        <div style={{ minWidth: '420px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1.2fr',
              background: 'var(--surface-2)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            {['Pair', 'P&L', 'R:R', 'Emotion', 'Alignment'].map(header => (
              <div
                key={header}
                style={{
                  padding: '8px 12px',
                  fontSize: '10px',
                  color: 'var(--text-3)',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {header}
              </div>
            ))}
          </div>
          {[
            { pair: 'EURUSD', pnl: '+$312.00', rr: '2.4R', emotion: 'Focused', align: 91, pos: true },
            { pair: 'GBPJPY', pnl: '−$180.00', rr: '−1.0R', emotion: 'Revenge', align: 31, pos: false },
            { pair: 'XAUUSD', pnl: '+$540.00', rr: '3.1R', emotion: 'Calm', align: 88, pos: true },
            { pair: 'BTCUSD', pnl: '−$95.00', rr: '−0.6R', emotion: 'FOMO', align: 54, pos: false },
          ].map((row, i) => (
            <div
              key={row.pair}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1.2fr',
                borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                background: i % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
                alignItems: 'center',
              }}
            >
              <div style={{ padding: '8px 12px', fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text)' }}>
                {row.pair}
              </div>
              <div
                style={{
                  padding: '8px 12px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: row.pos ? 'var(--green)' : 'var(--red)',
                  fontWeight: 600,
                }}
              >
                {row.pnl}
              </div>
              <div style={{ padding: '8px 12px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>
                {row.rr}
              </div>
              <div
                style={{
                  padding: '8px 12px',
                  fontSize: '11px',
                  color:
                    row.emotion === 'Focused' || row.emotion === 'Calm'
                      ? 'var(--green)'
                      : row.emotion === 'Revenge'
                      ? 'var(--red)'
                      : 'var(--amber)',
                }}
              >
                {row.emotion}
              </div>
              <div style={{ padding: '8px 12px' }}>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    background:
                      row.align >= 75
                        ? 'rgba(62, 207, 142, 0.1)'
                        : row.align >= 50
                        ? 'rgba(245, 166, 35, 0.1)'
                        : 'rgba(255, 95, 95, 0.1)',
                    color: row.align >= 75 ? 'var(--green)' : row.align >= 50 ? 'var(--amber)' : 'var(--red)',
                  }}
                >
                  ● {row.align}/100
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── AI SANDBOX INTERACTIVE COMPONENT ─────────────────────────
function AISandbox() {
  const [selected, setSelected] = useState<number | null>(0)
  const [showing, setShowing] = useState(true)
  const [text, setText] = useState(AI_SANDBOX_SCENARIOS[0].response)

  const handleSelect = (i: number) => {
    setSelected(i)
    setShowing(false)
    setText('')
    const full = AI_SANDBOX_SCENARIOS[i].response
    let idx = 0
    const interval = setInterval(() => {
      idx += 2
      setText(full.slice(0, idx))
      if (idx >= full.length) {
        clearInterval(interval)
        setShowing(true)
      }
    }, 12)
  }

  const scenario = selected !== null ? AI_SANDBOX_SCENARIOS[selected] : null

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-2)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), var(--shadow-ring)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Terminal Title Bar */}
      <div
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--surface-2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Terminal size={15} color="var(--accent)" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
            AI Behavioral Engine — Live Scenario Simulator
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: 'var(--green)',
              animation: 'pulse 1.5s infinite',
            }}
          />
          <span style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
            Layer 2 Interpreter Ready
          </span>
        </div>
      </div>

      <div className="sandbox-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.35fr', gap: '0' }}>
        {/* Left: Scenarios List */}
        <div
          style={{
            padding: '16px',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            background: 'var(--surface)',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: 'var(--text-3)',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '4px',
            }}
          >
            Select a Trading Impasse
          </div>
          {AI_SANDBOX_SCENARIOS.map((s, i) => {
            const isSelected = selected === i
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(i)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  background: isSelected ? 'var(--surface-3)' : 'var(--surface-2)',
                  border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                  fontFamily: 'var(--font-sans)',
                  transition: 'all 0.15s ease',
                  width: '100%',
                }}
              >
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.05em',
                    flexShrink: 0,
                    background: s.severity === 'critical' ? 'rgba(255, 95, 95, 0.12)' : 'rgba(245, 166, 35, 0.12)',
                    color: s.severity === 'critical' ? 'var(--red)' : 'var(--amber)',
                  }}
                >
                  {s.severity.toUpperCase()}
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    color: isSelected ? 'var(--text)' : 'var(--text-2)',
                    fontWeight: isSelected ? 600 : 400,
                    lineHeight: 1.4,
                  }}
                >
                  {s.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Right: AI Synthesis Output */}
        <div
          style={{
            padding: '20px',
            background: 'rgba(10, 11, 14, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '260px',
          }}
        >
          {scenario && (
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: 'rgba(108, 142, 255, 0.1)',
                  border: '1px solid rgba(108, 142, 255, 0.25)',
                  marginBottom: '14px',
                }}
              >
                <Activity size={12} color="var(--accent)" />
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    color: 'var(--accent)',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.06em',
                  }}
                >
                  FLAG: {scenario.flag.toUpperCase()}
                </span>
              </div>

              <div
                style={{
                  fontSize: '13px',
                  lineHeight: 1.7,
                  color: 'var(--text)',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '-0.01em',
                }}
              >
                {text}
                {!showing && (
                  <span
                    style={{
                      display: 'inline-block',
                      width: '3px',
                      height: '14px',
                      background: 'var(--accent)',
                      marginLeft: '4px',
                      animation: 'blink 0.8s infinite',
                      verticalAlign: 'middle',
                    }}
                  />
                )}
              </div>
            </div>
          )}

          <div
            style={{
              paddingTop: '16px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: 'var(--text-3)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <span>Deterministic Analytics → GPT-4o Behavioral Synthesis</span>
            <span style={{ color: 'var(--green)' }}>✓ Zero Price Predictions</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── TWO-LAYER ARCHITECTURE SVG DIAGRAM ───────────────────────
function ArchitectureFlowDiagram() {
  return (
    <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '8px' }}>
      <div style={{ minWidth: '640px', maxWidth: '860px', margin: '0 auto' }}>
        <svg
          width="100%"
          viewBox="0 0 860 380"
          style={{ width: '100%', height: 'auto', display: 'block', margin: '0 auto', overflow: 'visible' }}
          aria-label="Two-layer AI architecture: raw trades flow into the deterministic engine producing scores, which feed the AI interpretation layer producing coaching insights"
        >
          <defs>
            <marker id="arr-gray" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="#555C6E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </marker>
            <marker id="arr-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="#3ECF8E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </marker>
            <marker id="arr-accent" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M2 1L8 5L2 9" fill="none" stroke="#6C8EFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </marker>
            <linearGradient id="l1-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(62, 207, 142, 0.08)" />
              <stop offset="100%" stopColor="rgba(62, 207, 142, 0.02)" />
            </linearGradient>
            <linearGradient id="l2-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(108, 142, 255, 0.08)" />
              <stop offset="100%" stopColor="rgba(108, 142, 255, 0.02)" />
            </linearGradient>
          </defs>

          {/* TOP INPUT: Raw Trade Data */}
          <rect x="74" y="10" width="140" height="34" rx="7" fill="#161920" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1" />
          <circle cx="92" cy="27" r="3" fill="#3ECF8E" />
          <text x="148" y="23" textAnchor="middle" fill="#E8EAF0" fontSize="10.5" fontWeight="600" fontFamily="system-ui, sans-serif">
            Raw Trade Data
          </text>
          <text x="148" y="35" textAnchor="middle" fill="#8B90A0" fontSize="8" fontFamily="'JetBrains Mono', monospace">
            Broker Webhook / Read-Only
          </text>
          <line x1="144" y1="44" x2="144" y2="68" stroke="#3ECF8E" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arr-green)" />

          {/* LAYER 01: Deterministic Engine */}
          <rect x="24" y="70" width="240" height="216" rx="12" fill="url(#l1-grad)" stroke="rgba(62, 207, 142, 0.3)" strokeWidth="1.2" />
          <text x="144" y="94" textAnchor="middle" fill="#3ECF8E" fontSize="9" fontFamily="'JetBrains Mono', monospace" letterSpacing="1.2" fontWeight="700">
            LAYER 01
          </text>
          <text x="144" y="113" textAnchor="middle" fill="#E8EAF0" fontSize="14" fontWeight="700" fontFamily="system-ui, sans-serif">
            Deterministic Engine
          </text>
          <rect x="74" y="121" width="140" height="18" rx="4" fill="rgba(62, 207, 142, 0.12)" />
          <text x="144" y="134" textAnchor="middle" fill="#3ECF8E" fontSize="9" fontFamily="'JetBrains Mono', monospace">
            Pure TypeScript · No AI
          </text>
          <line x1="44" y1="147" x2="244" y2="147" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" />

          {[
            'Win rate / RR / profit factor',
            '12 behavioral flag detectors',
            'Discipline score (0–100)',
            'Consistency & risk metrics',
            'Session edge calculations',
          ].map((item, i) => (
            <g key={item}>
              <circle cx="44" cy={165 + i * 20} r="2.5" fill="#3ECF8E" />
              <text x="54" y={169 + i * 20} fill="#8B90A0" fontSize="10.5" fontFamily="system-ui, sans-serif">
                {item}
              </text>
            </g>
          ))}

          {/* ARROW 1: Layer 1 -> Analytics Payload */}
          <line x1="264" y1="178" x2="326" y2="178" stroke="#555C6E" strokeWidth="1.5" markerEnd="url(#arr-gray)" />
          <rect x="272" y="159" width="48" height="15" rx="3" fill="#111318" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.5" />
          <text x="296" y="170" textAnchor="middle" fill="#3ECF8E" fontSize="8.5" fontFamily="'JetBrains Mono', monospace">
            scores
          </text>

          {/* MIDDLE: Performance Analytics Payload */}
          <rect x="328" y="98" width="204" height="160" rx="10" fill="#0E1117" stroke="rgba(108, 142, 255, 0.25)" strokeWidth="1" />
          <rect x="328" y="98" width="204" height="28" rx="10" fill="rgba(108, 142, 255, 0.08)" />
          <circle cx="344" cy="112" r="3" fill="#6C8EFF" />
          <text x="430" y="116" textAnchor="middle" fill="#6C8EFF" fontSize="9" fontFamily="'JetBrains Mono', monospace" letterSpacing="1.2" fontWeight="700">
            PERFORMANCE ANALYTICS
          </text>

          {[
            { label: 'discipline', val: '78 / 100', col: '#6C8EFF' },
            { label: 'consistency', val: '84 / 100', col: '#3ECF8E' },
            { label: 'risk_quality', val: '61 / 100', col: '#F5A623' },
            { label: 'emotional_stability', val: '72 / 100', col: '#B48EFF' },
            { label: 'flags_active', val: '3 detected', col: '#FF5F5F' },
            { label: 'session_edge', val: '"London 67%"', col: '#3ECF8E' },
          ].map((row, i) => (
            <g key={row.label}>
              <text x="342" y={143 + i * 18} fill="#8B90A0" fontSize="9.5" fontFamily="'JetBrains Mono', monospace">
                {row.label}:
              </text>
              <text x="518" y={143 + i * 18} textAnchor="end" fill={row.col} fontSize="9.5" fontFamily="'JetBrains Mono', monospace" fontWeight="600">
                {row.val}
              </text>
            </g>
          ))}

          {/* ARROW 2: Analytics -> Layer 2 */}
          <line x1="532" y1="178" x2="594" y2="178" stroke="#555C6E" strokeWidth="1.5" markerEnd="url(#arr-gray)" />
          <rect x="538" y="159" width="52" height="15" rx="3" fill="#111318" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.5" />
          <text x="564" y="170" textAnchor="middle" fill="#6C8EFF" fontSize="8.5" fontFamily="'JetBrains Mono', monospace">
            interprets
          </text>

          {/* LAYER 02: AI Interpretation Layer */}
          <rect x="596" y="70" width="240" height="216" rx="12" fill="url(#l2-grad)" stroke="rgba(108, 142, 255, 0.3)" strokeWidth="1.2" />
          <text x="716" y="94" textAnchor="middle" fill="#6C8EFF" fontSize="9" fontFamily="'JetBrains Mono', monospace" letterSpacing="1.2" fontWeight="700">
            LAYER 02
          </text>
          <text x="716" y="113" textAnchor="middle" fill="#E8EAF0" fontSize="14" fontWeight="700" fontFamily="system-ui, sans-serif">
            AI Interpretation Layer
          </text>
          <rect x="636" y="121" width="160" height="18" rx="4" fill="rgba(108, 142, 255, 0.12)" />
          <text x="716" y="134" textAnchor="middle" fill="#6C8EFF" fontSize="9" fontFamily="'JetBrains Mono', monospace">
            OpenAI GPT-4o · Explains Only
          </text>
          <line x1="616" y1="147" x2="816" y2="147" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" />

          {[
            'Weekly & monthly coaching',
            'Interactive AI chat coach',
            'Root-cause psychological insight',
            'Behavioral pattern narratives',
            'Actionable discipline guidance',
          ].map((item, i) => (
            <g key={item}>
              <circle cx="616" cy={165 + i * 20} r="2.5" fill="#6C8EFF" />
              <text x="626" y={169 + i * 20} fill="#8B90A0" fontSize="10.5" fontFamily="system-ui, sans-serif">
                {item}
              </text>
            </g>
          ))}

          {/* BOTTOM OUTPUT: Coaching Output */}
          <line x1="716" y1="286" x2="716" y2="318" stroke="#6C8EFF" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arr-accent)" />
          <rect x="646" y="320" width="140" height="34" rx="7" fill="#161920" stroke="rgba(108, 142, 255, 0.3)" strokeWidth="1" />
          <circle cx="664" cy="337" r="3" fill="#6C8EFF" />
          <text x="722" y="333" textAnchor="middle" fill="#6C8EFF" fontSize="10.5" fontWeight="600" fontFamily="system-ui, sans-serif">
            Coaching Output
          </text>
          <text x="722" y="345" textAnchor="middle" fill="#8B90A0" fontSize="8" fontFamily="'JetBrains Mono', monospace">
            Reports · Chat · Actions
          </text>

          {/* GUARDRAIL CALLOUT (centered at bottom) */}
          <rect x="280" y="292" width="300" height="30" rx="6" fill="rgba(245, 166, 35, 0.08)" stroke="rgba(245, 166, 35, 0.22)" strokeWidth="0.5" />
          <text x="430" y="311" textAnchor="middle" fill="#F5A623" fontSize="9.5" fontFamily="'JetBrains Mono', monospace">
            ⚠ Zero buy/sell signals — strictly behavioral analysis
          </text>
        </svg>
      </div>
    </div>
  )
}

// ── MAIN LANDING PAGE ────────────────────────────────────────
export default function LandingPage() {
  const [insightIdx, setInsightIdx] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setInsightIdx(i => (i + 1) % ROTATING_INSIGHTS.length), 3800)
    return () => clearInterval(t)
  }, [])

  return (
    <div
      style={{
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: 'var(--font-sans)',
        minHeight: '100vh',
        overflowX: 'clip',
      }}
    >
      {/* Skip Link for Accessibility */}
      <a
        href="#main-content"
        className="skip-link"
        style={{
          position: 'absolute',
          top: '-40px',
          left: '16px',
          background: 'var(--accent)',
          color: '#fff',
          padding: '8px 16px',
          borderRadius: '6px',
          zIndex: 100,
          fontFamily: 'var(--font-sans)',
          fontSize: '13px',
          fontWeight: 600,
          textDecoration: 'none',
          transition: 'top 0.15s ease',
        }}
        onFocus={e => {
          e.currentTarget.style.top = '16px'
        }}
        onBlur={e => {
          e.currentTarget.style.top = '-40px'
        }}
      >
        Skip to main content
      </a>

      {/* ── TOP NAVIGATION ── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'rgba(10, 11, 14, 0.82)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 24px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo Mark */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 800,
                color: '#FFFFFF',
                fontFamily: 'var(--font-mono)',
                boxShadow: '0 0 12px rgba(108, 142, 255, 0.35)',
              }}
            >
              TM
            </div>
            <span style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}>
              TraderMind
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="desktop-nav-links" style={{ display: 'flex', gap: '28px' }}>
            {[
              ['#features', 'Features'],
              ['#demo', 'Preview'],
              ['#how-it-works', 'Architecture'],
              ['#pricing', 'Pricing'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="nav-link"
                style={{
                  fontSize: '13.5px',
                  color: 'var(--text-2)',
                  textDecoration: 'none',
                  fontWeight: 500,
                  transition: 'color 150ms var(--ease-standard)',
                }}
              >
                {label}
              </a>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="desktop-nav-ctas" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link
              href="/auth/login"
              style={{
                padding: '6px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-2)',
                textDecoration: 'none',
                transition: 'color 150ms var(--ease-standard)',
              }}
            >
              Log in
            </Link>
            <Link
              href="/auth/register"
              style={{
                padding: '6px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text)',
                textDecoration: 'none',
                border: '1px solid var(--border-2)',
                background: 'var(--surface-2)',
                transition: 'all 150ms var(--ease-standard)',
              }}
            >
              Sign Up
            </Link>
            <Link
              href="/auth/login"
              className="cta-pill"
              style={{
                padding: '7px 16px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: 600,
                background: 'var(--accent)',
                color: '#FFFFFF',
                textDecoration: 'none',
                boxShadow: '0 0 20px rgba(108, 142, 255, 0.25)',
                transition: 'transform 160ms var(--ease-out)',
              }}
            >
              Try Demo →
            </Link>
          </div>

          {/* Mobile Nav Toggle */}
          <div className="mobile-nav-toggle" style={{ display: 'none', alignItems: 'center', gap: '8px' }}>
            <Link
              href="/auth/login"
              style={{
                padding: '6px 12px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 600,
                background: 'var(--accent)',
                color: '#FFFFFF',
                textDecoration: 'none',
              }}
            >
              Demo →
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            className="mobile-nav-drawer"
            style={{
              background: 'rgba(10, 11, 14, 0.98)',
              borderBottom: '1px solid var(--border)',
              padding: '16px 24px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {[
              ['#features', 'Features'],
              ['#demo', 'Product Preview'],
              ['#how-it-works', 'Two-Layer Architecture'],
              ['#pricing', 'Pricing & Demo Access'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  fontSize: '15px',
                  color: 'var(--text)',
                  textDecoration: 'none',
                  fontWeight: 500,
                  padding: '6px 0',
                }}
              >
                {label}
              </a>
            ))}
            <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '10px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text-2)',
                  border: '1px solid var(--border)',
                  textDecoration: 'none',
                }}
              >
                Log in
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '10px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text)',
                  border: '1px solid var(--border-2)',
                  background: 'var(--surface-2)',
                  textDecoration: 'none',
                }}
              >
                Sign Up
              </Link>
            </div>
            <Link
              href="/auth/login"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                textAlign: 'center',
                padding: '12px',
                borderRadius: '9999px',
                fontSize: '13.5px',
                fontWeight: 600,
                background: 'var(--accent)',
                color: '#FFFFFF',
                textDecoration: 'none',
              }}
            >
              Try Guest Demo — Instant Access →
            </Link>
          </div>
        )}
      </header>

      {/* ── MAIN CONTENT LANDMARK ── */}
      <main id="main-content">
        {/* ── HERO SECTION ── */}
        <section
          style={{
            maxWidth: '1120px',
            margin: '0 auto',
            padding: '96px 24px 72px',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          {/* Subtle Atmospheric Horizon Glow */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '640px',
              height: '320px',
              background: 'radial-gradient(ellipse at center, rgba(108, 142, 255, 0.09) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* Announcement Chip */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '9999px',
              marginBottom: '28px',
              background: 'rgba(108, 142, 255, 0.08)',
              border: '1px solid rgba(108, 142, 255, 0.22)',
              fontSize: '11.5px',
              fontWeight: 600,
              color: 'var(--accent)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.04em',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--green)',
                animation: 'pulse 1.8s infinite',
              }}
            />
            AI BEHAVIORAL INTELLIGENCE · TWO-LAYER ARCHITECTURE
          </div>

          {/* Two-Tone Headline */}
          <h1
            style={{
              fontSize: 'clamp(32px, 5.2vw, 64px)',
              fontWeight: 700,
              letterSpacing: '-0.035em',
              lineHeight: 1.08,
              marginBottom: '24px',
              textWrap: 'balance',
            }}
          >
            Most trading tools analyze the market.
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, var(--accent) 0%, var(--purple) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              We analyze the trader.
            </span>
          </h1>

          {/* Subheading / Lede */}
          <p
            style={{
              fontSize: '17px',
              color: 'var(--text-2)',
              maxWidth: '620px',
              margin: '0 auto 36px',
              lineHeight: 1.65,
              fontWeight: 400,
            }}
          >
            TraderMind isolates psychological missteps, computes discipline scores with pure deterministic math, and delivers AI coaching tailored to your decision history.
          </p>

          {/* Action CTAs */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginBottom: '18px',
            }}
          >
            <Link
              href="/auth/login"
              className="cta-pill"
              style={{
                padding: '12px 28px',
                borderRadius: '9999px',
                fontSize: '14px',
                fontWeight: 600,
                background: 'var(--accent)',
                color: '#FFFFFF',
                textDecoration: 'none',
                boxShadow: '0 0 28px rgba(108, 142, 255, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'transform 160ms var(--ease-out)',
              }}
            >
              Try Guest Demo — Instant Access <ArrowRight size={15} />
            </Link>
            <Link
              href="/dashboard"
              style={{
                padding: '12px 24px',
                borderRadius: '9999px',
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--text)',
                textDecoration: 'none',
                border: '1px solid var(--border-2)',
                background: 'var(--surface)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 150ms var(--ease-standard)',
              }}
            >
              View Live Dashboard
            </Link>
          </div>

          <p style={{ fontSize: '11.5px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
            Pre-filled demo credentials · Zero credit card required · Instant access
          </p>

          {/* Rotating AI Insight Ticker */}
          <div
            style={{
              maxWidth: '680px',
              margin: '52px auto 0',
              padding: '14px 20px',
              borderRadius: '12px',
              background: 'rgba(108, 142, 255, 0.05)',
              border: '1px solid rgba(108, 142, 255, 0.18)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              minHeight: '60px',
            }}
          >
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--green)',
                flexShrink: 0,
                animation: 'pulse 1.6s infinite',
              }}
            />
            <p
              key={insightIdx}
              className="insight-text"
              style={{
                fontSize: '13.5px',
                fontStyle: 'italic',
                color: 'var(--text-2)',
                lineHeight: 1.5,
                textAlign: 'left',
              }}
            >
              &ldquo;{ROTATING_INSIGHTS[insightIdx]}&rdquo;
            </p>
          </div>

          {/* Supported Brokers Monochrome Strip */}
          <div style={{ marginTop: '48px' }}>
            <p
              style={{
                fontSize: '11px',
                color: 'var(--text-3)',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '14px',
              }}
            >
              Direct Integration Badges (Read-Only)
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {BROKERS.map(broker => (
                <span
                  key={broker}
                  style={{
                    padding: '5px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                    background: 'var(--surface)',
                    border: '1px solid var(--border-2)',
                    color: 'var(--text-2)',
                  }}
                >
                  {broker}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Architectural Hatched Band Divider */}
        <div className="hatched-band" />

        {/* ── PRODUCT PREVIEW SECTION ── */}
        <section id="demo" style={{ maxWidth: '1120px', margin: '0 auto', padding: '80px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <div
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '10px',
                fontWeight: 600,
              }}
            >
              Interactive Product Preview
            </div>
            <h2
              style={{
                fontSize: 'clamp(24px, 3.4vw, 38px)',
                fontWeight: 700,
                letterSpacing: '-0.025em',
                marginBottom: '12px',
              }}
            >
              Institutional Behavioral Intelligence
            </h2>
            <p
              style={{
                fontSize: '15px',
                color: 'var(--text-2)',
                maxWidth: '560px',
                margin: '0 auto',
                lineHeight: 1.6,
              }}
            >
              Every visual metric isolates decision execution, emotional stability, and rule compliance. No noisy market forecasts.
            </p>
          </div>

          <DashboardMockup />

          <div style={{ textAlign: 'center', marginTop: '28px' }}>
            <Link
              href="/auth/login"
              className="cta-pill"
              style={{
                padding: '11px 24px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: 600,
                background: 'var(--surface-2)',
                border: '1px solid var(--border-2)',
                color: 'var(--text)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 150ms var(--ease-standard)',
              }}
            >
              Explore Full Live Dashboard <ArrowRight size={14} color="var(--accent)" />
            </Link>
          </div>
        </section>

        {/* Architectural Hatched Band Divider */}
        <div className="hatched-band" />

        {/* ── PLATFORM FEATURES BENTO ── */}
        <section id="features" style={{ maxWidth: '1120px', margin: '0 auto', padding: '80px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <div
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '10px',
                fontWeight: 600,
              }}
            >
              Core Capabilities
            </div>
            <h2
              style={{
                fontSize: 'clamp(24px, 3.4vw, 38px)',
                fontWeight: 700,
                letterSpacing: '-0.025em',
                marginBottom: '12px',
              }}
            >
              Engineered for Disciplined Execution
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--text-2)' }}>
              Built specifically for prop-firm traders and systematic operators seeking performance longevity.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '16px',
            }}
          >
            {FEATURES.map(f => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="feature-card"
                  style={{
                    padding: '24px',
                    borderRadius: '16px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-ring)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: f.bg,
                      border: '1px solid var(--border-2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={20} color={f.color} strokeWidth={2} />
                  </div>
                  <h3
                    style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--text)',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {f.title}
                  </h3>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-2)', lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Architectural Hatched Band Divider */}
        <div className="hatched-band" />

        {/* ── INTERACTIVE AI SANDBOX ── */}
        <section style={{ maxWidth: '1120px', margin: '0 auto', padding: '80px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <div
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '10px',
                fontWeight: 600,
              }}
            >
              Interactive Behavioral Sandbox
            </div>
            <h2
              style={{
                fontSize: 'clamp(24px, 3.4vw, 38px)',
                fontWeight: 700,
                letterSpacing: '-0.025em',
                marginBottom: '12px',
              }}
            >
              Test the AI Coach in Real Time
            </h2>
            <p
              style={{
                fontSize: '15px',
                color: 'var(--text-2)',
                maxWidth: '560px',
                margin: '0 auto',
                lineHeight: 1.6,
              }}
            >
              Select any real-world behavioral violation below to preview how TraderMind decomposes root psychological triggers.
            </p>
          </div>

          <div style={{ maxWidth: '860px', margin: '0 auto' }}>
            <AISandbox />
          </div>
        </section>

        {/* Architectural Hatched Band Divider */}
        <div className="hatched-band" />

        {/* ── TWO-LAYER ARCHITECTURE SPECIFICATION ── */}
        <section
          id="how-it-works"
          style={{
            background: 'var(--surface)',
            borderTop: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            padding: '80px 24px',
          }}
        >
          <div style={{ maxWidth: '960px', margin: '0 auto', textAlign: 'center' }}>
            <div
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '10px',
                fontWeight: 600,
              }}
            >
              Technical Architecture
            </div>
            <h2
              style={{
                fontSize: 'clamp(24px, 3.4vw, 38px)',
                fontWeight: 700,
                letterSpacing: '-0.025em',
                marginBottom: '12px',
              }}
            >
              Two Layers. One Deterministic Core.
            </h2>
            <p
              style={{
                fontSize: '15px',
                color: 'var(--text-2)',
                marginBottom: '44px',
                maxWidth: '600px',
                margin: '0 auto 44px',
                lineHeight: 1.6,
              }}
            >
              Layer 1 executes strict mathematical scoring with zero AI hallucination risk. Layer 2 receives structured data objects to translate behavioral dynamics into plain English.
            </p>

            <ArchitectureFlowDiagram />

            <div
              style={{
                marginTop: '32px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '9999px',
                background: 'rgba(245, 166, 35, 0.08)',
                border: '1px solid rgba(245, 166, 35, 0.22)',
                fontSize: '12.5px',
                color: 'var(--amber)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <ShieldCheck size={16} />
              Strict separation: The AI only interprets behavior — it never predicts price or suggests entries.
            </div>
          </div>
        </section>

        {/* ── PRICING SECTION ── */}
        <section id="pricing" style={{ maxWidth: '840px', margin: '0 auto', padding: '80px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '10px',
                fontWeight: 600,
              }}
            >
              Transparent Pricing
            </div>
            <h2
              style={{
                fontSize: 'clamp(24px, 3.4vw, 38px)',
                fontWeight: 700,
                letterSpacing: '-0.025em',
                marginBottom: '10px',
              }}
            >
              Simple, Accessible Plans
            </h2>
            <p style={{ fontSize: '12.5px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
              * Hackathon & portfolio release: all Pro features are fully accessible via the pre-filled demo account.
            </p>
          </div>

          <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {[
              {
                name: 'Free',
                price: '$0',
                period: 'forever',
                highlight: false,
                cta: 'Create Free Account',
                href: '/auth/register',
                features: [
                  'Manual trade journaling',
                  'Basic session win rate analytics',
                  'Daily emotional state tracking',
                  'Core discipline scoring',
                  '1 broker integration slot',
                ],
              },
              {
                name: 'Pro',
                price: '$29',
                period: 'per month',
                highlight: true,
                cta: 'Try Demo — Full Access',
                href: '/auth/login',
                features: [
                  'Everything in Free tier',
                  'Weekly & monthly GPT-4o reports',
                  'Real-time trade alignment evaluator',
                  '12-flag behavioral intelligence engine',
                  'Unlimited broker & webhook sync',
                  'Custom rule violation tracking',
                ],
              },
            ].map(plan => (
              <div
                key={plan.name}
                style={{
                  padding: '32px 28px',
                  borderRadius: '16px',
                  background: plan.highlight
                    ? 'linear-gradient(145deg, rgba(108, 142, 255, 0.08), rgba(180, 142, 255, 0.04))'
                    : 'var(--surface)',
                  border: plan.highlight ? '1px solid rgba(108, 142, 255, 0.4)' : '1px solid var(--border)',
                  boxShadow: plan.highlight ? '0 12px 40px rgba(108, 142, 255, 0.15)' : 'var(--shadow-ring)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                {plan.highlight && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-11px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      padding: '3px 12px',
                      borderRadius: '9999px',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      background: 'var(--accent)',
                      color: '#FFFFFF',
                      fontFamily: 'var(--font-mono)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    FEATURED PORTFOLIO DEMO
                  </div>
                )}

                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-2)' }}>{plan.name}</div>
                    <div
                      style={{
                        fontSize: '38px',
                        fontWeight: 700,
                        letterSpacing: '-0.03em',
                        color: 'var(--text)',
                        fontFamily: 'var(--font-mono)',
                        fontFeatureSettings: '"tnum" 1',
                        margin: '4px 0',
                      }}
                    >
                      {plan.price}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                      {plan.period}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
                    {plan.features.map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Check size={15} color={plan.highlight ? 'var(--accent)' : 'var(--green)'} />
                        <span style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.5 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href={plan.href}
                  className="cta-pill"
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '12px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    background: plan.highlight ? 'var(--accent)' : 'var(--surface-2)',
                    border: plan.highlight ? '1px solid var(--accent)' : '1px solid var(--border-2)',
                    color: plan.highlight ? '#FFFFFF' : 'var(--text)',
                    transition: 'transform 160ms var(--ease-out)',
                  }}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Architectural Hatched Band Divider */}
      <div className="hatched-band" />

      {/* ── INSTITUTIONAL FOOTER ── */}
      <footer style={{ padding: '64px 24px 36px', background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          {/* Main 4-Column Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '40px',
              marginBottom: '48px',
            }}
          >
            {/* Col 1: Brand & Mission */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    background: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  TM
                </div>
                <span style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}>
                  TraderMind
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6, maxWidth: '280px' }}>
                Most trading tools analyze the market. We analyze the trader — measuring psychology, discipline, and behavioral risk.
              </p>
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '5px 12px',
                    borderRadius: '9999px',
                    background: 'rgba(62, 207, 142, 0.08)',
                    border: '1px solid rgba(62, 207, 142, 0.2)',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--green)',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'var(--green)',
                      animation: 'pulse 1.8s infinite',
                    }}
                  />
                  Deterministic Engine Online
                </div>
              </div>
              <div style={{ marginTop: '4px' }}>
                <a
                  href="https://github.com/mufasa-droid/TraderMind"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-chip"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border-2)',
                    color: 'var(--text)',
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    textDecoration: 'none',
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    />
                  </svg>
                  <span>mufasa-droid / TraderMind</span>
                  <span style={{ color: 'var(--text-3)' }}>↗</span>
                </a>
              </div>
            </div>

            {/* Col 2: Platform Links */}
            <div>
              <p
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--accent)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 700,
                  marginBottom: '16px',
                }}
              >
                Platform
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Behavioral Intelligence Engine', href: '#features' },
                  { label: 'Real-Time Trade Evaluation', href: '#features' },
                  { label: 'AI Psychological Coaching', href: '#features' },
                  { label: 'Performance Analytics', href: '#features' },
                  { label: 'Goals & Rule Enforcement', href: '#features' },
                  { label: 'Interactive AI Sandbox', href: '#demo' },
                ].map(item => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="footer-link"
                      style={{ fontSize: '13px', color: 'var(--text-2)', textDecoration: 'none' }}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3: Architecture & System */}
            <div>
              <p
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--accent)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 700,
                  marginBottom: '16px',
                }}
              >
                Architecture
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Two-Layer Architecture', href: '#how-it-works' },
                  { label: 'Layer 1: Deterministic Engine', href: '#how-it-works' },
                  { label: 'Layer 2: GPT-4o Insights', href: '#how-it-works' },
                  { label: 'MetaTrader 4 & 5 Sync', href: '#features' },
                  { label: 'Crypto & Broker Integrations', href: '#features' },
                  { label: 'Free & Pro Pricing', href: '#pricing' },
                ].map(item => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="footer-link"
                      style={{ fontSize: '13px', color: 'var(--text-2)', textDecoration: 'none' }}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4: Institutional Guardrails */}
            <div>
              <p
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--amber)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 700,
                  marginBottom: '16px',
                }}
              >
                Guardrails & Ethics
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                    🛡 Zero Trade Signals
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5 }}>
                    Strict policy: We never predict price or recommend trade entries. Only trader behavior is measured.
                  </div>
                </div>
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                    🔒 Read-Only Broker Sync
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5 }}>
                    Zero execution capability. TraderMind cannot place, modify, or close trades on your broker account.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tech Stack Strip */}
          <div
            style={{
              padding: '24px 0',
              borderTop: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)',
              marginBottom: '28px',
            }}
          >
            <p
              style={{
                fontSize: '11px',
                color: 'var(--text-3)',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                textAlign: 'center',
                marginBottom: '14px',
              }}
            >
              Built with Institutional-Grade Architecture
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                {
                  name: 'Next.js 15',
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 180 180" fill="none">
                      <circle cx="90" cy="90" r="90" fill="#000" />
                      <path d="M149.5 157.4L69.1 54H54v72h12.1V69.4l73.9 95.4c3.3-2.2 6.5-4.7 9.5-7.4z" fill="#fff" />
                      <path d="M115.9 54H128v72h-12.1V54z" fill="#fff" />
                    </svg>
                  ),
                },
                {
                  name: 'TypeScript',
                  icon: (
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: '9px',
                        color: '#3178C6',
                        background: 'rgba(49, 120, 198, 0.15)',
                        padding: '1px 3px',
                        borderRadius: '2px',
                      }}
                    >
                      TS
                    </span>
                  ),
                },
                {
                  name: 'Tailwind CSS',
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#38BDF8">
                      <path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.337 6.182 14.976 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.337 13.382 8.976 12 6.001 12z" />
                    </svg>
                  ),
                },
                {
                  name: 'Supabase',
                  icon: (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="#3ECF8E">
                      <path d="M21.362 9.354H12V.396a.396.396 0 0 0-.716-.233L.12 14.282a.396.396 0 0 0 .319.638H12v8.958a.396.396 0 0 0 .716.233l11.164-14.119a.396.396 0 0 0-.319-.638z" />
                    </svg>
                  ),
                },
                {
                  name: 'OpenAI GPT-4o',
                  icon: (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#74AA9C" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v8M8 12h8" />
                    </svg>
                  ),
                },
                {
                  name: 'Recharts',
                  icon: (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8884d8" strokeWidth="2">
                      <rect x="3" y="12" width="4" height="9" rx="1" />
                      <rect x="10" y="7" width="4" height="14" rx="1" />
                      <rect x="17" y="3" width="4" height="18" rx="1" />
                    </svg>
                  ),
                },
                {
                  name: 'MetaAPI SDK',
                  icon: (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="2">
                      <path d="M12 2l8 4.5v9L12 20l-8-4.5v-9L12 2z" />
                    </svg>
                  ),
                },
                {
                  name: 'Vercel Edge',
                  icon: (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="#fff">
                      <path d="M12 1L24 22H0L12 1Z" />
                    </svg>
                  ),
                },
              ].map(tech => (
                <span
                  key={tech.name}
                  className="footer-chip"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '11.5px',
                    fontFamily: 'var(--font-mono)',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {tech.icon}
                  {tech.name}
                </span>
              ))}
            </div>
          </div>

          {/* Sub-Footer Bottom Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                © 2026 TraderMind. Built for prop-firm and systematic traders.
              </span>
            </div>

            <p style={{ fontSize: '11.5px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', margin: 0 }}>
              TraderMind analyzes trader behavior, not market direction. No financial advice.
            </p>

            <a
              href="#"
              style={{
                fontSize: '12px',
                color: 'var(--text-2)',
                textDecoration: 'none',
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              className="footer-link"
            >
              Back to top ↑
            </a>
          </div>
        </div>
      </footer>

      {/* Global Embedded Styles for Pseudo-classes, Media Queries & Keyframes */}
      <style jsx global>{`
        .cta-pill:active {
          transform: scale(0.97) !important;
        }
        .cta-pill:hover {
          filter: brightness(1.08);
        }
        .nav-link:hover {
          color: var(--text) !important;
        }
        .feature-card {
          transition: border-color 150ms var(--ease-standard), transform 150ms var(--ease-standard);
        }
        .feature-card:hover {
          border-color: var(--border-2) !important;
          transform: translateY(-2px);
        }
        .footer-link {
          transition: color 150ms var(--ease-standard);
        }
        .footer-link:hover {
          color: var(--text) !important;
        }
        .footer-chip {
          transition: border-color 150ms var(--ease-standard), background-color 150ms var(--ease-standard);
        }
        .footer-chip:hover {
          border-color: var(--border-2) !important;
          background-color: var(--surface-2) !important;
        }
        .insight-text {
          animation: fadeUp 0.35s var(--ease-out);
        }

        @media (max-width: 767px) {
          .desktop-nav-links,
          .desktop-nav-ctas {
            display: none !important;
          }
          .mobile-nav-toggle {
            display: flex !important;
          }
          .sandbox-grid {
            grid-template-columns: 1fr !important;
          }
          .pricing-grid {
            grid-template-columns: 1fr !important;
          }
          .mockup-score-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  )
}
