import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const alt = 'Mentora | Modern Learning Management System';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #4f46e5, #ec4899)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'white',
            borderRadius: '24px',
            padding: '40px 60px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontWeight: 800,
              color: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              letterSpacing: '-0.05em',
            }}
          >
            Mentora
            <span style={{ color: '#4f46e5', marginLeft: '12px' }}>LMS</span>
          </div>
        </div>
        <div
          style={{
            marginTop: '40px',
            fontSize: 40,
            color: 'white',
            fontWeight: 600,
            textAlign: 'center',
            letterSpacing: '-0.02em',
          }}
        >
          Modern Learning Management System
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
