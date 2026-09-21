'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronRight, Shield, Target, Link as LinkIcon, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const STEPS = [
  { number: 1, title: 'Welcome',         subtitle: "Let's set up your profile"      },
  { number: 2, title: 'Trading Profile', subtitle: 'Tell us about your trading style' },
  { number: 3, title: 'Risk Rules',      subtitle: 'Define your trading boundaries'  },
  { number: 4, title: 'Connect Broker',  subtitle: 'Sync your trades automatically'  },
]

const INSTRUMENTS = [
  { id: 'forex',  label: 'Forex',          emoji: '💱' },
  { id: 'crypto', label: 'Crypto',         emoji: '₿'  },
  { id: 'both',   label: 'Forex & Crypto', emoji: '🌐' },
  { id: 'stocks', label: 'Stocks/Indices', emoji: '📈' },
]

const STYLES = [
  { id: 'day',   label: 'Day Trader',   desc: 'Open and close within the same day' },
  { id: 'swing', label: 'Swing Trader', desc: 'Hold positions for days to weeks'   },
  { id: 'scalp', label: 'Scalper',      desc: 'Very short-term, many trades/day'   },
]

const EXPERIENCE = [
  { id: 'beginner',     label: 'Beginner',     desc: 'Under 1 year'     },
  { id: 'intermediate', label: 'Intermediate', desc: '1–3 years'        },
  { id: 'advanced',     label: 'Advanced',     desc: '3+ years'         },
]

const SESSIONS_OPTIONS = [
  { id: 'asian',    label: 'Asian',    time: '00:00–08:00 UTC' },
  { id: 'london',   label: 'London',   time: '08:00–12:00 UTC' },
  { id: 'overlap',  label: 'Overlap',  time: '12:00–16:00 UTC' },
  { id: 'new_york', label: 'New York', time: '13:00–17:00 UTC' },
]

const BROKERS_MINI = [
  { id: 'mt5', label: 'MetaTrader 5', color: 'var(--accent)' },
  { id: 'mt4', label: 'MetaTrader 4', color: 'var(--accent)' },
  { id: 'binance', label: 'Binance',  color: '#F0B90B'        },
  { id: 'bybit',   label: 'Bybit',    color: '#F7A600'        },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [userName, setUserName] = useState('Trader')

  // Step 2 — profile
  const [instrument, setInstrument] = useState('forex')
  const [tradingStyle, setTradingStyle] = useState('day')
  const [experience, setExperience] = useState('intermediate')
  const [sessions, setSessions] = useState<string[]>(['london', 'new_york'])

  // Step 3 — risk rules
  const [maxRisk, setMaxRisk] = useState(2.0)
  const [maxDailyLoss, setMaxDailyLoss] = useState(3.0)
  const [maxTrades, setMaxTrades] = useState(5)

  // Step 4 — broker
  const [selectedBroker, setSelectedBroker] = useState('')

  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', user.id)
            .single()

          if (profile?.full_name) {
            setUserName(profile.full_name)
          } else if (user.user_metadata?.full_name) {
            setUserName(user.user_metadata.full_name)
          }
        }
      } catch (err) {
        console.error('Failed to load user info:', err)
      }
    }
    loadUser()
  }, [])

  const nextStep = () => {
    if (step < 4) setStep(s => s + 1)
  }

  const prevStep = () => {
    if (step > 1) setStep(s => s - 1)
  }

  const completeOnboarding = async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/auth/login'
        return
      }

      // Save risk settings
      await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          max_risk_per_trade_pct: maxRisk,
          max_daily_loss_pct: maxDailyLoss,
          preferred_sessions: sessions,
        }, { onConflict: 'user_id' })

      // Mark onboarding complete
      await supabase
        .from('users')
        .update({ onboarding_completed: true })
        .eq('id', user.id)

      window.location.href = '/dashboard'
    } catch (err) {
      console.error('Onboarding save failed:', err)
      // Still redirect — don't block the user
      window.location.href = '/dashboard'
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      fontFamily: 'var(--font-sans)',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '40px' }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '7px',
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', fontWeight: 800, color: '#fff',
        }}>TM</div>
        <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>TraderMind</span>
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: '520px', marginBottom: '32px' }}>
        {/* Step indicators */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          {STEPS.map(s => (
            <div key={s.number} style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: s.number < 4 ? 1 : 'none' }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-mono)',
                background: s.number < step
                  ? 'var(--green)'
                  : s.number === step
                  ? 'var(--accent)'
                  : 'var(--surface-2)',
                color: s.number <= step ? '#fff' : 'var(--text-3)',
                border: s.number === step ? '2px solid var(--accent)' : '1px solid var(--border)',
                transition: 'all 0.3s',
              }}>
                {s.number < step ? '✓' : s.number}
              </div>
              {s.number < 4 && (
                <div style={{
                  flex: 1, height: '2px', minWidth: '40px', marginRight: '6px',
                  background: s.number < step ? 'var(--green)' : 'var(--border)',
                  transition: 'background 0.3s',
                }} />
              )}
            </div>
          ))}
        </div>
        {/* Progress track */}
        <div style={{ height: '3px', background: 'var(--surface-2)', borderRadius: '2px' }}>
          <div style={{
            height: '3px', borderRadius: '2px', background: 'var(--accent)',
            width: `${((step - 1) / 3) * 100}%`,
            transition: 'width 0.4s ease',
          }} />
        </div>
        <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
          Step {step} of 4
        </div>
      </div>

      {/* Step card */}
      <div style={{
        width: '100%', maxWidth: '520px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '32px',
      }}>
        {step === 1 && <StepWelcome userName={userName} onNext={nextStep} />}
        {step === 2 && (
          <StepProfile
            instrument={instrument} setInstrument={setInstrument}
            tradingStyle={tradingStyle} setTradingStyle={setTradingStyle}
            experience={experience} setExperience={setExperience}
            sessions={sessions} setSessions={setSessions}
            onBack={prevStep} onNext={nextStep}
          />
        )}
        {step === 3 && (
          <StepRiskRules
            maxRisk={maxRisk} setMaxRisk={setMaxRisk}
            maxDailyLoss={maxDailyLoss} setMaxDailyLoss={setMaxDailyLoss}
            maxTrades={maxTrades} setMaxTrades={setMaxTrades}
            onBack={prevStep} onNext={nextStep}
          />
        )}
        {step === 4 && (
          <StepBroker
            selectedBroker={selectedBroker}
            setSelectedBroker={setSelectedBroker}
            onBack={prevStep}
            onComplete={completeOnboarding}
            saving={saving}
          />
        )}
      </div>
    </div>
  )
}

function StepWelcome({ userName, onNext }: { userName: string; onNext: () => void }) {
  return (
    <div>
      <div style={{ fontSize: '28px', marginBottom: '12px' }}>👋</div>
      <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px', letterSpacing: '-0.5px' }}>
        Welcome{userName !== 'Trader' ? `, ${userName}` : ''} to TraderMind
      </h1>
      <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.7, marginBottom: '24px' }}>
        Let&apos;s take 2 minutes to set up your behavioral intelligence profile.
        This helps us analyze your trading patterns from day one.
      </p>

      {/* What to expect */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
        {[
          { icon: '🧠', text: "We'll learn your trading style and preferred sessions" },
          { icon: '🛡', text: "You'll set your risk rules — we'll monitor compliance" },
          { icon: '🔗', text: 'Optionally connect your broker for automatic trade sync' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'var(--surface-2)', borderRadius: '8px' }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
            <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>{item.text}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onNext}
        style={{
          width: '100%', padding: '12px', borderRadius: '8px',
          background: 'var(--accent)', border: 'none',
          color: '#fff', fontSize: '14px', fontWeight: 700,
          cursor: 'pointer', fontFamily: 'var(--font-sans)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        }}
      >
        Get Started <ChevronRight size={16} />
      </button>
    </div>
  )
}

interface StepProfileProps {
  instrument: string
  setInstrument: (v: string) => void
  tradingStyle: string
  setTradingStyle: (v: string) => void
  experience: string
  setExperience: (v: string) => void
  sessions: string[]
  setSessions: React.Dispatch<React.SetStateAction<string[]>>
  onBack: () => void
  onNext: () => void
}

function StepProfile({
  instrument, setInstrument, tradingStyle, setTradingStyle,
  experience, setExperience, sessions, setSessions,
  onBack, onNext,
}: StepProfileProps) {

  const toggleSession = (id: string) => {
    setSessions(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>
        Trading Profile
      </h2>
      <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '24px' }}>
        Tell us about how you trade. This helps the AI coach give relevant advice.
      </p>

      {/* Primary Instrument */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '8px' }}>
          Primary Instrument
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {INSTRUMENTS.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setInstrument(item.id)}
              style={{
                padding: '10px 12px', borderRadius: '8px',
                border: `1px solid ${instrument === item.id ? 'rgba(108,142,255,0.4)' : 'var(--border)'}`,
                background: instrument === item.id ? 'rgba(108,142,255,0.1)' : 'var(--surface-2)',
                color: instrument === item.id ? 'var(--accent)' : 'var(--text-2)',
                cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                fontFamily: 'var(--font-sans)',
                display: 'flex', alignItems: 'center', gap: '8px',
                transition: 'all 0.15s',
              }}
            >
              <span>{item.emoji}</span> {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trading Style */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '8px' }}>
          Trading Style
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {STYLES.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTradingStyle(item.id)}
              style={{
                padding: '10px 14px', borderRadius: '8px', textAlign: 'left',
                border: `1px solid ${tradingStyle === item.id ? 'rgba(108,142,255,0.4)' : 'var(--border)'}`,
                background: tradingStyle === item.id ? 'rgba(108,142,255,0.1)' : 'var(--surface-2)',
                cursor: 'pointer', fontFamily: 'var(--font-sans)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 600, color: tradingStyle === item.id ? 'var(--accent)' : 'var(--text)' }}>
                {item.label}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{item.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Experience */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '8px' }}>
          Experience Level
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {EXPERIENCE.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setExperience(item.id)}
              style={{
                padding: '10px 8px', borderRadius: '8px', textAlign: 'center',
                border: `1px solid ${experience === item.id ? 'rgba(108,142,255,0.4)' : 'var(--border)'}`,
                background: experience === item.id ? 'rgba(108,142,255,0.1)' : 'var(--surface-2)',
                cursor: 'pointer', fontFamily: 'var(--font-sans)',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 600, color: experience === item.id ? 'var(--accent)' : 'var(--text)' }}>
                {item.label}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '2px' }}>{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Sessions */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '8px' }}>
          Sessions You Trade (select all that apply)
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {SESSIONS_OPTIONS.map(s => {
            const active = sessions.includes(s.id)
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSession(s.id)}
                style={{
                  padding: '10px 12px', borderRadius: '8px', textAlign: 'left',
                  border: `1px solid ${active ? 'rgba(62,207,142,0.3)' : 'var(--border)'}`,
                  background: active ? 'rgba(62,207,142,0.08)' : 'var(--surface-2)',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, background: active ? 'var(--green)' : 'var(--text-3)', transition: 'background 0.15s' }} />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: active ? 'var(--green)' : 'var(--text)' }}>{s.label}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{s.time}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button type="button" onClick={onBack} style={{ flex: 1, padding: '11px', borderRadius: '8px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
          ← Back
        </button>
        <button type="button" onClick={onNext} style={{ flex: 2, padding: '11px', borderRadius: '8px', background: 'var(--accent)', border: 'none', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
          Continue →
        </button>
      </div>
    </div>
  )
}

interface StepRiskRulesProps {
  maxRisk: number
  setMaxRisk: (v: number) => void
  maxDailyLoss: number
  setMaxDailyLoss: (v: number) => void
  maxTrades: number
  setMaxTrades: (v: number) => void
  onBack: () => void
  onNext: () => void
}

function StepRiskRules({
  maxRisk, setMaxRisk, maxDailyLoss, setMaxDailyLoss,
  maxTrades, setMaxTrades, onBack, onNext,
}: StepRiskRulesProps) {
  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>
        Risk Rules
      </h2>
      <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '24px' }}>
        Set your trading boundaries. The platform will monitor these rules and
        alert you when they are violated.
      </p>

      {/* Max risk per trade */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
            Max Risk Per Trade
          </label>
          <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--amber)', fontFamily: 'var(--font-mono)' }}>
            {maxRisk.toFixed(1)}%
          </span>
        </div>
        <input type="range" min={0.1} max={5} step={0.1} value={maxRisk}
          onChange={e => setMaxRisk(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--amber)', cursor: 'pointer' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
          <span>0.1%</span>
          <span style={{ color: 'var(--green)' }}>recommended ≤ 2%</span>
          <span>5%</span>
        </div>
      </div>

      {/* Max daily loss */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
            Max Daily Loss
          </label>
          <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>
            {maxDailyLoss.toFixed(1)}%
          </span>
        </div>
        <input type="range" min={0.5} max={10} step={0.5} value={maxDailyLoss}
          onChange={e => setMaxDailyLoss(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--red)', cursor: 'pointer' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
          <span>0.5%</span>
          <span style={{ color: 'var(--green)' }}>recommended ≤ 3%</span>
          <span>10%</span>
        </div>
      </div>

      {/* Max trades per day */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
            Max Trades Per Day
          </label>
          <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
            {maxTrades}
          </span>
        </div>
        <input type="range" min={1} max={20} step={1} value={maxTrades}
          onChange={e => setMaxTrades(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
          <span>1</span>
          <span style={{ color: 'var(--green)' }}>recommended ≤ 5</span>
          <span>20</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button type="button" onClick={onBack} style={{ flex: 1, padding: '11px', borderRadius: '8px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
          ← Back
        </button>
        <button type="button" onClick={onNext} style={{ flex: 2, padding: '11px', borderRadius: '8px', background: 'var(--accent)', border: 'none', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
          Save Rules →
        </button>
      </div>
    </div>
  )
}

interface StepBrokerProps {
  selectedBroker: string
  setSelectedBroker: (v: string) => void
  onBack: () => void
  onComplete: () => void
  saving: boolean
}

function StepBroker({
  selectedBroker, setSelectedBroker, onBack, onComplete, saving,
}: StepBrokerProps) {
  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>
        Connect Your Broker
      </h2>
      <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '20px' }}>
        Connect your trading account for automatic sync. You can skip this and
        connect later from the Broker Connect page.
      </p>

      {/* Broker mini-cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
        {BROKERS_MINI.map(broker => (
          <button
            key={broker.id}
            type="button"
            onClick={() => setSelectedBroker(broker.id)}
            style={{
              padding: '12px', borderRadius: '8px', textAlign: 'left',
              border: `1px solid ${selectedBroker === broker.id ? `${broker.color}60` : 'var(--border)'}`,
              background: selectedBroker === broker.id ? `${broker.color}10` : 'var(--surface-2)',
              cursor: 'pointer', fontFamily: 'var(--font-sans)',
              display: 'flex', alignItems: 'center', gap: '10px',
              transition: 'all 0.15s',
            }}
          >
            <div style={{
              width: '32px', height: '32px', borderRadius: '6px',
              background: `${broker.color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px', fontWeight: 800,
              color: broker.color, fontFamily: 'var(--font-mono)', flexShrink: 0,
            }}>
              {broker.id.toUpperCase().slice(0, 3)}
            </div>
            <span style={{
              fontSize: '13px', fontWeight: 600,
              color: selectedBroker === broker.id ? broker.color : 'var(--text)',
            }}>
              {broker.label}
            </span>
          </button>
        ))}
      </div>

      {selectedBroker && (
        <div style={{
          padding: '12px 14px', borderRadius: '8px', marginBottom: '20px',
          background: 'rgba(62,207,142,0.06)',
          border: '1px solid rgba(62,207,142,0.2)',
          fontSize: '13px', color: 'var(--text-2)',
        }}>
          ✓ <strong style={{ color: 'var(--green)' }}>{BROKERS_MINI.find(b => b.id === selectedBroker)?.label}</strong> selected.
          You&apos;ll complete the connection setup on the Broker Connect page after onboarding.
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button type="button" onClick={onBack} style={{ flex: 1, padding: '11px', borderRadius: '8px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
          ← Back
        </button>
        <button
          type="button"
          onClick={onComplete}
          disabled={saving}
          style={{
            flex: 2, padding: '11px', borderRadius: '8px',
            background: 'var(--accent)', border: 'none',
            color: '#fff', fontSize: '14px', fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            fontFamily: 'var(--font-sans)',
          }}
        >
          {saving ? 'Setting up...' : 'Go to Dashboard →'}
        </button>
      </div>

      {/* Skip link */}
      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <button
          type="button"
          onClick={onComplete}
          disabled={saving}
          style={{
            background: 'none', border: 'none',
            fontSize: '12px', color: 'var(--text-3)',
            cursor: 'pointer', fontFamily: 'var(--font-mono)',
          }}
        >
          Skip for now — connect broker later
        </button>
      </div>
    </div>
  )
}
