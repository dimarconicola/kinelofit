import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff6eb'
        }}
      >
        <div
          style={{
            width: 144,
            height: 144,
            borderRadius: 48,
            background: 'linear-gradient(145deg, #ff704a, #1f6f7a)',
            boxShadow: '0 18px 40px rgba(31,111,122,0.22)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff6eb',
            fontSize: 68,
            fontWeight: 700
          }}
        >
          k
        </div>
      </div>
    ),
    { width: 192, height: 192 }
  );
}
