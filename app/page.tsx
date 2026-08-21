import Link from 'next/link'
import { ArrowRight, Check, Brain, Zap, Shield, BarChart3, Target, TrendingUp } from 'lucide-react'

const c = {
  green: '#3ecf8e', accent: 'hsl(226,100%,71%)', purple: '#b48eff', amber: '#f5a623', teal: '#1de9c2',
  surface: 'hsl(224,18%,8%)', surface2: 'hsl(224,16%,11%)',
  border: 'hsl(220,12%,14%)', text: 'hsl(220,15%,92%)', text2: 'hsl(220,10%,60%)', text3: 'hsl(220,10%,35%)',
  mono: "'DM Mono', monospace",
}

const FEATURES = [
  { icon: Brain, color: 'hsl(226,100%,71%)', title: 'AI Behavioral Coaching', desc: 'Weekly AI analysis of your psychology, emotional patterns, and decision quality — insights no market tool can deliver.' },
  { icon: Zap, color: '#3ecf8e', title: 'Real-Time Trade Evaluation', desc: 'Get an alignment score, risk quality rating, and behavioral check based on your own historical data — before you enter.' },
  { icon: Shield, color: '#f5a623', title: 'Behavioral Intelligence Engine', desc: 'Automatically detects revenge trading, FOMO entries, post-win risk creep, overtrading, and 8 other damaging patterns.' },
  { icon: BarChart3, color: '#b48eff', title: 'Performance Analytics', desc: 'Session-by-session, instrument-by-instrument, strategy-by-strategy — know exactly when, where, and how you perform best.' },
  { icon: Target, color: '#1de9c2', title: 'Goals & Rule Enforcement', desc: 'Define your trading rules. The platform monitors compliance and flags every violation, keeping you accountable.' },
  { icon: TrendingUp, color: '#3ecf8e', title: 'Broker Sync', desc: 'MT4, MT5, Binance, Bybit, cTrader, TradingView — trades sync automatically with zero manual logging friction.' },
]

export default function LandingPage() {
  return (
    <div style={{ background: 'hsl(222,20%,5%)', color: c.text, minHeight: '100vh' }}>
      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(10,11,14,0.9)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${c.border}` }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: c.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: '#fff' }}>TM</div>
            <span style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.3px' }}>TraderMind</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link href="/auth/login" style={{ padding: '8px 16px', borderRadius: '7px', fontSize: '13px', fontWeight: 600, color: c.text2, textDecoration: 'none', border: `1px solid ${c.border}` }}>Log in</Link>
            <Link href="/dashboard" style={{ padding: '8px 16px', borderRadius: '7px', fontSize: '13px', fontWeight: 600, background: c.accent, color: '#fff', textDecoration: 'none' }}>Start Free</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: '1120px', margin: '0 auto', padding: '100px 24px 80px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 14px', borderRadius: '20px', marginBottom: '28px', background: 'rgba(108,142,255,0.1)', border: `1px solid rgba(108,142,255,0.25)`, fontSize: '12px', fontWeight: 600, color: c.accent, fontFamily: c.mono }}>
          ⚡ AI-Powered Trading Performance Coach
        </div>
        <h1 style={{ fontSize: 'clamp(36px, 5vw, 68px)', fontWeight: 800, letterSpacing: '-2px', lineHeight: 1.05, marginBottom: '24px' }}>
          Most trading tools analyze the market.<br />
          <span style={{ background: `linear-gradient(135deg, ${c.accent}, ${c.purple})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>We analyze the trader.</span>
        </h1>
        <p style={{ fontSize: '18px', color: c.text2, maxWidth: '560px', margin: '0 auto 40px', lineHeight: 1.7 }}>
          TraderMind is a behavioral intelligence platform that identifies psychological patterns, scores your discipline, and coaches you to trade your best — consistently.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', borderRadius: '10px', background: c.accent, color: '#fff', fontSize: '15px', fontWeight: 700, textDecoration: 'none', boxShadow: '0 0 30px rgba(108,142,255,0.3)' }}>
            View Demo Dashboard <ArrowRight size={16} />
          </Link>
          <Link href="/auth/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 24px', borderRadius: '10px', border: `1px solid ${c.border}`, color: c.text2, fontSize: '15px', fontWeight: 600, textDecoration: 'none' }}>
            Start Free Trial
          </Link>
        </div>

        {/* Brokers */}
        <div style={{ marginTop: '56px' }}>
          <p style={{ fontSize: '11px', color: c.text3, fontFamily: c.mono, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>Connects with</p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {['MT4', 'MT5', 'Binance', 'Bybit', 'cTrader', 'TradingView', 'DXTrade'].map(b => (
              <span key={b} style={{ padding: '5px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, fontFamily: c.mono, background: c.surface, border: `1px solid ${c.border}`, color: c.text3 }}>{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ maxWidth: '1120px', margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <p style={{ fontSize: '11px', fontFamily: c.mono, color: c.accent, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '12px' }}>Platform Features</p>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, letterSpacing: '-1px' }}>Built for serious traders.</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ padding: '24px', borderRadius: '12px', background: c.surface, border: `1px solid ${c.border}` }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${f.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <f.icon size={20} color={f.color} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>{f.title}</h3>
              <p style={{ fontSize: '14px', color: c.text2, lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background: c.surface, borderTop: `1px solid ${c.border}`, borderBottom: `1px solid ${c.border}`, padding: '80px 24px' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-1px', marginBottom: '40px' }}>Two layers. One system.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', textAlign: 'left' }}>
            {[
              { label: 'Layer 01', color: c.accent, title: 'Deterministic Engine', items: ['Win rate, RR, streaks — pure math', 'Behavioral flag detection', 'Discipline & consistency scoring', 'Trade alignment scoring', 'Risk exposure tracking'] },
              { label: 'Layer 02', color: c.green, title: 'AI Interpretation', items: ['Explains patterns in plain English', 'Weekly & monthly coach reports', 'Real-time chat coaching', 'Specific improvement suggestions', 'Personalized trade narratives'] },
            ].map(layer => (
              <div key={layer.label} style={{ padding: '24px', borderRadius: '12px', background: 'hsl(224,14%,14%)', border: `1px solid ${c.border}` }}>
                <div style={{ fontSize: '11px', fontFamily: c.mono, fontWeight: 700, color: layer.color, background: `${layer.color}18`, padding: '4px 10px', borderRadius: '6px', display: 'inline-block', marginBottom: '12px' }}>{layer.label}</div>
                <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>{layer.title}</div>
                {layer.items.map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Check size={12} color={layer.color} />
                    <span style={{ fontSize: '13px', color: c.text2 }}>{item}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ marginTop: '20px', padding: '14px 20px', borderRadius: '8px', background: 'rgba(245,166,35,0.08)', border: `1px solid rgba(245,166,35,0.2)` }}>
            <p style={{ fontSize: '13px', color: c.text2, fontFamily: c.mono }}>⚠ The AI never generates buy/sell signals. It only interprets your behavior.</p>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-1px' }}>Simple pricing.</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {[
            { name: 'Free', price: '$0', period: 'forever', highlight: false, cta: 'Get Started Free', features: ['Manual trade logging', 'Basic performance stats', 'Behavioral journal', 'Session breakdown', '1 broker connection'] },
            { name: 'Pro', price: '$29', period: 'per month', highlight: true, cta: 'Start 14-Day Free Trial', features: ['Everything in Free', 'AI weekly & monthly reports', 'Real-time trade evaluation', 'Behavioral intelligence engine', 'All broker integrations', 'Goals & rule enforcement', 'Priority support'] },
          ].map(plan => (
            <div key={plan.name} style={{ padding: '28px', borderRadius: '14px', background: plan.highlight ? 'linear-gradient(135deg,rgba(108,142,255,0.1),rgba(180,142,255,0.06))' : c.surface, border: `1px solid ${plan.highlight ? 'rgba(108,142,255,0.35)' : c.border}`, position: 'relative' }}>
              {plan.highlight && <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', padding: '4px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: c.accent, color: '#fff', fontFamily: c.mono, whiteSpace: 'nowrap' }}>Most Popular</div>}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: c.text2 }}>{plan.name}</div>
                <div style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-1.5px' }}>{plan.price}</div>
                <div style={{ fontSize: '12px', color: c.text3, fontFamily: c.mono }}>{plan.period}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Check size={13} color={plan.highlight ? c.accent : c.green} />
                    <span style={{ fontSize: '13px', color: c.text2 }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/dashboard" style={{ display: 'block', textAlign: 'center', padding: '11px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, textDecoration: 'none', background: plan.highlight ? c.accent : 'transparent', border: `1px solid ${plan.highlight ? c.accent : c.border}`, color: plan.highlight ? '#fff' : c.text2 }}>{plan.cta}</Link>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${c.border}`, padding: '28px 24px' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '5px', background: c.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: '#fff' }}>TM</div>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>TraderMind</span>
          </div>
          <p style={{ fontSize: '12px', color: c.text3, fontFamily: c.mono }}>© 2026 TraderMind · We analyze the trader, not the market</p>
        </div>
      </footer>
    </div>
  )
}
