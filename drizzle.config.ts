import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/data/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@127.0.0.1:54322/postgres'
  }
});
