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
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '96px 84px',
          background: 'linear-gradient(180deg, #fff6eb 0%, #f6efe6 48%, #efe4d6 100%)',
          color: '#181412'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div style={{ fontSize: 42, letterSpacing: 4, textTransform: 'uppercase', color: '#68594d' }}>kinelo.fit</div>
          <div style={{ fontSize: 128, lineHeight: 0.95, fontWeight: 700 }}>Il calendario wellness di Palermo</div>
          <div style={{ fontSize: 54, lineHeight: 1.35, color: '#68594d' }}>
            Lezioni, studi e agenda salvata in una app leggera da aprire direttamente dalla home.
          </div>
        </div>
        <div style={{ display: 'grid', gap: 24 }}>
          {['Lezioni verificate', 'Mappa città', 'Agenda personale'].map((label) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '28px 32px', borderRadius: 36, background: 'rgba(255,255,255,0.7)' }}>
              <div style={{ width: 18, height: 18, borderRadius: 999, background: '#ff704a' }} />
              <div style={{ fontSize: 42 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1179, height: 2556 }
  );
}
