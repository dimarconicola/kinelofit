import { readFile } from 'node:fs/promises';

import { validateImportCsv } from '@/lib/catalog/import-validator';

const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: tsx scripts/validate-import.ts <csv-file>');
  process.exit(1);
}

const main = async () => {
  const raw = await readFile(filePath, 'utf8');
  const result = validateImportCsv(raw);

  if (!result.ok) {
    console.error(`Import invalid: ${result.rows} rows checked.`);
    result.errors.forEach((issue) => {
      console.error(`ERROR row ${issue.row}${issue.field ? ` (${issue.field})` : ''}: ${issue.message}`);
    });
    result.warnings.forEach((issue) => {
      console.error(`WARN row ${issue.row}${issue.field ? ` (${issue.field})` : ''}: ${issue.message}`);
    });
    process.exit(1);
  }

  console.log(`Import valid: ${result.rows} rows, ${result.headers.length} columns.`);
  if (result.warnings.length > 0) {
    result.warnings.forEach((issue) => {
      console.warn(`WARN row ${issue.row}${issue.field ? ` (${issue.field})` : ''}: ${issue.message}`);
    });
  }
};

void main();
