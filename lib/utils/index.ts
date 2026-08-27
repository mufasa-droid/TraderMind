import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO, startOfWeek, startOfMonth, subMonths, subWeeks } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── FORMATTERS ────────────────────────────────────────────────
export function formatCurrency(value: number, currency = 'USD'): string {
  const abs = Math.abs(value)
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(abs)
  return value < 0 ? `-${formatted}` : formatted
}

export function formatPnl(value: number): string {
  const formatted = formatCurrency(value)
  return value >= 0 ? `+${formatted}` : formatted
}

export function formatPct(value: number, decimals = 1): string {
  return `${value >= 0 ? '' : ''}${value.toFixed(decimals)}%`
}

export function formatRR(value: number): string {
  return `${value.toFixed(1)}R`
}

export function formatScore(value: number): string {
  return `${Math.round(value)}`
}

export function scoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-400'
  if (score >= 55) return 'text-amber-400'
  return 'text-red-400'
}

export function scoreBgColor(score: number): string {
  if (score >= 75) return 'bg-emerald-400/10 text-emerald-400'
  if (score >= 55) return 'bg-amber-400/10 text-amber-400'
  return 'bg-red-400/10 text-red-400'
}

export function pnlColor(value: number): string {
  return value >= 0 ? 'text-emerald-400' : 'text-red-400'
}

export function riskLevelColor(level: string): string {
  switch (level) {
    case 'low': return 'text-emerald-400'
    case 'medium': return 'text-amber-400'
    case 'high': return 'text-orange-400'
    case 'critical': return 'text-red-400'
    default: return 'text-slate-400'
  }
}

export function flagSeverityColor(severity: string): string {
  switch (severity) {
    case 'high': return 'bg-red-500'
    case 'medium': return 'bg-amber-500'
    case 'low': return 'bg-emerald-500'
    default: return 'bg-slate-500'
  }
}

export function emotionColor(emotion: string): string {
  switch (emotion) {
    case 'calm':
    case 'focused': return 'text-emerald-400'
    case 'overconfident':
    case 'fomo': return 'text-amber-400'
    case 'fearful':
    case 'revenge_trading':
    case 'stressed': return 'text-red-400'
    default: return 'text-slate-400'
  }
}

export function emotionLabel(emotion: string): string {
  const labels: Record<string, string> = {
    calm: 'Calm',
    focused: 'Focused',
    fearful: 'Fearful',
    revenge_trading: 'Revenge',
    fomo: 'FOMO',
    overconfident: 'Overconfident',
    hesitant: 'Hesitant',
    stressed: 'Stressed',
    neutral: 'Neutral',
  }
  return labels[emotion] ?? emotion
}

export function flagTypeLabel(flag: string): string {
  return flag.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function sessionLabel(session: string): string {
  const labels: Record<string, string> = {
    asian: 'Asian',
    london: 'London',
    new_york: 'New York',
    overlap: 'Overlap',
  }
  return labels[session] ?? session
}

export function sessionTime(session: string): string {
  const times: Record<string, string> = {
    asian: '00:00–08:00 UTC',
    london: '08:00–12:00 UTC',
    overlap: '12:00–16:00 UTC',
    new_york: '16:00–22:00 UTC',
  }
  return times[session] ?? ''
}

// ── DATE HELPERS ──────────────────────────────────────────────
export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM d, yyyy')
}

export function formatDateTime(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM d, HH:mm')
}

export function formatRelative(dateStr: string): string {
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true })
}

export function getDateRange(label: '1W' | '1M' | '3M' | 'YTD' | 'ALL') {
  const now = new Date()
  switch (label) {
    case '1W':
      return { start: subWeeks(now, 1).toISOString(), end: now.toISOString() }
    case '1M':
      return { start: subMonths(now, 1).toISOString(), end: now.toISOString() }
    case '3M':
      return { start: subMonths(now, 3).toISOString(), end: now.toISOString() }
    case 'YTD':
      return { start: new Date(now.getFullYear(), 0, 1).toISOString(), end: now.toISOString() }
    case 'ALL':
    default:
      return { start: new Date(2020, 0, 1).toISOString(), end: now.toISOString() }
  }
}

export function detectTradingSession(timestamp: string | Date): 'asian' | 'london' | 'new_york' | 'overlap' {
  const d = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  const hour = d.getUTCHours()
  // Discrete buckets — no shadowing:
  //  08-12 London, 12-16 Overlap, 16-22 New York, else Asian
  if (hour >= 12 && hour < 16) return 'overlap'
  if (hour >= 8 && hour < 12) return 'london'
  if (hour >= 16 && hour < 22) return 'new_york'
  return 'asian'
}

// ── NUMBER HELPERS ────────────────────────────────────────────
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}
