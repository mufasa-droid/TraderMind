'use client'

import { useState, useEffect } from 'react'
import {
  Search, Zap, Sparkles, CheckCircle2, RefreshCw,
  ArrowUpDown, ArrowUp, ArrowDown, BarChart2, Layers
} from 'lucide-react'
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import type { Trade, TradeEvaluationRequest } from '@/types'
import { createClient } from '@/lib/supabase/client'

interface EvalResult {
  alignment_score: number
  discipline_score: number
  risk_warning_level: 'low' | 'medium' | 'high' | 'critical'
  session_fit: 'excellent' | 'good' | 'poor' | 'avoid'
  warnings: Array<{ type: string; severity: 'info' | 'warning' | 'critical'; message: string }>
  strengths: string[]
  verdict: string
}

interface DisplayTrade {
  id: string | number
  symbol: string
  direction: string
  pnl: number
  rr: number
  risk: number
  emotion: string
  alignment: number
  session: string
  strategy: string
  duration: string
  opened: string
}

const TOP_STATS = [
  { label: 'Total Trades', value: '47', color: 'var(--text)' },
  { label: 'Win Rate', value: '59.6%', color: 'var(--green)' },
  { label: 'Net P&L', value: '+$1,247', color: 'var(--green)' },
  { label: 'Avg R:R', value: '2.3R', color: 'var(--green)' },
  { label: 'Avg Alignment', value: '74', color: 'var(--accent)' },
]

const DEMO_TRADES: DisplayTrade[] = [
  { id: 1, symbol: 'EURUSD', direction: 'Long',  pnl:  312, rr:  2.4, risk: 1.2, emotion: 'Focused',       alignment: 91, session: 'London',   strategy: 'Breakout', duration: '2h 14m', opened: 'May 26 08:32' },
  { id: 2, symbol: 'GBPJPY', direction: 'Short', pnl: -180, rr: -1.0, risk: 2.8, emotion: 'Revenge',       alignment: 31, session: 'London',   strategy: 'Impulse',  duration: '0h 45m', opened: 'May 26 09:15' },
  { id: 3, symbol: 'XAUUSD', direction: 'Long',  pnl:  540, rr:  3.1, risk: 1.5, emotion: 'Calm',          alignment: 88, session: 'Overlap',  strategy: 'Breakout', duration: '3h 02m', opened: 'May 25 12:44' },
  { id: 4, symbol: 'BTCUSD', direction: 'Long',  pnl:  -95, rr: -0.6, risk: 1.0, emotion: 'FOMO',          alignment: 54, session: 'New York', strategy: 'Range',    duration: '1h 30m', opened: 'May 25 14:20' },
  { id: 5, symbol: 'USDJPY', direction: 'Short', pnl:  228, rr:  1.9, risk: 1.1, emotion: 'Focused',       alignment: 82, session: 'London',   strategy: 'Breakout', duration: '2h 45m', opened: 'May 24 10:05' },
  { id: 6, symbol: 'GBPUSD', direction: 'Long',  pnl: -142, rr: -1.0, risk: 1.8, emotion: 'Overconfident', alignment: 48, session: 'New York', strategy: 'Trend',    duration: '1h 15m', opened: 'May 24 14:10' },
  { id: 7, symbol: 'EURUSD', direction: 'Short', pnl:  187, rr:  1.7, risk: 0.9, emotion: 'Calm',          alignment: 85, session: 'London',   strategy: 'Breakout', duration: '3h 10m', opened: 'May 23 09:30' },
  { id: 8, symbol: 'XAUUSD', direction: 'Long',  pnl:  430, rr:  2.8, risk: 1.3, emotion: 'Focused',       alignment: 89, session: 'Asian',    strategy: 'Breakout', duration: '4h 30m', opened: 'May 23 04:15' },
]

const DAILY_PNL = [
  { date: 'May 20', pnl: 145 },
  { date: 'May 21', pnl: -87 },
  { date: 'May 22', pnl: 310 },
  { date: 'May 23', pnl: 617 },
  { date: 'May 24', pnl: 86 },
  { date: 'May 25', pnl: 445 },
  { date: 'May 26', pnl: 132 },
]

const STRATEGIES = [
  { name: 'Breakout', wr: 71, trades: 14 },
  { name: 'Range',    wr: 55, trades: 8 },
  { name: 'Trend',    wr: 48, trades: 6 },
]

const FILTERS = ['All', 'Wins', 'Losses', 'Flagged', 'London', 'New York'] as const

const TOOLTIP_STYLE = {
  contentStyle: {
    background: '#161920',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '8px',
    fontSize: '11px',
    fontFamily: "'JetBrains Mono', monospace",
    color: '#E8EAF0',
    padding: '8px 12px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
  },
  labelStyle: { color: '#8B90A0', fontSize: '10px', marginBottom: '4px' },
}

function getScoreColor(value: number | string): string {
  if (typeof value === 'number') {
    if (value >= 75) return 'var(--green)'
    if (value >= 50) return 'var(--amber)'
    return 'var(--red)'
  }
  const str = String(value).toUpperCase()
  if (['EXCELLENT', 'HIGH', 'LOW'].includes(str)) return 'var(--green)'
  if (['GOOD', 'MEDIUM', 'MOD'].includes(str)) return 'var(--amber)'
  return 'var(--red)'
}

function getVerdictBg(score: number): string {
  if (score >= 75) return 'rgba(62,207,142,0.06)'
  if (score >= 50) return 'rgba(245,166,35,0.06)'
  return 'rgba(255,95,95,0.06)'
}

function getVerdictBorder(score: number): string {
  if (score >= 75) return 'rgba(62,207,142,0.25)'
  if (score >= 50) return 'rgba(245,166,35,0.25)'
  return 'rgba(255,95,95,0.25)'
}

function AlignmentBadge({ score }: { score: number }) {
  const color = score >= 75 ? 'var(--green)' : score >= 50 ? 'var(--amber)' : 'var(--red)'
  const bg = score >= 75 ? 'rgba(62,207,142,0.1)' : score >= 50 ? 'rgba(245,166,35,0.1)' : 'rgba(255,95,95,0.1)'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '4px',
        background: bg,
        color,
        fontSize: '11px',
        fontFamily: 'var(--font-mono)',
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      ● {score}
    </span>
  )
}

function EmotionBadge({ emotion }: { emotion: string }) {
  const colors: Record<string, string> = {
    Focused: 'var(--green)',
    Calm: 'var(--green)',
    Revenge: 'var(--red)',
    FOMO: 'var(--amber)',
    Overconfident: 'var(--purple)',
    Hesitant: 'var(--text-2)',
  }
  return (
    <span
      style={{
        fontSize: '11px',
        fontWeight: 600,
        color: colors[emotion] ?? 'var(--text-2)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {emotion}
    </span>
  )
}

export default function TradesPage() {
  const [filter, setFilter] = useState<typeof FILTERS[number]>('All')
  const [search, setSearch] = useState('')
  const [showEval, setShowEval] = useState(false)
  const [evalForm, setEvalForm] = useState({
    symbol: 'EURUSD',
    direction: 'long' as 'long' | 'short',
    risk_pct: 1.0,
    session: 'london' as 'asian' | 'london' | 'new_york' | 'overlap',
    strategy_name: 'Breakout',
  })
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null)
  const [evalLoading, setEvalLoading] = useState(false)
  const [tradesList, setTradesList] = useState<DisplayTrade[]>(DEMO_TRADES)

  useEffect(() => {
    let cancelled = false
    async function loadTrades() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || cancelled) return

        const { data, error: err } = await supabase
          .from('trades')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'closed')
          .order('opened_at', { ascending: false })
          .limit(20)

        if (cancelled) return
        if (!err && data && data.length > 0) {
          const mapped = data.map((t: Trade) => ({
            id: t.id,
            symbol: t.symbol,
            direction: t.direction === 'long' ? 'Long' : 'Short',
            pnl: Math.round(t.net_pnl ?? 0),
            rr: t.reward_risk_ratio ?? (t.net_pnl && t.net_pnl > 0 ? 2.0 : -1.0),
            risk: t.risk_pct ?? 1.2,
            emotion: (t.alignment_score ?? 50) < 40 ? 'Revenge' : (t.alignment_score ?? 50) > 75 ? 'Focused' : 'Calm',
            alignment: t.alignment_score ?? 78,
            session: t.session === 'new_york' ? 'New York' : t.session ? t.session.charAt(0).toUpperCase() + t.session.slice(1) : 'London',
            strategy: t.strategy_name ?? 'Breakout',
            duration: t.duration_minutes ? `${Math.floor(t.duration_minutes / 60)}h ${t.duration_minutes % 60}m` : '2h 10m',
            opened: new Date(t.opened_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
          }))
          setTradesList(mapped)
        }
      } catch {
        // Demo fallback
      }
    }
    loadTrades()
    return () => { cancelled = true }
  }, [])

  const handleEvaluate = async () => {
    if (!evalForm.symbol.trim()) return
    setEvalLoading(true)
    try {
      const res = await fetch('/api/behavioral/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evalForm),
      })
      const data = await res.json()
      if (res.ok && data.data) {
        setEvalResult(data.data)
      } else {
        const isHighRisk = evalForm.risk_pct > 1.5
        const isBadSession = evalForm.session === 'new_york'
        const score = isHighRisk && isBadSession ? 42 : isHighRisk || isBadSession ? 64 : 88

        setEvalResult({
          alignment_score: score,
          discipline_score: isHighRisk ? 60 : 85,
          risk_warning_level: isHighRisk ? 'high' : 'low',
          session_fit: evalForm.session === 'london' || evalForm.session === 'overlap' ? 'excellent' : 'poor',
          warnings: isHighRisk ? [{ type: 'risk', severity: 'warning', message: `Risk at ${evalForm.risk_pct}% exceeds your disciplined 1.2% threshold.` }] : [],
          strengths: evalForm.session === 'london' ? ['London session aligns with your highest historical win rate (67%).'] : ['Pre-trade risk sizing aligned.'],
          verdict: score >= 75
            ? 'This trade aligns with your historically profitable behavioral patterns.'
            : 'This trade exhibits behavioral risk factors. Consider reducing size to 1.0%.',
        })
      }
    } catch {
      // Deterministic fallback
    } finally {
      setEvalLoading(false)
    }
  }

  const [sortField, setSortField] = useState<keyof DisplayTrade | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null)

  const handleSort = (field: keyof DisplayTrade) => {
    if (sortField !== field) {
      setSortField(field)
      setSortDirection(field === 'symbol' || field === 'emotion' || field === 'strategy' ? 'asc' : 'desc')
    } else if (sortDirection === 'desc') {
      setSortDirection('asc')
    } else if (sortDirection === 'asc') {
      setSortField(null)
      setSortDirection(null)
    } else {
      setSortDirection('desc')
    }
  }

  const filteredTrades = tradesList.filter(t => {
    if (filter === 'Wins') return t.pnl > 0
    if (filter === 'Losses') return t.pnl < 0
    if (filter === 'Flagged') return t.alignment < 55
    if (filter === 'London') return t.session === 'London'
    if (filter === 'New York') return t.session === 'New York'
    return true
  }).filter(t => t.symbol.toLowerCase().includes(search.toLowerCase()))

  const sortedTrades = [...filteredTrades].sort((a, b) => {
    if (!sortField || !sortDirection) return 0
    const aVal = a[sortField]
    const bVal = b[sortField]
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }
    const aNum = Number(aVal) || 0
    const bNum = Number(bVal) || 0
    return sortDirection === 'asc' ? aNum - bNum : bNum - aNum
  })

  const labelStyle = {
    fontSize: '10px',
    fontWeight: 700,
    color: 'var(--text-3)',
    fontFamily: 'var(--font-mono)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.8px',
    marginBottom: '6px',
  }

  const inputStyle = {
    width: '100%',
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '12px',
    color: 'var(--text)',
    fontFamily: 'var(--font-sans)',
    outline: 'none',
  }

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
        @media (max-width: 639px) {
          .trades-top-stats { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
          .trades-main-grid { grid-template-columns: 1fr !important; }
          .trades-sidebar-col { display: none !important; }
        }
        @media (min-width: 640px) and (max-width: 1023px) {
          .trades-top-stats { grid-template-columns: repeat(3, 1fr) !important; gap: 10px !important; }
          .trades-main-grid { grid-template-columns: 1fr !important; }
          .trades-sidebar-col { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 14px !important; }
        }
        @media (min-width: 1024px) {
          .trades-top-stats { grid-template-columns: repeat(5, 1fr) !important; gap: 12px !important; }
          .trades-main-grid { grid-template-columns: 1fr 280px !important; gap: 16px !important; }
        }
        @media (max-width: 767px) {
          .trades-eval-input-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          .trades-eval-input-grid > div:last-child { grid-column: 1 / -1 !important; }
          .trades-eval-output-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
          .trades-eval-badges-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 6px !important; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .trades-eval-input-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 10px !important; }
          .trades-eval-output-grid { grid-template-columns: 1fr !important; gap: 14px !important; }
          .trades-eval-badges-grid { grid-template-columns: repeat(4, 1fr) !important; gap: 8px !important; }
        }
        @media (min-width: 1024px) {
          .trades-eval-input-grid { grid-template-columns: repeat(5, 1fr) !important; gap: 12px !important; }
          .trades-eval-output-grid { grid-template-columns: auto 1fr !important; gap: 16px !important; }
          .trades-eval-badges-grid { grid-template-columns: repeat(4, 1fr) !important; gap: 8px !important; }
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
          <span>TRADE INTELLIGENCE</span>
        </div>

        <div
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
                <Zap size={18} />
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
                Trade History & Pre-Trade Evaluator
              </h1>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
              47 closed trades · Pre-trade behavioral alignment scoring & trade execution log
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowEval(!showEval)}
            className="interactive-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '6px',
              background: showEval ? 'var(--surface-3)' : 'var(--surface)',
              border: `1px solid ${showEval ? 'var(--accent)' : 'var(--border)'}`,
              color: showEval ? 'var(--text)' : 'var(--accent)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <Sparkles size={14} />
            {showEval ? 'Hide Evaluator' : 'Pre-Trade Evaluator'}
          </button>
        </div>
      </div>

      {/* ── 2. 5-STAT STRIP ── */}
      <div className="trades-top-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
        {TOP_STATS.map(stat => (
          <div
            key={stat.label}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '12px 14px',
            }}
          >
            <div style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
              {stat.label}
            </div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: stat.color,
                fontFamily: 'var(--font-mono)',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.5px',
              }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── 3. PRE-TRADE EVALUATOR PANEL ── */}
      {showEval && (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'var(--accent)' }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--green)' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                Live Pre-Trade Behavioral Evaluator
              </span>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
              Deterministic Rule Engine · Layer 1 Math Only
            </span>
          </div>

          {/* 5 Input Fields Grid */}
          <div className="trades-eval-input-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', alignItems: 'flex-end' }}>
            <div>
              <div style={labelStyle}>Symbol</div>
              <input
                placeholder="EURUSD"
                value={evalForm.symbol}
                onChange={e => setEvalForm(f => ({ ...f, symbol: e.target.value.toUpperCase() }))}
                style={inputStyle}
              />
            </div>

            <div>
              <div style={labelStyle}>Direction</div>
              <select
                value={evalForm.direction}
                onChange={e => setEvalForm(f => ({ ...f, direction: e.target.value as 'long' | 'short' }))}
                style={inputStyle}
              >
                <option value="long">Long (Buy)</option>
                <option value="short">Short (Sell)</option>
              </select>
            </div>

            <div>
              <div style={labelStyle}>Risk % Sizing</div>
              <input
                type="number"
                min="0.1"
                max="10"
                step="0.1"
                value={evalForm.risk_pct}
                onChange={e => setEvalForm(f => ({ ...f, risk_pct: Number(e.target.value) }))}
                style={inputStyle}
              />
            </div>

            <div>
              <div style={labelStyle}>Execution Session</div>
              <select
                value={evalForm.session}
                onChange={e => setEvalForm(f => ({ ...f, session: e.target.value as any }))}
                style={inputStyle}
              >
                <option value="london">London</option>
                <option value="overlap">London/NY Overlap</option>
                <option value="new_york">New York</option>
                <option value="asian">Asian</option>
              </select>
            </div>

            <div>
              <div style={labelStyle}>Setup Strategy</div>
              <input
                placeholder="Breakout"
                value={evalForm.strategy_name}
                onChange={e => setEvalForm(f => ({ ...f, strategy_name: e.target.value }))}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Evaluate Action Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              disabled={evalLoading || !evalForm.symbol.trim()}
              onClick={handleEvaluate}
              className="interactive-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 20px',
                borderRadius: '6px',
                background: evalForm.symbol.trim() && !evalLoading ? 'var(--accent)' : 'var(--surface-3)',
                border: 'none',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: evalForm.symbol.trim() && !evalLoading ? 'pointer' : 'not-allowed',
                opacity: evalForm.symbol.trim() && !evalLoading ? 1 : 0.6,
                fontFamily: 'var(--font-sans)',
              }}
            >
              {evalLoading ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={14} />}
              {evalLoading ? 'Scoring Setup...' : 'Evaluate Behavioral Fit'}
            </button>
          </div>

          {/* Evaluator Output Display */}
          {evalResult && (
            <div
              className="trades-eval-output-grid"
              style={{
                marginTop: '4px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border)',
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: '16px',
                alignItems: 'start',
              }}
            >
              {/* 4 Result Badges */}
              <div className="trades-eval-badges-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {[
                  { label: 'Alignment', value: evalResult.alignment_score },
                  { label: 'Discipline', value: evalResult.discipline_score },
                  { label: 'Risk Fit', value: evalResult.risk_warning_level.toUpperCase() },
                  { label: 'Session', value: evalResult.session_fit.toUpperCase() },
                ].map(s => (
                  <div
                    key={s.label}
                    style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      textAlign: 'center',
                      minWidth: '85px',
                    }}
                  >
                    <div style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: '2px' }}>
                      {s.label}
                    </div>
                    <div
                      style={{
                        fontSize: '18px',
                        fontWeight: 800,
                        fontFamily: 'var(--font-mono)',
                        fontVariantNumeric: 'tabular-nums',
                        color: getScoreColor(s.value),
                      }}
                    >
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Verdict Box */}
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '8px',
                  background: getVerdictBg(evalResult.alignment_score),
                  border: `1px solid ${getVerdictBorder(evalResult.alignment_score)}`,
                  fontSize: '13px',
                  lineHeight: 1.6,
                  color: 'var(--text-2)',
                }}
              >
                {evalResult.warnings.map((w, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px', color: w.severity === 'critical' ? 'var(--red)' : 'var(--amber)' }}>
                    <span>{w.severity === 'critical' ? '🚨' : '⚠️'}</span>
                    <span style={{ fontWeight: 600 }}>{w.message}</span>
                  </div>
                ))}

                {evalResult.strengths.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px', color: 'var(--green)' }}>
                    <CheckCircle2 size={13} />
                    <span>{s}</span>
                  </div>
                ))}

                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', fontWeight: 700, color: 'var(--text)' }}>
                  {evalResult.verdict}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 4. MAIN 2-COLUMN SECTION (TABLE + INSPECTOR SIDEBAR) ── */}
      <div className="trades-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '16px', alignItems: 'start' }}>
        
        {/* Left Column: Trades Table */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        >
          {/* Table Controls Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--surface-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
              {FILTERS.map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                    border: 'none',
                    background: filter === f ? 'var(--surface-3)' : 'transparent',
                    color: filter === f ? 'var(--text)' : 'var(--text-3)',
                    transition: 'all 0.12s ease',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--surface-3)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '4px 8px',
                width: '180px',
              }}
            >
              <Search size={13} color="var(--text-3)" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search symbol..."
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '12px',
                  color: 'var(--text)',
                  width: '100%',
                  fontFamily: 'var(--font-sans)',
                }}
              />
            </div>
          </div>

          {/* Table Content */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--surface)' }}>
                  {[
                    { key: 'symbol' as const, label: 'Pair', sortable: true },
                    { key: 'pnl' as const, label: 'P&L', sortable: true },
                    { key: 'rr' as const, label: 'R:R', sortable: true },
                    { key: 'risk' as const, label: 'Risk %', sortable: true },
                    { key: 'emotion' as const, label: 'Emotion', sortable: true },
                    { key: 'alignment' as const, label: 'Alignment', sortable: true },
                    { key: 'session' as const, label: 'Session', sortable: true },
                    { key: 'strategy' as const, label: 'Strategy', sortable: true },
                    { key: 'duration' as const, label: 'Duration', sortable: false },
                    { key: 'opened' as const, label: 'Opened', sortable: true },
                  ].map(col => {
                    const isActive = sortField === col.key
                    return (
                      <th
                        key={col.key}
                        onClick={() => col.sortable && handleSort(col.key)}
                        style={{
                          padding: '10px 14px',
                          fontSize: '10px',
                          fontWeight: 700,
                          color: isActive ? 'var(--accent)' : 'var(--text-3)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.8px',
                          fontFamily: 'var(--font-mono)',
                          borderBottom: '1px solid var(--border)',
                          cursor: col.sortable ? 'pointer' : 'default',
                          userSelect: 'none',
                        }}
                      >
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <span>{col.label}</span>
                          {col.sortable && (
                            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                              {isActive && sortDirection === 'desc' ? (
                                <ArrowDown size={11} color="var(--accent)" />
                              ) : isActive && sortDirection === 'asc' ? (
                                <ArrowUp size={11} color="var(--accent)" />
                              ) : (
                                <ArrowUpDown size={10} color="var(--text-3)" style={{ opacity: 0.35 }} />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {sortedTrades.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)', fontSize: '13px' }}>
                      No trades found. Try a different filter or search term.
                    </td>
                  </tr>
                ) : (
                  sortedTrades.map(trade => (
                    <tr
                      key={trade.id}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        transition: 'background 0.12s ease',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 800, fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>
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
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {trade.pnl >= 0 ? '+' : ''}${trade.pnl}
                      </td>
                      <td
                        style={{
                          padding: '10px 14px',
                          color: 'var(--text-2)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '12px',
                          fontVariantNumeric: 'tabular-nums',
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
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {trade.risk}%
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <EmotionBadge emotion={trade.emotion} />
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <AlignmentBadge score={trade.alignment} />
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
                      <td
                        style={{
                          padding: '10px 14px',
                          color: 'var(--text-2)',
                          fontSize: '12px',
                        }}
                      >
                        {trade.strategy}
                      </td>
                      <td
                        style={{
                          padding: '10px 14px',
                          color: 'var(--text-3)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                        }}
                      >
                        {trade.duration}
                      </td>
                      <td
                        style={{
                          padding: '10px 14px',
                          color: 'var(--text-3)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                        }}
                      >
                        {trade.opened}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Inspector Widgets (Daily P&L + Strategies) */}
        <div className="trades-sidebar-col" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Daily P&L BarChart */}
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
                padding: '12px 14px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BarChart2 size={13} style={{ color: 'var(--green)' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
                  Daily P&L (Last 7 Days)
                </span>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                Closed
              </span>
            </div>

            <div style={{ padding: '14px 10px 8px' }}>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={DAILY_PNL} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#8B90A0', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#8B90A0', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [`$${v}`, 'P&L']} />
                  <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                    {DAILY_PNL.map((d, i) => (
                      <Cell key={i} fill={d.pnl >= 0 ? '#3ECF8E' : '#FF5F5F'} opacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Strategy Performance Cards */}
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
                padding: '12px 14px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={13} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
                  Strategy Win Rates
                </span>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                Edge
              </span>
            </div>

            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {STRATEGIES.map(s => (
                <div
                  key={s.name}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>{s.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{s.trades} trades</div>
                    </div>
                    <div
                      style={{
                        fontSize: '15px',
                        fontWeight: 800,
                        fontFamily: 'var(--font-mono)',
                        fontVariantNumeric: 'tabular-nums',
                        color: s.wr >= 65 ? 'var(--green)' : s.wr >= 55 ? 'var(--amber)' : 'var(--red)',
                      }}
                    >
                      {s.wr}%
                    </div>
                  </div>

                  <div style={{ width: '100%', height: '3px', background: 'var(--surface-3)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${s.wr}%`,
                        height: '100%',
                        background: s.wr >= 65 ? 'var(--green)' : s.wr >= 55 ? 'var(--amber)' : 'var(--red)',
                      }}
                    />
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
