'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  X, User, Shield, AlertTriangle, Check,
  Trash2, Globe, Clock, Sparkles
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface ProfileSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  userName: string
  userEmail: string | null
  initials: string
  onProfileUpdated: (newName: string) => void
}

const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
  { value: 'America/Chicago', label: 'America/Chicago (CST/CDT)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
  { value: 'Europe/Frankfurt', label: 'Europe/Frankfurt (CET/CEST)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST/AEDT)' },
]

export default function ProfileSettingsModal({
  isOpen,
  onClose,
  userName,
  userEmail,
  initials,
  onProfileUpdated,
}: ProfileSettingsModalProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'profile' | 'danger'>('profile')

  // Form states
  const [name, setName] = useState(userName)
  const [timezone, setTimezone] = useState('UTC')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Account deletion states
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  // Sync state when opened
  useEffect(() => {
    if (isOpen) {
      setName(userName)
      setSaveSuccess(false)
      setErrorMessage(null)
      setShowConfirmDelete(false)
      setConfirmText('')
    }
  }, [isOpen, userName])

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    if (isOpen) document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrorMessage(null)
    setSaveSuccess(false)

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: name, timezone }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to update profile')

      onProfileUpdated(name)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2500)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setErrorMessage(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (confirmText.trim().toUpperCase() !== 'DELETE') return

    setDeleting(true)
    setErrorMessage(null)

    try {
      const res = await fetch('/api/user/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Failed to delete account')
      }

      // Sign out from browser Supabase client
      try {
        const supabase = createClient()
        await supabase.auth.signOut()
      } catch {}

      onClose()
      router.push('/auth/login?deleted=true')
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setErrorMessage(msg)
      setDeleting(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 6, 8, 0.78)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      animation: 'modalFadeIn 0.2s ease-out',
    }}>
      {/* Click outside backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0 }}
      />

      {/* Modal Dialog Card */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '520px',
        background: 'rgba(17, 19, 24, 0.94)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        boxShadow: '0 30px 80px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
        zIndex: 1001,
        overflow: 'hidden',
        fontFamily: 'var(--font-sans)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.02)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'var(--surface-3)',
              border: '1px solid var(--border-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text)',
              fontSize: '13px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
            }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
                Account & Preferences
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                {userEmail || 'demo@tradermind.io'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-3)',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
          padding: '0 24px',
          gap: '20px',
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            style={{
              padding: '12px 4px',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${activeTab === 'profile' ? 'var(--accent)' : 'transparent'}`,
              color: activeTab === 'profile' ? '#fff' : 'var(--text-3)',
              fontSize: '13px',
              fontWeight: activeTab === 'profile' ? 700 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <User size={14} />
            <span>Profile & Sessions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('danger')}
            style={{
              padding: '12px 4px',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${activeTab === 'danger' ? 'var(--red)' : 'transparent'}`,
              color: activeTab === 'danger' ? 'var(--red)' : 'var(--text-3)',
              fontSize: '13px',
              fontWeight: activeTab === 'danger' ? 700 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <AlertTriangle size={14} />
            <span>Danger Zone</span>
          </button>
        </div>

        {/* Error notification banner */}
        {errorMessage && (
          <div style={{
            margin: '16px 24px 0',
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(255,95,95,0.1)',
            border: '1px solid rgba(255,95,95,0.25)',
            fontSize: '12px',
            color: 'var(--red)',
          }}>
            {errorMessage}
          </div>
        )}

        {/* Tab 1: Profile & Timezone */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} style={{ padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
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
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Alex Kim"
                  required
                  style={{
                    width: '100%',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
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
                  Email Address
                </label>
                <input
                  type="email"
                  value={userEmail || 'demo@tradermind.io'}
                  disabled
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '13px',
                    color: 'var(--text-3)',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'var(--font-mono)',
                  }}
                />
                <span style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '4px', display: 'block' }}>
                  Managed by Supabase Auth
                </span>
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
                  Preferred Timezone (Session Calculations)
                </label>
                <select
                  value={timezone}
                  onChange={e => setTimezone(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    fontSize: '13px',
                    color: 'var(--text)',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                  }}
                >
                  {TIMEZONES.map(t => (
                    <option key={t.value} value={t.value} style={{ background: '#111318', color: '#fff' }}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Row */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border)',
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Current Plan</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                    PRO TRADER
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>Broker Connection</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>
                    ● MT5 CONNECTED
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'var(--text-2)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '8px',
                    background: saveSuccess ? 'var(--green)' : 'var(--accent)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                  }}
                >
                  {saving ? (
                    'Saving…'
                  ) : saveSuccess ? (
                    <>
                      <Check size={14} />
                      <span>Saved!</span>
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Danger Zone / Delete Account */}
        {activeTab === 'danger' && (
          <div style={{ padding: '24px' }}>
            <div style={{
              background: 'rgba(255, 95, 95, 0.05)',
              border: '1px solid rgba(255, 95, 95, 0.25)',
              borderRadius: '12px',
              padding: '18px 20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <AlertTriangle size={17} style={{ color: 'var(--red)' }} />
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--red)' }}>
                  Delete Account
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.55, margin: '0 0 16px' }}>
                Permanently delete your user profile, linked broker accounts, trading rules, journal reflections, screenshots, and AI behavioral history. This action cannot be reversed.
              </p>

              {!showConfirmDelete ? (
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    background: 'rgba(255, 95, 95, 0.12)',
                    border: '1px solid rgba(255, 95, 95, 0.35)',
                    color: 'var(--red)',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Trash2 size={14} />
                  <span>Delete Account…</span>
                </button>
              ) : (
                <div style={{
                  marginTop: '12px',
                  paddingTop: '16px',
                  borderTop: '1px solid rgba(255, 95, 95, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-2)' }}>
                    To confirm deletion, type <strong style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>DELETE</strong> below:
                  </p>

                  <input
                    type="text"
                    value={confirmText}
                    onChange={e => setConfirmText(e.target.value)}
                    placeholder="Type DELETE"
                    style={{
                      width: '100%',
                      background: 'var(--surface-2)',
                      border: '1px solid rgba(255, 95, 95, 0.35)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      fontSize: '13px',
                      color: 'var(--text)',
                      outline: 'none',
                      fontFamily: 'var(--font-mono)',
                      boxSizing: 'border-box',
                    }}
                  />

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowConfirmDelete(false)
                        setConfirmText('')
                      }}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        background: 'transparent',
                        border: '1px solid var(--border)',
                        color: 'var(--text-2)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={confirmText.trim().toUpperCase() !== 'DELETE' || deleting}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        background: confirmText.trim().toUpperCase() === 'DELETE' ? 'var(--red)' : 'rgba(255,95,95,0.2)',
                        border: 'none',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: confirmText.trim().toUpperCase() === 'DELETE' && !deleting ? 'pointer' : 'not-allowed',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {deleting ? 'Deleting…' : 'Yes, Delete My Account'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
