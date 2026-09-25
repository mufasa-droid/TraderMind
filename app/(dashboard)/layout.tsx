'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Brain,
  BookOpen,
  Target,
  Settings,
  Zap,
  LogOut,
  Clock,
  Image,
  Menu,
  X,
  Search,
  Activity,
  Shield,
  Sliders,
  ChevronRight,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import NotificationDropdown from '@/components/layout/NotificationDropdown'
import ProfileSettingsModal from '@/components/layout/ProfileSettingsModal'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/behavior', label: 'Behavior', icon: Brain },
  { href: '/ai-coach', label: 'AI Coach', icon: Zap },
  { href: '/trades', label: 'Trade History', icon: Clock },
  { href: '/journal', label: 'Journal', icon: BookOpen },
  { href: '/goals', label: 'Goals & Rules', icon: Target },
  { href: '/screenshots', label: 'Screenshots', icon: Image },
]

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string
  label: string
  icon: React.ElementType
  active: boolean
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="apple-btn"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '9px 14px',
        borderRadius: '10px',
        fontSize: '13px',
        fontWeight: active ? 600 : 500,
        textDecoration: 'none',
        color: active ? '#FFFFFF' : 'var(--text-2)',
        background: active ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
        border: active ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid transparent',
        boxShadow: active ? 'inset 0 1px 0 rgba(255, 255, 255, 0.08)' : 'none',
        transition: 'all 0.15s ease',
      }}
    >
      <Icon
        size={16}
        strokeWidth={active ? 2.2 : 1.8}
        style={{
          color: active ? 'var(--accent)' : 'var(--text-3)',
          transition: 'color 0.15s ease',
          flexShrink: 0,
        }}
      />
      <span style={{ flex: 1, letterSpacing: '-0.01em' }}>{label}</span>
      {active && (
        <span
          style={{
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: 'var(--accent)',
            boxShadow: '0 0 6px var(--accent)',
          }}
        />
      )}
    </Link>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('Alex Kim')
  const [initials, setInitials] = useState('AK')
  const [currentDateStr, setCurrentDateStr] = useState<string>('')
  const [currentShortTimeStr, setCurrentShortTimeStr] = useState<string>('')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Prevent background scrolling when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const datePart = now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      })
      const timePart = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'UTC',
      })
      setCurrentDateStr(`${datePart} · ${timePart} UTC`)
      setCurrentShortTimeStr(`${timePart} UTC`)
    }

    updateTime()
    const interval = setInterval(updateTime, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    try {
      const supabase = createClient()
      supabase.auth
        .getUser()
        .then(({ data: { user } }) => {
          if (user) {
            setUserEmail(user.email ?? null)
            const name = (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'Trader'
            setUserName(name)
            setInitials(name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase())
          }
        })
        .catch(() => {
          // Demo fallback
        })
    } catch {
      // Demo fallback
    }
  }, [])

  const handleSignOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch {}
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--bg)',
        position: 'relative',
        overflowX: 'clip',
        maxWidth: '100vw',
        width: '100%',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes drawerSlide {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @media (min-width: 768px) {
          .desktop-sidebar { display: flex !important; }
          .mobile-menu-trigger { display: none !important; }
          .mobile-header-stats { display: none !important; }
          .desktop-header-stats { display: flex !important; }
          .desktop-time-badge { display: flex !important; }
          .mobile-time-badge { display: none !important; }
        }
        @media (max-width: 767px) {
          .desktop-sidebar { display: none !important; }
          .mobile-menu-trigger { display: flex !important; }
          .mobile-header-stats { display: flex !important; }
          .desktop-header-stats { display: none !important; }
          .desktop-time-badge { display: none !important; }
          .mobile-time-badge { display: flex !important; }
          .dashboard-main-content { padding: 16px 14px 28px 14px !important; }
          .dashboard-topbar { padding: 0 14px !important; }
        }
      `}</style>

      {/* ── DESKTOP MACOS PRO APP SIDEBAR (240px) ── */}
      <aside
        className="desktop-sidebar"
        style={{
          width: '240px',
          background: 'rgba(17, 19, 24, 0.75)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          flexDirection: 'column',
          height: '100vh',
          position: 'sticky',
          top: 0,
          flexShrink: 0,
          zIndex: 40,
        }}
      >
        {/* Workspace Brand Header */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, var(--accent), var(--purple))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 800,
              color: '#FFFFFF',
              fontFamily: 'var(--font-mono)',
              boxShadow: '0 0 16px rgba(108, 142, 255, 0.35)',
              flexShrink: 0,
            }}
          >
            TM
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
              TraderMind
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
              Pro Workspace · v1.0
            </div>
          </div>
        </div>

        {/* Quick Action Search Hint */}
        <div style={{ padding: '14px 16px 6px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '7px 12px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              color: 'var(--text-3)',
              fontSize: '12px',
              cursor: 'default',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={13} />
              <span>Workspace</span>
            </div>
            <span
              style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                background: 'rgba(255, 255, 255, 0.06)',
                padding: '2px 5px',
                borderRadius: '4px',
              }}
            >
              ⌘K
            </span>
          </div>
        </div>

        {/* Navigation List */}
        <nav
          style={{
            padding: '10px 14px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: 'var(--text-3)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '10px 8px 6px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Intelligence Platform
          </div>
          {NAV_ITEMS.map(item => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))}
            />
          ))}
          <div style={{ flex: 1 }} />
        </nav>

        {/* Footer: Broker Connection & User Profile */}
        <div
          style={{
            padding: '16px 14px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* MT5 Read-Only Status Card */}
          <Link href="/broker/connect" style={{ textDecoration: 'none', display: 'block' }}>
            <div
              className="apple-glass-card apple-btn"
              style={{
                padding: '10px 14px',
                borderRadius: '12px',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'var(--text-3)',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.06em',
                  }}
                >
                  MT5 FEED
                </span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    color: 'var(--green)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'var(--green)',
                      boxShadow: '0 0 6px var(--green)',
                      display: 'inline-block',
                    }}
                  />{' '}
                  SYNCED
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  color: 'var(--text-2)',
                  fontFamily: 'var(--font-mono)',
                  marginTop: '4px',
                }}
              >
                <span>⚡</span> 0.42ms Latency · Read-Only
              </div>
            </div>
          </Link>

          {/* User Profile Capsule */}
          <div
            className="apple-glass-card apple-btn"
            onClick={() => setIsSettingsOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 10px',
              borderRadius: '12px',
              cursor: 'pointer',
            }}
            title="Click to manage account settings & profile"
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                flexShrink: 0,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
              }}
            >
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {userName}
              </div>
              <div
                style={{
                  fontSize: '9.5px',
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Settings & Profile
              </div>
            </div>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation()
                setIsSettingsOpen(true)
              }}
              title="Account Settings"
              className="apple-btn"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: 'var(--text-3)',
                display: 'flex',
                borderRadius: '6px',
              }}
            >
              <Settings size={15} />
            </button>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation()
                handleSignOut()
              }}
              title="Sign out"
              className="apple-btn"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: 'var(--text-3)',
                display: 'flex',
                borderRadius: '6px',
              }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MOBILE SLIDEOVER DRAWER ── */}
      {isMobileMenuOpen && (
        <>
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              zIndex: 90,
              animation: 'modalFadeIn 0.2s ease-out',
            }}
          />
          <aside
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: '280px',
              maxWidth: '85vw',
              background: 'rgba(17, 19, 24, 0.95)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              borderRight: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 100,
              boxShadow: '0 0 60px rgba(0, 0, 0, 0.9)',
              animation: 'drawerSlide 0.25s var(--spring-smooth)',
            }}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: '18px 20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, var(--accent), var(--purple))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  TM
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>TraderMind</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                    Pro Workspace
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="apple-btn"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'var(--text-2)',
                  cursor: 'pointer',
                  padding: '7px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Navigation */}
            <nav style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'var(--text-3)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '8px 10px',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                Navigation
              </div>
              {NAV_ITEMS.map(item => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))}
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              ))}
              <div style={{ flex: 1 }} />
            </nav>

            {/* Drawer Footer */}
            <div style={{ padding: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  setIsSettingsOpen(true)
                }}
                className="apple-glass-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>{userName}</div>
                  <div style={{ fontSize: '10px', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                    Settings & Profile
                  </div>
                </div>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation()
                    handleSignOut()
                  }}
                  title="Sign out"
                  className="apple-btn"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    color: 'var(--text-3)',
                    display: 'flex',
                  }}
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* ── MAIN CONTENT CONTAINER ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, maxWidth: '100%', overflowX: 'clip' }}>
        {/* Apple Translucent Sticky Header (52px) */}
        <header
          className="dashboard-topbar"
          style={{
            height: '52px',
            background: 'rgba(10, 11, 14, 0.72)',
            backdropFilter: 'blur(28px) saturate(180%)',
            WebkitBackdropFilter: 'blur(28px) saturate(180%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            flexShrink: 0,
            position: 'sticky',
            top: 0,
            zIndex: 30,
            width: '100%',
          }}
        >
          {/* Left section: Hamburger button (mobile) + Balance/P&L */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <button
              type="button"
              className="mobile-menu-trigger apple-btn"
              onClick={() => setIsMobileMenuOpen(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#FFFFFF',
                cursor: 'pointer',
                padding: '7px',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              aria-label="Open menu"
            >
              <Menu size={16} />
            </button>

            {/* Desktop Metrics (JetBrains Mono Tabular Figures) */}
            <div className="desktop-header-stats" style={{ alignItems: 'center', gap: '18px' }}>
              <span style={{ fontSize: '12.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>
                Balance:{' '}
                <span
                  style={{
                    color: 'var(--text)',
                    fontWeight: 650,
                    fontFeatureSettings: '"tnum" 1',
                  }}
                >
                  $11,247.50
                </span>
              </span>
              <span style={{ fontSize: '12.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>
                Equity:{' '}
                <span
                  style={{
                    color: 'var(--text)',
                    fontWeight: 650,
                    fontFeatureSettings: '"tnum" 1',
                  }}
                >
                  $11,380.20
                </span>
              </span>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 8px',
                  borderRadius: '9999px',
                  background: 'rgba(62, 207, 142, 0.1)',
                  border: '1px solid rgba(62, 207, 142, 0.25)',
                }}
              >
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--green)', fontWeight: 700 }}>
                  +$312.00 today
                </span>
              </div>
            </div>

            {/* Mobile Metrics (Compact) */}
            <div className="mobile-header-stats" style={{ alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>
                $11.2k
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--green)',
                  fontWeight: 700,
                  background: 'rgba(62, 207, 142, 0.1)',
                  padding: '2px 7px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(62, 207, 142, 0.25)',
                }}
              >
                +$312
              </span>
            </div>
          </div>

          {/* Right section: Notifications + UTC Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <NotificationDropdown />

            {/* Desktop Full UTC Time Badge */}
            <div
              className="desktop-time-badge"
              style={{
                alignItems: 'center',
                gap: '8px',
                fontSize: '11.5px',
                color: 'var(--text-2)',
                fontFamily: 'var(--font-mono)',
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '5px 12px',
                borderRadius: '9999px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--green)',
                  boxShadow: '0 0 6px var(--green)',
                  display: 'inline-block',
                }}
              />
              <span>{currentDateStr || 'Syncing UTC…'}</span>
            </div>

            {/* Mobile Compact Time Badge */}
            <div
              className="mobile-time-badge"
              style={{
                alignItems: 'center',
                gap: '5px',
                fontSize: '10.5px',
                color: 'var(--text-2)',
                fontFamily: 'var(--font-mono)',
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '4px 8px',
                borderRadius: '9999px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <span
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: 'var(--green)',
                  display: 'inline-block',
                }}
              />
              <span>{currentShortTimeStr || 'UTC'}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main
          className="dashboard-main-content"
          style={{
            flex: 1,
            padding: '28px',
            minWidth: 0,
            maxWidth: '100%',
            overflowX: 'clip',
          }}
        >
          {children}
        </main>
      </div>

      {/* macOS Preferences Style Settings Modal */}
      <ProfileSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userName={userName}
        userEmail={userEmail}
        initials={initials}
        onProfileUpdated={newName => {
          setUserName(newName)
          const newInitials = newName.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()
          setInitials(newInitials)
        }}
      />
    </div>
  )
}
