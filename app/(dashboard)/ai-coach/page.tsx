'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, RefreshCw, ChevronRight, Brain, TrendingUp, AlertCircle, Lightbulb, User, ShieldAlert, ArrowRight } from 'lucide-react'

const DEMO_REPORT = {
  behavioral_analysis: `Your trading behavior this month shows a clear bifurcation between disciplined and reactive sessions. During London hours, you demonstrate strong pre-trade discipline — risk sizing is consistent at 1.2%, entries are methodical with ATR confirmation, and emotional state logs indicate high focus levels. However, your New York session behavior degrades significantly, particularly following any loss in the preceding London session.\n\nThe post-loss behavioral pattern is your most critical leak: you entered positions within 3–5 minutes of a loss in 6 of your 9 NY-session losses this month. This is a textbook revenge trading pattern. Across these trades, your average risk escalated to 2.4% — double your stated maximum of 1.2%. Combined, these impulse trades cost $485, eroding over 38% of your monthly gains.`,
  psychological_patterns: `Your confidence calibration is off in one specific scenario: the post-win streak. After 3+ consecutive winning trades, your position sizing silently creeps upward by an average of +0.8%, and your pre-trade reflection notes become noticeably shorter and less detailed. This indicates that overconfidence is subtly degrading your analytical rigor before losses occur — not after. The ensuing drawdown feels "random", but the data confirms it is a predictable byproduct of discipline decay.`,
  discipline_feedback: `Overall rule compliance is at 87% this month — solid, but not yet elite. Your most frequent infraction is exceeding max risk per trade (4 violations), all occurring during NY sessions after London drawdowns. Additionally, you skipped your post-trade journal on 11 occasions, and every single un-journaled trade resulted in a loss. This survivorship bias in your logging habits prevents objective post-mortem reviews on your worst decision cycles.`,
  key_insights: [
    'London session win rate (67%) is 19 percentage points above New York (48%) — consider a strict 2-trade cap in NY.',
    'Your 3 revenge trades cost $485 combined — completely offsetting your best two winning streaks.',
    'Breakout strategy performs at 71% WR when ATR > 14-period average, but drops to 38% when ATR filter is ignored.',
    'Average holding time on losing trades (4h 12m) is double winning trades (2h 03m) — you are reluctant to cut losses at planned stops.',
    'Discipline score improved +3 points MoM to 78/100, reflecting genuine process improvements in London sessions.',
  ],
  improvement_suggestions: [
    'Implement a mandatory 30-minute cooling period: zero new trade execution within 30 minutes of a closed loss.',
    'Cap New York sessions to a maximum of 2 trades per day until your NY win rate consistently exceeds 55%.',
    'Add an explicit ATR condition check to your pre-trade checklist for all breakout setups.',
    'Journal every trade unconditionally, especially losses. Set an automated timer 5 minutes post-exit.',
    'Establish a structured trailing stop or partial profit-taking rule to reduce loss duration.',
  ],
  overall_discipline_score: 78,
  behavioral_consistency_score: 84,
  risk_quality_score: 61,
  emotional_stability_score: 72,
}

const INITIAL_MESSAGES = [
  {
    role: 'assistant' as const,
    content: "I've analyzed your May 2026 trading data. Your discipline score is 78/100 — improving, but 3 behavioral patterns are holding back your performance. Where would you like to start: session performance, emotional patterns, or risk consistency?"
  }
]

const QUICK_PROMPTS = [
  "Why do I perform worse in NY sessions?",
  "Analyze my revenge trading pattern",
  "What's my best trading setup?",
  "How can I improve my discipline score?",
]

export default function AICoachPage() {
  const [activeTab, setActiveTab] = useState<'report' | 'chat'>('report')
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([...INITIAL_MESSAGES])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [report, setReport] = useState<any>(DEMO_REPORT)
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    let cancelled = false
    async function loadReport() {
      setReportLoading(true)
      try {
        const r = await fetch('/api/ai/report?period=monthly', { cache: 'no-store' })
        if (r.ok) {
          const j = await r.json()
          if (!cancelled && j.data) setReport(j.data)
        }
      } catch {
        // graceful demo fallback
      } finally {
        if (!cancelled) setReportLoading(false)
      }
    }
    loadReport()
    return () => { cancelled = true }
  }, [])

  const handleGenerate = async () => {
    setGenerating(true)
    setReportError(null)
    try {
      const r = await fetch('/api/ai/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: 'monthly' })
      })
      const j = await r.json()
      if (r.ok && j.data) {
        setReport(j.data)
      } else {
        setReportError(j.error || 'Using calibrated demo coaching report')
      }
    } catch {
      setReportError('Using calibrated demo coaching report')
    } finally {
      setGenerating(false)
    }
  }

  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || isLoading) return
    setInput('')
    const newHistory = [...messages, { role: 'user' as const, content: msg }]
    setMessages(newHistory)
    setIsLoading(true)

    try {
      const r = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history: messages })
      })
      const j = await r.json()
      if (r.ok && j.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: j.reply }])
      } else {
        // Calibrated contextual demo replies for portfolio demonstration
        const demoReplies: Record<string, string> = {
          "Why do I perform worse in NY sessions?": "Your NY session underperformance (48% win rate vs 67% in London) stems from two quantifiable behavioral factors:\n\n1. **Emotional Carryover:** Stress logs show you enter NY at an average psychological fatigue score of 6.2/10 following London sessions, compared to 3.8/10 at market open.\n2. **Strategy Misalignment:** NY volatility spikes trigger premature stop-outs on breakout setups that were calibrated for London liquidity structure.\n\n**Recommendation:** Cap NY trading at 2 setups max and enforce a mandatory 30-minute break between sessions.",
          "Analyze my revenge trading pattern": "Your revenge trading follows an exact 3-step sequence in your logs:\n\n1. **Trigger:** A London session loss exceeding -$150.\n2. **Omission:** Skipping the post-trade journal entry.\n3. **Impulse Action:** Executing a new position within 3–5 minutes at 2.4% risk (double your 1.2% limit).\n\nAll 3 revenge trades this month occurred on GBPJPY and EURUSD following this exact cycle, totaling -$485 in unnecessary losses.",
          "What's my best trading setup?": "Your highest-edge setup is the **London Session Breakout with ATR Confirmation**:\n\n• **Win Rate:** 71% (14 trades)\n• **Average R:R:** 2.8R\n• **Profit Contribution:** +$984\n\nWhen ATR is above its 14-period moving average at entry, your alignment score reaches 91/100. When you take breakouts without this filter, your win rate collapses to 38%.",
          "How can I improve my discipline score?": "To push your discipline score from 78 to 85+:\n\n1. **Eliminate post-loss re-entries:** A mandatory 30-minute delay after any stop-out will instantly remove all revenge trade penalties.\n2. **Lock risk sizing:** Keep every position at strictly 1.0%–1.2% regardless of recent winning streaks.\n3. **100% Journaling:** Log all 47 trades, specifically the losing trades where key psychological insights reside.",
        }

        const fallback = demoReplies[msg] ?? (j.reply || `Based on your May trading analytics (59.6% win rate, 78 discipline score, 47 trades), your primary behavioral edge lies in London session discipline, while your primary risk leak is post-loss impatience in NY. Would you like me to break down your risk sizing consistency or session timing rules?`)
        setMessages(prev => [...prev, { role: 'assistant', content: fallback }])
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Based on your trading metrics, your highest conviction setups occur during the London session (67% win rate, 2.4R average). To maintain peak decision quality, focus on eliminating post-loss entries in New York."
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const discipline = report?.overall_discipline_score ?? DEMO_REPORT.overall_discipline_score
  const consistency = report?.behavioral_consistency_score ?? DEMO_REPORT.behavioral_consistency_score
  const riskQuality = report?.risk_quality_score ?? DEMO_REPORT.risk_quality_score
  const emotional = report?.emotional_stability_score ?? DEMO_REPORT.emotional_stability_score

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Top Header & Tab Controls */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '6px',
              background: 'rgba(108,142,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Brain size={16} color="var(--accent)" />
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text)' }}>AI Coach</h1>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            Behavioral intelligence & decision quality coaching
          </p>
        </div>

        {/* Tab Toggle */}
        <div style={{
          display: 'flex', gap: '4px', background: 'var(--surface-2)',
          padding: '4px', borderRadius: '8px', border: '1px solid var(--border)'
        }}>
          <button
            onClick={() => setActiveTab('report')}
            style={{
              padding: '6px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
              border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              background: activeTab === 'report' ? 'var(--surface-3)' : 'transparent',
              color: activeTab === 'report' ? 'var(--text)' : 'var(--text-2)',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <Lightbulb size={13} color={activeTab === 'report' ? 'var(--accent)' : 'currentColor'} />
            Monthly Report
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            style={{
              padding: '6px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
              border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              background: activeTab === 'chat' ? 'var(--surface-3)' : 'transparent',
              color: activeTab === 'chat' ? 'var(--text)' : 'var(--text-2)',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <Sparkles size={13} color={activeTab === 'chat' ? 'var(--accent)' : 'currentColor'} />
            Coach Chat
          </button>
        </div>
      </div>

      {activeTab === 'report' ? (
        /* Report View */
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(300px, 1fr)', gap: '16px', alignItems: 'start' }}>
          
          {/* Left Column — Score Banner + Narrative Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Score Banner */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(108,142,255,0.08) 0%, rgba(62,207,142,0.04) 100%)',
              border: '1px solid rgba(108,142,255,0.2)',
              borderRadius: '12px',
              padding: '20px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '8px',
                    background: 'rgba(108,142,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Sparkles size={18} color="var(--accent)" />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
                      Monthly Behavioral Analysis · May 2026
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                      47 closed trades · 59.6% win rate · GPT-4o Behavioral Assessment
                    </div>
                  </div>
                </div>

                <button
                  disabled={generating}
                  onClick={handleGenerate}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '7px 14px', borderRadius: '7px',
                    background: 'rgba(108,142,255,0.15)',
                    border: '1px solid rgba(108,142,255,0.3)',
                    color: 'var(--accent)', fontSize: '11px', fontWeight: 600,
                    cursor: generating ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-mono)',
                    opacity: generating ? 0.7 : 1,
                    transition: 'all 0.15s'
                  }}
                >
                  <RefreshCw size={12} style={{ animation: generating ? 'spin 1s linear infinite' : undefined }} />
                  {generating ? 'Analyzing...' : 'Regenerate'}
                </button>
              </div>

              {/* 4 Score Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {[
                  { label: 'Discipline', score: discipline, delta: '+3', color: 'var(--accent)' },
                  { label: 'Consistency', score: consistency, delta: '+7', color: 'var(--green)' },
                  { label: 'Risk Quality', score: riskQuality, delta: '-4', color: 'var(--amber)' },
                  { label: 'Emotional Stability', score: emotional, delta: '+11', color: 'var(--purple)' },
                ].map(s => (
                  <div key={s.label} style={{
                    background: 'rgba(10, 11, 14, 0.6)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '12px 10px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '26px',
                      fontWeight: 800,
                      color: s.color,
                      fontFamily: 'var(--font-mono)',
                      fontFeatureSettings: '"tnum" 1, "zero" 1',
                      letterSpacing: '-0.5px'
                    }}>
                      {s.score}
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text)', marginTop: '2px' }}>
                      {s.label}
                    </div>
                    <div style={{
                      fontSize: '9px',
                      color: s.delta.startsWith('+') ? 'var(--green)' : 'var(--red)',
                      fontFamily: 'var(--font-mono)',
                      marginTop: '2px'
                    }}>
                      {s.delta} MoM
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Narrative Section 1: Behavioral Analysis */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              overflow: 'hidden'
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 16px', borderBottom: '1px solid var(--border)',
                background: 'var(--surface-2)'
              }}>
                <Brain size={15} color="var(--accent)" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                  Behavioral Analysis
                </span>
              </div>
              <div style={{ padding: '16px', fontSize: '13px', lineHeight: 1.75, color: 'var(--text-2)' }}>
                {String(report?.behavioral_analysis ?? DEMO_REPORT.behavioral_analysis).split('\n\n').map((para, i, arr) => (
                  <p key={i} style={{ marginBottom: i < arr.length - 1 ? '12px' : 0 }}>{para}</p>
                ))}
              </div>
            </div>

            {/* Narrative Section 2: Psychological Patterns */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              overflow: 'hidden'
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 16px', borderBottom: '1px solid var(--border)',
                background: 'var(--surface-2)'
              }}>
                <TrendingUp size={15} color="var(--purple)" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                  Psychological Patterns
                </span>
              </div>
              <div style={{ padding: '16px', fontSize: '13px', lineHeight: 1.75, color: 'var(--text-2)' }}>
                {String(report?.psychological_patterns ?? DEMO_REPORT.psychological_patterns).split('\n\n').map((para, i, arr) => (
                  <p key={i} style={{ marginBottom: i < arr.length - 1 ? '12px' : 0 }}>{para}</p>
                ))}
              </div>
            </div>

            {/* Narrative Section 3: Discipline Feedback */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              overflow: 'hidden'
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 16px', borderBottom: '1px solid var(--border)',
                background: 'var(--surface-2)'
              }}>
                <AlertCircle size={15} color="var(--amber)" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                  Discipline Feedback & Rule Adherence
                </span>
              </div>
              <div style={{ padding: '16px', fontSize: '13px', lineHeight: 1.75, color: 'var(--text-2)' }}>
                {String(report?.discipline_feedback ?? DEMO_REPORT.discipline_feedback).split('\n\n').map((para, i, arr) => (
                  <p key={i} style={{ marginBottom: i < arr.length - 1 ? '12px' : 0 }}>{para}</p>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column — Key Insights & Action Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Key Insights Panel */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              overflow: 'hidden'
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 16px', borderBottom: '1px solid var(--border)',
                background: 'var(--surface-2)'
              }}>
                <Lightbulb size={15} color="var(--amber)" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                  Key Data Insights
                </span>
              </div>
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {((report?.key_insights ?? DEMO_REPORT.key_insights) as string[]).map((insight: string, i: number) => (
                  <div key={i} style={{
                    display: 'flex', gap: '10px', padding: '10px 12px',
                    background: 'var(--surface-2)', borderRadius: '8px',
                    border: '1px solid var(--border)'
                  }}>
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '50%',
                      background: 'rgba(108,142,255,0.15)', color: 'var(--accent)',
                      fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', flexShrink: 0,
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {i + 1}
                    </div>
                    <p style={{ fontSize: '12px', lineHeight: 1.55, color: 'var(--text-2)' }}>
                      {insight}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Items Panel */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              overflow: 'hidden'
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 16px', borderBottom: '1px solid var(--border)',
                background: 'var(--surface-2)'
              }}>
                <ChevronRight size={15} color="var(--green)" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                  Action Items for Next Month
                </span>
              </div>
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {((report?.improvement_suggestions ?? DEMO_REPORT.improvement_suggestions) as string[]).map((sug: string, i: number) => (
                  <div key={i} style={{
                    display: 'flex', gap: '10px', alignItems: 'flex-start',
                    padding: '8px 10px', borderRadius: '7px',
                    background: 'rgba(255,255,255,0.02)'
                  }}>
                    <div style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: 'var(--green)', marginTop: '6px', flexShrink: 0
                    }} />
                    <p style={{ fontSize: '12px', lineHeight: 1.55, color: 'var(--text-2)' }}>
                      {sug}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Ask AI Coach Button */}
            <button
              onClick={() => setActiveTab('chat')}
              style={{
                width: '100%', padding: '14px 16px', borderRadius: '10px',
                background: 'rgba(108,142,255,0.12)',
                border: '1px solid rgba(108,142,255,0.3)',
                color: 'var(--accent)', fontSize: '13px', fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.15s'
              }}
            >
              <Sparkles size={15} />
              Discuss Report with AI Coach
              <ArrowRight size={14} />
            </button>

          </div>

        </div>
      ) : (
        /* Chat View */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 260px',
          gap: '16px',
          height: 'calc(100vh - 200px)',
          minHeight: '520px'
        }}>
          {/* Main Chat Box */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Message Feed */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: '10px',
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    alignItems: 'flex-start'
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '50%',
                    background: msg.role === 'user' ? 'rgba(108,142,255,0.25)' : 'rgba(62,207,142,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    {msg.role === 'user' ? <User size={14} color="var(--accent)" /> : <Sparkles size={14} color="var(--green)" />}
                  </div>

                  {/* Bubble */}
                  <div style={{
                    maxWidth: '75%',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    lineHeight: 1.7,
                    background: msg.role === 'user' ? 'rgba(108,142,255,0.15)' : 'var(--surface-2)',
                    color: 'var(--text)',
                    border: `1px solid ${msg.role === 'user' ? 'rgba(108,142,255,0.3)' : 'var(--border)'}`,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isLoading && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '50%',
                    background: 'rgba(62,207,142,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Sparkles size={14} color="var(--green)" />
                  </div>
                  <div style={{
                    padding: '12px 18px',
                    background: 'var(--surface-2)',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    gap: '5px',
                    alignItems: 'center'
                  }}>
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        style={{
                          width: '6px', height: '6px', borderRadius: '50%',
                          background: 'var(--accent)',
                          opacity: 0.8,
                          animation: `bounce 1s infinite ${i * 0.18}s`
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div style={{ padding: '16px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  value={input}
                  disabled={isLoading}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder="Ask the coach about session performance, revenge trades, or risk discipline..."
                  style={{
                    flex: 1,
                    background: 'var(--surface-3)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '13px',
                    color: 'var(--text)',
                    fontFamily: 'var(--font-sans)',
                    outline: 'none',
                  }}
                />
                <button
                  disabled={isLoading || !input.trim()}
                  onClick={() => sendMessage()}
                  style={{
                    width: '42px', height: '42px', borderRadius: '8px',
                    background: input.trim() && !isLoading ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                    border: 'none',
                    cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s'
                  }}
                >
                  <Send size={15} color={input.trim() && !isLoading ? '#fff' : 'var(--text-3)'} />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Questions Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{
              fontSize: '11px', fontWeight: 700, color: 'var(--text-3)',
              fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.8px',
              padding: '0 4px'
            }}>
              Suggested Questions
            </div>
            {QUICK_PROMPTS.map(prompt => (
              <button
                key={prompt}
                disabled={isLoading}
                onClick={() => sendMessage(prompt)}
                style={{
                  padding: '12px 14px', borderRadius: '8px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-2)', fontSize: '12px',
                  textAlign: 'left', cursor: isLoading ? 'not-allowed' : 'pointer',
                  lineHeight: 1.5, fontFamily: 'var(--font-sans)',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => {
                  if (!isLoading) {
                    e.currentTarget.style.borderColor = 'rgba(108,142,255,0.35)'
                    e.currentTarget.style.color = 'var(--text)'
                    e.currentTarget.style.background = 'var(--surface-2)'
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.color = 'var(--text-2)'
                  e.currentTarget.style.background = 'var(--surface)'
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

        </div>
      )}
    </div>
  )
}
