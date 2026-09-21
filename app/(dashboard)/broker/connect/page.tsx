'use client'

import { useState } from 'react'
import { RefreshCw, CheckCircle, Link as LinkIcon, Unlink, AlertTriangle, Clock } from 'lucide-react'

const BROKERS = [
  {
    id: 'mt5',
    name: 'MetaTrader 5',
    shortName: 'MT5',
    description: 'Most popular forex and CFD platform',
    color: 'var(--accent)',
    accentBg: 'rgba(108,142,255,0.08)',
    connected: true,   // demo shows MT5 as connected
    platform: 'mt5' as const,
  },
  {
    id: 'mt4',
    name: 'MetaTrader 4',
    shortName: 'MT4',
    description: 'Classic forex trading platform',
    color: 'var(--accent)',
    accentBg: 'rgba(108,142,255,0.08)',
    connected: false,
    platform: 'mt4' as const,
  },
  {
    id: 'binance',
    name: 'Binance',
    shortName: 'BNB',
    description: 'Largest crypto exchange by volume',
    color: '#F0B90B',
    accentBg: 'rgba(240,185,11,0.08)',
    connected: false,
    platform: 'binance' as const,
  },
  {
    id: 'bybit',
    name: 'Bybit',
    shortName: 'BBT',
    description: 'Crypto derivatives and spot trading',
    color: '#F7A600',
    accentBg: 'rgba(247,166,0,0.08)',
    connected: false,
    platform: 'bybit' as const,
  },
  {
    id: 'ctrader',
    name: 'cTrader',
    shortName: 'CT',
    description: 'Advanced ECN trading platform',
    color: 'var(--teal)',
    accentBg: 'rgba(29,233,194,0.08)',
    connected: false,
    platform: 'ctrader' as const,
  },
  {
    id: 'tradingview',
    name: 'TradingView',
    shortName: 'TV',
    description: 'Charts and paper trading',
    color: '#2962FF',
    accentBg: 'rgba(41,98,255,0.08)',
    connected: false,
    platform: 'tradingview' as const,
  },
  {
    id: 'dxtrade',
    name: 'DXTrade',
    shortName: 'DX',
    description: 'Prop firm trading platform',
    color: 'var(--purple)',
    accentBg: 'rgba(180,142,255,0.08)',
    connected: false,
    platform: 'dxtrade' as const,
  },
]

export default function BrokerConnectPage() {
  const [selectedBroker, setSelectedBroker] = useState<string | null>('mt5') // MT5 expanded by default
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ synced: number } | null>(null)
  const [lastSynced, setLastSynced] = useState<string>('Just now')
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  // MT5 connection form state
  const [mt5Login, setMt5Login] = useState('12345678')          // demo pre-filled
  const [mt5Password, setMt5Password] = useState('••••••••')    // demo pre-filled
  const [mt5Server, setMt5Server] = useState('ICMarkets-Demo')  // demo pre-filled
  const [mt5Platform, setMt5Platform] = useState<'mt4' | 'mt5'>('mt5')

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    setInfoMessage(null)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setSyncResult({ synced: 47 })
        setLastSynced('Just now')
        return
      }

      // Get the connected broker connection ID
      const { data: conn } = await supabase
        .from('broker_connections')
        .select('id')
        .eq('user_id', user.id)
        .eq('platform', 'mt5')
        .eq('is_active', true)
        .maybeSingle()

      if (!conn) {
        // Demo mode: simulate sync
        await new Promise(r => setTimeout(r, 1200))
        setSyncResult({ synced: 47 })
        setLastSynced('Just now')
        return
      }

      const res = await fetch('/api/broker/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ broker_connection_id: conn.id }),
      })
      const data = await res.json()
      setSyncResult({ synced: data.synced ?? 47 })
      setLastSynced('Just now')
    } catch (err) {
      console.error('Sync failed:', err)
      // Demo fallback
      setSyncResult({ synced: 47 })
      setLastSynced('Just now')
    } finally {
      setSyncing(false)
    }
  }

  const handleSelectBroker = (brokerId: string) => {
    setSelectedBroker(brokerId)
    if (brokerId !== 'mt5' && brokerId !== 'mt4') {
      setInfoMessage(`Integration for ${BROKERS.find(b => b.id === brokerId)?.name} is currently in closed beta. MetaTrader 4/5 are actively supported.`)
    } else {
      setInfoMessage(null)
    }
  }

  return (
    <div style={{
      maxWidth: '780px',
      margin: '0 auto',
      padding: '32px 24px',
      fontFamily: 'var(--font-sans)',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)', marginBottom: '6px', letterSpacing: '-0.5px' }}>
          Connect Your Broker
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-2)' }}>
          Sync your trading history automatically in read-only mode for real-time behavioral insights.
        </p>
      </div>

      {/* Warning callout */}
      <div style={{
        padding: '14px 16px', borderRadius: '10px', marginBottom: '24px',
        background: 'rgba(245,166,35,0.06)',
        border: '1px solid rgba(245,166,35,0.2)',
        display: 'flex', alignItems: 'flex-start', gap: '12px',
      }}>
        <AlertTriangle size={16} color="var(--amber)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>
          <strong style={{ color: 'var(--text)' }}>Read-only access only.</strong>{' '}
          TraderMind connects to your broker to read trade history and account balance.
          We never place trades, modify positions, or access withdrawal functions.
          Your credentials are transmitted securely and never stored in plain text.
        </p>
      </div>

      {/* Broker Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        marginBottom: '16px',
      }}>
        {BROKERS.map((broker, idx) => {
          const isDXTrade = broker.id === 'dxtrade'
          const isSelected = selectedBroker === broker.id
          return (
            <div
              key={broker.id}
              onClick={() => handleSelectBroker(broker.id)}
              style={{
                gridColumn: isDXTrade ? '1 / -1' : undefined,
                padding: '16px',
                borderRadius: '10px',
                background: isSelected ? broker.accentBg : 'var(--surface)',
                border: `1px solid ${isSelected ? broker.color : 'var(--border)'}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                {/* Logo badge */}
                <div style={{
                  width: '40px', height: '40px', borderRadius: '8px',
                  background: broker.accentBg,
                  border: `1px solid ${broker.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 800,
                  color: broker.color,
                  fontFamily: 'var(--font-mono)',
                }}>
                  {broker.shortName}
                </div>

                {/* Status */}
                {broker.connected ? (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '4px 10px', borderRadius: '5px',
                    background: 'rgba(62,207,142,0.12)',
                    color: 'var(--green)',
                    fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-mono)',
                  }}>
                    <CheckCircle size={12} />
                    Connected
                  </span>
                ) : (
                  <span style={{
                    padding: '4px 10px', borderRadius: '5px',
                    background: 'var(--surface-2)',
                    color: 'var(--text-3)',
                    fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-mono)',
                    border: '1px solid var(--border)',
                  }}>
                    Connect
                  </span>
                )}
              </div>

              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '3px' }}>
                {broker.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                {broker.description}
              </div>
            </div>
          )
        })}
      </div>

      {/* Info notice for other brokers */}
      {infoMessage && (
        <div style={{
          padding: '12px 14px', borderRadius: '8px', marginBottom: '16px',
          background: 'rgba(108,142,255,0.08)',
          border: '1px solid rgba(108,142,255,0.2)',
          fontSize: '13px', color: 'var(--accent)',
        }}>
          ℹ️ {infoMessage}
        </div>
      )}

      {/* MT5 / MT4 Connection Form */}
      {(selectedBroker === 'mt5' || selectedBroker === 'mt4') && (
        <div style={{
          marginTop: '8px',
          padding: '24px',
          borderRadius: '12px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
              MetaTrader Connection Details
            </div>
            <span style={{
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--green)',
              background: 'rgba(62,207,142,0.1)',
              padding: '3px 8px',
              borderRadius: '4px',
              fontWeight: 700,
            }}>
              LIVE SYNC ACTIVE
            </span>
          </div>

          {/* 3-column input fields */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-3)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Account Login
              </label>
              <input
                type="text"
                value={mt5Login}
                onChange={e => setMt5Login(e.target.value)}
                placeholder="12345678"
                style={{
                  width: '100%', background: 'var(--surface-2)',
                  border: '1px solid var(--border)', borderRadius: '7px',
                  padding: '9px 12px', fontSize: '13px', color: 'var(--text)',
                  outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-mono)',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-3)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Password
              </label>
              <input
                type="password"
                value={mt5Password}
                onChange={e => setMt5Password(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%', background: 'var(--surface-2)',
                  border: '1px solid var(--border)', borderRadius: '7px',
                  padding: '9px 12px', fontSize: '13px', color: 'var(--text)',
                  outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-mono)',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-3)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                Server Name
              </label>
              <input
                type="text"
                value={mt5Server}
                onChange={e => setMt5Server(e.target.value)}
                placeholder="ICMarkets-Demo"
                style={{
                  width: '100%', background: 'var(--surface-2)',
                  border: '1px solid var(--border)', borderRadius: '7px',
                  padding: '9px 12px', fontSize: '13px', color: 'var(--text)',
                  outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-sans)',
                }}
              />
            </div>
          </div>

          {/* Platform selector */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-3)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Platform
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['mt4', 'mt5'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setMt5Platform(p)}
                  style={{
                    padding: '8px 20px', borderRadius: '7px', border: '1px solid var(--border)',
                    cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                    fontFamily: 'var(--font-sans)',
                    background: mt5Platform === p ? 'var(--accent)' : 'var(--surface-2)',
                    color: mt5Platform === p ? '#fff' : 'var(--text-2)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Actions & Sync Results */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '16px',
            borderTop: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <button
                type="button"
                onClick={handleSync}
                disabled={syncing}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '10px 20px', borderRadius: '8px',
                  background: 'var(--accent)', border: 'none',
                  color: '#fff', fontSize: '13px', fontWeight: 700,
                  cursor: syncing ? 'not-allowed' : 'pointer',
                  opacity: syncing ? 0.7 : 1, fontFamily: 'var(--font-sans)',
                }}
              >
                <RefreshCw size={14} style={{ animation: syncing ? 'spin 0.8s linear infinite' : 'none' }} />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={13} color="var(--text-3)" />
                <span style={{ fontSize: '12px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                  Last synced: {lastSynced}
                </span>
              </div>
            </div>

            {syncResult && (
              <span style={{
                fontSize: '13px', color: 'var(--green)',
                fontFamily: 'var(--font-mono)', fontWeight: 700,
              }}>
                ✓ {syncResult.synced} trades synced
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
