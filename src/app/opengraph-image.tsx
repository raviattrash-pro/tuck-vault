import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Tuck — Your Personal Space';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          backgroundColor: '#1E1B4B',
          backgroundImage: 'radial-gradient(circle at 25px 25px, #312E81 2%, transparent 0%), radial-gradient(circle at 75px 75px, #312E81 2%, transparent 0%)',
          backgroundSize: '100px 100px',
          padding: '80px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '24px',
              backgroundColor: '#4F46E5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontSize: '40px',
              fontWeight: 900,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
            }}
          >
            ☵
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: '52px',
                fontWeight: 900,
                color: '#FFFFFF',
                letterSpacing: '-2px',
              }}
            >
              tuck
            </span>
            <span
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#A5B4FC',
                textTransform: 'uppercase',
                letterSpacing: '2px',
              }}
            >
              Personal Vault &amp; Notes
            </span>
          </div>
        </div>

        {/* Center Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '900px' }}>
          <h1
            style={{
              fontSize: '48px',
              fontWeight: 900,
              color: '#FFFFFF',
              lineHeight: 1.2,
              margin: 0,
              letterSpacing: '-1px',
            }}
          >
            A place for the things that make up your life.
          </h1>
          <p
            style={{
              fontSize: '24px',
              color: '#C7D2FE',
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            Encrypted Document Vault &middot; Daily Checklists &middot; Budgets &middot; Curated Links
          </p>
        </div>

        {/* Bottom Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              padding: '12px 24px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid #34D399',
              color: '#A7F3D0',
              fontSize: '18px',
              fontWeight: 700,
            }}
          >
            🔒 AES-256 Vault
          </div>
          <div
            style={{
              padding: '12px 24px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(99, 102, 241, 0.2)',
              border: '1px solid #818CF8',
              color: '#E0E7FF',
              fontSize: '18px',
              fontWeight: 700,
            }}
          >
            ⚡ 100% Offline-First
          </div>
          <div
            style={{
              padding: '12px 24px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              border: '1px solid #FBBF24',
              color: '#FDE68A',
              fontSize: '18px',
              fontWeight: 700,
            }}
          >
            ☁️ Supabase Cloud Sync
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
