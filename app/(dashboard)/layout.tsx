'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Brain, BookOpen, Target, Settings, Zap,
  Bell, LogOut, Clock, Image
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

const styles = {
  sidebar: {
    width: '210px',
    background: 'var(--surface)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    position: 'sticky' as const,
    top: 0,
    flexShrink: 0,
  },
  logo: {
    padding: '18px 16px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoMark: {
    width: '28px',
    height: '28px',
    borderRadius: '7px',
    background: 'var(--accent)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: 800,
    color: '#fff',
    flexShrink: 0,
  },
  logoText: { fontSize: '15px', fontWeight: 800, letterSpacing: '-0.3px', color: 'var(--text)' },
  nav: { padding: '14px 10px', flex: 1, display: 'flex', flexDirection: 'column' as const, gap: '2px' },
  section: { fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.8px', textTransform: 'uppercase' as const, padding: '12px 8px 6px', fontFamily: 'var(--font-mono)' },
  sep: { height: '1px', background: 'var(--border)', margin: '10px 0' },
  footer: { padding: '12px 10px', borderTop: '1px solid var(--border)' },
  brokerBadge: {
    padding: '10px 12px',
    background: 'var(--surface-2)',
    borderRadius: '8px',
    marginBottom: '10px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    border: '1px solid var(--border)',
  },
}

function NavItem({ href, label, icon: Icon, active }: { href: string; label: string; icon: React.ElementType; active: boolean }) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 12px',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: active ? 600 : 500,
        textDecoration: 'none',
        color: active ? 'var(--accent)' : 'var(--text-2)',
        background: active ? 'rgba(108,142,255,0.12)' : 'transparent',
        border: `1px solid ${active ? 'rgba(108,142,255,0.25)' : 'transparent'}`,
        transition: 'all 0.15s ease',
      }}
    >
      <Icon size={16} strokeWidth={active ? 2.2 : 1.8} style={{ color: active ? 'var(--accent)' : 'var(--text-3)' }} />
      {label}
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

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
    }

    updateTime()
    const interval = setInterval(updateTime, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    try {
      const supabase = createClient()
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          setUserEmail(user.email ?? null)
          const name = (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'Trader'
          setUserName(name)
          setInitials(name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase())
        }
      }).catch(() => {
        // Demo fallback: default user remains 'Alex Kim'
      })
    } catch {
      // Demo fallback: default user remains 'Alex Kim'
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
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        {/* Logo */}
        <div style={styles.logo}>
          <div style={styles.logoMark}>TM</div>
          <div>
            <div style={styles.logoText}>TraderMind</div>
            <div style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>v1.0 · Pro</div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={styles.nav}>
          <div style={styles.section}>Platform</div>
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

        {/* Footer */}
        <div style={styles.footer}>
          {/* Broker Status */}
          <Link href="/broker/connect" style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{
              ...styles.brokerBadge,
              cursor: 'pointer',
              transition: 'border-color 0.15s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px' }}>MT5 · LINK</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} /> CONNECTED
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>
                <span>≋</span> 0.42ms Latency
              </div>
            </div>
          </Link>

          {/* User Profile Card */}
          <div
            onClick={() => setIsSettingsOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 10px',
              borderRadius: '8px',
              background: 'transparent',
              border: '1px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--surface-2)'
              e.currentTarget.style.borderColor = 'var(--border)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = 'transparent'
            }}
            title="Click to manage account settings & profile"
          >
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
              background: 'var(--surface-3)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text)', fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-mono)'
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
              <div style={{ fontSize: '9px', color: 'var(--accent)', fontFamily: 'var(--font-mono)', letterSpacing: '0.3px', textTransform: 'uppercase' }}>Settings & Profile</div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsSettingsOpen(true)
              }}
              title="Account Settings"
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px',
                color: 'var(--text-3)', display: 'flex', borderRadius: '4px',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
            >
              <Settings size={15} strokeWidth={1.8} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleSignOut()
              }}
              title="Sign out"
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px',
                color: 'var(--text-3)', display: 'flex', borderRadius: '4px',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
            >
              <LogOut size={15} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <header style={{
          height: '48px',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>
              Balance: <span style={{ color: 'var(--green)', fontWeight: 600 }}>$11,247.50</span>
            </span>
            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>
              Equity: <span style={{ color: 'var(--green)', fontWeight: 600 }}>$11,380.20</span>
            </span>
            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>
              P&L today: <span style={{ color: 'var(--green)', fontWeight: 600 }}>+$312.00</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <NotificationDropdown />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              color: 'var(--text-2)',
              fontFamily: 'var(--font-mono)',
              background: 'var(--surface-2)',
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--green)',
                boxShadow: '0 0 6px rgba(62,207,142,0.6)',
                display: 'inline-block',
              }} />
              <span>{currentDateStr || 'Syncing UTC…'}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {children}
        </main>
      </div>

      {/* Profile & Account Settings Modal */}
      <ProfileSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userName={userName}
        userEmail={userEmail}
        initials={initials}
        onProfileUpdated={(newName) => {
          setUserName(newName)
          const newInitials = newName.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()
          setInitials(newInitials)
        }}
      />
    </div>
  )
}
