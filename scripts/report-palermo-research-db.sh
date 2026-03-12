#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DB_PATH="$ROOT_DIR/data/research/palermo_research.sqlite"

if [[ ! -f "$DB_PATH" ]]; then
  echo "Missing database: $DB_PATH" >&2
  exit 1
fi

sqlite3 -header -column "$DB_PATH" "
SELECT COUNT(*) AS venues FROM venues;
SELECT COUNT(*) AS instructors FROM instructors;
SELECT COUNT(*) AS offerings FROM offerings;
SELECT COUNT(*) AS schedules FROM schedules;
SELECT verification_level, listing_status, COUNT(*) AS venue_count
FROM venues
GROUP BY verification_level, listing_status
ORDER BY verification_level, listing_status;
SELECT name, offerings_count, instructors_count, schedule_count, verification_level, listing_status
FROM venue_rollup
ORDER BY CASE listing_status
  WHEN 'current' THEN 0
  WHEN 'unknown' THEN 1
  WHEN 'lead' THEN 2
  ELSE 3
END, offerings_count DESC, schedule_count DESC
LIMIT 12;
"
