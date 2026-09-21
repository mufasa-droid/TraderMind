'use client'

import { useState, useEffect } from 'react'
import { Image as ImageIcon, Upload, Trash2, Eye, X, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Shot = {
  id: string
  user_id?: string
  url: string
  thumbnail_url?: string
  label?: string
  symbol?: string
  notes?: string
  timeframe?: string
  trade_type?: string
  created_at: string
}

const DEMO_SHOTS: Shot[] = [
  {
    id: '1',
    url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1400&q=80',
    thumbnail_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80',
    label: 'EURUSD Breakout Setup',
    symbol: 'EURUSD',
    notes: 'Clean break and retest of H1 consolidation high with ATR expansion.',
    timeframe: 'H1',
    trade_type: 'setup',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: '2',
    url: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=1400&q=80',
    thumbnail_url: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=600&q=80',
    label: 'GBPJPY Loss Post-Mortem',
    symbol: 'GBPJPY',
    notes: 'Revenge entry after initial London stopout. Rule violation: risk creep + FOMO.',
    timeframe: 'M15',
    trade_type: 'review',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
]

export default function ScreenshotsPage() {
  const [shots, setShots] = useState<Shot[]>(DEMO_SHOTS)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedShot, setSelectedShot] = useState<Shot | null>(null)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    async function loadScreenshots() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (cancelled) return

        if (user) {
          const { data, error } = await supabase
            .from('trade_screenshots')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(30)

          if (!cancelled && !error && data && data.length > 0) {
            setShots(data as Shot[])
          }
        }
      } catch (err) {
        console.warn('Screenshots fetch error:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadScreenshots()
    return () => {
      cancelled = true
    }
  }, [])

  // Close modal on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedShot(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Demo local placeholder for offline/demo mode
        const previewUrl = URL.createObjectURL(file)
        const demo: Shot = {
          id: `demo-${Date.now()}`,
          url: previewUrl,
          thumbnail_url: previewUrl,
          label: file.name.replace(/\.[^/.]+$/, '').slice(0, 28),
          symbol: 'MANUAL',
          notes: 'Uploaded in demo mode session',
          timeframe: 'M15',
          trade_type: 'setup',
          created_at: new Date().toISOString(),
        }
        setShots(prev => [demo, ...prev].slice(0, 30))
        return
      }

      // Rule 3.4 & Section 2.12: Scoped to user id in trade-screenshots bucket
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const storagePath = `${user.id}/${Date.now()}-${sanitizedName}`

      const { error: upErr } = await supabase.storage
        .from('trade-screenshots')
        .upload(storagePath, file)

      if (upErr) throw upErr

      const { data: { publicUrl } } = supabase.storage
        .from('trade-screenshots')
        .getPublicUrl(storagePath)

      const { data, error } = await supabase
        .from('trade_screenshots')
        .insert({
          user_id: user.id,
          url: publicUrl,
          thumbnail_url: publicUrl,
          label: file.name.replace(/\.[^/.]+$/, ''),
          trade_type: 'setup',
        })
        .select()
        .single()

      if (error) throw error
      if (data) setShots(prev => [data as Shot, ...prev])
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err))
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (shot: Shot) => {
    const confirmed = window.confirm(`Delete screenshot "${shot.label || 'Untitled'}"?`)
    if (!confirmed) return

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user && !shot.id.startsWith('demo-') && shot.id !== '1' && shot.id !== '2') {
        await supabase
          .from('trade_screenshots')
          .delete()
          .eq('id', shot.id)
          .eq('user_id', user.id)
      }

      setShots(prev => prev.filter(s => s.id !== shot.id))
      if (selectedShot?.id === shot.id) setSelectedShot(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1100px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.6px', color: 'var(--text)' }}>
            Screenshots
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '3px', fontFamily: 'var(--font-mono)' }}>
            {loading ? 'Loading…' : `${shots.length} chart screenshots · Scoped to trade history`}
          </p>
        </div>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            background: 'var(--accent)',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 600,
            cursor: uploading ? 'not-allowed' : 'pointer',
            opacity: uploading ? 0.6 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload Chart'}
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            style={{ display: 'none' }}
            disabled={uploading}
          />
        </label>
      </div>

      {/* Grid of Screenshots */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {shots.map(s => (
          <div
            key={s.id}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              transition: 'border-color 0.2s, transform 0.2s',
            }}
          >
            {/* Image Thumbnail */}
            <div
              onClick={() => setSelectedShot(s)}
              style={{
                height: '170px',
                background: 'var(--surface-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {s.url ? (
                <img
                  src={s.thumbnail_url || s.url}
                  alt={s.label || 'Chart Screenshot'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <ImageIcon size={28} color="var(--text-3)" />
              )}
              {s.symbol && (
                <span
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: 'rgba(10, 11, 14, 0.8)',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid var(--border)',
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: 'var(--text)',
                  }}
                >
                  {s.symbol}
                </span>
              )}
              {s.trade_type && (
                <span
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: s.trade_type === 'setup' ? 'rgba(62, 207, 142, 0.2)' : 'rgba(108, 142, 255, 0.2)',
                    border: `1px solid ${s.trade_type === 'setup' ? 'rgba(62, 207, 142, 0.4)' : 'rgba(108, 142, 255, 0.4)'}`,
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color: s.trade_type === 'setup' ? 'var(--green)' : 'var(--accent)',
                    textTransform: 'uppercase',
                  }}
                >
                  {s.trade_type}
                </span>
              )}
            </div>

            {/* Info Card Body */}
            <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                {s.label || 'Untitled Screenshot'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
                {new Date(s.created_at).toLocaleDateString()} · {s.timeframe ?? 'H1'} · {s.symbol ?? 'N/A'}
              </div>
              {s.notes && (
                <p style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5, flex: 1, margin: 0 }}>
                  {s.notes}
                </p>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedShot(s)}
                  style={{
                    flex: 1,
                    padding: '7px 10px',
                    borderRadius: '6px',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                  }}
                >
                  <Eye size={12} /> View Full Size
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(s)}
                  title="Delete screenshot"
                  style={{
                    padding: '7px 10px',
                    borderRadius: '6px',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'var(--red)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State per Rule 3.10 */}
      {!loading && shots.length === 0 && (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '50px 20px',
            textAlign: 'center',
            color: 'var(--text-3)',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
          }}
        >
          No screenshots yet. Upload your first chart.
        </div>
      )}

      {/* Full Size Modal View */}
      {selectedShot && (
        <div
          onClick={() => setSelectedShot(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '24px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-2)',
              borderRadius: '12px',
              maxWidth: '960px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
                  {selectedShot.label || 'Chart View'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  {selectedShot.symbol ? `${selectedShot.symbol} · ` : ''}{selectedShot.timeframe ?? 'H1'} · {new Date(selectedShot.created_at).toLocaleString()}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {selectedShot.url && (
                  <a
                    href={selectedShot.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-2)',
                      fontSize: '11px',
                      textDecoration: 'none',
                    }}
                  >
                    <ExternalLink size={12} /> Open Raw
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedShot(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-2)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Image Display */}
            <div
              style={{
                flex: 1,
                background: '#07080a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'auto',
                padding: '12px',
                maxHeight: '65vh',
              }}
            >
              {selectedShot.url ? (
                <img
                  src={selectedShot.url}
                  alt={selectedShot.label}
                  style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: '4px' }}
                />
              ) : (
                <div style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                  No image available
                </div>
              )}
            </div>

            {/* Modal Footer Notes */}
            {selectedShot.notes && (
              <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                  Behavioral Notes
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.5 }}>
                  {selectedShot.notes}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
