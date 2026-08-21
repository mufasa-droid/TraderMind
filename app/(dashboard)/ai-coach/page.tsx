'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, RefreshCw, ChevronRight, Brain, TrendingUp, AlertCircle, Lightbulb } from 'lucide-react'

const c = {
  green: '#3ecf8e', red: '#ff5f5f', amber: '#f5a623',
  accent: 'hsl(226,100%,71%)', purple: '#b48eff',
  surface: 'hsl(224,18%,8%)', surface2: 'hsl(224,16%,11%)', surface3: 'hsl(224,14%,14%)',
  border: 'hsl(220,12%,14%)', text: 'hsl(220,15%,92%)',
  text2: 'hsl(220,10%,55%)', text3: 'hsl(220,10%,35%)', mono: "'DM Mono', monospace",
}
const panel = { background: c.surface, border: `1px solid ${c.border}`, borderRadius: '10px', overflow: 'hidden' }

const SAMPLE_REPORT = {
  behavioral_analysis: `Your trading behavior this month shows a clear bifurcation between disciplined and reactive sessions. During London hours, you demonstrate strong pre-trade discipline — risk sizing is consistent, entries are methodical, and emotional state logs indicate high focus levels. However, your New York session behavior degrades significantly, particularly following any loss in the preceding London session.\n\nThe post-loss behavioral pattern is your most critical issue: you are entering positions within 3–5 minutes of a loss in 6 of your 9 NY-session losses this month. This is a textbook revenge trading pattern. Across these 6 trades, your average risk was 2.4% — double your stated maximum of 1.2%.`,
  psychological_patterns: `Your confidence calibration is off in one specific scenario: the post-win streak. After 3+ consecutive wins, your position sizing increases by an average of 0.8% and your pre-trade reflection notes become shorter and less detailed. This suggests overconfidence is silently degrading your process quality before losses occur — not after. The losses feel "random" to you, but the data shows they are predictable.`,
  discipline_feedback: `Rule compliance is 87% this month — strong, but not elite. Your most violated rule is max risk per trade (4 violations). Three of those violations occurred on NY session trades after London losses. One additional improvement area: you skipped your post-trade journal on 11 occasions. Every un-journaled trade was a loser. This is likely survivorship bias in your reflection habits — you journal wins more consistently than losses.`,
  key_insights: [
    'London session win rate (67%) is 19 points above your NY session (48%) — consider restricting NY trading to 2 trades max.',
    'Your 3 revenge trades cost $485 combined — more than your average monthly profit.',
    'Breakout strategy performs at 71% WR when ATR > 14-period average, but only 38% when ATR is below it.',
    'Your average holding time on losing trades (4h 12m) is 2× your winning trades (2h 3m) — you are letting losses run.',
    'Discipline score improved 3 points MoM — the consistency in London session is a genuine behavior change.',
  ],
  improvement_suggestions: [
    'Implement a 30-minute "cooling period" rule: no new trade within 30 minutes of a loss exit.',
    'Set a hard cap of 2 trades per NY session until your NY win rate exceeds 55%.',
    'Add ATR condition check to your pre-trade checklist for all breakout setups.',
    'Journal every trade, not just winners. Set a calendar reminder 5 minutes after each trade close.',
    'Review your exit strategy — consider a trailing stop or partial exit rule to reduce average loss hold time.',
  ]
}

const INITIAL_MESSAGES = [
  {
    role: 'assistant',
    content: "I've analyzed your trading data for May 2026. Your discipline score is 78/100 — improving, but there are 3 behavioral patterns holding back your performance. Where would you like to start: your session-specific performance, emotional trading patterns, or risk management consistency?"
  }
]

const QUICK_PROMPTS = [
  "Why do I perform worse in NY sessions?",
  "Analyze my revenge trading pattern",
  "What's my best trading setup?",
  "How can I improve my discipline score?",
]

export default function AICoachPage() {
  const [activeTab, setActiveTab] = useState<'chat' | 'report'>('report')
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text?: string) => {
    const msg = text ?? input.trim()
    if (!msg) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setIsLoading(true)

    // Simulate AI response (in production: POST /api/ai/chat)
    await new Promise(r => setTimeout(r, 1400))
    const replies: Record<string, string> = {
      "Why do I perform worse in NY sessions?": "Your NY session underperformance (48% WR vs 67% London) is driven by two factors. First, you're often already emotionally fatigued by the London session — stress levels in your logs average 6.2/10 entering NY, vs 3.8/10 at London open. Second, NY session volatility increases stop-hunting risk, and your stop placement is based on London market structure. Consider wider stops or smaller size in NY until your ATR-adjusted entry framework improves.",
      "Analyze my revenge trading pattern": "Your revenge trading follows a predictable 3-step trigger: (1) a London loss of >$150, (2) a gap in journaling that loss, (3) entry within 5 minutes of the loss close. All 3 revenge trades this month matched this pattern exactly. The solution isn't willpower — it's friction. I'd suggest a mandatory 30-minute delay rule encoded into your broker's pending order workflow. Make impulsive entries structurally harder.",
      "What's my best trading setup?": "Your highest-performing setup is London breakout with ATR confirmation: 71% WR across 14 trades, avg 2.8R. The critical filter is ATR > 14-period average at entry — when you skip this filter, WR drops to 38%. Your second-best is Asian range breakout at London open (65% WR, but only 5 trades — sample size is too small to conclude). Focus on mastering the breakout + ATR setup before adding complexity.",
    }
    const reply = replies[msg] ?? "Based on your trading data, this is a strong behavioral question. Your current discipline score of 78/100 and behavioral consistency of 84/100 suggest you have a solid foundation. The key area to focus on is the specific pattern you're asking about — would you like me to pull the specific trades that illustrate this?"

    setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    setIsLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.6px' }}>AI Coach</h1>
          <p style={{ fontSize: '12px', color: c.text3, marginTop: '3px', fontFamily: c.mono }}>
            Behavioral coaching powered by your trading data
          </p>
        </div>
        <div style={{ display: 'flex', gap: '4px', background: c.surface2, padding: '3px', borderRadius: '8px' }}>
          {(['report', 'chat'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '6px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
              border: 'none', cursor: 'pointer', textTransform: 'capitalize',
              background: activeTab === tab ? c.surface3 : 'transparent',
              color: activeTab === tab ? c.text : c.text3,
            }}>{tab === 'report' ? 'Monthly Report' : 'Chat'}</button>
          ))}
        </div>
      </div>

      {activeTab === 'report' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px' }}>
          {/* Report Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Score Banner */}
            <div style={{
              ...panel,
              background: 'linear-gradient(135deg, rgba(108,142,255,0.08), rgba(180,142,255,0.04))',
              border: `1px solid rgba(108,142,255,0.2)`,
            }}>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: 'rgba(108,142,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}><Sparkles size={16} color={c.accent} /></div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>May 2026 Monthly Report</div>
                    <div style={{ fontSize: '11px', color: c.text3, fontFamily: c.mono }}>Generated today · 47 trades analyzed</div>
                  </div>
                  <button style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '7px', background: 'rgba(108,142,255,0.15)', border: `1px solid rgba(108,142,255,0.3)`, color: c.accent, fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: c.mono }}
                    onClick={() => setGenerating(true)}>
                    <RefreshCw size={11} /> Regenerate
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {[
                    { label: 'Discipline', value: 78, color: c.accent },
                    { label: 'Consistency', value: 84, color: c.green },
                    { label: 'Risk Quality', value: 61, color: c.amber },
                    { label: 'Emotional', value: 72, color: c.purple },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: 'center', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '28px', fontWeight: 800, color: s.color, letterSpacing: '-1px' }}>{s.value}</div>
                      <div style={{ fontSize: '10px', color: c.text3, fontFamily: c.mono, marginTop: '2px' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Behavioral Analysis */}
            {[
              { title: 'Behavioral Analysis', icon: Brain, content: SAMPLE_REPORT.behavioral_analysis },
              { title: 'Psychological Patterns', icon: TrendingUp, content: SAMPLE_REPORT.psychological_patterns },
              { title: 'Discipline Feedback', icon: AlertCircle, content: SAMPLE_REPORT.discipline_feedback },
            ].map(section => (
              <div key={section.title} style={panel}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderBottom: `1px solid ${c.border}` }}>
                  <section.icon size={14} color={c.accent} />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{section.title}</span>
                </div>
                <div style={{ padding: '16px', fontSize: '13px', lineHeight: 1.8, color: c.text2 }}>
                  {section.content.split('\n\n').map((para, i) => (
                    <p key={i} style={{ marginBottom: i < section.content.split('\n\n').length - 1 ? '12px' : 0 }}>{para}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Right Column - Insights & Suggestions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Key Insights */}
            <div style={panel}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderBottom: `1px solid ${c.border}` }}>
                <Lightbulb size={14} color={c.amber} />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Key Insights</span>
              </div>
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {SAMPLE_REPORT.key_insights.map((insight, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', padding: '10px 12px', background: c.surface2, borderRadius: '8px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(108,142,255,0.15)', color: c.accent, fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: c.mono }}>{i + 1}</div>
                    <p style={{ fontSize: '12px', lineHeight: 1.6, color: c.text2 }}>{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Items */}
            <div style={panel}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderBottom: `1px solid ${c.border}` }}>
                <ChevronRight size={14} color={c.green} />
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Action Items</span>
              </div>
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {SAMPLE_REPORT.improvement_suggestions.map((sug, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '8px 10px', borderRadius: '7px' }}>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: c.green, marginTop: '6px', flexShrink: 0 }} />
                    <p style={{ fontSize: '12px', lineHeight: 1.6, color: c.text2 }}>{sug}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Ask About This Report */}
            <button onClick={() => setActiveTab('chat')} style={{
              width: '100%', padding: '12px', borderRadius: '8px',
              background: 'rgba(108,142,255,0.1)', border: `1px solid rgba(108,142,255,0.25)`,
              color: c.accent, fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}>
              <Sparkles size={13} /> Ask the AI coach about this report
            </button>
          </div>
        </div>
      ) : (
        /* Chat Interface */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '16px', height: 'calc(100vh - 180px)' }}>
          <div style={{ ...panel, display: 'flex', flexDirection: 'column' }}>
            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                  {msg.role === 'assistant' && (
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(108,142,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Sparkles size={13} color={c.accent} />
                    </div>
                  )}
                  <div style={{
                    maxWidth: '75%', padding: '12px 14px', borderRadius: '10px', fontSize: '13px', lineHeight: 1.7,
                    background: msg.role === 'user' ? 'rgba(108,142,255,0.15)' : c.surface2,
                    color: c.text,
                    border: `1px solid ${msg.role === 'user' ? 'rgba(108,142,255,0.25)' : c.border}`,
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(108,142,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={13} color={c.accent} />
                  </div>
                  <div style={{ padding: '12px 16px', background: c.surface2, borderRadius: '10px', border: `1px solid ${c.border}` }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.accent, opacity: 0.7, animation: `bounce 1s infinite ${i * 0.2}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '16px', borderTop: `1px solid ${c.border}` }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask about your trading behavior..."
                  style={{
                    flex: 1, background: c.surface2, border: `1px solid ${c.border}`,
                    borderRadius: '8px', padding: '10px 14px', fontSize: '13px',
                    color: c.text, fontFamily: 'inherit', outline: 'none',
                  }}
                />
                <button onClick={() => sendMessage()} style={{
                  width: '40px', height: '40px', borderRadius: '8px', background: c.accent,
                  border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Send size={15} color="#fff" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Prompts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: c.text3, fontFamily: c.mono, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Quick Questions</div>
            {QUICK_PROMPTS.map(prompt => (
              <button key={prompt} onClick={() => sendMessage(prompt)} style={{
                padding: '12px', borderRadius: '8px', background: c.surface,
                border: `1px solid ${c.border}`, color: c.text2, fontSize: '12px',
                textAlign: 'left', cursor: 'pointer', lineHeight: 1.5,
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `rgba(108,142,255,0.3)`; e.currentTarget.style.color = c.text }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.color = c.text2 }}
              >{prompt}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
