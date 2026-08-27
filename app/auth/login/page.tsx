'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'


const c = {
  accent: 'hsl(226,100%,71%)', surface: 'hsl(224,18%,8%)', surface2: 'hsl(224,16%,11%)',
  border: 'hsl(220,12%,14%)', text: 'hsl(220,15%,92%)', text2: 'hsl(220,10%,60%)', text3: 'hsl(220,10%,35%)',
  mono: "'DM Mono', monospace",
}

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState(
  process.env.NEXT_PUBLIC_DEMO_USER_EMAIL ?? ''
  )
  const [password, setPassword] = useState(
    process.env.NEXT_PUBLIC_DEMO_USER_PASSWORD ?? ''
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
          console.warn('Demo mode: Supabase sign-in failed, navigating to dashboard anyway:', signInError.message)
          router.push('/dashboard')
          router.refresh()
          return
        }
        setError(signInError.message)
        return
      }
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('Sign-in exception:', msg)
      if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        console.warn('Demo mode: exception bypass → /dashboard')
        router.push('/dashboard')
        router.refresh()
        return
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: 'hsl(222,20%,5%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', justifyContent: 'center' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: c.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: '#fff' }}>TM</div>
          <span style={{ fontSize: '18px', fontWeight: 700, color: c.text }}>TraderMind</span>
        </div>

        {/* Demo Banner — now correctly inside return */}
        {process.env.NEXT_PUBLIC_DEMO_MODE === "true" && (
          <div style={{
            padding: "10px 14px", borderRadius: "8px", marginBottom: "16px",
            background: "rgba(79,110,247,0.1)", border: "1px solid rgba(79,110,247,0.3)",
            fontSize: "12px", color: "hsl(226,100%,71%)", textAlign: "center",
          }}>
            ✦ Portfolio Demo — credentials pre-filled. Click Sign In.
          </div>
        )}

        {/* Card */}
        <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: '14px', padding: '32px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '6px' }}>Welcome back</h1>
          <p style={{ fontSize: '13px', color: c.text2, marginBottom: '28px' }}>Sign in to your TraderMind account</p>

          {error && (
            <div style={{
              padding: '10px 12px', borderRadius: '8px', marginBottom: '16px',
              background: 'rgba(255,95,95,0.08)', border: '1px solid rgba(255,95,95,0.25)',
              fontSize: '12px', color: '#ff5f5f', lineHeight: 1.5,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: c.text2, marginBottom: '6px', fontFamily: c.mono }}>Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@example.com"
                style={{ width: '100%', background: c.surface2, border: `1px solid ${c.border}`, borderRadius: '8px', padding: '10px 12px', fontSize: '14px', color: c.text, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: c.text2, marginBottom: '6px', fontFamily: c.mono }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  style={{ width: '100%', background: c.surface2, border: `1px solid ${c.border}`, borderRadius: '8px', padding: '10px 40px 10px 12px', fontSize: '14px', color: c.text, outline: 'none', boxSizing: 'border-box' }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: c.text3 }}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '11px', borderRadius: '8px', background: c.accent, border: 'none',
              color: '#fff', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px',
            }}>
              {loading ? 'Signing in...' : <><span>Sign In</span><ArrowRight size={15} /></>}
            </button>
          </form>

          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: `1px solid ${c.border}`, textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: c.text2 }}>
              Don't have an account?{' '}
              <Link href="/auth/register" style={{ color: c.accent, textDecoration: 'none', fontWeight: 600 }}>Create one free</Link>
            </p>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: c.text3, fontFamily: c.mono }}>
          <Link href="/dashboard" style={{ color: c.text3, textDecoration: 'none' }}>→ Skip to demo dashboard</Link>
        </p>
      </div>
    </div>
  )
}
