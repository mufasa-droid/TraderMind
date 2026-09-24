'use client'

import { useState, useEffect } from 'react'
import { Plus, CheckCircle, AlertTriangle, XCircle, Target, Shield, Clock, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { TradingRule, UserSettings } from '@/types'

const DEMO_RULES: TradingRule[] = [
  { id: '1', user_id: 'demo', name: 'Max 2% risk per trade', rule_type: 'risk', is_active: true, violation_count: 4, description: 'Never risk more than 2% of account on a single trade', created_at: new Date().toISOString() },
  { id: '2', user_id: 'demo', name: 'No trading during news', rule_type: 'session', is_active: true, violation_count: 0, description: 'Avoid trading 30 minutes before/after major news events', created_at: new Date().toISOString() },
  { id: '3', user_id: 'demo', name: 'No revenge trading', rule_type: 'emotional', is_active: true, violation_count: 3, description: 'Do not enter a trade immediately after a loss out of emotion', created_at: new Date().toISOString() },
  { id: '4', user_id: 'demo', name: 'Max 5 trades per day', rule_type: 'frequency', is_active: true, violation_count: 1, description: 'Limit daily trades to maintain quality over quantity', created_at: new Date().toISOString() },
  { id: '5', user_id: 'demo', name: 'Respect daily loss limit', rule_type: 'risk', is_active: true, violation_count: 0, description: 'Stop trading when daily loss exceeds 3% of account', created_at: new Date().toISOString() },
  { id: '6', user_id: 'demo', name: 'Journal every trade', rule_type: 'strategy', is_active: false, violation_count: 11, description: 'Log emotional state and reasoning for every trade', created_at: new Date().toISOString() },
]

const DEMO_DAILY = {
  date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  maxTrades: 5,
  maxLoss: 300,
  target: 200,
  currentTrades: 2,
  currentPnl: 132,
  status: 'on_track' as const,
}

export default function GoalsPage() {
  const [maxRisk, setMaxRisk] = useState(2.0)
  const [maxDailyLoss, setMaxDailyLoss] = useState(3.0)
  const [maxTrades, setMaxTrades] = useState(5)
  const [rules, setRules] = useState<TradingRule[]>(DEMO_RULES)
  const [dailyGoal, setDailyGoal] = useState(DEMO_DAILY)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newRuleName, setNewRuleName] = useState('')
  const [newRuleDesc, setNewRuleDesc] = useState('')
  const [newRuleType, setNewRuleType] = useState<TradingRule['rule_type']>('risk')

  const [sessions, setSessions] = useState<{ name: string; time: string; active: boolean }[]>([
    { name: 'Asian', time: '00:00–08:00 UTC', active: false },
    { name: 'London', time: '08:00–12:00 UTC', active: true },
    { name: 'Overlap', time: '12:00–16:00 UTC', active: true },
    { name: 'New York', time: '16:00–22:00 UTC', active: false },
  ])

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
            setSettings(s)
            setMaxRisk(s.max_risk_per_trade_pct ?? 2)
            setMaxDailyLoss(s.max_daily_loss_pct ?? 3)
            setMaxTrades(s.max_daily_trades ?? 5)
            if (s.preferred_sessions) {
              setSessions(prev =>
                prev.map(p => ({
                  ...p,
                  active: s.preferred_sessions.includes(p.name.toLowerCase() as any),
                }))
              )
            }
          }

          if (rulesRes.data && rulesRes.data.length > 0) {
            setRules(rulesRes.data as TradingRule[])
          }

          if (goalsRes.data) {
            const g = goalsRes.data as any
            if (g.max_trades !== undefined) {
              setDailyGoal({
                date: g.date,
                maxTrades: g.max_trades,
                maxLoss: g.max_daily_loss_usd ?? 300,
                target: g.target_pnl_usd ?? 200,
                currentTrades: g.trades_taken ?? 0,
                currentPnl: g.current_pnl ?? 0,
                status: g.goal_status ?? 'on_track',
              })
            }
          }

          // Compute today's actual performance from closed trades
          const { data: tradesData } = await supabase
            .from('trades')
            .select('net_pnl,opened_at')
            .eq('user_id', user.id)
            .gte('opened_at', new Date().toISOString().slice(0, 10))

          if (!cancelled && tradesData && tradesData.length > 0 && !goalsRes.data) {
            const todayPnl = tradesData.reduce((s: number, t: any) => s + (t.net_pnl ?? 0), 0)
            setDailyGoal(prev => ({
              ...prev,
              currentTrades: tradesData.length,
              currentPnl: Math.round(todayPnl),
            }))
          }
        }
      } catch (err) {
        console.warn('Goals data fetch error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()
    return () => {
      cancelled = true
    }
  }, [])

  const handleSaveSettings = async () => {
    setSaving(true)
    setError(null)
    setSavedSuccess(false)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Offline demo fallback
        setDailyGoal(prev => ({ ...prev, maxTrades }))
        setSavedSuccess(true)
        setTimeout(() => setSavedSuccess(false), 2500)
        return
      }

      // Rule 3.4 & Section 2.10: Upsert scoped to user_id
      const payload = {
        user_id: user.id,
        max_risk_per_trade_pct: maxRisk,
        max_daily_loss_pct: maxDailyLoss,
        max_daily_trades: maxTrades,
        preferred_sessions: sessions.filter(s => s.active).map(s => s.name.toLowerCase()),
        updated_at: new Date().toISOString(),
      }

      const { error: upsertErr } = await supabase
        .from('user_settings')
        .upsert(payload, { onConflict: 'user_id' })

      if (upsertErr) throw upsertErr
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 2500)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  const toggleRule = async (id: string) => {
    const r = rules.find(x => x.id === id)
    if (!r) return
    const next = !r.is_active
    setRules(prev => prev.map(x => (x.id === id ? { ...x, is_active: next } : x)))

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user && !id.startsWith('demo-') && id.length > 2) {
        await supabase
          .from('trading_rules')
          .update({ is_active: next })
          .eq('id', id)
          .eq('user_id', user.id)
      }
    } catch (e) {
      console.warn('Failed to update rule status:', e)
    }
  }

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRuleName.trim()) return

    const newRule: TradingRule = {
      id: `rule-${Date.now()}`,
      user_id: 'user',
      name: newRuleName.trim(),
      description: newRuleDesc.trim() || 'Custom disciplined trading rule',
      rule_type: newRuleType,
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

  const toggleSession = (name: string) => {
    setSessions(prev => prev.map(s => (s.name === name ? { ...s, active: !s.active } : s)))
  }

  const activeRules = rules.filter(r => r.is_active)
  const compliantCount = rules.filter(r => (r.violation_count ?? 0) === 0 && r.is_active).length
  const totalViolations = rules.reduce((s, r) => s + (r.violation_count ?? 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1100px' }}>
      <style>{`
        @media (max-width: 1023px) {
          .goals-main-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
        }
        @media (max-width: 639px) {
          .goals-summary-grid { grid-template-columns: 1fr !important; gap: 8px !important; }
        }
      `}</style>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.6px', color: 'var(--text)' }}>
          Goals & Rules {loading && <span style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>· syncing</span>}
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '3px', fontFamily: 'var(--font-mono)' }}>
          Define your behavioral trading rules. TraderMind monitors real-time compliance.{' '}
          {error && <span style={{ color: 'var(--red)' }}>· {error}</span>}
        </p>
      </div>

      <div className="goals-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px' }}>
        {/* Left Column: Rules Summary & Rule List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Rule Compliance Summary Cards */}
          <div className="goals-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {[
              {
                label: 'Compliant Rules',
                value: `${compliantCount}/${activeRules.length}`,
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
                value: activeRules.length,
                color: 'var(--accent)',
                icon: Shield,
              },
            ].map(s => (
              <div
                key={s.label}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <s.icon size={14} color={s.color} />
                  <span
                    style={{
                      fontSize: '10px',
                      color: 'var(--text-3)',
                      fontFamily: 'var(--font-mono)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px',
                    }}
                  >
                    {s.label}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '26px',
                    fontWeight: 800,
                    color: s.color,
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '-0.5px',
                  }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          {/* Rules List Panel */}
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                Trading Rules {loading ? '· …' : `(${rules.length})`}
              </span>
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
                }}
              >
                <Plus size={12} /> Add Rule
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {rules.map((rule, i) => {
                const violations = rule.violation_count ?? 0
                const dotColor = !rule.is_active
                  ? 'var(--text-3)'
                  : violations === 0
                  ? 'var(--green)'
                  : violations > 3
                  ? 'var(--red)'
                  : 'var(--amber)'

                return (
                  <div
                    key={rule.id}
                    style={{
                      padding: '14px 18px',
                      borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      transition: 'background 0.15s',
                    }}
                  >
                    {/* Status Dot */}
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        flexShrink: 0,
                        background: dotColor,
                        boxShadow: rule.is_active && violations === 0 ? '0 0 6px rgba(62,207,142,0.4)' : 'none',
                      }}
                    />

                    {/* Rule Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
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
                            fontFamily: 'var(--font-mono)',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            background: 'var(--surface-2)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-2)',
                            textTransform: 'uppercase',
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
                      <p style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.4, margin: 0 }}>
                        {rule.description}
                      </p>
                    </div>

                    {/* Violations Count */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {violations > 0 ? (
                        <div
                          style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: violations > 3 ? 'var(--red)' : 'var(--amber)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          ×{violations} {violations === 1 ? 'violation' : 'violations'}
                        </div>
                      ) : (
                        <div style={{ fontSize: '12px', color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>
                          ✓ clean
                        </div>
                      )}
                    </div>

                    {/* Toggle Switch */}
                    <div
                      onClick={() => toggleRule(rule.id)}
                      title={rule.is_active ? 'Click to deactivate rule' : 'Click to activate rule'}
                      style={{
                        width: '36px',
                        height: '20px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        background: rule.is_active ? 'var(--accent)' : 'var(--surface-3)',
                        border: '1px solid var(--border)',
                        position: 'relative',
                        flexShrink: 0,
                        transition: 'background 0.2s',
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
                          transition: 'left 0.2s',
                          left: rule.is_active ? '18px' : '2px',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Today's Goals, Risk Parameters, Sessions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Today's Goal Status */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(62,207,142,0.08), rgba(62,207,142,0.02))',
              border: '1px solid rgba(62,207,142,0.25)',
              borderRadius: '10px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid rgba(62,207,142,0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Target size={14} color="var(--green)" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Today's Goals</span>
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: '10px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--green)',
                  background: 'rgba(62,207,142,0.12)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                {dailyGoal.status}
              </span>
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                {
                  label: 'Trades Taken',
                  current: dailyGoal.currentTrades,
                  max: dailyGoal.maxTrades,
                  color: 'var(--accent)',
                  format: (v: number) => `${v}`,
                },
                {
                  label: 'P&L Today',
                  current: dailyGoal.currentPnl,
                  max: dailyGoal.target,
                  color: dailyGoal.currentPnl >= 0 ? 'var(--green)' : 'var(--red)',
                  format: (v: number) => `${v >= 0 ? '+' : ''}$${v}`,
                },
                {
                  label: 'Daily Loss Used',
                  current: Math.max(0, -dailyGoal.currentPnl),
                  max: dailyGoal.maxLoss,
                  color: 'var(--red)',
                  format: (v: number) => `$${v}`,
                },
              ].map(g => (
                <div key={g.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                      {g.label}
                    </span>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: g.color,
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {g.format(g.current)} / {g.format(g.max)}
                    </span>
                  </div>
                  <div style={{ height: '5px', background: 'var(--surface-3)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        borderRadius: '3px',
                        background: g.color,
                        width: `${Math.min(100, Math.max(0, (g.current / g.max) * 100))}%`,
                        transition: 'width 0.3s ease-out',
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

          {/* Risk Settings Panel */}
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
              {[
                {
                  label: 'Max Risk Per Trade (%)',
                  value: maxRisk,
                  onChange: setMaxRisk,
                  min: 0.1,
                  max: 5,
                  step: 0.1,
                  color: 'var(--amber)',
                },
                {
                  label: 'Max Daily Loss (%)',
                  value: maxDailyLoss,
                  onChange: setMaxDailyLoss,
                  min: 0.5,
                  max: 10,
                  step: 0.5,
                  color: 'var(--red)',
                },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                      {s.label}
                    </span>
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 800,
                        color: s.color,
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {s.value}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={s.min}
                    max={s.max}
                    step={s.step}
                    value={s.value}
                    onChange={e => s.onChange(Number(e.target.value))}
                    style={{ width: '100%', accentColor: s.color, cursor: 'pointer' }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '3px',
                      fontSize: '10px',
                      color: 'var(--text-3)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <span>{s.min}%</span>
                    <span>{s.max}%</span>
                  </div>
                </div>
              ))}

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                    Max Trades Per Day
                  </span>
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 800,
                      color: 'var(--accent)',
                      fontFamily: 'var(--font-mono)',
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
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '3px',
                    fontSize: '10px',
                    color: 'var(--text-3)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <span>1</span>
                  <span>20</span>
                </div>
              </div>

              {savedSuccess && (
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

              {error && (
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
                  {error}
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
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  marginTop: '4px',
                  opacity: saving ? 0.6 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                {saving ? 'Saving…' : 'Save Settings'}
              </button>
            </div>
          </div>

          {/* Preferred Sessions Panel */}
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

            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sessions.map(s => (
                <div
                  key={s.name}
                  onClick={() => toggleSession(s.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    background: s.active ? 'rgba(108,142,255,0.08)' : 'var(--surface-2)',
                    borderRadius: '8px',
                    border: `1px solid ${s.active ? 'rgba(108,142,255,0.25)' : 'transparent'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <div
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: s.active ? 'var(--accent)' : 'var(--text-3)',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: s.active ? 'var(--text)' : 'var(--text-3)' }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                      {s.time}
                    </div>
                  </div>
                  {s.active && (
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

      {/* Add Rule Modal */}
      {showAddModal && (
        <div
          onClick={() => setShowAddModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
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
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
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
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: '5px' }}>
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
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: '5px' }}>
                  RULE TYPE
                </label>
                <select
                  value={newRuleType}
                  onChange={e => setNewRuleType(e.target.value as any)}
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
                  <option value="strategy">Strategy Compliance</option>
                  <option value="frequency">Trade Frequency</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: '5px' }}>
                  DESCRIPTION
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain why this rule exists and when it triggers a violation..."
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
