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
          justifyContent: 'space-between',
          padding: '72px 84px',
          background: 'linear-gradient(135deg, #fff6eb 0%, #f6efe6 44%, #efe4d6 100%)',
          color: '#181412'
        }}
      >
        <div style={{ width: '48%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ fontSize: 28, letterSpacing: 4, textTransform: 'uppercase', color: '#68594d' }}>kinelo.fit</div>
            <div style={{ fontSize: 86, lineHeight: 0.98, fontWeight: 700 }}>App installabile per Palermo</div>
            <div style={{ fontSize: 36, lineHeight: 1.35, color: '#68594d' }}>
              Apri il calendario cittadino, passa dalla mappa agli studi e torna subito nella tua agenda salvata.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 18 }}>
            {['Lezioni', 'Studi', 'Agenda'].map((label) => (
              <div key={label} style={{ padding: '18px 24px', borderRadius: 999, background: '#ffffff', fontSize: 30 }}>{label}</div>
            ))}
          </div>
        </div>
        <div style={{ width: '42%', display: 'flex', alignItems: 'stretch' }}>
          <div style={{ flex: 1, borderRadius: 40, padding: 28, background: 'rgba(255,255,255,0.82)', boxShadow: '0 24px 70px rgba(76,41,23,0.12)', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ height: 220, borderRadius: 28, background: 'linear-gradient(145deg, #d4dfd0, #4a5d4e)' }} />
            <div style={{ fontSize: 42, fontWeight: 700 }}>Palermo hub</div>
            <div style={{ display: 'grid', gap: 14 }}>
              {['Mappa e quartieri', 'Studi con profilo', 'Condivisione singole classi'].map((row) => (
                <div key={row} style={{ fontSize: 30, color: '#68594d' }}>{row}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1600, height: 900 }
  );
}
