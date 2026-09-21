'use client'

export default function DashboardLayoutError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '400px', gap: '16px',
      fontFamily: 'var(--font-sans)',
      padding: '32px',
    }}>
      <div style={{ fontSize: '32px' }}>⚠</div>
      <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>
        Something went wrong
      </h2>
      <p style={{ fontSize: '14px', color: 'var(--text-2)', maxWidth: '420px', textAlign: 'center', lineHeight: 1.6 }}>
        {error.message || 'Failed to load dashboard data.'}
      </p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={reset}
          style={{
            padding: '10px 20px', borderRadius: '8px',
            background: 'var(--accent)', border: 'none',
            color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          Try again
        </button>
        <a
          href="/dashboard"
          style={{
            padding: '10px 20px', borderRadius: '8px',
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            color: 'var(--text)', fontSize: '14px', fontWeight: 600, textDecoration: 'none',
          }}
        >
          Reload Demo
        </a>
      </div>
    </div>
  )
}
