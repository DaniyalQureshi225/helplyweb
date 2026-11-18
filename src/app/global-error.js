'use client';

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', background: '#FAFAF7', color: '#10233D' }}>
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
          <div style={{ maxWidth: 480, textAlign: 'center' }}>
            <p style={{ letterSpacing: '0.2em', fontWeight: 700 }}>HELPY</p>
            <h1 style={{ fontSize: 28, margin: '16px 0 8px' }}>The app could not start.</h1>
            <p style={{ color: '#61728a', fontSize: 14, lineHeight: 1.6 }}>
              Please reload the page. If the problem continues, contact HELPY support.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: 24,
                padding: '12px 20px',
                borderRadius: 12,
                border: 'none',
                background: '#10233D',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reload
            </button>
            {error?.digest ? (
              <p style={{ marginTop: 24, fontSize: 11, color: '#8b98ab' }}>Reference: {error.digest}</p>
            ) : null}
          </div>
        </main>
      </body>
    </html>
  );
}
