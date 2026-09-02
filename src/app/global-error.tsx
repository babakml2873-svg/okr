'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="fa" dir="rtl">
      <body
        style={{
          display: 'flex',
          minHeight: '100dvh',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          fontFamily: 'system-ui, sans-serif',
          padding: '1.5rem',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>خطای غیرمنتظره</h1>
        <p style={{ color: '#6b7280', maxWidth: '28rem', lineHeight: 1.8 }}>
          مشکلی در بارگذاری برنامه پیش آمد. لطفاً دوباره تلاش کنید.
          {error.digest ? ` (کد خطا: ${error.digest})` : ''}
        </p>
        <button
          onClick={reset}
          style={{
            background: '#4f46e5',
            color: '#fff',
            border: 0,
            borderRadius: '0.5rem',
            padding: '0.6rem 1.4rem',
            fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          تلاش مجدد
        </button>
      </body>
    </html>
  )
}
