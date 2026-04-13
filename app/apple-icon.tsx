import { ImageResponse } from 'next/og';

export const contentType = 'image/png';
export const size = { width: 180, height: 180 };

export default function AppleIcon() {
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
            width: 136,
            height: 136,
            borderRadius: 42,
            background: 'linear-gradient(145deg, #ff704a, #1f6f7a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff6eb',
            fontSize: 62,
            fontWeight: 700
          }}
        >
          k
        </div>
      </div>
    ),
    size
  );
}
