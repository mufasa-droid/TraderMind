'use client'

import { useState } from 'react'
import { Plus, BookOpen, Camera, Smile, Brain, TrendingDown } from 'lucide-react'

const c = {
  green: '#3ecf8e', red: '#ff5f5f', amber: '#f5a623',
  accent: 'hsl(226,100%,71%)', purple: '#b48eff',
  surface: 'hsl(224,18%,8%)', surface2: 'hsl(224,16%,11%)', surface3: 'hsl(224,14%,14%)',
  border: 'hsl(220,12%,14%)', text: 'hsl(220,15%,92%)',
  text2: 'hsl(220,10%,55%)', text3: 'hsl(220,10%,35%)', mono: "'DM Mono', monospace",
}
const panel = { background: c.surface, border: `1px solid ${c.border}`, borderRadius: '10px', overflow: 'hidden' }

const EMOTIONS = [
  { id: 'calm', label: 'Calm', color: c.green },
  { id: 'focused', label: 'Focused', color: c.green },
  { id: 'neutral', label: 'Neutral', color: c.text2 },
  { id: 'hesitant', label: 'Hesitant', color: c.text2 },
  { id: 'overconfident', label: 'Overconfident', color: c.amber },
  { id: 'fomo', label: 'FOMO', color: c.amber },
  { id: 'stressed', label: 'Stressed', color: c.red },
  { id: 'fearful', label: 'Fearful', color: c.red },
  { id: 'revenge_trading', label: 'Revenge', color: c.red },
]

const RECENT_ENTRIES = [
  {
    id: 1, date: 'May 26 · 08:28', type: 'pre_trade', emotion: 'focused', trade: 'EURUSD Long',
    confidence: 8, stress: 2, notes: 'Clean breakout setup on H1. ATR conditions met. Waiting for London open momentum.',
    screenshot: true,
  },
  {
    id: 2, date: 'May 26 · 09:10', type: 'post_trade', emotion: 'revenge_trading', trade: 'GBPJPY Short',
    confidence: 4, stress: 8, notes: 'Entered immediately after EURUSD stop out. Should not have traded. Violated 30-minute rule.',
    lesson: 'Implementing mandatory 30-min break after any stopped trade.',
    screenshot: false,
  },
  {
    id: 3, date: 'May 25 · 12:40', type: 'pre_trade', emotion: 'calm', trade: 'XAUUSD Long',
    confidence: 9, stress: 1, notes: 'Gold showing strong momentum. ATR expanding. London-NY overlap — historically my best period for gold.',
    screenshot: true,
  },
]

function SliderInput({ label, value, onChange, color }: { label: string; value: number; onChange: (v: number) => void; color: string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '11px', color: c.text3, fontFamily: c.mono }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color, fontFamily: c.mono }}>{value}/10</span>
      </div>
      <input type="range" min={1} max={10} value={value} onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: color, cursor: 'pointer' }} />
    </div>
  )
}

export default function JournalPage() {
  const [showForm, setShowForm] = useState(false)
  const [emotion, setEmotion] = useState('')
  const [confidence, setConfidence] = useState(7)
  const [stress, setStress] = useState(3)
  const [fear, setFear] = useState(2)
  const [focus, setFocus] = useState(8)
  const [notes, setNotes] = useState('')
  const [logType, setLogType] = useState<'pre_trade' | 'post_trade' | 'daily'>('pre_trade')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.6px' }}>Behavioral Journal</h1>
          <p style={{ fontSize: '12px', color: c.text3, marginTop: '3px', fontFamily: c.mono }}>
            Track emotions, psychology, and trade context
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
          borderRadius: '8px', background: c.accent, border: 'none',
          color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
        }}>
          <Plus size={14} /> New Entry
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: showForm ? '1fr 380px' : '1fr', gap: '16px' }}>
        {/* Journal Entries */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {RECENT_ENTRIES.map(entry => {
            const emotionData = EMOTIONS.find(e => e.id === entry.emotion)
            return (
              <div key={entry.id} style={{ ...panel, cursor: 'pointer' }}>
                <div style={{ padding: '14px 16px', borderBottom: `1px solid ${c.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600,
                      fontFamily: c.mono, textTransform: 'uppercase',
                      background: entry.type === 'pre_trade' ? 'rgba(108,142,255,0.1)' : 'rgba(180,142,255,0.1)',
                      color: entry.type === 'pre_trade' ? c.accent : c.purple,
                    }}>
                      {entry.type === 'pre_trade' ? 'Pre-Trade' : 'Post-Trade'}
                    </div>
                    <span style={{ fontSize: '11px', color: c.text3, fontFamily: c.mono }}>{entry.date}</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: c.text, marginLeft: 'auto' }}>{entry.trade}</span>
                    {entry.screenshot && <Camera size={12} color={c.text3} />}
                  </div>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                    {/* Emotion */}
                    <div style={{ padding: '8px 12px', background: c.surface2, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: emotionData?.color }} />
                      <span style={{ fontSize: '12px', fontWeight: 600, color: emotionData?.color }}>{emotionData?.label}</span>
                    </div>
                    {/* Levels */}
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {[
                        { label: 'Conf', value: entry.confidence, color: c.green },
                        { label: 'Stress', value: entry.stress, color: entry.stress > 6 ? c.red : c.amber },
                      ].map(m => (
                        <div key={m.label} style={{ padding: '8px 12px', background: c.surface2, borderRadius: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '10px', color: c.text3, fontFamily: c.mono }}>{m.label}</div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: m.color, fontFamily: c.mono }}>{m.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p style={{ fontSize: '13px', lineHeight: 1.7, color: c.text2, marginBottom: entry.lesson ? '10px' : 0 }}>
                    {entry.notes}
                  </p>

                  {entry.lesson && (
                    <div style={{
                      marginTop: '10px', padding: '10px 12px', borderRadius: '7px',
                      background: 'rgba(62,207,142,0.06)', border: `1px solid rgba(62,207,142,0.15)`,
                      fontSize: '12px', color: c.text2,
                    }}>
                      <span style={{ color: c.green, fontWeight: 600 }}>Lesson: </span>{entry.lesson}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Log Form */}
        {showForm && (
          <div style={{ ...panel, position: 'sticky', top: '20px', height: 'fit-content' }}>
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={14} color={c.accent} />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>New Journal Entry</span>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Log Type */}
              <div>
                <div style={{ fontSize: '10px', color: c.text3, fontFamily: c.mono, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Entry Type</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['pre_trade', 'post_trade', 'daily'] as const).map(type => (
                    <button key={type} onClick={() => setLogType(type)} style={{
                      padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontFamily: c.mono,
                      border: `1px solid ${logType === type ? 'rgba(108,142,255,0.3)' : c.border}`,
                      background: logType === type ? 'rgba(108,142,255,0.1)' : 'transparent',
                      color: logType === type ? c.accent : c.text3, cursor: 'pointer',
                    }}>{type.replace(/_/g, ' ')}</button>
                  ))}
                </div>
              </div>

              {/* Emotion */}
              <div>
                <div style={{ fontSize: '10px', color: c.text3, fontFamily: c.mono, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Emotional State</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {EMOTIONS.map(e => (
                    <button key={e.id} onClick={() => setEmotion(e.id)} style={{
                      padding: '5px 10px', borderRadius: '20px', fontSize: '11px', fontFamily: c.mono,
                      border: `1px solid ${emotion === e.id ? e.color : c.border}`,
                      background: emotion === e.id ? `${e.color}18` : 'transparent',
                      color: emotion === e.id ? e.color : c.text3, cursor: 'pointer',
                    }}>{e.label}</button>
                  ))}
                </div>
              </div>

              {/* Sliders */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <SliderInput label="Confidence" value={confidence} onChange={setConfidence} color={c.green} />
                <SliderInput label="Stress Level" value={stress} onChange={setStress} color={stress > 6 ? c.red : c.amber} />
                <SliderInput label="Fear Level" value={fear} onChange={setFear} color={fear > 6 ? c.red : c.text2} />
                <SliderInput label="Focus" value={focus} onChange={setFocus} color={c.accent} />
              </div>

              {/* Notes */}
              <div>
                <div style={{ fontSize: '10px', color: c.text3, fontFamily: c.mono, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Notes</div>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Trade setup, reasoning, emotional context..."
                  rows={4}
                  style={{
                    width: '100%', background: c.surface2, border: `1px solid ${c.border}`,
                    borderRadius: '7px', padding: '10px', fontSize: '12px', color: c.text,
                    fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: 1.6,
                  }}
                />
              </div>

              <button style={{
                width: '100%', padding: '10px', borderRadius: '8px', background: c.accent,
                border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}>
                Save Entry
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
