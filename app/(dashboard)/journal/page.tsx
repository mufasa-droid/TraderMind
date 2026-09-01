'use client'

import { useState, useEffect } from 'react'
import { Plus, BookOpen, Camera, CheckCircle, Sparkles, X, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { BehavioralLog } from '@/types'

const EMOTIONS = [
  { id: 'calm',            label: 'Calm',          color: 'var(--green)' },
  { id: 'focused',         label: 'Focused',       color: 'var(--green)' },
  { id: 'neutral',         label: 'Neutral',       color: 'var(--text-2)' },
  { id: 'hesitant',        label: 'Hesitant',      color: 'var(--text-2)' },
  { id: 'overconfident',   label: 'Overconfident', color: 'var(--amber)' },
  { id: 'fomo',            label: 'FOMO',          color: 'var(--amber)' },
  { id: 'stressed',        label: 'Stressed',      color: 'var(--red)' },
  { id: 'fearful',         label: 'Fearful',       color: 'var(--red)' },
  { id: 'revenge_trading', label: 'Revenge',       color: 'var(--red)' },
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
    notes: 'Clean H1 breakout setup. ATR conditions met (1.4x 14-period MA). Waiting for London open volume to confirm directional momentum before sizing to 1.2%.',
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
    notes: 'Entered immediately within 4 minutes of EURUSD stop-out. Violated risk limit at 2.4% sizing and skipped pre-trade checklist. Classic emotional reaction to a clean loss.',
    lesson: 'Mandatory 30-minute cooling period after any stopped trade. Zero exceptions.',
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
    notes: 'Gold showing strong consolidation above key support. ATR expanding on H4. London-NY overlap window has produced our highest win rate setups this month.',
    lesson: null,
    hasScreenshot: true,
  },
]

function formatLogDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).replace(',', ' ·')
}

function SliderInput({
  label, value, onChange, color
}: {
  label: string
  value: number
  onChange: (v: number) => void
  color: string
}) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
          {label}
        </span>
        <span style={{
          fontSize: '13px',
          fontWeight: 700,
          color,
          fontFamily: 'var(--font-mono)',
          fontFeatureSettings: '"tnum" 1, "zero" 1'
        }}>
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
          background: 'var(--surface-3)'
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
    try {
      const supabase = createClient()
      supabase
        .from('behavioral_logs')
        .select('*')
        .order('logged_at', { ascending: false })
        .limit(20)
        .then(({ data, error: err }) => {
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
              hasScreenshot: Boolean(l.screenshot_url)
            }))
            setEntries(mapped)
          }
        })
    } catch {
      // Demo fallback
    }
    return () => { cancelled = true }
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emotion) {
      setError('Please select an emotional state.')
      return
    }
    if (!notes.trim()) {
      setError('Please provide notes or reflection for this entry.')
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '6px',
              background: 'rgba(108,142,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <BookOpen size={16} color="var(--accent)" />
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text)' }}>
              Behavioral Journal
            </h1>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            {entries.length} logged sessions · Psychological context, emotional states & post-trade lessons
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '8px',
            background: showForm ? 'var(--surface-3)' : 'var(--accent)',
            border: '1px solid var(--border)',
            color: '#fff', fontSize: '12px', fontWeight: 700,
            cursor: 'pointer', transition: 'all 0.15s'
          }}
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? 'Close Panel' : 'New Journal Entry'}
        </button>
      </div>

      {/* Main Content Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: showForm ? 'minmax(0, 1.4fr) minmax(360px, 1fr)' : '1fr',
        gap: '16px',
        alignItems: 'start'
      }}>
        {/* Left Column: Journal Entries Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {entries.map(entry => {
            const emotionItem = EMOTIONS.find(e => e.id === entry.emotion) ?? {
              label: entry.emotion || 'Neutral',
              color: 'var(--text-2)'
            }

            return (
              <div
                key={entry.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  transition: 'border-color 0.15s'
                }}
              >
                {/* Entry Header */}
                <div style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  {/* Badge */}
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    background: entry.type === 'pre_trade'
                      ? 'rgba(108,142,255,0.12)'
                      : entry.type === 'post_trade'
                        ? 'rgba(180,142,255,0.12)'
                        : 'rgba(255,255,255,0.06)',
                    color: entry.type === 'pre_trade'
                      ? 'var(--accent)'
                      : entry.type === 'post_trade'
                        ? 'var(--purple)'
                        : 'var(--text-2)',
                    border: `1px solid ${entry.type === 'pre_trade' ? 'rgba(108,142,255,0.2)' : entry.type === 'post_trade' ? 'rgba(180,142,255,0.2)' : 'var(--border)'}`
                  }}>
                    {entry.type === 'pre_trade' ? 'Pre-Trade' : entry.type === 'post_trade' ? 'Post-Trade' : 'Daily Review'}
                  </span>

                  <span style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                    {entry.date}
                  </span>

                  <span style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--text)',
                    marginLeft: 'auto'
                  }}>
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
                  {/* Emotional Tag & Psychological Levels */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '5px 12px', borderRadius: '20px',
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)'
                    }}>
                      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: emotionItem.color }} />
                      <span style={{ fontSize: '12px', fontWeight: 600, color: emotionItem.color }}>
                        {emotionItem.label}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {[
                        { label: 'Conf', val: entry.confidence, col: 'var(--green)' },
                        { label: 'Stress', val: entry.stress, col: entry.stress > 6 ? 'var(--red)' : 'var(--amber)' },
                        { label: 'Fear', val: entry.fear, col: entry.fear > 6 ? 'var(--red)' : 'var(--text-3)' },
                        { label: 'Focus', val: entry.focus, col: 'var(--accent)' },
                      ].map(stat => (
                        <div key={stat.label} style={{
                          padding: '4px 8px', borderRadius: '6px',
                          background: 'var(--surface-2)', border: '1px solid var(--border)',
                          fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-2)'
                        }}>
                          <span style={{ color: 'var(--text-3)', marginRight: '4px' }}>{stat.label}:</span>
                          <span style={{ color: stat.col, fontWeight: 700 }}>{stat.val}/10</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes content */}
                  <p style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--text-2)' }}>
                    {entry.notes}
                  </p>

                  {/* Highlighted Lesson box */}
                  {entry.lesson && (
                    <div style={{
                      marginTop: '4px',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      background: 'rgba(62, 207, 142, 0.05)',
                      border: '1px solid rgba(62, 207, 142, 0.2)',
                      borderLeft: '3px solid var(--green)',
                      fontSize: '12px',
                      lineHeight: 1.6,
                      color: 'var(--text)'
                    }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-mono)', marginBottom: '3px' }}>
                        KEY TAKEAWAY & RULE REINFORCEMENT
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
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            overflow: 'hidden',
            position: 'sticky',
            top: '20px'
          }}>
            {/* Form Header */}
            <div style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--surface-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={14} color="var(--accent)" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                  New Journal Entry
                </span>
              </div>
              <button
                onClick={() => setShowForm(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSave} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Entry Type */}
              <div>
                <div style={{
                  fontSize: '10px', fontWeight: 700, color: 'var(--text-3)',
                  fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px'
                }}>
                  Log Classification
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['pre_trade', 'post_trade', 'daily'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setLogType(type)}
                      style={{
                        flex: 1, padding: '7px 0', borderRadius: '6px', fontSize: '11px',
                        fontWeight: 600, fontFamily: 'var(--font-mono)', cursor: 'pointer',
                        border: `1px solid ${logType === type ? 'rgba(108,142,255,0.4)' : 'var(--border)'}`,
                        background: logType === type ? 'rgba(108,142,255,0.12)' : 'var(--surface-2)',
                        color: logType === type ? 'var(--accent)' : 'var(--text-2)',
                        transition: 'all 0.15s'
                      }}
                    >
                      {type === 'pre_trade' ? 'Pre-Trade' : type === 'post_trade' ? 'Post-Trade' : 'Daily'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Setup / Pair Name */}
              <div>
                <div style={{
                  fontSize: '10px', fontWeight: 700, color: 'var(--text-3)',
                  fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px'
                }}>
                  Symbol / Setup
                </div>
                <input
                  type="text"
                  value={symbol}
                  onChange={e => setSymbol(e.target.value)}
                  placeholder="e.g. EURUSD Long, London Breakout"
                  style={{
                    width: '100%',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: '7px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: 'var(--text)',
                    outline: 'none',
                    fontFamily: 'var(--font-sans)'
                  }}
                />
              </div>

              {/* Emotional State Selector */}
              <div>
                <div style={{
                  fontSize: '10px', fontWeight: 700, color: 'var(--text-3)',
                  fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px'
                }}>
                  Primary Emotional State
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {EMOTIONS.map(e => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => setEmotion(e.id)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        border: `1px solid ${emotion === e.id ? e.color : 'var(--border)'}`,
                        background: emotion === e.id ? `${e.color}18` : 'transparent',
                        color: emotion === e.id ? e.color : 'var(--text-3)',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders */}
              <div style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '14px 14px 2px'
              }}>
                <SliderInput label="Confidence Level" value={confidence} onChange={setConfidence} color="var(--green)" />
                <SliderInput label="Stress Level" value={stress} onChange={setStress} color={stress > 6 ? 'var(--red)' : 'var(--amber)'} />
                <SliderInput label="Fear / Hesitation" value={fear} onChange={setFear} color={fear > 6 ? 'var(--red)' : 'var(--accent)'} />
                <SliderInput label="Focus Level" value={focus} onChange={setFocus} color="var(--accent)" />
              </div>

              {/* Notes */}
              <div>
                <div style={{
                  fontSize: '10px', fontWeight: 700, color: 'var(--text-3)',
                  fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px'
                }}>
                  Reasoning & Psychological Notes
                </div>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Describe your thesis, checklist adherence, and psychological state..."
                  rows={3}
                  style={{
                    width: '100%',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: '7px',
                    padding: '10px',
                    fontSize: '12px',
                    color: 'var(--text)',
                    fontFamily: 'var(--font-sans)',
                    outline: 'none',
                    resize: 'vertical',
                    lineHeight: 1.6
                  }}
                />
              </div>

              {/* Lesson Learned (Optional for post-trade) */}
              <div>
                <div style={{
                  fontSize: '10px', fontWeight: 700, color: 'var(--text-3)',
                  fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px'
                }}>
                  Lesson Learned / Takeaway (Optional)
                </div>
                <input
                  type="text"
                  value={lesson}
                  onChange={e => setLesson(e.target.value)}
                  placeholder="What rule will you enforce next time?"
                  style={{
                    width: '100%',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: '7px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: 'var(--text)',
                    outline: 'none',
                    fontFamily: 'var(--font-sans)'
                  }}
                />
              </div>

              {error && (
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'rgba(255, 95, 95, 0.08)',
                  border: '1px solid rgba(255, 95, 95, 0.25)',
                  fontSize: '11px',
                  color: 'var(--red)',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: '8px',
                  background: 'var(--accent)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {saving ? 'Saving...' : 'Save Journal Entry'}
              </button>

            </form>
          </div>
        )}
      </div>
    </div>
  )
}
