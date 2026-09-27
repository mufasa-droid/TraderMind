'use client'

import { useState, useEffect } from 'react'
import { Plus, CheckCircle, XCircle, Target, Shield, Clock, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { TradingRule, UserSettings } from '@/types'

const DEMO_RULES: TradingRule[] = [
  {
    id: '1',
    user_id: 'demo',
    name: 'Max 2% risk per trade',
    rule_type: 'risk',
    is_active: true,
    violation_count: 4,
    description: 'Never risk more than 2% of account equity on any single execution',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    user_id: 'demo',
    name: 'No trading during news',
    rule_type: 'session',
    is_active: true,
    violation_count: 0,
    description: 'Avoid entering positions 30 minutes before and after high-impact red folder events',
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    user_id: 'demo',
    name: 'No revenge trading',
    rule_type: 'emotional',
    is_active: true,
    violation_count: 3,
    description: 'Enforce mandatory 30-minute cooling period immediately following consecutive losses',
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    user_id: 'demo',
    name: 'Max 5 trades per day',
    rule_type: 'frequency',
    is_active: true,
    violation_count: 1,
    description: 'Hard cap daily executions to protect mental capital and avoid overtrading',
    created_at: new Date().toISOString(),
  },
  {
    id: '5',
    user_id: 'demo',
    name: 'Respect daily loss limit',
    rule_type: 'risk',
    is_active: true,
    violation_count: 0,
    description: 'Terminal shutdown when daily unrealized or realized loss reaches 3% threshold',
    created_at: new Date().toISOString(),
  },
  {
    id: '6',
    user_id: 'demo',
    name: 'Journal every trade',
    rule_type: 'strategy',
    is_active: false,
    violation_count: 11,
    description: 'Record emotional state, pre-trade thesis, and execution screenshot within 1 hour',
    created_at: new Date().toISOString(),
  },
]

const RULE_TYPE_COLORS: Record<string, string> = {
  risk: 'var(--red)',
  session: 'var(--accent)',
  emotional: 'var(--purple)',
  frequency: 'var(--amber)',
  discipline: 'var(--green)',
  strategy: 'var(--teal)',
}

const DEFAULT_SESSIONS = [
  { id: 'asian', name: 'Asian', time: '00:00–08:00 UTC', active: false },
  { id: 'london', name: 'London', time: '08:00–12:00 UTC', active: true },
  { id: 'overlap', name: 'Overlap', time: '12:00–16:00 UTC', active: true },
  { id: 'new_york', name: 'New York', time: '13:00–17:00 UTC', active: false },
]

export default function GoalsPage() {
  const [rules, setRules] = useState<TradingRule[]>(DEMO_RULES)
  const [maxRisk, setMaxRisk] = useState<number>(2.0)
  const [maxDailyLoss, setMaxDailyLoss] = useState<number>(3.0)
  const [maxTrades, setMaxTrades] = useState<number>(5)
  const [sessions, setSessions] = useState(DEFAULT_SESSIONS)

  const [dailyGoal, setDailyGoal] = useState({
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    maxTrades: 5,
    maxLoss: 300,
    target: 200,
    currentTrades: 2,
    currentPnl: 132,
    status: 'on_track' as 'on_track' | 'at_risk' | 'breached',
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Add rule modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [newRuleName, setNewRuleName] = useState('')
  const [newRuleDesc, setNewRuleDesc] = useState('')
  const [newRuleType, setNewRuleType] = useState<TradingRule['rule_type']>('risk')

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (cancelled) return

        if (user) {
          // Rule 3.4: All queries strictly scoped to .eq('user_id', user.id)
          const [settingsRes, rulesRes, goalsRes] = await Promise.all([
            supabase.from('user_settings').select('*').eq('user_id', user.id).maybeSingle(),
            supabase.from('trading_rules').select('*').eq('user_id', user.id).order('created_at', { ascending: true }).limit(20),
            supabase.from('daily_goals').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(1).maybeSingle(),
          ])

          if (cancelled) return

          if (settingsRes.data) {
            const s = settingsRes.data as UserSettings
            if (s.max_risk_per_trade_pct !== undefined && s.max_risk_per_trade_pct !== null) {
              setMaxRisk(Number(s.max_risk_per_trade_pct))
            }
            if (s.max_daily_loss_pct !== undefined && s.max_daily_loss_pct !== null) {
              setMaxDailyLoss(Number(s.max_daily_loss_pct))
            }
            if (s.max_daily_trades !== undefined && s.max_daily_trades !== null) {
              setMaxTrades(Number(s.max_daily_trades))
            }
            if (s.preferred_sessions && Array.isArray(s.preferred_sessions)) {
              setSessions(prev =>
                prev.map(p => ({
                  ...p,
                  active: s.preferred_sessions.includes(p.id as any) || s.preferred_sessions.includes(p.name.toLowerCase() as any),
                }))
              )
            }
          }

          if (rulesRes.data && rulesRes.data.length > 0) {
            setRules(rulesRes.data as TradingRule[])
          }

          if (goalsRes.data) {
            const g = goalsRes.data as any
            setDailyGoal(prev => ({
              ...prev,
              date: g.date || prev.date,
              maxTrades: g.max_trades ?? prev.maxTrades,
              maxLoss: g.max_daily_loss_usd ?? prev.maxLoss,
              target: g.target_pnl_usd ?? prev.target,
              currentTrades: g.trades_taken ?? prev.currentTrades,
              currentPnl: g.current_pnl ?? prev.currentPnl,
              status: g.goal_status ?? 'on_track',
            }))
          }
        }
      } catch (err) {
        console.warn('Goals data fetch notice:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()
    return () => {
      cancelled = true
    }
  }, [])

  // Toggle rule active state
  const toggleRule = async (id: string) => {
    const target = rules.find(r => r.id === id)
    if (!target) return
    const nextState = !target.is_active

    // Optimistic UI update
    setRules(prev => prev.map(r => (r.id === id ? { ...r, is_active: nextState } : r)))

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user && !id.startsWith('demo-') && id.length > 5) {
        await supabase
          .from('trading_rules')
          .update({ is_active: nextState })
          .eq('id', id)
          .eq('user_id', user.id)
      }
    } catch (e) {
      console.warn('Failed to toggle rule on server:', e)
    }
  }

  // Toggle preferred session
  const toggleSession = (id: string) => {
    setSessions(prev => prev.map(s => (s.id === id ? { ...s, active: !s.active } : s)))
  }

  // Save settings handler
  const handleSaveSettings = async () => {
    setSaving(true)
    setErrorMsg(null)
    setSaveSuccess(false)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Offline demo fallback
        setDailyGoal(prev => ({ ...prev, maxTrades }))
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
        return
      }

      // Rule 3.4 & Section 2.10: Upsert scoped to user_id
      const payload = {
        user_id: user.id,
        max_risk_per_trade_pct: maxRisk,
        max_daily_loss_pct: maxDailyLoss,
        max_daily_trades: maxTrades,
        preferred_sessions: sessions.filter(s => s.active).map(s => s.id),
        updated_at: new Date().toISOString(),
      }

      const { error: upsertErr } = await supabase
        .from('user_settings')
        .upsert(payload, { onConflict: 'user_id' })

      if (upsertErr) throw upsertErr

      setDailyGoal(prev => ({ ...prev, maxTrades }))
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  // Add rule handler
  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRuleName.trim()) return

    const newRule: TradingRule = {
      id: `rule-${Date.now()}`,
      user_id: 'user',
      name: newRuleName.trim(),
      description: newRuleDesc.trim() || 'Custom disciplined execution constraint',
      rule_type: newRuleType as any,
      is_active: true,
      violation_count: 0,
      created_at: new Date().toISOString(),
    }

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data, error } = await supabase
          .from('trading_rules')
          .insert({
            user_id: user.id,
            name: newRule.name,
            description: newRule.description,
            rule_type: newRule.rule_type,
            is_active: true,
            violation_count: 0,
          })
          .select()
          .single()

        if (!error && data) {
          setRules(prev => [data as TradingRule, ...prev])
        } else {
          setRules(prev => [newRule, ...prev])
        }
      } else {
        setRules(prev => [newRule, ...prev])
      }

      setNewRuleName('')
      setNewRuleDesc('')
      setShowAddModal(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err))
    }
  }

  // Summary counts
  const activeCount = rules.filter(r => r.is_active).length
  const compliantCount = rules.filter(r => r.is_active && (r.violation_count ?? 0) === 0).length
  const totalViolations = rules.reduce((s, r) => s + (r.violation_count ?? 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1100px' }}>
      <style>{`
        @media (max-width: 1023px) {
          .goals-main-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
        }
        @media (max-width: 639px) {
          .goals-summary-grid { grid-template-columns: 1fr !important; gap: 10px !important; }
        }
      `}</style>

      {/* Page Title & Context */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.6px', color: 'var(--text)' }}>
          Goals & Rules {loading && <span style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>· syncing</span>}
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '3px', fontFamily: 'var(--font-mono)' }}>
          Institutional behavioral guardrails. TraderMind audits live executions against defined trading discipline.{' '}
          {errorMsg && <span style={{ color: 'var(--red)' }}>· {errorMsg}</span>}
        </p>
      </div>

      {/* Step 7: Summary Cards (3-column row) */}
      <div className="goals-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          {
            label: 'Compliant Rules',
            value: `${compliantCount}/${activeCount}`,
            color: 'var(--green)',
            icon: CheckCircle,
          },
          {
            label: 'Total Violations',
            value: totalViolations,
            color: totalViolations > 5 ? 'var(--red)' : 'var(--amber)',
            icon: XCircle,
          },
          {
            label: 'Active Rules',
            value: activeCount,
            color: 'var(--accent)',
            icon: Shield,
          },
        ].map(item => (
          <div
            key={item.label}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '14px 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <item.icon size={14} color={item.color} />
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                }}
              >
                {item.label}
              </span>
            </div>
            <div
              style={{
                fontSize: '26px',
                fontWeight: 800,
                color: item.color,
                fontFamily: 'var(--font-mono)',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.5px',
              }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Left Rules List, Right Settings */}
      <div className="goals-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px' }}>
        {/* Left Column: Rules Management */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Trading Rules</span>
                <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                  ({activeCount} of {rules.length} active)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '7px',
                  background: 'var(--accent)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <Plus size={12} /> Add Rule
              </button>
            </div>

            {/* Rule Rows */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {rules.map((rule, i) => {
                const violations = rule.violation_count ?? 0
                const isCompliant = violations === 0
                const dotColor = !rule.is_active
                  ? 'var(--text-3)'
                  : isCompliant
                  ? 'var(--green)'
                  : violations > 3
                  ? 'var(--red)'
                  : 'var(--amber)'

                const typeColor = RULE_TYPE_COLORS[rule.rule_type] || 'var(--accent)'

                return (
                  <div
                    key={rule.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '14px 18px',
                      borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      background: 'var(--surface)',
                      transition: 'background 0.15s',
                    }}
                  >
                    {/* Status dot */}
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: dotColor,
                        flexShrink: 0,
                      }}
                    />

                    {/* Rule Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: rule.is_active ? 'var(--text)' : 'var(--text-3)',
                          }}
                        >
                          {rule.name}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 600,
                            background: `${typeColor}18`,
                            color: typeColor,
                            textTransform: 'uppercase',
                            letterSpacing: '0.4px',
                          }}
                        >
                          {rule.rule_type}
                        </span>
                        {!rule.is_active && (
                          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>
                            Inactive
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.45, margin: 0 }}>
                        {rule.description}
                      </p>
                    </div>

                    {/* Violation count */}
                    <div
                      style={{
                        fontSize: '12px',
                        fontFamily: 'var(--font-mono)',
                        fontVariantNumeric: 'tabular-nums',
                        flexShrink: 0,
                        color: violations > 0
                          ? violations > 3
                            ? 'var(--red)'
                            : 'var(--amber)'
                          : 'var(--green)',
                      }}
                    >
                      {violations > 0 ? `×${violations}` : '✓ clean'}
                    </div>

                    {/* Toggle switch (Rule 4.54: <div> with onClick, never button) */}
                    <div
                      role="switch"
                      aria-checked={rule.is_active}
                      tabIndex={0}
                      onClick={() => toggleRule(rule.id)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          toggleRule(rule.id)
                        }
                      }}
                      title={rule.is_active ? 'Click to deactivate rule' : 'Click to activate rule'}
                      style={{
                        width: '36px',
                        height: '20px',
                        borderRadius: '10px',
                        background: rule.is_active ? 'var(--accent)' : 'var(--surface-3)',
                        border: '1px solid var(--border)',
                        position: 'relative',
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'background 0.2s',
                        outline: 'none',
                      }}
                    >
                      <div
                        style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          background: '#fff',
                          position: 'absolute',
                          top: '2px',
                          left: rule.is_active ? '18px' : '2px',
                          transition: 'left 0.2s',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Today's Goals, Risk Parameters, Preferred Sessions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Step 9: Today's Goals Panel */}
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
                <Target size={14} color="var(--green)" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Today's Goals</span>
              </div>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  color: dailyGoal.status === 'breached' ? 'var(--red)' : dailyGoal.status === 'at_risk' ? 'var(--amber)' : 'var(--green)',
                  background: dailyGoal.status === 'breached' ? 'rgba(255,95,95,0.12)' : dailyGoal.status === 'at_risk' ? 'rgba(245,166,35,0.12)' : 'rgba(62,207,142,0.12)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {dailyGoal.status === 'on_track' ? 'ON TRACK' : dailyGoal.status === 'at_risk' ? 'AT RISK' : 'LIMIT REACHED'}
              </span>
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                {
                  label: 'Trades taken',
                  current: dailyGoal.currentTrades,
                  max: dailyGoal.maxTrades,
                  color: 'var(--accent)',
                  format: (v: number) => String(v),
                },
                {
                  label: 'P&L today',
                  current: dailyGoal.currentPnl,
                  max: dailyGoal.target,
                  color: 'var(--green)',
                  format: (v: number) => `${v >= 0 ? '+' : ''}$${v}`,
                },
                {
                  label: 'Daily loss used',
                  current: Math.max(0, -dailyGoal.currentPnl),
                  max: dailyGoal.maxLoss,
                  color: 'var(--red)',
                  format: (v: number) => `$${v}`,
                },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                      {item.label}
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: item.color,
                        fontFamily: 'var(--font-mono)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {item.format(item.current)} / {item.format(item.max)}
                    </span>
                  </div>
                  <div style={{ height: '4px', background: 'var(--surface-3)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '4px',
                        borderRadius: '2px',
                        background: item.color,
                        width: `${Math.min(100, Math.max(0, (item.current / item.max) * 100))}%`,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              ))}

              <div
                style={{
                  fontSize: '10px',
                  color: 'var(--text-3)',
                  fontFamily: 'var(--font-mono)',
                  textAlign: 'center',
                  marginTop: '2px',
                }}
              >
                {dailyGoal.date}
              </div>
            </div>
          </div>

          {/* Step 10: Risk Parameters Panel */}
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
                gap: '8px',
              }}
            >
              <Shield size={14} color="var(--amber)" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Risk Parameters</span>
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Slider 1: Max Risk Per Trade */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                    Max Risk Per Trade
                  </span>
                  <span
                    style={{
                      fontSize: '18px',
                      fontWeight: 800,
                      color: 'var(--amber)',
                      fontFamily: 'var(--font-mono)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {maxRisk}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={5}
                  step={0.1}
                  value={maxRisk}
                  onChange={e => setMaxRisk(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--amber)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>0.1%</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>5.0%</span>
                </div>
              </div>

              {/* Slider 2: Max Daily Loss */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                    Max Daily Loss
                  </span>
                  <span
                    style={{
                      fontSize: '18px',
                      fontWeight: 800,
                      color: 'var(--red)',
                      fontFamily: 'var(--font-mono)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {maxDailyLoss}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={10}
                  step={0.5}
                  value={maxDailyLoss}
                  onChange={e => setMaxDailyLoss(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--red)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>0.5%</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>10.0%</span>
                </div>
              </div>

              {/* Slider 3: Max Trades Per Day */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                    Max Trades Per Day
                  </span>
                  <span
                    style={{
                      fontSize: '18px',
                      fontWeight: 800,
                      color: 'var(--accent)',
                      fontFamily: 'var(--font-mono)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {maxTrades}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  step={1}
                  value={maxTrades}
                  onChange={e => setMaxTrades(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>1</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>20</span>
                </div>
              </div>

              {saveSuccess && (
                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'rgba(62,207,142,0.1)',
                    border: '1px solid rgba(62,207,142,0.3)',
                    fontSize: '11px',
                    color: 'var(--green)',
                    fontFamily: 'var(--font-mono)',
                    textAlign: 'center',
                  }}
                >
                  ✓ Risk parameters saved successfully
                </div>
              )}

              {errorMsg && (
                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'rgba(255,95,95,0.08)',
                    border: '1px solid rgba(255,95,95,0.2)',
                    fontSize: '11px',
                    color: 'var(--red)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {errorMsg}
                </div>
              )}

              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={saving}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'var(--accent)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                  fontFamily: 'var(--font-sans)',
                  transition: 'opacity 0.2s',
                }}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>

          {/* Step 11: Preferred Sessions Panel */}
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
                gap: '8px',
              }}
            >
              <Clock size={14} color="var(--accent)" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Preferred Sessions</span>
            </div>

            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {sessions.map(session => (
                <div
                  key={session.id}
                  onClick={() => toggleSession(session.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: session.active ? 'rgba(108,142,255,0.08)' : 'var(--surface-2)',
                    border: `1px solid ${session.active ? 'rgba(108,142,255,0.25)' : 'transparent'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: session.active ? 'var(--accent)' : 'var(--text-3)',
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: session.active ? 'var(--text)' : 'var(--text-3)',
                      }}
                    >
                      {session.name}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                      {session.time}
                    </div>
                  </div>
                  {session.active && (
                    <span style={{ fontSize: '10px', color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      Active
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Rule Modal — Solid 71UI Dark, Zero Glassmorphism */}
      {showAddModal && (
        <div
          onClick={() => setShowAddModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-2)',
              borderRadius: '12px',
              maxWidth: '460px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>Create Trading Rule</div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddRule} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    color: 'var(--text-3)',
                    fontFamily: 'var(--font-mono)',
                    marginBottom: '5px',
                  }}
                >
                  RULE NAME
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Max 2 trades after a loss"
                  value={newRuleName}
                  onChange={e => setNewRuleName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '7px',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    color: 'var(--text-3)',
                    fontFamily: 'var(--font-mono)',
                    marginBottom: '5px',
                  }}
                >
                  RULE TYPE
                </label>
                <select
                  value={newRuleType}
                  onChange={e => setNewRuleType(e.target.value as TradingRule['rule_type'])}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '7px',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                >
                  <option value="risk">Risk Management</option>
                  <option value="emotional">Emotional Discipline</option>
                  <option value="session">Session Timing</option>
                  <option value="frequency">Trade Frequency</option>
                  <option value="strategy">Strategy Compliance</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    color: 'var(--text-3)',
                    fontFamily: 'var(--font-mono)',
                    marginBottom: '5px',
                  }}
                >
                  DESCRIPTION
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain why this rule exists and how it prevents emotional mistakes..."
                  value={newRuleDesc}
                  onChange={e => setNewRuleDesc(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '7px',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    fontSize: '12px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-2)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'var(--accent)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Add Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
