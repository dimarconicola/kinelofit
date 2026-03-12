import test from 'node:test';
import assert from 'node:assert/strict';

import { evaluateAdapterAutoReverify, parseSourceWithAdapter } from '@/lib/freshness/adapters';

test('Rishi adapter parses weekday slots from timetable table HTML', () => {
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

  const parsed = parseSourceWithAdapter('https://www.centroculturarishi.it/corsi/', html);
  assert.equal(parsed.adapterId, 'rishi-corsi');
  assert.ok(parsed.sessions.some((item) => item.title === 'Soft Yoga' && item.weekday === 'Monday' && item.startTime === '18:15'));
  assert.ok(parsed.sessions.some((item) => item.title === 'Soft Yoga' && item.weekday === 'Wednesday' && item.startTime === '18:15'));
  assert.ok(parsed.sessions.some((item) => item.title === 'Canto Sacro' && item.weekday === 'Tuesday' && item.startTime === '20:15' && item.endTime === '21:15'));
});

test('Taiji adapter parses known recurring timetable lines', () => {
  const html = `
    <p>Taiji Studio - via Selinunte 11 - lunedi, mercoledi e venerdi h8,30 e 19,00 oppure lunedi e venerdi h10,00</p>
    <p>Qi Gong</p>
    <p>Villa Trabia - sabato h10,00</p>
    <p>Taiji Studio - via Selinunte 11 - lunedi e venerdi 18,00</p>
  `;

  const parsed = parseSourceWithAdapter('https://www.taijistudiopalermo.it/', html);
  assert.equal(parsed.adapterId, 'taiji-home');
  assert.ok(parsed.sessions.some((item) => item.title === 'Taijiquan' && item.weekday === 'Monday' && item.startTime === '08:30'));
  assert.ok(parsed.sessions.some((item) => item.title === 'Taijiquan' && item.weekday === 'Friday' && item.startTime === '19:00'));
  assert.ok(parsed.sessions.some((item) => item.title === 'Qi Gong' && item.weekday === 'Saturday' && item.startTime === '10:00'));
  assert.ok(parsed.sessions.some((item) => item.title === 'Qi Gong' && item.weekday === 'Monday' && item.startTime === '18:00'));
});

test('Barbara Wix adapter parses schedule blocks and strips instructor suffix', () => {
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

  const parsed = parseSourceWithAdapter('https://www.barbarafaludiyoga.com/corsi-in-studio', html);
  assert.equal(parsed.adapterId, 'barbara-wix');
  assert.equal(parsed.sessions.length, 4);
  assert.ok(parsed.sessions.some((item) => item.weekday === 'Monday' && item.startTime === '09:00' && item.title === 'Hatha Yoga'));
  assert.ok(parsed.sessions.some((item) => item.weekday === 'Tuesday' && item.startTime === '11:00' && item.title === 'Vinyasa'));
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
