import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          environment: 'jsdom',
          globals: true,
          include: ['src/**/*.test.ts?(x)'],
          name: 'client',
        },
      },
      {
        extends: true,
        test: {
          environment: 'node',
          globals: true,
          include: ['server/**/*.test.ts'],
          name: 'server',
        },
      },
    ],
  },
});
