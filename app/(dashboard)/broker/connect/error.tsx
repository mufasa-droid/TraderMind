'use client'

export default function Error({
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
    }}>
      <div style={{ fontSize: '32px' }}>⚠</div>
      <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>
        Something went wrong
      </h2>
      <p style={{ fontSize: '14px', color: 'var(--text-2)', maxWidth: '400px', textAlign: 'center' }}>
        {error.message}
      </p>
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
    </div>
  )
}
