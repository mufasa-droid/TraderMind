'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Brain, BarChart3, ListOrdered,
  BookOpen, Target, Image, Settings, Zap,
  TrendingUp, Bell, ChevronDown, LogOut, Menu, X
} from 'lucide-react'
import { useState } from 'react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/behavior', label: 'Behavior', icon: Brain },
  { href: '/ai-coach', label: 'AI Coach', icon: Zap },
  { href: '/trades', label: 'Trades', icon: ListOrdered },
  { href: '/journal', label: 'Journal', icon: BookOpen },
]

const SECONDARY_NAV = [
  { href: '/goals', label: 'Goals & Rules', icon: Target },
  { href: '/screenshots', label: 'Screenshots', icon: Image },
]

const styles = {
  sidebar: {
    width: '220px',
    background: 'hsl(224,18%,8%)',
    borderRight: '1px solid hsl(220,12%,14%)',
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    position: 'sticky' as const,
    top: 0,
    flexShrink: 0,
  },
  logo: {
    padding: '20px 16px',
    borderBottom: '1px solid hsl(220,12%,14%)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoMark: {
    width: '28px',
    height: '28px',
    borderRadius: '7px',
    background: 'hsl(226,100%,71%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 800,
    color: '#fff',
    flexShrink: 0,
  },
  logoText: { fontSize: '15px', fontWeight: 700, letterSpacing: '-0.3px' },
  nav: { padding: '12px 8px', flex: 1, display: 'flex', flexDirection: 'column' as const, gap: '2px' },
  section: { fontSize: '10px', fontWeight: 600, color: 'hsl(220,10%,40%)', letterSpacing: '0.8px', textTransform: 'uppercase' as const, padding: '8px 8px 4px', fontFamily: "'DM Mono', monospace" },
  sep: { height: '1px', background: 'hsl(220,12%,14%)', margin: '8px 0' },
  footer: { padding: '12px 8px', borderTop: '1px solid hsl(220,12%,14%)' },
  brokerBadge: {
    padding: '8px 10px',
    background: 'hsl(224,16%,11%)',
    borderRadius: '8px',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
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
        padding: '8px 10px',
        borderRadius: '7px',
        fontSize: '13px',
        fontWeight: 500,
        textDecoration: 'none',
        color: active ? 'hsl(220,15%,92%)' : 'hsl(220,10%,55%)',
        background: active ? 'hsl(224,16%,13%)' : 'transparent',
        transition: 'all 0.15s',
      }}
    >
      <Icon size={15} style={{ color: active ? 'hsl(226,100%,71%)' : 'hsl(220,10%,45%)' }} />
      {label}
    </Link>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

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
          <div style={styles.section}>Platform</div>
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
          <div style={styles.section}>Tools</div>
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
          {/* Broker Status */}
          <div style={styles.brokerBadge}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#3ecf8e', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(220,15%,85%)' }}>MT5 Connected</div>
              <div style={{ fontSize: '10px', color: 'hsl(220,10%,45%)', fontFamily: "'DM Mono', monospace" }}>Synced just now</div>
            </div>
          </div>

          {/* User */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, hsl(226,100%,71%), #b48eff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: 700, color: '#fff'
            }}>AK</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(220,15%,85%)' }}>Alex Kim</div>
              <div style={{ fontSize: '10px', color: 'hsl(220,10%,45%)', fontFamily: "'DM Mono', monospace" }}>Pro trader</div>
            </div>
            <Settings size={13} style={{ color: 'hsl(220,10%,45%)', cursor: 'pointer' }} />
          </div>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <header style={{
          height: '52px',
          background: 'hsl(224,18%,8%)',
          borderBottom: '1px solid hsl(220,12%,14%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={14} style={{ color: 'hsl(226,100%,71%)' }} />
            <span style={{ fontSize: '12px', fontFamily: "'DM Mono', monospace", color: 'hsl(220,10%,55%)' }}>
              Balance: <span style={{ color: '#3ecf8e', fontWeight: 500 }}>$11,247.50</span>
            </span>
            <span style={{ color: 'hsl(220,12%,20%)', margin: '0 4px' }}>·</span>
            <span style={{ fontSize: '12px', fontFamily: "'DM Mono', monospace", color: 'hsl(220,10%,55%)' }}>
              P&L today: <span style={{ color: '#3ecf8e' }}>+$312.00</span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button style={{
              background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px',
              color: 'hsl(220,10%,55%)', position: 'relative'
            }}>
              <Bell size={16} />
              <span style={{
                position: 'absolute', top: '2px', right: '2px', width: '6px', height: '6px',
                borderRadius: '50%', background: 'hsl(226,100%,71%)', border: '1.5px solid hsl(224,18%,8%)'
              }} />
            </button>
            <span style={{ fontSize: '11px', color: 'hsl(220,10%,40%)', fontFamily: "'DM Mono', monospace" }}>
              May 28, 2026
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
