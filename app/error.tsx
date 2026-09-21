'use client'

export default function RootError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', gap: '16px',
      fontFamily: 'var(--font-sans)',
      background: 'var(--bg)',
      color: 'var(--text)',
      padding: '24px',
    }}>
      <div style={{ fontSize: '36px' }}>⚠</div>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>
        Something went wrong
      </h2>
      <p style={{ fontSize: '14px', color: 'var(--text-2)', maxWidth: '440px', textAlign: 'center', lineHeight: 1.6 }}>
        {error.message || 'An unexpected error occurred while loading this view.'}
      </p>
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
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
          href="/auth/login"
          style={{
            padding: '10px 20px', borderRadius: '8px',
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            color: 'var(--text)', fontSize: '14px', fontWeight: 600, textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center',
          }}
        >
          Back to Login
        </a>
      </div>
    </div>
  )
}
