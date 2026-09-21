'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  Bell, BellOff, CheckCircle2, AlertTriangle,
  Sparkles, X, ArrowRight, ShieldCheck
} from 'lucide-react'

export interface NotificationItem {
  id: string
  title: string
  message: string
  time: string
  type: 'warning' | 'info' | 'insight' | 'success'
  isRead: boolean
  href?: string
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Post-Win Risk Warning',
    message: 'Your risk increased to 2.8% on GBPJPY after 2 consecutive wins. Recommended threshold: 1.2%.',
    time: '14m ago',
    type: 'warning',
    isRead: false,
    href: '/behavior',
  },
  {
    id: 'n2',
    title: 'London Session Edge Active',
    message: 'London session is open. Your historical win rate is 67% (+19 pts over average). Maintain discipline.',
    time: '1h ago',
    type: 'info',
    isRead: false,
    href: '/trades',
  },
  {
    id: 'n3',
    title: 'AI Coaching Insight Ready',
    message: 'Weekly behavioral report generated. Discipline score improved +3 points with optimal trade spacing.',
    time: '3h ago',
    type: 'insight',
    isRead: false,
    href: '/ai-coach',
  },
]

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS)
  const containerRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.isRead).length

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const dismissNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
  }

  const getTypeStyle = (type: NotificationItem['type']) => {
    switch (type) {
      case 'warning':
        return {
          icon: AlertTriangle,
          color: 'var(--red)',
          bg: 'rgba(255, 95, 95, 0.12)',
          border: 'rgba(255, 95, 95, 0.25)',
        }
      case 'info':
        return {
          icon: Sparkles,
          color: 'var(--green)',
          bg: 'rgba(62, 207, 142, 0.12)',
          border: 'rgba(62, 207, 142, 0.25)',
        }
      case 'insight':
        return {
          icon: Sparkles,
          color: 'var(--accent)',
          bg: 'rgba(108, 142, 255, 0.12)',
          border: 'rgba(108, 142, 255, 0.25)',
        }
      case 'success':
      default:
        return {
          icon: ShieldCheck,
          color: 'var(--green)',
          bg: 'rgba(62, 207, 142, 0.12)',
          border: 'rgba(62, 207, 142, 0.25)',
        }
    }
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        aria-expanded={isOpen}
        style={{
          background: isOpen ? 'var(--surface-2)' : 'transparent',
          border: `1px solid ${isOpen ? 'var(--border-2)' : 'transparent'}`,
          borderRadius: '8px',
          cursor: 'pointer',
          padding: '6px',
          color: isOpen ? 'var(--text)' : 'var(--text-2)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = 'var(--text)'
          if (!isOpen) e.currentTarget.style.background = 'var(--surface-2)'
        }}
        onMouseLeave={e => {
          if (!isOpen) {
            e.currentTarget.style.color = 'var(--text-2)'
            e.currentTarget.style.background = 'transparent'
          }
        }}
      >
        <Bell size={17} strokeWidth={unreadCount > 0 ? 2.2 : 1.8} />
        
        {/* Unread Indicator Badge */}
        {unreadCount > 0 ? (
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            minWidth: '14px',
            height: '14px',
            borderRadius: '7px',
            background: 'var(--red)',
            border: '2px solid var(--surface)',
            color: '#fff',
            fontSize: '9px',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 2px',
            boxShadow: '0 0 8px rgba(255, 95, 95, 0.6)',
          }}>
            {unreadCount}
          </span>
        ) : (
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
          }} />
        )}
      </button>

      {/* Glassmorphic Popover Dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: '370px',
          maxWidth: 'calc(100vw - 32px)',
          background: 'rgba(17, 19, 24, 0.88)',
          backdropFilter: 'blur(28px) saturate(190%)',
          WebkitBackdropFilter: 'blur(28px) saturate(190%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '14px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
          zIndex: 100,
          overflow: 'hidden',
          animation: 'notifDropdownFade 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
            background: 'rgba(255, 255, 255, 0.01)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span style={{
                  padding: '2px 7px',
                  borderRadius: '10px',
                  fontSize: '10px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  background: 'rgba(108, 142, 255, 0.15)',
                  color: 'var(--accent)',
                  border: '1px solid rgba(108, 142, 255, 0.3)',
                }}>
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '2px 6px',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-3)',
                    fontSize: '11px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    padding: '2px 4px',
                  }}
                  title="Clear all"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* List of Notifications or Empty State */}
          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {notifications.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {notifications.map(item => {
                  const style = getTypeStyle(item.type)
                  const Icon = style.icon

                  return (
                    <div
                      key={item.id}
                      onClick={() => markAsRead(item.id)}
                      style={{
                        padding: '13px 16px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        background: item.isRead ? 'transparent' : 'rgba(108, 142, 255, 0.04)',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start',
                        transition: 'background 0.15s ease',
                        cursor: 'pointer',
                        position: 'relative',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)')}
                      onMouseLeave={e => (e.currentTarget.style.background = item.isRead ? 'transparent' : 'rgba(108, 142, 255, 0.04)')}
                    >
                      {/* Status dot / unread indicator */}
                      {!item.isRead && (
                        <div style={{
                          position: 'absolute',
                          left: '6px',
                          top: '19px',
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          background: 'var(--accent)',
                        }} />
                      )}

                      {/* Icon */}
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: style.bg,
                        border: `1px solid ${style.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        color: style.color,
                        marginTop: '1px',
                      }}>
                        <Icon size={14} />
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '3px' }}>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: item.isRead ? 600 : 700,
                            color: item.isRead ? 'var(--text)' : '#fff',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {item.title}
                          </span>
                          <span style={{
                            fontSize: '10px',
                            color: 'var(--text-3)',
                            fontFamily: 'var(--font-mono)',
                            flexShrink: 0,
                          }}>
                            {item.time}
                          </span>
                        </div>

                        <p style={{
                          fontSize: '12px',
                          color: 'var(--text-2)',
                          lineHeight: 1.45,
                          margin: '0 0 6px',
                        }}>
                          {item.message}
                        </p>

                        {item.href && (
                          <Link
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: 'var(--accent)',
                              textDecoration: 'none',
                              fontFamily: 'var(--font-mono)',
                            }}
                          >
                            <span>Inspect behavioral pattern</span>
                            <ArrowRight size={11} />
                          </Link>
                        )}
                      </div>

                      {/* Dismiss button */}
                      <button
                        type="button"
                        onClick={e => dismissNotification(item.id, e)}
                        title="Dismiss"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-3)',
                          cursor: 'pointer',
                          padding: '3px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0.6,
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.opacity = '1'
                          e.currentTarget.style.color = 'var(--text)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.opacity = '0.6'
                          e.currentTarget.style.color = 'var(--text-3)'
                        }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* Empty State When There Are No Notifications */
              <div style={{
                padding: '36px 24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'rgba(62, 207, 142, 0.1)',
                  border: '1px solid rgba(62, 207, 142, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--green)',
                  boxShadow: '0 0 16px rgba(62, 207, 142, 0.15)',
                }}>
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                    All Caught Up
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.5, maxWidth: '270px', margin: '0 auto' }}>
                    No new alerts. You are currently trading within all defined behavioral risk parameters and session rules.
                  </p>
                </div>
                <Link
                  href="/goals"
                  onClick={() => setIsOpen(false)}
                  style={{
                    marginTop: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--accent)',
                    textDecoration: 'none',
                    fontFamily: 'var(--font-mono)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  Review Trading Rules & Limits →
                </Link>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '10px 16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'rgba(10, 11, 14, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
              TraderMind Engine v1.0
            </span>
            <Link
              href="/goals"
              onClick={() => setIsOpen(false)}
              style={{
                fontSize: '11px',
                color: 'var(--text-2)',
                textDecoration: 'none',
                fontFamily: 'var(--font-mono)',
              }}
            >
              Preferences
            </Link>
          </div>
        </div>
      )}

      <style>{`
        @keyframes notifDropdownFade {
          from {
            opacity: 0;
            transform: translateY(-6px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  )
}
