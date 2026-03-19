import path from 'path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    include: ['tests/components/**/*.test.tsx', 'tests/api/**/*.test.ts', 'tests/api/**/*.test.tsx', 'tests/lib/**/*.test.ts', 'tests/lib/**/*.test.tsx'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.{ts,tsx}',
        '**/types.ts',
        'next-env.d.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      'next/link': path.resolve(__dirname, './tests/mocks/next-link.tsx'),
      'next/navigation': path.resolve(__dirname, './tests/mocks/next-navigation.ts')
    }
  }
});
