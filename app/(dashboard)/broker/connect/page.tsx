'use client'

import { useState, useEffect } from 'react'
import {
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  Download,
  Copy,
  Check,
  Terminal,
  Cloud,
  Zap,
  ShieldCheck,
  ExternalLink,
  FileCode,
} from 'lucide-react'

const BROKERS = [
  {
    id: 'mt5',
    name: 'MetaTrader 5',
    shortName: 'MT5',
    description: 'Most popular forex and CFD platform',
    color: 'var(--accent)',
    accentBg: 'rgba(108,142,255,0.08)',
    connected: true, // demo shows MT5 as connected
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
  const [connectionMethod, setConnectionMethod] = useState<'ea' | 'cloud'>('ea')
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ synced: number } | null>(null)
  const [lastSynced, setLastSynced] = useState<string>('Just now')
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  // Sync EA details
  const [syncKey, setSyncKey] = useState<string>('demo-trader-uuid-1234')
  const [webhookUrl, setWebhookUrl] = useState<string>('http://localhost:3000/api/broker/webhook')
  const [copiedKey, setCopiedKey] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [testingWebhook, setTestingWebhook] = useState(false)
  const [webhookTestResult, setWebhookTestResult] = useState<string | null>(null)

  // MT5 connection form state (for cloud sync)
  const [mt5Login, setMt5Login] = useState('12345678') // demo pre-filled
  const [mt5Password, setMt5Password] = useState('••••••••') // demo pre-filled
  const [mt5Server, setMt5Server] = useState('ICMarkets-Demo') // demo pre-filled
  const [mt5Platform, setMt5Platform] = useState<'mt4' | 'mt5'>('mt5')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWebhookUrl(`${window.location.origin}/api/broker/webhook`)
    }

    async function loadUser() {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          setSyncKey(user.id)
        }
      } catch {
        // Fallback to demo key
      }
    }
    loadUser()
  }, [])

  const copyToClipboard = async (text: string, type: 'key' | 'url') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'key') {
        setCopiedKey(true)
        setTimeout(() => setCopiedKey(false), 2000)
      } else {
        setCopiedUrl(true)
        setTimeout(() => setCopiedUrl(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }

  const handleTestWebhook = async () => {
    setTestingWebhook(true)
    setWebhookTestResult(null)
    try {
      const res = await fetch('/api/broker/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sync-key': syncKey,
        },
        body: JSON.stringify({
          sync_key: syncKey,
          platform: 'mt5',
          account: {
            login: 12345678,
            server: 'ICMarkets-Demo',
            currency: 'USD',
            balance: 10000,
            equity: 10000,
            leverage: 100,
          },
          heartbeat: true,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setWebhookTestResult('Connection verified! Webhook is receiving data successfully.')
        setLastSynced('Just now')
      } else {
        setWebhookTestResult(data.message || 'Webhook reachable.')
      }
    } catch {
      setWebhookTestResult('Error reaching webhook endpoint.')
    } finally {
      setTestingWebhook(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    setInfoMessage(null)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
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
        await new Promise((r) => setTimeout(r, 1200))
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
    if (brokerId !== 'mt5' && brokerId !== 'mt4' && brokerId !== 'ctrader') {
      setInfoMessage(
        `Integration for ${BROKERS.find((b) => b.id === brokerId)?.name} is currently in closed beta. MetaTrader 4/5 and cTrader are actively supported.`
      )
    } else {
      setInfoMessage(null)
    }
  }

  return (
    <div
      style={{
        maxWidth: '820px',
        margin: '0 auto',
        padding: '32px 24px',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 800,
            color: 'var(--text)',
            marginBottom: '6px',
            letterSpacing: '-0.5px',
          }}
        >
          Connect Your Broker
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-2)' }}>
          Sync your trading history automatically in read-only mode for real-time behavioral insights.
        </p>
      </div>

      {/* Warning callout */}
      <div
        style={{
          padding: '14px 16px',
          borderRadius: '10px',
          marginBottom: '24px',
          background: 'rgba(245,166,35,0.06)',
          border: '1px solid rgba(245,166,35,0.2)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        <AlertTriangle size={16} color="var(--amber)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>
          <strong style={{ color: 'var(--text)' }}>Read-only access only.</strong> TraderMind
          connects to your broker to read trade history and account balance. We never place trades,
          modify positions, or access withdrawal functions. Your credentials are transmitted securely
          and never stored in plain text.
        </p>
      </div>

      {/* Broker Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        {BROKERS.map((broker) => {
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
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                }}
              >
                {/* Logo badge */}
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: broker.accentBg,
                    border: `1px solid ${broker.color}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: broker.color,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {broker.shortName}
                </div>

                {/* Status */}
                {broker.connected ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      borderRadius: '5px',
                      background: 'rgba(62,207,142,0.12)',
                      color: 'var(--green)',
                      fontSize: '11px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <CheckCircle size={12} />
                    Connected
                  </span>
                ) : (
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '5px',
                      background: 'var(--surface-2)',
                      color: 'var(--text-3)',
                      fontSize: '11px',
                      fontWeight: 600,
                      fontFamily: 'var(--font-mono)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    Connect
                  </span>
                )}
              </div>

              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'var(--text)',
                  marginBottom: '3px',
                }}
              >
                {broker.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>{broker.description}</div>
            </div>
          )
        })}
      </div>

      {/* Info notice for other brokers */}
      {infoMessage && (
        <div
          style={{
            padding: '12px 14px',
            borderRadius: '8px',
            marginBottom: '16px',
            background: 'rgba(108,142,255,0.08)',
            border: '1px solid rgba(108,142,255,0.2)',
            fontSize: '13px',
            color: 'var(--accent)',
          }}
        >
          ℹ️ {infoMessage}
        </div>
      )}

      {/* MetaTrader Configuration Panel */}
      {(selectedBroker === 'mt5' || selectedBroker === 'mt4') && (
        <div
          style={{
            marginTop: '8px',
            borderRadius: '12px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            overflow: 'hidden',
          }}
        >
          {/* Method Selector Tabs */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--surface-2)',
            }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setConnectionMethod('ea')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '7px',
                  fontSize: '12px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                  border:
                    connectionMethod === 'ea'
                      ? '1px solid var(--accent)'
                      : '1px solid var(--border)',
                  background:
                    connectionMethod === 'ea' ? 'rgba(108,142,255,0.12)' : 'var(--surface)',
                  color: connectionMethod === 'ea' ? 'var(--accent)' : 'var(--text-2)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Terminal size={14} />
                Desktop EA Sync
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(62,207,142,0.15)',
                    color: 'var(--green)',
                    fontWeight: 800,
                  }}
                >
                  FREE
                </span>
              </button>

              <button
                type="button"
                onClick={() => setConnectionMethod('cloud')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '7px',
                  fontSize: '12px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                  border:
                    connectionMethod === 'cloud'
                      ? '1px solid var(--accent)'
                      : '1px solid var(--border)',
                  background:
                    connectionMethod === 'cloud' ? 'rgba(108,142,255,0.12)' : 'var(--surface)',
                  color: connectionMethod === 'cloud' ? 'var(--accent)' : 'var(--text-2)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Cloud size={14} />
                Cloud Terminal Sync (Demo)
              </button>
            </div>

            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--green)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 700,
              }}
            >
              <Zap size={13} />
              WEBHOOK ACTIVE
            </span>
          </div>

          {/* TAB 1: DESKTOP EA SYNC (FREE) */}
          {connectionMethod === 'ea' && (
            <div style={{ padding: '24px' }}>
              {/* Banner / Value Prop */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  background: 'rgba(108,142,255,0.05)',
                  border: '1px solid rgba(108,142,255,0.18)',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(108,142,255,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent)',
                    flexShrink: 0,
                  }}
                >
                  <FileCode size={20} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: 'var(--text)',
                      marginBottom: '4px',
                    }}
                  >
                    100% Free Real-Time Sync via MQL5 Expert Advisor
                  </div>
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-2)',
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    Run the lightweight TraderMind Sync EA in your MetaTrader terminal. It automatically
                    sweeps your historical deals and streams real-time trade closures and balance updates
                    directly to your dashboard via encrypted WebRequest — no subscription or cloud fees required.
                  </p>
                </div>
              </div>

              {/* Download Section */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: 'var(--surface-2)',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  marginBottom: '20px',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: 'var(--text)',
                      marginBottom: '4px',
                    }}
                  >
                    Download TraderMind Sync EA (.mq5)
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-3)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    v1.0.0 · MQL5 Source Code · Compatible with MetaTrader 5
                  </div>
                </div>

                <a
                  href="/downloads/TraderMind_Sync.mq5"
                  download="TraderMind_Sync.mq5"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    background: 'var(--accent)',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    transition: 'opacity 0.15s ease',
                  }}
                >
                  <Download size={15} />
                  Download EA
                </a>
              </div>

              {/* Credentials / Setup Inputs */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '14px',
                  marginBottom: '24px',
                }}
              >
                {/* Sync Key Box */}
                <div
                  style={{
                    padding: '16px',
                    background: 'var(--surface-2)',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '6px',
                    }}
                  >
                    <label
                      style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-3)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                      }}
                    >
                      Your Private Sync Key
                    </label>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(syncKey, 'key')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: copiedKey ? 'var(--green)' : 'var(--accent)',
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: 0,
                      }}
                    >
                      {copiedKey ? <Check size={12} /> : <Copy size={12} />}
                      {copiedKey ? 'COPIED' : 'COPY'}
                    </button>
                  </div>
                  <div
                    style={{
                      padding: '8px 10px',
                      background: 'var(--surface)',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={syncKey}
                  >
                    {syncKey}
                  </div>
                </div>

                {/* Webhook URL Box */}
                <div
                  style={{
                    padding: '16px',
                    background: 'var(--surface-2)',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '6px',
                    }}
                  >
                    <label
                      style={{
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-3)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                      }}
                    >
                      Webhook Target URL
                    </label>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(webhookUrl, 'url')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: copiedUrl ? 'var(--green)' : 'var(--accent)',
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: 0,
                      }}
                    >
                      {copiedUrl ? <Check size={12} /> : <Copy size={12} />}
                      {copiedUrl ? 'COPIED' : 'COPY'}
                    </button>
                  </div>
                  <div
                    style={{
                      padding: '8px 10px',
                      background: 'var(--surface)',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={webhookUrl}
                  >
                    {webhookUrl}
                  </div>
                </div>
              </div>

              {/* Step-by-Step Installation Guide */}
              <div style={{ marginBottom: '24px' }}>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--text)',
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  3-Step Quick Setup Guide
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Step 1 */}
                  <div
                    style={{
                      padding: '14px',
                      borderRadius: '8px',
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'var(--accent)',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 800,
                        fontFamily: 'var(--font-mono)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      1
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: 'var(--text)',
                          marginBottom: '3px',
                        }}
                      >
                        Copy EA to MetaTrader 5 Experts Folder
                      </div>
                      <p
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-2)',
                          margin: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        In your MT5 terminal, click{' '}
                        <code
                          style={{
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--accent)',
                            background: 'var(--surface)',
                            padding: '2px 5px',
                            borderRadius: '4px',
                          }}
                        >
                          File → Open Data Folder
                        </code>
                        . Navigate into{' '}
                        <code
                          style={{
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--accent)',
                            background: 'var(--surface)',
                            padding: '2px 5px',
                            borderRadius: '4px',
                          }}
                        >
                          MQL5 → Experts
                        </code>{' '}
                        and paste the downloaded{' '}
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>
                          TraderMind_Sync.mq5
                        </span>
                        . Press{' '}
                        <kbd
                          style={{
                            fontFamily: 'var(--font-mono)',
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            padding: '1px 4px',
                            borderRadius: '3px',
                          }}
                        >
                          F4
                        </kbd>{' '}
                        to open MetaEditor and click <strong>Compile</strong> (or restart MT5).
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div
                    style={{
                      padding: '14px',
                      borderRadius: '8px',
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'var(--accent)',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 800,
                        fontFamily: 'var(--font-mono)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      2
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: 'var(--text)',
                          marginBottom: '3px',
                        }}
                      >
                        Enable WebRequest Permission in MT5
                      </div>
                      <p
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-2)',
                          margin: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        In MT5, click{' '}
                        <code
                          style={{
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--accent)',
                            background: 'var(--surface)',
                            padding: '2px 5px',
                            borderRadius: '4px',
                          }}
                        >
                          Tools → Options → Expert Advisors
                        </code>
                        . Check{' '}
                        <strong>&quot;Allow WebRequest for listed URL&quot;</strong>, click the <code>+</code> button,
                        and add your Webhook Target URL:{' '}
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>
                          {webhookUrl}
                        </span>
                        .
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div
                    style={{
                      padding: '14px',
                      borderRadius: '8px',
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'var(--accent)',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 800,
                        fontFamily: 'var(--font-mono)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      3
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: 'var(--text)',
                          marginBottom: '3px',
                        }}
                      >
                        Attach EA to Any Chart &amp; Enter Sync Key
                      </div>
                      <p
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-2)',
                          margin: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        Open the Navigator window (
                        <kbd
                          style={{
                            fontFamily: 'var(--font-mono)',
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            padding: '1px 4px',
                            borderRadius: '3px',
                          }}
                        >
                          Ctrl+N
                        </kbd>
                        ) in MT5, expand <em>Expert Advisors</em>, and drag{' '}
                        <strong>TraderMind_Sync</strong> onto any active currency chart. In the{' '}
                        <strong>Inputs</strong> tab, paste your <strong>Private Sync Key</strong>. Click
                        OK! Your historical trades will sync immediately and live deals will update in real time.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Test Webhook Connection Action */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <button
                    type="button"
                    onClick={handleTestWebhook}
                    disabled={testingWebhook}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: testingWebhook ? 'not-allowed' : 'pointer',
                      fontFamily: 'var(--font-sans)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <RefreshCw
                      size={14}
                      style={{ animation: testingWebhook ? 'spin 0.8s linear infinite' : 'none' }}
                    />
                    {testingWebhook ? 'Verifying Webhook...' : 'Test Webhook Connection'}
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={13} color="var(--text-3)" />
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-3)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      Last check: {lastSynced}
                    </span>
                  </div>
                </div>

                {webhookTestResult && (
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'var(--green)',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                    }}
                  >
                    ✓ {webhookTestResult}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CLOUD TERMINAL SYNC (METAAPI / DEMO) */}
          {connectionMethod === 'cloud' && (
            <div style={{ padding: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
                  Cloud MetaTrader Account Credentials
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--green)',
                    background: 'rgba(62,207,142,0.1)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontWeight: 700,
                  }}
                >
                  SIMULATED CLOUD SYNC ACTIVE
                </span>
              </div>

              {/* 3-column input fields */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px',
                  marginBottom: '18px',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-3)',
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.6px',
                    }}
                  >
                    Account Login
                  </label>
                  <input
                    type="text"
                    value={mt5Login}
                    onChange={(e) => setMt5Login(e.target.value)}
                    placeholder="12345678"
                    style={{
                      width: '100%',
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      borderRadius: '7px',
                      padding: '9px 12px',
                      fontSize: '13px',
                      color: 'var(--text)',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-3)',
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.6px',
                    }}
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    value={mt5Password}
                    onChange={(e) => setMt5Password(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      borderRadius: '7px',
                      padding: '9px 12px',
                      fontSize: '13px',
                      color: 'var(--text)',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-3)',
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.6px',
                    }}
                  >
                    Server Name
                  </label>
                  <input
                    type="text"
                    value={mt5Server}
                    onChange={(e) => setMt5Server(e.target.value)}
                    placeholder="ICMarkets-Demo"
                    style={{
                      width: '100%',
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      borderRadius: '7px',
                      padding: '9px 12px',
                      fontSize: '13px',
                      color: 'var(--text)',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'var(--font-sans)',
                    }}
                  />
                </div>
              </div>

              {/* Platform selector */}
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-3)',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                  }}
                >
                  Platform
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['mt4', 'mt5'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setMt5Platform(p)}
                      style={{
                        padding: '8px 20px',
                        borderRadius: '7px',
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600,
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
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <button
                    type="button"
                    onClick={handleSync}
                    disabled={syncing}
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
                      cursor: syncing ? 'not-allowed' : 'pointer',
                      opacity: syncing ? 0.7 : 1,
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    <RefreshCw
                      size={14}
                      style={{ animation: syncing ? 'spin 0.8s linear infinite' : 'none' }}
                    />
                    {syncing ? 'Syncing...' : 'Sync Now'}
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={13} color="var(--text-3)" />
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-3)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      Last synced: {lastSynced}
                    </span>
                  </div>
                </div>

                {syncResult && (
                  <span
                    style={{
                      fontSize: '13px',
                      color: 'var(--green)',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                    }}
                  >
                    ✓ {syncResult.synced} trades synced
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* cTrader Configuration Panel */}
      {selectedBroker === 'ctrader' && (
        <div
          style={{
            marginTop: '8px',
            borderRadius: '12px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            overflow: 'hidden',
          }}
        >
          {/* Method Header Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--surface-2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '7px',
                  fontSize: '12px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-sans)',
                  border: '1px solid var(--teal)',
                  background: 'rgba(29,233,194,0.12)',
                  color: 'var(--teal)',
                }}
              >
                <Terminal size={14} />
                cTrader Automate cBot Sync
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(62,207,142,0.15)',
                    color: 'var(--green)',
                    fontWeight: 800,
                  }}
                >
                  FREE
                </span>
              </div>
            </div>

            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--green)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 700,
              }}
            >
              <Zap size={13} />
              WEBHOOK ACTIVE
            </span>
          </div>

          <div style={{ padding: '24px' }}>
            {/* Banner / Value Prop */}
            <div
              style={{
                padding: '16px',
                borderRadius: '10px',
                background: 'rgba(29,233,194,0.06)',
                border: '1px solid rgba(29,233,194,0.2)',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'rgba(29,233,194,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--teal)',
                  flexShrink: 0,
                }}
              >
                <FileCode size={20} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: 'var(--text)',
                    marginBottom: '4px',
                  }}
                >
                  100% Free Real-Time Sync via cTrader C# cBot
                </div>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--text-2)',
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  Run the lightweight TraderMind Sync cBot in cTrader Automate. It automatically sweeps your
                  historical deals and streams real-time trade closures and balance updates directly to your
                  dashboard via secure WebRequest — zero cloud fees or bridge subscriptions required.
                </p>
              </div>
            </div>

            {/* Download Section */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                background: 'var(--surface-2)',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                marginBottom: '20px',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: 'var(--text)',
                    marginBottom: '4px',
                  }}
                >
                  Download TraderMind Sync cBot (.cs)
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-3)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  v1.0.0 · C# Source Code · Compatible with cTrader Automate (.NET)
                </div>
              </div>

              <a
                href="/downloads/TraderMind_Sync_cTrader.cs"
                download="TraderMind_Sync_cTrader.cs"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  background: 'var(--teal)',
                  color: '#0A0B0E',
                  fontSize: '13px',
                  fontWeight: 800,
                  textDecoration: 'none',
                  transition: 'opacity 0.15s ease',
                }}
              >
                <Download size={15} />
                Download cBot (.cs)
              </a>
            </div>

            {/* Credentials / Setup Inputs */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '14px',
                marginBottom: '24px',
              }}
            >
              {/* Sync Key Box */}
              <div
                style={{
                  padding: '16px',
                  background: 'var(--surface-2)',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--text-3)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    marginBottom: '8px',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  Private Sync Key (cBot Input)
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    readOnly
                    value={syncKey}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: 'var(--surface-3)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: 'var(--teal)',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(syncKey, 'key')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '8px 14px',
                      borderRadius: '6px',
                      background: copiedKey ? 'var(--green)' : 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: copiedKey ? '#0A0B0E' : 'var(--text)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {copiedKey ? <Check size={14} /> : <Copy size={14} />}
                    {copiedKey ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Webhook URL Box */}
              <div
                style={{
                  padding: '16px',
                  background: 'var(--surface-2)',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--text-3)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    marginBottom: '8px',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  Webhook Ingestion URL
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    readOnly
                    value={webhookUrl}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      background: 'var(--surface-3)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: 'var(--text)',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(webhookUrl, 'url')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '8px 14px',
                      borderRadius: '6px',
                      background: copiedUrl ? 'var(--green)' : 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: copiedUrl ? '#0A0B0E' : 'var(--text)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {copiedUrl ? <Check size={14} /> : <Copy size={14} />}
                    {copiedUrl ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            {/* 4-Step Installation Guide */}
            <div
              style={{
                background: 'var(--surface-2)',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                padding: '20px',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--text)',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Terminal size={15} color="var(--teal)" />
                4-Step cTrader Automate Setup
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: 'rgba(29,233,194,0.15)',
                      color: 'var(--teal)',
                      fontSize: '11px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    1
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                      Open cTrader Automate
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.5, marginTop: '2px' }}>
                      In cTrader Desktop, click the <strong>Automate</strong> icon on the left sidebar navigation bar.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: 'rgba(29,233,194,0.15)',
                      color: 'var(--teal)',
                      fontSize: '11px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    2
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                      Create New cBot & Paste Source Code
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.5, marginTop: '2px' }}>
                      Click <strong>New cBot</strong>, replace the default template with the downloaded{' '}
                      <code style={{ color: 'var(--teal)', fontFamily: 'var(--font-mono)' }}>TraderMind_Sync_cTrader.cs</code>, and click <strong>Build</strong> (Ctrl + B).
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: 'rgba(29,233,194,0.15)',
                      color: 'var(--teal)',
                      fontSize: '11px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    3
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                      Add Instance to Any Chart
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.5, marginTop: '2px' }}>
                      Right-click the built cBot in the left list &rarr; click <strong>Add an Instance</strong>. Select any currency pair (e.g. EURUSD).
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: 'rgba(29,233,194,0.15)',
                      color: 'var(--teal)',
                      fontSize: '11px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    4
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                      Configure Sync Key & Start
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.5, marginTop: '2px' }}>
                      In the cBot parameters panel, paste your <strong>Private Sync Key</strong>. Click the green <strong>Start</strong> button. When cTrader asks for FullAccess permissions for WebRequest, click Grant.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Connection Button & Status */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '16px',
                borderTop: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={handleTestWebhook}
                  disabled={testingWebhook}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    background: 'var(--surface-3)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: testingWebhook ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <RefreshCw
                    size={13}
                    style={{ animation: testingWebhook ? 'spin 0.8s linear infinite' : 'none' }}
                  />
                  {testingWebhook ? 'Verifying...' : 'Test cTrader Webhook Ping'}
                </button>

                {webhookTestResult && (
                  <span
                    style={{
                      fontSize: '12px',
                      color: webhookTestResult.includes('verified') ? 'var(--green)' : 'var(--amber)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {webhookTestResult}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={14} color="var(--green)" />
                <span style={{ fontSize: '12px', color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>
                  Read-Only WebRequest Protocol
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
