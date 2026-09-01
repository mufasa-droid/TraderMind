'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const c = {
  accent: 'hsl(226,100%,71%)',
  surface: 'hsl(224,18%,8%)',
  surface2: 'hsl(224,16%,11%)',
  border: 'hsl(220,12%,14%)',
  text: 'hsl(220,15%,92%)',
  text2: 'hsl(220,10%,60%)',
  text3: 'hsl(220,10%,35%)',
  green: '#3ecf8e',
  mono: "'JetBrains Mono', monospace",
}

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    // Demo/portfolio bypass if demo mode
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      router.push('/dashboard')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || 'Trader',
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      if (data?.session) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setSuccess(true)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: 'hsl(222,20%,5%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px', justifyContent: 'center' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: c.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 800,
            color: '#fff',
          }}>
            TM
          </div>
          <span style={{ fontSize: '18px', fontWeight: 700, color: c.text }}>TraderMind</span>
        </div>

        {/* Card */}
        <div style={{
          background: c.surface,
          border: `1px solid ${c.border}`,
          borderRadius: '14px',
          padding: '32px',
        }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(62,207,142,0.12)',
                color: c.green,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <CheckCircle2 size={24} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: c.text, marginBottom: '8px' }}>
                Account Created!
              </h2>
              <p style={{ fontSize: '13px', color: c.text2, lineHeight: 1.6, marginBottom: '24px' }}>
                Check your email confirmation link, or jump straight into the demo experience.
              </p>
              <Link
                href="/dashboard"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: c.accent,
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Go to Dashboard <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <>
              <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '6px' }}>
                Create Account
              </h1>
              <p style={{ fontSize: '13px', color: c.text2, marginBottom: '24px' }}>
                Start tracking and improving your trading psychology
              </p>

              {error && (
                <div style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  background: 'rgba(255,95,95,0.08)',
                  border: '1px solid rgba(255,95,95,0.25)',
                  fontSize: '12px',
                  color: '#ff5f5f',
                  lineHeight: 1.5,
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: c.text2, marginBottom: '6px', fontFamily: c.mono, textTransform: 'uppercase' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Alex Kim"
                    style={{
                      width: '100%',
                      background: c.surface2,
                      border: `1px solid ${c.border}`,
                      borderRadius: '8px',
                      padding: '10px 12px',
                      fontSize: '14px',
                      color: c.text,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: c.text2, marginBottom: '6px', fontFamily: c.mono, textTransform: 'uppercase' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="alex@example.com"
                    style={{
                      width: '100%',
                      background: c.surface2,
                      border: `1px solid ${c.border}`,
                      borderRadius: '8px',
                      padding: '10px 12px',
                      fontSize: '14px',
                      color: c.text,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: c.text2, marginBottom: '6px', fontFamily: c.mono, textTransform: 'uppercase' }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="Minimum 6 characters"
                      style={{
                        width: '100%',
                        background: c.surface2,
                        border: `1px solid ${c.border}`,
                        borderRadius: '8px',
                        padding: '10px 40px 10px 12px',
                        fontSize: '14px',
                        color: c.text,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: c.text3,
                      }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '11px',
                    borderRadius: '8px',
                    background: c.accent,
                    border: 'none',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '6px',
                  }}
                >
                  {loading ? 'Creating account...' : <><span>Create Free Account</span><ArrowRight size={15} /></>}
                </button>
              </form>

              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: `1px solid ${c.border}`, textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: c.text2 }}>
                  Already have an account?{' '}
                  <Link href="/auth/login" style={{ color: c.accent, textDecoration: 'none', fontWeight: 600 }}>
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: c.text3, fontFamily: c.mono }}>
          <Link href="/dashboard" style={{ color: c.text3, textDecoration: 'none' }}>
            → Skip to demo dashboard
          </Link>
        </p>
      </div>
    </div>
  )
}
