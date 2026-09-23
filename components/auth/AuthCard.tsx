'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export type AuthMode = 'signin' | 'signup'

interface AuthCardProps {
  initialMode?: AuthMode
}

export default function AuthCard({ initialMode = 'signin' }: AuthCardProps) {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>(initialMode)

  // Sign In state
  const [signInEmail, setSignInEmail] = useState(
    process.env.NEXT_PUBLIC_DEMO_USER_EMAIL ?? ''
  )
  const [signInPassword, setSignInPassword] = useState(
    process.env.NEXT_PUBLIC_DEMO_USER_PASSWORD ?? ''
  )
  const [showSignInPassword, setShowSignInPassword] = useState(false)
  const [signInLoading, setSignInLoading] = useState(false)
  const [signInError, setSignInError] = useState<string | null>(null)

  // Sign Up state
  const [fullName, setFullName] = useState('')
  const [signUpEmail, setSignUpEmail] = useState('')
  const [signUpPassword, setSignUpPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showSignUpPassword, setShowSignUpPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [signUpLoading, setSignUpLoading] = useState(false)
  const [signUpError, setSignUpError] = useState<string | null>(null)
  const [signUpSuccess, setSignUpSuccess] = useState(false)

  // Check URL query parameters for errors or notices on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const err = params.get('error')
      if (err) {
        setSignInError(decodeURIComponent(err))
      }
      const deleted = params.get('deleted')
      if (deleted) {
        setSignInError('Your account has been deleted.')
      }
    }
  }, [])

  // Sync mode with URL if query param or path changes
  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    setSignInError(null)
    setSignUpError(null)
    if (typeof window !== 'undefined') {
      const targetUrl = newMode === 'signin' ? '/auth/login' : '/auth/register'
      window.history.replaceState(null, '', targetUrl)
    }
  }

  // Handle Sign In Submit
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignInLoading(true)
    setSignInError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password: signInPassword,
      })

      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          setSignInError('Your email address has not been confirmed yet. Please check your inbox (including spam) for the verification link, or disable "Confirm email" in your Supabase Auth settings.')
          return
        }
        // Demo mode bypass if demo mode active or unconfigured
        if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
          router.push('/dashboard')
          return
        }
        setSignInError(error.message)
        return
      }

      // Rule 3.20 — check if user has completed onboarding
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('onboarding_completed')
          .eq('id', user.id)
          .maybeSingle()

        if (profile && !profile.onboarding_completed) {
          router.push('/auth/onboarding')
          return
        }
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        router.push('/dashboard')
        return
      }
      const msg = err instanceof Error ? err.message : String(err)
      setSignInError(msg)
    } finally {
      setSignInLoading(false)
    }
  }

  // Handle Sign Up Submit
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signUpEmail || !signUpPassword) {
      setSignUpError('Please enter your email and password')
      return
    }

    if (signUpPassword !== confirmPassword) {
      setSignUpError('Passwords do not match')
      return
    }

    if (signUpPassword.length < 6) {
      setSignUpError('Password must be at least 6 characters')
      return
    }

    // Demo/portfolio bypass if demo mode without keys
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('YOUR_PROJECT'))) {
      router.push('/auth/onboarding')
      return
    }

    setSignUpLoading(true)
    setSignUpError(null)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email: signUpEmail,
        password: signUpPassword,
        options: {
          data: {
            full_name: fullName || 'Trader',
          },
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
        },
      })

      if (error) {
        setSignUpError(error.message)
        return
      }

      // Rule 3.21 — New User Initialization
      const userId = data.user?.id
      if (userId) {
        try {
          await supabase.from('users').upsert({
            id: userId,
            email: signUpEmail,
            full_name: fullName || 'Trader',
            timezone: 'UTC',
            plan: 'free',
            broker_connected: false,
            onboarding_completed: false,
          })

          await supabase.from('user_settings').upsert({
            user_id: userId,
            max_risk_per_trade_pct: 2.0,
            max_daily_loss_pct: 3.0,
            preferred_sessions: ['london', 'new_york'],
          }, { onConflict: 'user_id' })
        } catch {
          // Client upsert may be blocked by RLS if session is not yet active
        }

        // Ensure user row and settings exist via admin endpoint (bypasses RLS if session is not yet active)
        await fetch('/api/auth/init-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            email: signUpEmail,
            fullName: fullName || 'Trader',
          }),
        }).catch(() => {})
      }

      if (data?.session) {
        router.push('/auth/onboarding')
        router.refresh()
      } else {
        setSignUpSuccess(true)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setSignUpError(msg)
    } finally {
      setSignUpLoading(false)
    }
  }

  return (
    <div style={{
      background: 'var(--bg)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background ambient glowing orbs for glassmorphism refraction */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '540px',
        height: '360px',
        background: 'radial-gradient(ellipse at center, rgba(108,142,255,0.14) 0%, rgba(180,142,255,0.06) 45%, transparent 70%)',
        filter: 'blur(50px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <Link href="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '28px',
          justifyContent: 'center',
          textDecoration: 'none',
        }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '9px',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 800,
            color: '#fff',
            boxShadow: '0 4px 16px rgba(108,142,255,0.35)',
          }}>
            TM
          </div>
          <span style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            TraderMind
          </span>
        </Link>

        {/* Demo Mode Banner */}
        {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && mode === 'signin' && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '10px',
            marginBottom: '16px',
            background: 'rgba(108,142,255,0.1)',
            border: '1px solid rgba(108,142,255,0.28)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            fontSize: '12px',
            color: '#8ea6ff',
            textAlign: 'center',
            fontFamily: 'var(--font-mono)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          }}>
            ✦ Portfolio Demo — credentials pre-filled. Click Sign In.
          </div>
        )}

        {/* Glassmorphic Card Container */}
        <div style={{
          background: 'rgba(17, 19, 24, 0.72)',
          backdropFilter: 'blur(28px) saturate(190%)',
          WebkitBackdropFilter: 'blur(28px) saturate(190%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '18px',
          padding: '28px 30px 32px',
          boxShadow: '0 30px 70px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
        }}>

          {/* ── TOP SWITCHER TABS ── */}
          <div style={{
            display: 'flex',
            position: 'relative',
            background: 'rgba(10, 11, 14, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '26px',
          }}>
            {/* Sliding Pill Indicator */}
            <div style={{
              position: 'absolute',
              top: '4px',
              bottom: '4px',
              left: mode === 'signin' ? '4px' : 'calc(50% + 2px)',
              width: 'calc(50% - 6px)',
              background: 'linear-gradient(135deg, rgba(108, 142, 255, 0.32), rgba(74, 107, 255, 0.2))',
              border: '1px solid rgba(108, 142, 255, 0.45)',
              boxShadow: '0 2px 14px rgba(108, 142, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
              borderRadius: '7px',
              transition: 'all 0.26s cubic-bezier(0.16, 1, 0.3, 1)',
              pointerEvents: 'none',
            }} />

            {/* Sign In Tab */}
            <button
              type="button"
              onClick={() => switchMode('signin')}
              style={{
                flex: 1,
                padding: '8px 14px',
                borderRadius: '7px',
                background: 'transparent',
                border: 'none',
                color: mode === 'signin' ? '#FFFFFF' : 'var(--text-2)',
                fontSize: '13px',
                fontWeight: mode === 'signin' ? 700 : 500,
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
                position: 'relative',
                zIndex: 2,
                transition: 'color 0.2s ease',
              }}
            >
              Sign In
            </button>

            {/* Sign Up Tab */}
            <button
              type="button"
              onClick={() => switchMode('signup')}
              style={{
                flex: 1,
                padding: '8px 14px',
                borderRadius: '7px',
                background: 'transparent',
                border: 'none',
                color: mode === 'signup' ? '#FFFFFF' : 'var(--text-2)',
                fontSize: '13px',
                fontWeight: mode === 'signup' ? 700 : 500,
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
                position: 'relative',
                zIndex: 2,
                transition: 'color 0.2s ease',
              }}
            >
              Sign Up
            </button>
          </div>

          {/* ── SIGN IN VIEW ── */}
          {mode === 'signin' && (
            <div style={{ animation: 'authFade 0.25s ease-out' }}>
              <h1 style={{
                fontSize: '22px',
                fontWeight: 800,
                letterSpacing: '-0.5px',
                marginBottom: '6px',
                color: 'var(--text)',
              }}>
                Welcome back
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '24px' }}>
                Sign in to your TraderMind behavioral dashboard
              </p>

              {signInError && (
                <div style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  background: 'rgba(255,95,95,0.1)',
                  border: '1px solid rgba(255,95,95,0.28)',
                  fontSize: '12px',
                  color: 'var(--red)',
                  lineHeight: 1.5,
                }}>
                  {signInError}
                </div>
              )}

              <form onSubmit={handleSignInSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--text-2)',
                    marginBottom: '6px',
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                  }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={signInEmail}
                    onChange={e => setSignInEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    style={{
                      width: '100%',
                      background: 'rgba(22, 25, 32, 0.75)',
                      border: '1px solid rgba(255, 255, 255, 0.09)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      fontSize: '14px',
                      color: 'var(--text)',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.15s ease',
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--text-2)',
                    marginBottom: '6px',
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                  }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showSignInPassword ? 'text' : 'password'}
                      value={signInPassword}
                      onChange={e => setSignInPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        background: 'rgba(22, 25, 32, 0.75)',
                        border: '1px solid rgba(255, 255, 255, 0.09)',
                        borderRadius: '8px',
                        padding: '10px 40px 10px 12px',
                        fontSize: '14px',
                        color: 'var(--text)',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-3)',
                        display: 'flex',
                        padding: 0,
                      }}
                    >
                      {showSignInPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={signInLoading}
                  style={{
                    width: '100%',
                    padding: '11px',
                    borderRadius: '8px',
                    background: 'var(--accent)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: signInLoading ? 'not-allowed' : 'pointer',
                    opacity: signInLoading ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '6px',
                    boxShadow: '0 4px 18px rgba(108,142,255,0.3)',
                  }}
                >
                  {signInLoading ? 'Signing in...' : <><span>Sign In</span><ArrowRight size={15} /></>}
                </button>
              </form>

              <div style={{
                marginTop: '22px',
                paddingTop: '18px',
                borderTop: '1px solid rgba(255,255,255,0.07)',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: '13px', color: 'var(--text-2)' }}>
                  Need an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: '13px',
                    }}
                  >
                    Create one free →
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* ── SIGN UP VIEW ── */}
          {mode === 'signup' && (
            <div style={{ animation: 'authFade 0.25s ease-out' }}>
              {signUpSuccess ? (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'rgba(62,207,142,0.12)',
                    color: 'var(--green)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}>
                    <CheckCircle2 size={24} />
                  </div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
                    Account Created!
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '24px' }}>
                    We sent a verification link to <strong style={{ color: 'var(--text)' }}>{signUpEmail}</strong>. Please check your inbox (and spam) to confirm your email, then sign in.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSignUpSuccess(false)
                      switchMode('signin')
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      background: 'var(--accent)',
                      border: 'none',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Proceed to Sign In <ArrowRight size={15} />
                  </button>
                </div>
              ) : (
                <>
                  <h1 style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    letterSpacing: '-0.5px',
                    marginBottom: '6px',
                    color: 'var(--text)',
                  }}>
                    Create Account
                  </h1>
                  <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '22px' }}>
                    Start tracking your trading psychology and discipline
                  </p>

                  {signUpError && (
                    <div style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      marginBottom: '16px',
                      background: 'rgba(255,95,95,0.1)',
                      border: '1px solid rgba(255,95,95,0.28)',
                      fontSize: '12px',
                      color: 'var(--red)',
                      lineHeight: 1.5,
                    }}>
                      {signUpError}
                    </div>
                  )}

                  <form onSubmit={handleSignUpSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--text-2)',
                        marginBottom: '6px',
                        fontFamily: 'var(--font-mono)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                      }}>
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="Alex Kim"
                        style={{
                          width: '100%',
                          background: 'rgba(22, 25, 32, 0.75)',
                          border: '1px solid rgba(255, 255, 255, 0.09)',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          fontSize: '14px',
                          color: 'var(--text)',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--text-2)',
                        marginBottom: '6px',
                        fontFamily: 'var(--font-mono)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                      }}>
                        Email
                      </label>
                      <input
                        type="email"
                        value={signUpEmail}
                        onChange={e => setSignUpEmail(e.target.value)}
                        required
                        placeholder="alex@example.com"
                        style={{
                          width: '100%',
                          background: 'rgba(22, 25, 32, 0.75)',
                          border: '1px solid rgba(255, 255, 255, 0.09)',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          fontSize: '14px',
                          color: 'var(--text)',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--text-2)',
                        marginBottom: '6px',
                        fontFamily: 'var(--font-mono)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                      }}>
                        Password
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showSignUpPassword ? 'text' : 'password'}
                          value={signUpPassword}
                          onChange={e => setSignUpPassword(e.target.value)}
                          required
                          placeholder="Minimum 6 characters"
                          style={{
                            width: '100%',
                            background: 'rgba(22, 25, 32, 0.75)',
                            border: '1px solid rgba(255, 255, 255, 0.09)',
                            borderRadius: '8px',
                            padding: '10px 40px 10px 12px',
                            fontSize: '14px',
                            color: 'var(--text)',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-3)',
                            display: 'flex',
                            padding: 0,
                          }}
                        >
                          {showSignUpPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: 'var(--text-2)',
                        marginBottom: '6px',
                        fontFamily: 'var(--font-mono)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                      }}>
                        Confirm Password
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          required
                          placeholder="Re-enter password"
                          style={{
                            width: '100%',
                            background: 'rgba(22, 25, 32, 0.75)',
                            border: '1px solid rgba(255, 255, 255, 0.09)',
                            borderRadius: '8px',
                            padding: '10px 40px 10px 12px',
                            fontSize: '14px',
                            color: 'var(--text)',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-3)',
                            display: 'flex',
                            padding: 0,
                          }}
                        >
                          {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={signUpLoading}
                      style={{
                        width: '100%',
                        padding: '11px',
                        borderRadius: '8px',
                        background: 'var(--accent)',
                        border: 'none',
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: signUpLoading ? 'not-allowed' : 'pointer',
                        opacity: signUpLoading ? 0.7 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        marginTop: '6px',
                        boxShadow: '0 4px 18px rgba(108,142,255,0.3)',
                      }}
                    >
                      {signUpLoading ? 'Creating account...' : <><span>Create Free Account</span><ArrowRight size={15} /></>}
                    </button>
                  </form>

                  <div style={{
                    marginTop: '22px',
                    paddingTop: '18px',
                    borderTop: '1px solid rgba(255,255,255,0.07)',
                    textAlign: 'center',
                  }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-2)' }}>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => switchMode('signin')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent)',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: 0,
                          fontSize: '13px',
                        }}
                      >
                        Sign in →
                      </button>
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

        </div>

        {/* Muted skip to demo link below card */}
        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
          <Link href="/dashboard" style={{ color: 'var(--text-3)', textDecoration: 'none' }}>
            → Skip to demo dashboard
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes authFade {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
