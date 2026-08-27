'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Brain, BarChart3, ListOrdered,
  BookOpen, Target, Image, Settings, Zap,
  TrendingUp, Bell, ChevronDown, LogOut, Menu, X, Clock
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/behavior', label: 'Behavior', icon: Brain },
  { href: '/ai-coach', label: 'AI Coach', icon: Zap },
  { href: '/trades', label: 'Trade History', icon: Clock },
]

const SECONDARY_NAV = [
  { href: '/goals', label: 'Settings', icon: Settings },
]

const styles = {
  sidebar: {
    width: '200px',
    background: '#0F1115',
    borderRight: '1px solid hsl(220,12%,14%)',
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    position: 'sticky' as const,
    top: 0,
    flexShrink: 0,
  },
  logo: {
    padding: '18px 14px',
    borderBottom: '1px solid hsl(220,12%,14%)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoMark: {
    width: '26px',
    height: '26px',
    borderRadius: '6px',
    background: 'hsl(226,100%,71%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: 800,
    color: '#fff',
    flexShrink: 0,
  },
  logoText: { fontSize: '14px', fontWeight: 700, letterSpacing: '-0.2px', color: '#E8EAF0' },
  nav: { padding: '14px 8px', flex: 1, display: 'flex', flexDirection: 'column' as const, gap: '1px' },
  section: { fontSize: '10px', fontWeight: 600, color: 'hsl(220,10%,35%)', letterSpacing: '1px', textTransform: 'uppercase' as const, padding: '14px 8px 6px', fontFamily: "'DM Mono', monospace" },
  sep: { height: '1px', background: 'hsl(220,12%,14%)', margin: '10px 0' },
  footer: { padding: '10px 8px', borderTop: '1px solid hsl(220,12%,14%)' },
  brokerBadge: {
    padding: '10px 10px',
    background: '#161920',
    borderRadius: '8px',
    marginBottom: '10px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    border: '1px solid hsl(220,12%,14%)',
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
        padding: '7px 10px',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: active ? 600 : 500,
        textDecoration: 'none',
        color: active ? 'hsl(226,100%,71%)' : 'hsl(220,10%,55%)',
        background: active ? 'rgba(108,142,255,0.10)' : 'transparent',
        transition: 'all 0.15s',
      }}
    >
      <Icon size={15} strokeWidth={active ? 2.2 : 1.8} style={{ color: active ? 'hsl(226,100%,71%)' : 'hsl(220,10%,40%)' }} />
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

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email ?? null)
        const name = (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'Trader'
        setUserName(name)
        setInitials(name.split(' ').map(s=> s[0]).join('').slice(0,2).toUpperCase())
      } else if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
        // keep demo placeholder
      }
    })
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'hsl(222,20%,5%)' }}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        {/* Logo */}
        <div style={styles.logo}>
          <div style={styles.logoMark}>TM</div>
          <div>
            <div style={styles.logoText}>TraderMind</div>
            <div style={{ fontSize: '10px', color: 'hsl(220,10%,45%)', fontFamily: "'DM Mono', monospace" }}>v1.0 · Pro</div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={styles.nav}>
          <div style={styles.section}>Menu</div>
          {NAV_ITEMS.map(item => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={pathname === item.href || pathname.startsWith(item.href + '/')}
            />
          ))}

          <div style={styles.sep} />
          <div style={styles.section}>System</div>
          {SECONDARY_NAV.map(item => (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={pathname === item.href}
            />
          ))}

          <div style={{ flex: 1 }} />
        </nav>

        {/* Footer */}
        <div style={styles.footer}>
          {/* Broker Status — pixel-match: MTS LINK LIVE + latency */}
          <div style={styles.brokerBadge}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%' }}>
              <span style={{ fontSize:'10px', fontWeight:600, color:'hsl(220,10%,45%)', fontFamily:"'DM Mono', monospace", letterSpacing:'0.5px' }}>MTS LINK</span>
              <span style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'10px', fontWeight:700, color:'#3ecf8e', fontFamily:"'DM Mono', monospace" }}>
                <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#3ecf8e', display:'inline-block' }} /> LIVE
              </span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'11px', color:'hsl(220,15%,85%)', fontWeight:500 }}>
              <span style={{ color:'hsl(220,10%,45%)', fontSize:'11px' }}>≋</span> 0.42ms Latency
            </div>
          </div>

          {/* User — pixel-match: small icon circle + name + logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
              background: 'hsl(224,14%,14%)', border:'1px solid hsl(220,12%,14%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'hsl(220,10%,55%)'
            }}>
              {/* Show initials when real user, else generic icon */}
              {userEmail ? <span style={{fontSize:'11px',fontWeight:700,color:'#fff'}}>{initials}</span> : <span style={{fontSize:'12px'}}>◯</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(220,15%,85%)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{userName}</div>
              <div style={{ fontSize: '9px', color: 'hsl(220,10%,45%)', fontFamily: "'DM Mono', monospace", letterSpacing:'0.3px', textTransform:'uppercase' as const }}>{userEmail ? 'PRO TRADER' : 'PRO TRADER'}</div>
            </div>
            <button onClick={handleSignOut} title="Sign out" style={{ background:'transparent', border:'none', cursor:'pointer', padding:'4px', color:'hsl(220,10%,45%)', display:'flex' }}>
              <LogOut size={14} strokeWidth={1.6} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar — pixel-match: Balance / P&L today / bell / date */}
        <header style={{
          height: '48px',
          background: '#0F1115',
          borderBottom: '1px solid hsl(220,12%,14%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px 0 24px',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '12px', fontFamily: "'DM Mono', monospace", color: 'hsl(220,10%,55%)' }}>
              Balance: <span style={{ color: '#3ecf8e', fontWeight: 600 }}>$11,247.50</span>
            </span>
            <span style={{ fontSize: '12px', fontFamily: "'DM Mono', monospace", color: 'hsl(220,10%,55%)' }}>
              P&L today: <span style={{ color: '#3ecf8e', fontWeight: 600 }}>+$312.00</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button style={{
              background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px',
              color: 'hsl(220,10%,55%)', position: 'relative', display:'flex'
            }}>
              <Bell size={16} strokeWidth={1.8} />
              <span style={{
                position: 'absolute', top: '3px', right: '3px', width: '6px', height: '6px',
                borderRadius: '50%', background: '#ff6467', border: '1.5px solid #0F1115'
              }} />
            </button>
            <span style={{ fontSize: '11px', color: 'hsl(220,10%,55%)', fontFamily: "'DM Mono', monospace" }}>
              May 26, 2026
            </span>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
