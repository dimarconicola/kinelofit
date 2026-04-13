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
            width: 360,
            height: 360,
            borderRadius: 112,
            background: 'linear-gradient(145deg, #ff704a, #1f6f7a)',
            boxShadow: '0 36px 90px rgba(31,111,122,0.24)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff6eb',
            fontSize: 180,
            fontWeight: 700
          }}
        >
          k
        </div>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
