'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ChevronRight,
  Shield,
  Target,
  Sparkles,
  Brain,
  Link2,
  DollarSign,
  Coins,
  Globe,
  TrendingUp,
  Clock,
  Calendar,
  Zap,
  Compass,
  Award,
  Moon,
  Building2,
  Layers,
  Sun,
  Check,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { BrokerLogo } from '@/components/broker/BrokerLogos'

const STEPS = [
  { number: 1, title: 'Welcome', subtitle: "Let's set up your profile" },
  { number: 2, title: 'Trading Profile', subtitle: 'Tell us about your trading style' },
  { number: 3, title: 'Risk Rules', subtitle: 'Define your trading boundaries' },
  { number: 4, title: 'Connect Broker', subtitle: 'Sync your trades automatically' },
]

const INSTRUMENTS = [
  { id: 'forex', label: 'Forex', icon: DollarSign, desc: 'Major, minor & exotic FX pairs' },
  { id: 'crypto', label: 'Crypto', icon: Coins, desc: 'Bitcoin, Ethereum & Altcoins' },
  { id: 'both', label: 'Forex & Crypto', icon: Globe, desc: 'Multi-asset active portfolio' },
  { id: 'stocks', label: 'Stocks & Indices', icon: TrendingUp, desc: 'Equities & index futures' },
]

const STYLES = [
  { id: 'day', label: 'Day Trader', icon: Clock, desc: 'Positions opened and closed intraday' },
  { id: 'swing', label: 'Swing Trader', icon: Calendar, desc: 'Hold positions for days to weeks' },
  { id: 'scalp', label: 'Scalper', icon: Zap, desc: 'Rapid execution, high trade frequency' },
]

const EXPERIENCE = [
  { id: 'beginner', label: 'Beginner', icon: Compass, desc: 'Under 1 year' },
  { id: 'intermediate', label: 'Intermediate', icon: Target, desc: '1–3 years' },
  { id: 'advanced', label: 'Advanced', icon: Award, desc: '3+ years' },
]

const SESSIONS_OPTIONS = [
  { id: 'asian', label: 'Asian Session', time: '00:00–08:00 UTC', icon: Moon },
  { id: 'london', label: 'London Session', time: '08:00–12:00 UTC', icon: Building2 },
  { id: 'overlap', label: 'London/NY Overlap', time: '12:00–16:00 UTC', icon: Layers },
  { id: 'new_york', label: 'New York Session', time: '13:00–17:00 UTC', icon: Sun },
]

const BROKERS_ONBOARDING = [
  { id: 'mt5', label: 'MetaTrader 5', subtitle: 'Forex & Multi-Asset' },
  { id: 'mt4', label: 'MetaTrader 4', subtitle: 'Classic FX Trading' },
  { id: 'binance', label: 'Binance', subtitle: 'Spot & Futures' },
  { id: 'bybit', label: 'Bybit', subtitle: 'Derivatives & Spot' },
  { id: 'ctrader', label: 'cTrader', subtitle: 'ECN Direct Market' },
  { id: 'tradingview', label: 'TradingView', subtitle: 'Web & Paper Trading' },
  { id: 'dxtrade', label: 'DXTrade', subtitle: 'Prop Firm Platform' },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [userName, setUserName] = useState('Trader')

  // Step 2 — profile
  const [instrument, setInstrument] = useState('forex')
  const [tradingStyle, setTradingStyle] = useState('day')
  const [experience, setExperience] = useState('intermediate')
  const [sessions, setSessions] = useState<string[]>(['london', 'overlap'])

  // Step 3 — risk rules
  const [maxRisk, setMaxRisk] = useState(2.0)
  const [maxDailyLoss, setMaxDailyLoss] = useState(3.0)
  const [maxTrades, setMaxTrades] = useState(5)

  // Step 4 — broker
  const [selectedBroker, setSelectedBroker] = useState('mt5')

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
            .maybeSingle()

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
      padding: '36px 20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient background glow for refined luxury feel */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '580px',
        height: '380px',
        background: 'radial-gradient(ellipse at center, rgba(108,142,255,0.08) 0%, rgba(108,142,255,0.02) 50%, transparent 75%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div style={{ width: '100%', maxWidth: '520px', position: 'relative', zIndex: 1 }}>
        {/* Brand Header */}
        <Link href="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '32px',
          justifyContent: 'center',
          textDecoration: 'none',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: 800,
            color: '#fff',
            boxShadow: '0 4px 14px rgba(108,142,255,0.25)',
          }}>
            TM
          </div>
          <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            TraderMind
          </span>
        </Link>

        {/* Progress Tracker */}
        <div style={{
          background: 'rgba(17, 19, 24, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(16px)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
              {STEPS[step - 1].title}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
              Step {step} of 4
            </span>
          </div>

          {/* Stepper bar */}
          <div style={{ display: 'flex', gap: '6px', height: '4px' }}>
            {STEPS.map(s => {
              const isPast = s.number < step
              const isCurrent = s.number === step
              return (
                <div
                  key={s.number}
                  style={{
                    flex: 1,
                    height: '100%',
                    borderRadius: '2px',
                    background: isPast
                      ? 'var(--accent)'
                      : isCurrent
                      ? 'rgba(108, 142, 255, 0.75)'
                      : 'rgba(255, 255, 255, 0.08)',
                    transition: 'all 0.3s ease',
                  }}
                />
              )
            })}
          </div>
        </div>

        {/* Step Card Container */}
        <div style={{
          background: 'rgba(17, 19, 24, 0.78)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          borderRadius: '16px',
          padding: '28px 28px 30px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        }}>
          {step === 1 && <StepWelcome userName={userName} onNext={nextStep} />}
          {step === 2 && (
            <StepProfile
              instrument={instrument}
              setInstrument={setInstrument}
              tradingStyle={tradingStyle}
              setTradingStyle={setTradingStyle}
              experience={experience}
              setExperience={setExperience}
              sessions={sessions}
              setSessions={setSessions}
              onBack={prevStep}
              onNext={nextStep}
            />
          )}
          {step === 3 && (
            <StepRiskRules
              maxRisk={maxRisk}
              setMaxRisk={setMaxRisk}
              maxDailyLoss={maxDailyLoss}
              setMaxDailyLoss={setMaxDailyLoss}
              maxTrades={maxTrades}
              setMaxTrades={setMaxTrades}
              onBack={prevStep}
              onNext={nextStep}
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
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — WELCOME (Standardized, Soothing Neutral)
// ─────────────────────────────────────────────────────────────────────────────

function StepWelcome({ userName, onNext }: { userName: string; onNext: () => void }) {
  const highlights = [
    {
      icon: Brain,
      title: 'Psychological Analysis',
      desc: 'We map your emotional triggers, cognitive biases, and behavioral streaks.',
    },
    {
      icon: Shield,
      title: 'Discipline Guardrails',
      desc: 'Set custom risk bounds; TraderMind audits compliance and detects overtrading.',
    },
    {
      icon: Link2,
      title: 'Effortless Sync',
      desc: 'Connect your broker or MetaTrader for read-only automated trade ingestion.',
    },
  ]

  return (
    <div>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        background: 'rgba(108, 142, 255, 0.1)',
        border: '1px solid rgba(108, 142, 255, 0.25)',
        color: 'var(--accent)',
        marginBottom: '16px',
      }}>
        <Sparkles size={20} />
      </div>

      <h1 style={{
        fontSize: '22px',
        fontWeight: 800,
        color: 'var(--text)',
        marginBottom: '8px',
        letterSpacing: '-0.5px',
      }}>
        Welcome{userName && userName !== 'Trader' ? `, ${userName}` : ''}
      </h1>

      <p style={{
        fontSize: '13px',
        color: 'var(--text-2)',
        lineHeight: 1.6,
        marginBottom: '24px',
      }}>
        Let’s take 60 seconds to configure your behavioral profile.
        This provides the baseline context our deterministic engine needs to evaluate your decision quality.
      </p>

      {/* Feature cards with standard icons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
        {highlights.map((item, idx) => {
          const Icon = item.icon
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(108, 142, 255, 0.08)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '1px',
              }}>
                <Icon size={16} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.45 }}>
                  {item.desc}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={onNext}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          background: 'var(--accent)',
          border: 'none',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          boxShadow: '0 4px 18px rgba(108,142,255,0.28)',
          transition: 'opacity 0.2s',
        }}
      >
        <span>Get Started</span>
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — TRADING PROFILE (Standard Lucide Icons & Neutral Palette)
// ─────────────────────────────────────────────────────────────────────────────

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
      <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)', marginBottom: '4px', letterSpacing: '-0.4px' }}>
        Trading Profile
      </h2>
      <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '22px' }}>
        Help the behavioral engine understand your typical market environment.
      </p>

      {/* Primary Instrument */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-3)',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          display: 'block',
          marginBottom: '8px',
          fontWeight: 600,
        }}>
          Primary Instrument
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {INSTRUMENTS.map(item => {
            const Icon = item.icon
            const active = instrument === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setInstrument(item.id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '9px',
                  border: `1px solid ${active ? 'rgba(108,142,255,0.45)' : 'rgba(255,255,255,0.07)'}`,
                  background: active ? 'rgba(108,142,255,0.1)' : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  background: active ? 'rgba(108,142,255,0.2)' : 'rgba(255,255,255,0.05)',
                  color: active ? 'var(--accent)' : 'var(--text-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={15} />
                </div>
                <div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: active ? 700 : 500,
                    color: active ? '#FFFFFF' : 'var(--text)',
                  }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>
                    {item.id === 'forex' ? 'Currency Pairs' : item.id === 'crypto' ? 'Spot & Futures' : item.id === 'both' ? 'Multi-Asset' : 'Indices'}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Trading Style */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-3)',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          display: 'block',
          marginBottom: '8px',
          fontWeight: 600,
        }}>
          Trading Style
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {STYLES.map(item => {
            const Icon = item.icon
            const active = tradingStyle === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTradingStyle(item.id)}
                style={{
                  padding: '9px 12px',
                  borderRadius: '9px',
                  textAlign: 'left',
                  border: `1px solid ${active ? 'rgba(108,142,255,0.45)' : 'rgba(255,255,255,0.07)'}`,
                  background: active ? 'rgba(108,142,255,0.1)' : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <Icon size={14} color={active ? 'var(--accent)' : 'var(--text-3)'} />
                  <span style={{ fontSize: '13px', fontWeight: active ? 700 : 500, color: active ? '#FFFFFF' : 'var(--text)' }}>
                    {item.label}
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{item.desc}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Experience Level */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-3)',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          display: 'block',
          marginBottom: '8px',
          fontWeight: 600,
        }}>
          Experience Level
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {EXPERIENCE.map(item => {
            const Icon = item.icon
            const active = experience === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setExperience(item.id)}
                style={{
                  padding: '10px 8px',
                  borderRadius: '9px',
                  textAlign: 'center',
                  border: `1px solid ${active ? 'rgba(108,142,255,0.45)' : 'rgba(255,255,255,0.07)'}`,
                  background: active ? 'rgba(108,142,255,0.1)' : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={15} color={active ? 'var(--accent)' : 'var(--text-3)'} />
                <div style={{ fontSize: '12px', fontWeight: active ? 700 : 600, color: active ? '#FFFFFF' : 'var(--text)' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>{item.desc}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Sessions You Trade */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-3)',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          display: 'block',
          marginBottom: '8px',
          fontWeight: 600,
        }}>
          Trading Sessions (Select Active)
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
          {SESSIONS_OPTIONS.map(s => {
            const active = sessions.includes(s.id)
            const Icon = s.icon
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSession(s.id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '9px',
                  textAlign: 'left',
                  border: `1px solid ${active ? 'rgba(108,142,255,0.45)' : 'rgba(255,255,255,0.07)'}`,
                  background: active ? 'rgba(108,142,255,0.1)' : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '6px',
                  background: active ? 'rgba(108,142,255,0.2)' : 'rgba(255,255,255,0.05)',
                  color: active ? 'var(--accent)' : 'var(--text-3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={14} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: active ? 700 : 500, color: active ? '#FFFFFF' : 'var(--text)' }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                    {s.time}
                  </div>
                </div>
                {active && <Check size={14} color="var(--accent)" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            flex: 1,
            padding: '11px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: 'var(--text-2)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          style={{
            flex: 2,
            padding: '11px',
            borderRadius: '8px',
            background: 'var(--accent)',
            border: 'none',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 18px rgba(108,142,255,0.25)',
          }}
        >
          Continue
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — RISK RULES (Neutral, Soothing Guardrails)
// ─────────────────────────────────────────────────────────────────────────────

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <SlidersHorizontal size={18} color="var(--accent)" />
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.4px', margin: 0 }}>
          Risk Rules
        </h2>
      </div>
      <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '24px' }}>
        Establish behavioral boundaries. The engine calculates discipline scores based on these limits.
      </p>

      {/* Max risk per trade */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '10px',
        padding: '14px 16px',
        marginBottom: '14px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
              Max Risk Per Trade
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
              Hard ceiling per setup
            </div>
          </div>
          <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
            {maxRisk.toFixed(1)}%
          </span>
        </div>
        <input
          type="range"
          min={0.1}
          max={5}
          step={0.1}
          value={maxRisk}
          onChange={e => setMaxRisk(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
          <span>0.1%</span>
          <span style={{ color: 'var(--text-2)' }}>conservative: ≤ 2.0%</span>
          <span>5.0%</span>
        </div>
      </div>

      {/* Max daily loss */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '10px',
        padding: '14px 16px',
        marginBottom: '14px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
              Max Daily Loss
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
              Circuit breaker drawdown limit
            </div>
          </div>
          <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
            {maxDailyLoss.toFixed(1)}%
          </span>
        </div>
        <input
          type="range"
          min={0.5}
          max={10}
          step={0.5}
          value={maxDailyLoss}
          onChange={e => setMaxDailyLoss(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
          <span>0.5%</span>
          <span style={{ color: 'var(--text-2)' }}>recommended: ≤ 3.0%</span>
          <span>10.0%</span>
        </div>
      </div>

      {/* Max trades per day */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '10px',
        padding: '14px 16px',
        marginBottom: '26px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
              Max Trades Per Day
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
              Prevents overtrading fatigue
            </div>
          </div>
          <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
            {maxTrades} <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-3)' }}>trades</span>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
          <span>1</span>
          <span style={{ color: 'var(--text-2)' }}>optimal focus: 3–6</span>
          <span>20</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            flex: 1,
            padding: '11px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: 'var(--text-2)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          style={{
            flex: 2,
            padding: '11px',
            borderRadius: '8px',
            background: 'var(--accent)',
            border: 'none',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 18px rgba(108,142,255,0.25)',
          }}
        >
          Save Rules
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4 — CONNECT BROKER (Company Vector Logos & Neutral Card Styling)
// ─────────────────────────────────────────────────────────────────────────────

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
      <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)', marginBottom: '4px', letterSpacing: '-0.4px' }}>
        Connect Your Broker
      </h2>
      <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '20px', lineHeight: 1.5 }}>
        Select your trading platform for automated trade ingestion.
        Read-only access ensures credentials cannot execute orders.
      </p>

      {/* 7 Broker Cards with Official Company Logos */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        marginBottom: '20px',
      }}>
        {BROKERS_ONBOARDING.map(broker => {
          const isSelected = selectedBroker === broker.id
          return (
            <button
              key={broker.id}
              type="button"
              onClick={() => setSelectedBroker(broker.id)}
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                textAlign: 'left',
                border: `1px solid ${isSelected ? 'rgba(108, 142, 255, 0.45)' : 'rgba(255, 255, 255, 0.07)'}`,
                background: isSelected ? 'rgba(108, 142, 255, 0.09)' : 'rgba(255, 255, 255, 0.02)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.15s ease',
                position: 'relative',
              }}
            >
              {/* Official company vector logo */}
              <div style={{ flexShrink: 0 }}>
                <BrokerLogo id={broker.id} size={28} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: isSelected ? 700 : 600,
                  color: isSelected ? '#FFFFFF' : 'var(--text)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {broker.label}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: 'var(--text-3)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {broker.subtitle}
                </div>
              </div>

              {isSelected && (
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Check size={11} color="#FFFFFF" strokeWidth={3} />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Subtle confirmation notice */}
      {selectedBroker && (
        <div style={{
          padding: '11px 14px',
          borderRadius: '9px',
          marginBottom: '20px',
          background: 'rgba(108, 142, 255, 0.06)',
          border: '1px solid rgba(108, 142, 255, 0.2)',
          fontSize: '12px',
          color: 'var(--text-2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <CheckCircle2 size={15} color="var(--accent)" style={{ flexShrink: 0 }} />
          <span>
            <strong style={{ color: 'var(--text)' }}>
              {BROKERS_ONBOARDING.find(b => b.id === selectedBroker)?.label}
            </strong> selected. You can finish sync settings anytime in Broker Connect.
          </span>
        </div>
      )}

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            flex: 1,
            padding: '11px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: 'var(--text-2)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Back
        </button>
        <button
          type="button"
          onClick={onComplete}
          disabled={saving}
          style={{
            flex: 2,
            padding: '11px',
            borderRadius: '8px',
            background: 'var(--accent)',
            border: 'none',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            boxShadow: '0 4px 18px rgba(108,142,255,0.25)',
          }}
        >
          {saving ? 'Completing Setup...' : 'Go to Dashboard →'}
        </button>
      </div>

      {/* Neutral Skip Link */}
      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <button
          type="button"
          onClick={onComplete}
          disabled={saving}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '12px',
            color: 'var(--text-3)',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-2)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
        >
          Skip for now — configure broker later
        </button>
      </div>
    </div>
  )
}
