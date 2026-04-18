import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    exclude: ['**/node_modules/**', '**/e2e/**'],
    coverage: {
      reporter: ['text', 'lcov', 'json', 'html'],
      include: ['src/lib/**'],
      thresholds: {
        global: {
          lines: 50,
          functions: 50,
          branches: 50,
          statements: 50,
        },
        perFile: false,
        autoUpdate: true,
      },
    },
    testTimeout: 10000,
    hookTimeout: 30000,
    retry: 2,
    passWithNoTests: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
