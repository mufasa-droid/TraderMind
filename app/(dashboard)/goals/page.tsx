'use client'

import { useState } from 'react'
import { Plus, CheckCircle, AlertTriangle, XCircle, Target, Shield, Clock } from 'lucide-react'

const c = {
  green: '#3ecf8e', red: '#ff5f5f', amber: '#f5a623',
  accent: 'hsl(226,100%,71%)', purple: '#b48eff',
  surface: 'hsl(224,18%,8%)', surface2: 'hsl(224,16%,11%)', surface3: 'hsl(224,14%,14%)',
  border: 'hsl(220,12%,14%)', text: 'hsl(220,15%,92%)',
  text2: 'hsl(220,10%,55%)', text3: 'hsl(220,10%,35%)', mono: "'DM Mono', monospace",
}
const panel = { background: c.surface, border: `1px solid ${c.border}`, borderRadius: '10px', overflow: 'hidden' }

const RULES = [
  { id: 1, name: 'Max 2% risk per trade', type: 'risk', active: true, violations: 4, description: 'Never risk more than 2% of account on a single trade', compliant: false },
  { id: 2, name: 'No trading during news', type: 'session', active: true, violations: 0, description: 'Avoid trading 30 minutes before/after major news events', compliant: true },
  { id: 3, name: 'No revenge trading', type: 'emotional', active: true, violations: 3, description: 'Do not enter a trade immediately after a loss out of emotion', compliant: false },
  { id: 4, name: 'Max 5 trades per day', type: 'frequency', active: true, violations: 1, description: 'Limit daily trades to maintain quality over quantity', compliant: false },
  { id: 5, name: 'Respect daily loss limit', type: 'risk', active: true, violations: 0, description: 'Stop trading when daily loss exceeds 3% of account', compliant: true },
  { id: 6, name: 'Journal every trade', type: 'discipline', active: false, violations: 11, description: 'Log emotional state and reasoning for every trade', compliant: false },
]

const DAILY_GOAL = {
  date: 'May 26, 2026',
  maxTrades: 5,
  maxLoss: 300,
  target: 200,
  currentTrades: 2,
  currentPnl: 132,
  status: 'on_track',
}

export default function GoalsPage() {
  const [maxRisk, setMaxRisk] = useState(2.0)
  const [maxDailyLoss, setMaxDailyLoss] = useState(3.0)
  const [maxTrades, setMaxTrades] = useState(5)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1100px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.6px' }}>Goals & Rules</h1>
        <p style={{ fontSize: '12px', color: c.text3, marginTop: '3px', fontFamily: c.mono }}>Define your trading rules. The AI monitors compliance.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px' }}>
        {/* Rules List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Rule Compliance Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {[
              { label: 'Compliant Rules', value: `${RULES.filter(r => r.compliant).length}/${RULES.filter(r => r.active).length}`, color: c.green, icon: CheckCircle },
              { label: 'Total Violations', value: RULES.reduce((s, r) => s + r.violations, 0), color: c.red, icon: XCircle },
              { label: 'Active Rules', value: RULES.filter(r => r.active).length, color: c.accent, icon: Shield },
            ].map(s => (
              <div key={s.label} style={{ ...panel, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <s.icon size={14} color={s.color} />
                  <span style={{ fontSize: '10px', color: c.text3, fontFamily: c.mono, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{s.label}</span>
                </div>
                <div style={{ fontSize: '26px', fontWeight: 800, color: s.color, letterSpacing: '-0.5px' }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Rules */}
          <div style={panel}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${c.border}` }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Trading Rules</span>
              <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '7px', background: c.accent, border: 'none', color: '#fff', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                <Plus size={12} /> Add Rule
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {RULES.map((rule, i) => (
                <div key={rule.id} style={{ padding: '14px 16px', borderTop: i > 0 ? `1px solid ${c.border}40` : 'none', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {/* Status dot */}
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, background: !rule.active ? c.text3 : rule.compliant ? c.green : rule.violations > 3 ? c.red : c.amber }} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: rule.active ? c.text : c.text3 }}>{rule.name}</span>
                      <span style={{ fontSize: '10px', fontFamily: c.mono, padding: '2px 7px', borderRadius: '4px', background: c.surface2, color: c.text3 }}>{rule.type}</span>
                      {!rule.active && <span style={{ fontSize: '10px', fontFamily: c.mono, color: c.text3 }}>Inactive</span>}
                    </div>
                    <p style={{ fontSize: '12px', color: c.text3, lineHeight: 1.5 }}>{rule.description}</p>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {rule.violations > 0 ? (
                      <div style={{ fontSize: '13px', fontWeight: 700, color: rule.violations > 3 ? c.red : c.amber, fontFamily: c.mono }}>
                        ×{rule.violations} violations
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: c.green, fontFamily: c.mono }}>✓ clean</div>
                    )}
                  </div>

                  {/* Toggle */}
                  <div style={{
                    width: '36px', height: '20px', borderRadius: '10px', cursor: 'pointer',
                    background: rule.active ? c.accent : c.surface3, position: 'relative', flexShrink: 0,
                    transition: 'background 0.2s',
                  }}>
                    <div style={{
                      width: '14px', height: '14px', borderRadius: '50%', background: '#fff',
                      position: 'absolute', top: '3px', transition: 'left 0.2s',
                      left: rule.active ? '19px' : '3px',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Settings + Today's Goals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Today's Goal Status */}
          <div style={{
            ...panel,
            background: 'linear-gradient(135deg, rgba(62,207,142,0.07), rgba(62,207,142,0.02))',
            border: `1px solid rgba(62,207,142,0.2)`,
          }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid rgba(62,207,142,0.15)`, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={14} color={c.green} />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Today's Goals</span>
              <span style={{ marginLeft: 'auto', fontSize: '10px', fontFamily: c.mono, color: c.green, background: 'rgba(62,207,142,0.1)', padding: '2px 8px', borderRadius: '4px' }}>ON TRACK</span>
            </div>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'Trades taken', current: DAILY_GOAL.currentTrades, max: DAILY_GOAL.maxTrades, color: c.accent, format: (v: number) => `${v}` },
                { label: 'P&L today', current: DAILY_GOAL.currentPnl, max: DAILY_GOAL.target, color: c.green, format: (v: number) => `$${v}` },
                { label: 'Daily loss used', current: 0, max: DAILY_GOAL.maxLoss, color: c.red, format: (v: number) => `$${v}` },
              ].map(g => (
                <div key={g.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', color: c.text3, fontFamily: c.mono }}>{g.label}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: g.color, fontFamily: c.mono }}>{g.format(g.current)} / {g.format(g.max)}</span>
                  </div>
                  <div style={{ height: '4px', background: c.surface3, borderRadius: '2px' }}>
                    <div style={{ height: '4px', borderRadius: '2px', background: g.color, width: `${Math.min(100, (g.current / g.max) * 100)}%`, transition: 'width 0.3s' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Settings */}
          <div style={panel}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={14} color={c.amber} />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Risk Parameters</span>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { label: 'Max Risk Per Trade (%)', value: maxRisk, onChange: setMaxRisk, min: 0.1, max: 5, step: 0.1, color: c.amber },
                { label: 'Max Daily Loss (%)', value: maxDailyLoss, onChange: setMaxDailyLoss, min: 0.5, max: 10, step: 0.5, color: c.red },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: c.text3, fontFamily: c.mono }}>{s.label}</span>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: s.color, fontFamily: c.mono }}>{s.value}%</span>
                  </div>
                  <input type="range" min={s.min} max={s.max} step={s.step} value={s.value}
                    onChange={e => s.onChange(Number(e.target.value))}
                    style={{ width: '100%', accentColor: s.color, cursor: 'pointer' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px', fontSize: '10px', color: c.text3, fontFamily: c.mono }}>
                    <span>{s.min}%</span><span>{s.max}%</span>
                  </div>
                </div>
              ))}

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: c.text3, fontFamily: c.mono }}>Max Trades Per Day</span>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: c.accent, fontFamily: c.mono }}>{maxTrades}</span>
                </div>
                <input type="range" min={1} max={20} step={1} value={maxTrades}
                  onChange={e => setMaxTrades(Number(e.target.value))}
                  style={{ width: '100%', accentColor: c.accent, cursor: 'pointer' }} />
              </div>

              <button style={{ width: '100%', padding: '10px', borderRadius: '8px', background: c.accent, border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginTop: '4px' }}>
                Save Settings
              </button>
            </div>
          </div>

          {/* Sessions */}
          <div style={panel}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={14} color={c.accent} />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Preferred Sessions</span>
            </div>
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { name: 'Asian', time: '00:00–08:00 UTC', active: false },
                { name: 'London', time: '08:00–12:00 UTC', active: true },
                { name: 'Overlap', time: '12:00–16:00 UTC', active: true },
                { name: 'New York', time: '13:00–17:00 UTC', active: false },
              ].map(s => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', background: s.active ? 'rgba(108,142,255,0.08)' : c.surface2, borderRadius: '8px', border: `1px solid ${s.active ? 'rgba(108,142,255,0.2)' : 'transparent'}`, cursor: 'pointer' }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: s.active ? c.accent : c.text3, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: s.active ? c.text : c.text3 }}>{s.name}</div>
                    <div style={{ fontSize: '10px', color: c.text3, fontFamily: c.mono }}>{s.time}</div>
                  </div>
                  {s.active && <span style={{ fontSize: '10px', color: c.accent, fontFamily: c.mono }}>Active</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
