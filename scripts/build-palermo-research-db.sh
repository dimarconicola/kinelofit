#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SQL_PATH="$ROOT_DIR/data/research/palermo_research.sql"
DB_PATH="$ROOT_DIR/data/research/palermo_research.sqlite"

mkdir -p "$ROOT_DIR/data/research"
rm -f "$DB_PATH"
sqlite3 "$DB_PATH" < "$SQL_PATH"
echo "Built $DB_PATH"
"$ROOT_DIR/scripts/report-palermo-research-db.sh"
