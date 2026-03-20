import { getCatalogSnapshot } from '@/lib/catalog/repository';

const citySlug = (process.argv[2] ?? 'palermo').toLowerCase();

const pct = (value: number, total: number) => (total === 0 ? '0.0%' : `${((value / total) * 100).toFixed(1)}%`);

async function main() {
  const snapshot = await getCatalogSnapshot();
  const sessions = snapshot.sessions.filter((session) => session.citySlug === citySlug);
  const venues = snapshot.venues.filter((venue) => venue.citySlug === citySlug);
  const kids = sessions.filter((session) => session.categorySlug === 'kids-activities');
  const priced = sessions.filter((session) => Boolean(session.priceNote?.it || session.priceNote?.en));
  const attendanceTagged = sessions.filter((session) => Boolean(session.attendanceModel));
  const venueLevelSources = new Set(venues.map((venue) => venue.sourceUrl));

  const byAttendance = Object.fromEntries(
    ['drop_in', 'trial', 'cycle', 'term'].map((model) => [model, sessions.filter((session) => session.attendanceModel === model).length])
  );

  const kidsAgeTagged = kids.filter((session) => typeof session.ageMin === 'number' && typeof session.ageMax === 'number');

  console.log(JSON.stringify({
    citySlug,
    sourceMode: snapshot.sourceMode,
    totals: {
      venues: venues.length,
      sessions: sessions.length,
      kidsSessions: kids.length,
      venueSources: venueLevelSources.size
    },
    coverage: {
      pricing: {
        sessions: priced.length,
        percent: pct(priced.length, sessions.length)
      },
      attendanceModel: {
        sessions: attendanceTagged.length,
        percent: pct(attendanceTagged.length, sessions.length),
        byAttendance
      },
      kidsAgeRanges: {
        sessions: kidsAgeTagged.length,
        percent: pct(kidsAgeTagged.length, kids.length)
      }
    }
  }, null, 2));
}

void main();
