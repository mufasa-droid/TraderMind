'use client'

import { useState, useEffect } from 'react'
import { Plus, BookOpen, Camera, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { BehavioralLog } from '@/types'

const EMOTIONS = [
  { id: 'calm',            label: 'Calm',          color: 'var(--green)'  },
  { id: 'focused',         label: 'Focused',       color: 'var(--green)'  },
  { id: 'neutral',         label: 'Neutral',       color: 'var(--text-2)' },
  { id: 'hesitant',        label: 'Hesitant',      color: 'var(--text-2)' },
  { id: 'overconfident',   label: 'Overconfident', color: 'var(--amber)'  },
  { id: 'fomo',            label: 'FOMO',          color: 'var(--amber)'  },
  { id: 'stressed',        label: 'Stressed',      color: 'var(--red)'    },
  { id: 'fearful',         label: 'Fearful',       color: 'var(--red)'    },
  { id: 'revenge_trading', label: 'Revenge',       color: 'var(--red)'    },
]

interface JournalEntry {
  id: string | number
  date: string
  type: 'pre_trade' | 'post_trade' | 'daily'
  emotion: string
  trade: string
  confidence: number
  stress: number
  fear: number
  focus: number
  notes: string
  lesson?: string | null
  hasScreenshot?: boolean
}

const DEMO_ENTRIES: JournalEntry[] = [
  {
    id: 1,
    date: 'May 26 · 08:28',
    type: 'pre_trade',
    emotion: 'focused',
    trade: 'EURUSD Long',
    confidence: 8,
    stress: 2,
    fear: 2,
    focus: 9,
    notes: 'Clean H1 breakout setup. ATR conditions met. Waiting for London open momentum to confirm.',
    lesson: null,
    hasScreenshot: true,
  },
  {
    id: 2,
    date: 'May 26 · 09:10',
    type: 'post_trade',
    emotion: 'revenge_trading',
    trade: 'GBPJPY Short',
    confidence: 4,
    stress: 8,
    fear: 7,
    focus: 3,
    notes: 'Entered immediately after EURUSD stop-out. Violated 30-minute cool-down rule. Should not have traded.',
    lesson: 'Implementing mandatory 30-min break after any stopped trade. No exceptions.',
    hasScreenshot: false,
  },
  {
    id: 3,
    date: 'May 25 · 12:40',
    type: 'pre_trade',
    emotion: 'calm',
    trade: 'XAUUSD Long',
    confidence: 9,
    stress: 1,
    fear: 1,
    focus: 9,
    notes: 'Gold showing strong bullish momentum. ATR expanding nicely. London-NY overlap — historically my best period for XAUUSD.',
    lesson: null,
    hasScreenshot: true,
  },
]

const TYPE_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  pre_trade:  { bg: 'rgba(108,142,255,0.12)', color: 'var(--accent)',  label: 'Pre-Trade'  },
  post_trade: { bg: 'rgba(180,142,255,0.12)', color: 'var(--purple)',  label: 'Post-Trade' },
  daily:      { bg: 'rgba(255,255,255,0.06)', color: 'var(--text-2)', label: 'Daily'      },
}

function formatLogDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).replace(',', ' ·')
}

function SliderInput({
  label, value, onChange, color,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  color: string
}) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
          {label}
        </span>
        <span
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color,
            fontFamily: 'var(--font-mono)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}/10
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          accentColor: color,
          cursor: 'pointer',
          height: '4px',
          borderRadius: '2px',
          background: 'var(--surface-3)',
        }}
      />
    </div>
  )
}

export default function JournalPage() {
  const [showForm, setShowForm] = useState(false)
  const [logType, setLogType] = useState<'pre_trade' | 'post_trade' | 'daily'>('pre_trade')
  const [emotion, setEmotion] = useState('')
  const [confidence, setConfidence] = useState(7)
  const [stress, setStress] = useState(3)
  const [fear, setFear] = useState(2)
  const [focus, setFocus] = useState(8)
  const [notes, setNotes] = useState('')
  const [lesson, setLesson] = useState('')
  const [symbol, setSymbol] = useState('EURUSD Long')
  const [entries, setEntries] = useState<JournalEntry[]>(DEMO_ENTRIES)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function loadLogs() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || cancelled) return

        const { data, error: err } = await supabase
          .from('behavioral_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('logged_at', { ascending: false })
          .limit(20)

        if (cancelled) return
        if (!err && data && data.length > 0) {
          const mapped: JournalEntry[] = (data as BehavioralLog[]).map(l => ({
            id: l.id,
            date: formatLogDate(l.logged_at),
            type: (l.log_type as 'pre_trade' | 'post_trade' | 'daily') || 'pre_trade',
            emotion: l.emotion || 'neutral',
            trade: l.strategy_used || (l.trade_id ? `Trade #${l.trade_id.slice(0, 6)}` : 'Manual Setup'),
            confidence: l.confidence_level || 7,
            stress: l.stress_level || 3,
            fear: l.fear_level || 2,
            focus: l.focus_level || 8,
            notes: l.setup_notes || l.pre_trade_reasoning || l.post_trade_reflection || '',
            lesson: l.lesson_learned || null,
            hasScreenshot: Boolean(l.screenshot_url),
          }))
          // Rule 2.9: Demo entries always visible on the left (never remove them)
          setEntries([...mapped, ...DEMO_ENTRIES])
        }
      } catch {
        // Demo fallback
      }
    }
    loadLogs()
    return () => { cancelled = true }
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emotion) {
      setError('Please select an emotional state.')
      return
    }

    setSaving(true)
    setError(null)

    const newEntry: JournalEntry = {
      id: Date.now(),
      date: formatLogDate(new Date().toISOString()),
      type: logType,
      emotion,
      trade: symbol.trim() || 'Setup Log',
      confidence,
      stress,
      fear,
      focus,
      notes: notes.trim(),
      lesson: lesson.trim() || null,
      hasScreenshot: false,
    }

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        await supabase.from('behavioral_logs').insert({
          user_id: user.id,
          log_type: logType,
          emotion,
          confidence_level: confidence,
          stress_level: stress,
          fear_level: fear,
          focus_level: focus,
          setup_notes: notes.trim(),
          lesson_learned: lesson.trim() || null,
          strategy_used: symbol.trim(),
          logged_at: new Date().toISOString(),
        })
      }

      setEntries(prev => [newEntry, ...prev])
      setEmotion('')
      setNotes('')
      setLesson('')
      setConfidence(7)
      setStress(3)
      setFear(2)
      setFocus(8)
      setShowForm(false)
    } catch {
      // Local state fallback in demo
      setEntries(prev => [newEntry, ...prev])
      setShowForm(false)
    } finally {
      setSaving(false)
    }
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
        @media (max-width: 1023px) {
          .journal-main-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .journal-form-column { order: -1 !important; position: static !important; }
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
          <span>BEHAVIORAL JOURNAL</span>
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
                <BookOpen size={18} />
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
                Behavioral Journal
              </h1>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
              {entries.length} logged sessions · Psychological context, emotional states & post-trade lessons
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="interactive-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '6px',
              background: showForm ? 'var(--surface-3)' : 'var(--accent)',
              border: '1px solid var(--border)',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? 'Close Panel' : 'New Entry'}
          </button>
        </div>
      </div>

      {/* ── 2. MAIN CONTENT GRID (FEED + STICKY FORM) ── */}
      <div
        className="journal-main-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: showForm ? 'minmax(0, 1.4fr) 360px' : '1fr',
          gap: '16px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Journal Entries Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {entries.map(entry => {
            const typeConfig = TYPE_CONFIG[entry.type] ?? TYPE_CONFIG.pre_trade
            const emotionItem = EMOTIONS.find(e => e.id === entry.emotion) ?? {
              label: entry.emotion || 'Neutral',
              color: 'var(--text-2)',
            }

            return (
              <div
                key={entry.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                }}
              >
                {/* Entry Header */}
                <div
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      background: typeConfig.bg,
                      color: typeConfig.color,
                      border: `1px solid ${typeConfig.color}40`,
                    }}
                  >
                    {typeConfig.label}
                  </span>

                  <span style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                    {entry.date}
                  </span>

                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--text)',
                      marginLeft: 'auto',
                    }}
                  >
                    {entry.trade}
                  </span>

                  {entry.hasScreenshot && (
                    <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-3)' }} title="Chart Screenshot Attached">
                      <Camera size={13} />
                    </div>
                  )}
                </div>

                {/* Entry Body */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Emotional Tag & Psychological Metrics */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '16px',
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: emotionItem.color }} />
                      <span style={{ fontSize: '11px', fontWeight: 600, color: emotionItem.color }}>
                        {emotionItem.label}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {[
                        { label: 'Conf', val: entry.confidence, col: 'var(--green)' },
                        { label: 'Stress', val: entry.stress, col: entry.stress > 6 ? 'var(--red)' : 'var(--amber)' },
                        { label: 'Fear', val: entry.fear, col: entry.fear > 6 ? 'var(--red)' : 'var(--text-3)' },
                        { label: 'Focus', val: entry.focus, col: 'var(--accent)' },
                      ].map(stat => (
                        <div
                          key={stat.label}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '5px',
                            background: 'var(--surface-2)',
                            border: '1px solid var(--border)',
                            fontSize: '11px',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-2)',
                          }}
                        >
                          <span style={{ color: 'var(--text-3)', marginRight: '4px' }}>{stat.label}:</span>
                          <span style={{ color: stat.col, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{stat.val}/10</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes content */}
                  <p style={{ fontSize: '13px', lineHeight: 1.65, color: 'var(--text-2)', margin: 0 }}>
                    {entry.notes}
                  </p>

                  {/* Highlighted Lesson Learned */}
                  {entry.lesson && (
                    <div
                      style={{
                        marginTop: '4px',
                        padding: '12px 14px',
                        borderRadius: '6px',
                        background: 'rgba(62, 207, 142, 0.05)',
                        border: '1px solid rgba(62, 207, 142, 0.2)',
                        borderLeft: '3px solid var(--green)',
                        fontSize: '12px',
                        lineHeight: 1.6,
                        color: 'var(--text)',
                      }}
                    >
                      <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-mono)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                        Key Takeaway & Rule Reinforcement
                      </div>
                      "{entry.lesson}"
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Right Column: Slide-in Entry Form */}
        {showForm && (
          <div
            className="journal-form-column"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              overflow: 'hidden',
              position: 'sticky',
              top: '80px',
              alignSelf: 'flex-start',
            }}
          >
            {/* Form Header */}
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--surface-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={14} color="var(--accent)" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                  New Journal Entry
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: '16px' }}
              >
                ×
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSave} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Entry Type */}
              <div>
                <label style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '6px' }}>
                  Entry Classification
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['pre_trade', 'post_trade', 'daily'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setLogType(type)}
                      style={{
                        flex: 1,
                        padding: '6px 0',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        fontFamily: 'var(--font-mono)',
                        cursor: 'pointer',
                        border: `1px solid ${logType === type ? 'var(--accent)' : 'var(--border)'}`,
                        background: logType === type ? 'var(--surface-3)' : 'var(--surface-2)',
                        color: logType === type ? 'var(--text)' : 'var(--text-3)',
                        transition: 'all 0.12s ease',
                      }}
                    >
                      {type === 'pre_trade' ? 'Pre-Trade' : type === 'post_trade' ? 'Post-Trade' : 'Daily'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Setup / Pair Name */}
              <div>
                <label style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '6px' }}>
                  Symbol / Setup
                </label>
                <input
                  type="text"
                  value={symbol}
                  onChange={e => setSymbol(e.target.value)}
                  placeholder="e.g. EURUSD Long, London Breakout"
                  style={{
                    width: '100%',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: 'var(--text)',
                    outline: 'none',
                    fontFamily: 'var(--font-sans)',
                  }}
                />
              </div>

              {/* Emotional State Selector */}
              <div>
                <label style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '6px' }}>
                  Emotional State
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {EMOTIONS.map(e => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => setEmotion(e.id)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '14px',
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        border: `1px solid ${emotion === e.id ? e.color : 'var(--border)'}`,
                        background: emotion === e.id ? `${e.color}18` : 'transparent',
                        color: emotion === e.id ? e.color : 'var(--text-3)',
                        cursor: 'pointer',
                        transition: 'all 0.12s ease',
                      }}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders */}
              <div
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '12px 14px 2px',
                }}
              >
                <SliderInput label="Confidence" value={confidence} onChange={setConfidence} color="var(--green)" />
                <SliderInput label="Stress" value={stress} onChange={setStress} color={stress > 6 ? 'var(--red)' : 'var(--amber)'} />
                <SliderInput label="Fear" value={fear} onChange={setFear} color={fear > 6 ? 'var(--red)' : 'var(--accent)'} />
                <SliderInput label="Focus" value={focus} onChange={setFocus} color="var(--accent)" />
              </div>

              {/* Notes */}
              <div>
                <label style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '6px' }}>
                  Notes & Reasoning
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Describe your thesis, checklist adherence, and psychological state..."
                  rows={3}
                  style={{
                    width: '100%',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    fontSize: '12px',
                    color: 'var(--text)',
                    fontFamily: 'var(--font-sans)',
                    outline: 'none',
                    resize: 'vertical',
                    lineHeight: 1.6,
                  }}
                />
              </div>

              {/* Lesson Learned */}
              <div>
                <label style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '6px' }}>
                  Lesson Learned (Optional)
                </label>
                <input
                  type="text"
                  value={lesson}
                  onChange={e => setLesson(e.target.value)}
                  placeholder="What rule will you enforce next time?"
                  style={{
                    width: '100%',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: 'var(--text)',
                    outline: 'none',
                    fontFamily: 'var(--font-sans)',
                  }}
                />
              </div>

              {error && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'rgba(255, 95, 95, 0.08)',
                    border: '1px solid rgba(255, 95, 95, 0.25)',
                    fontSize: '11px',
                    color: 'var(--red)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="interactive-btn"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  background: 'var(--accent)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                {saving ? 'Saving...' : 'Save Entry'}
              </button>

            </form>
          </div>
        )}
      </div>
    </div>
  )
}
