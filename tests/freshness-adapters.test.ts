import test from 'node:test';
import assert from 'node:assert/strict';

import { evaluateAdapterAutoReverify, parseSourceWithAdapter } from '@/lib/freshness/adapters';
import { extractDiariaCalendarImageUrls, matchDiariaSignalsFromOcrText } from '@/lib/freshness/diaria-ocr';

test('Rishi adapter parses weekday slots from timetable table HTML', async () => {
  const html = `
    <table>
      <tr><td>CORSO</td><td>LUN</td><td>MAR</td><td>MER</td><td>GIO</td><td>VEN</td></tr>
      <tr>
        <td><strong>Soft Yoga</strong></td>
        <td>18.15</td><td>-</td><td>18.15</td><td>-</td><td>-</td>
      </tr>
      <tr>
        <td><strong>Canto Sacro</strong></td>
        <td>-</td><td>20.15-21.15</td><td>-</td><td>-</td><td>-</td>
      </tr>
    </table>
  `;

  const parsed = await parseSourceWithAdapter('https://www.centroculturarishi.it/corsi/', html);
  assert.equal(parsed.adapterId, 'rishi-corsi');
  assert.ok(parsed.sessions.some((item) => item.title === 'Soft Yoga' && item.weekday === 'Monday' && item.startTime === '18:15'));
  assert.ok(parsed.sessions.some((item) => item.title === 'Soft Yoga' && item.weekday === 'Wednesday' && item.startTime === '18:15'));
  assert.ok(parsed.sessions.some((item) => item.title === 'Canto Sacro' && item.weekday === 'Tuesday' && item.startTime === '20:15' && item.endTime === '21:15'));
});

test('Taiji adapter parses known recurring timetable lines', async () => {
  const html = `
    <p>Taiji Studio - via Selinunte 11 - lunedi, mercoledi e venerdi h8,30 e 19,00 oppure lunedi e venerdi h10,00</p>
    <p>Qi Gong</p>
    <p>Villa Trabia - sabato h10,00</p>
    <p>Taiji Studio - via Selinunte 11 - lunedi e venerdi 18,00</p>
  `;

  const parsed = await parseSourceWithAdapter('https://www.taijistudiopalermo.it/', html);
  assert.equal(parsed.adapterId, 'taiji-home');
  assert.ok(parsed.sessions.some((item) => item.title === 'Taijiquan' && item.weekday === 'Monday' && item.startTime === '08:30'));
  assert.ok(parsed.sessions.some((item) => item.title === 'Taijiquan' && item.weekday === 'Friday' && item.startTime === '19:00'));
  assert.ok(parsed.sessions.some((item) => item.title === 'Qi Gong' && item.weekday === 'Saturday' && item.startTime === '10:00'));
  assert.ok(parsed.sessions.some((item) => item.title === 'Qi Gong' && item.weekday === 'Monday' && item.startTime === '18:00'));
});

test('Barbara Wix adapter parses schedule blocks and strips instructor suffix', async () => {
  const html = `
    <html>
      <head>
        <style>.dummy { color: red; }</style>
        <script>window.debug = true;</script>
      </head>
      <body>
        <p>Luned&igrave;</p>
        <p>09:00 Hatha Yoga con Barbara</p>
        <p>19:30 Vinyasa Yoga con Domenico</p>
        <p>Marted&igrave;</p>
        <p>11.00 Vinyasa con Veronica</p>
        <p>19:30 Vinyasa Yoga con Claudia</p>
        <h2>Lo staff</h2>
        <p>Barbara Faludi</p>
      </body>
    </html>
  `;

  const parsed = await parseSourceWithAdapter('https://www.barbarafaludiyoga.com/corsi-in-studio', html);
  assert.equal(parsed.adapterId, 'barbara-wix');
  assert.equal(parsed.sessions.length, 4);
  assert.ok(parsed.sessions.some((item) => item.weekday === 'Monday' && item.startTime === '09:00' && item.title === 'Hatha Yoga'));
  assert.ok(parsed.sessions.some((item) => item.weekday === 'Tuesday' && item.startTime === '11:00' && item.title === 'Vinyasa'));
});

test('Diaria image URL extraction finds the published timetable boards', () => {
  const html = `
    <img src="https://www.diariapalermo.org/new-site/wp-content/uploads/2026/02/Calendario-25-26-yoga-pilates-e1770384364589.png" />
    <img src="https://www.diariapalermo.org/new-site/wp-content/uploads/2026/02/caelndario-25-26-adulti-e-bambini.png" />
  `;

  const urls = extractDiariaCalendarImageUrls(html);
  assert.equal(urls.length, 2);
  assert.ok(urls[0].includes('Calendario-25-26-yoga-pilates'));
  assert.ok(urls[1].includes('adulti-e-bambini'));
});

test('Diaria OCR matcher emits adult and timetable signals from captured text', () => {
  const texts = [
    `
      GYROKINESIS Alessandra 9.00-10.00 SALA VENEZIA
      TAI CHI - QI GONG Laura 9.30-10.30 SALA VENEZIA
      FELDENKRAIS Alessandra 10.00-11.00 SALA VENEZIA
      SOFT PILATES E DANZA SENIOR Emilia 11.00-12.00 SALA VENEZIA
      FUNCTIONAL TRAINING Giuseppe 18.00-19.00 STUDIO GAGINI
      DANZA ADULTA Carlotta 19.40-21.10 STUDIO GAGINI
      CAPOEIRA ADULTA Ceroda 19.00-20.00 SALA VENEZIA
      TEATRO ADULTA Maria Laura 20.30-22.00 SALA VENEZIA
    `,
    `
      MICROWORKOUT PILATES Maja 8.30-9.15 STUDIO GAGINI
      HATHA YOGA Federica 9.00-10.00 STUDIO GAGINI
      PILATES MURO Federica 10.30-11.30 STUDIO GAGINI
      VINYASA YOGA Ceren 18.15-19.15 SALA VENEZIA
      ASHTANGA YOGA Maria Laura 19.30-20.30 SALA VENEZIA
    `
  ];

  const parsed = matchDiariaSignalsFromOcrText(texts);
  assert.ok(parsed.some((item) => item.title === 'Gyrokinesis' && item.startTime === '09:00'));
  assert.ok(parsed.some((item) => item.title === 'Functional Training' && item.startTime === '18:00'));
  assert.ok(parsed.some((item) => item.title === 'Adult Dance' && item.startTime === '19:40'));
  assert.ok(parsed.some((item) => item.title === 'Microworkout Pilates' && item.startTime === '08:30'));
  assert.ok(parsed.some((item) => item.title === 'Vinyasa Yoga' && item.startTime === '18:15'));
});

test('adapter confidence threshold rejects low signal coverage', () => {
  const evaluation = evaluateAdapterAutoReverify(
    {
      minSignals: 10,
      minMatches: 6,
      minMatchRatio: 0.5
    },
    12,
    4
  );

  assert.equal(evaluation.accepted, false);
  assert.equal(evaluation.reason, 'insufficient_matches');
  assert.equal(Number(evaluation.matchRatio.toFixed(2)), 0.33);
});

test('adapter confidence threshold accepts healthy signal coverage', () => {
  const evaluation = evaluateAdapterAutoReverify(
    {
      minSignals: 10,
      minMatches: 6,
      minMatchRatio: 0.5
    },
    14,
    9
  );

  assert.equal(evaluation.accepted, true);
  assert.equal(evaluation.reason, 'accepted');
});
