import { defineConfig } from 'vitest/config'
import path from 'path'

// Tests unitaires : rapides, sans base de données.
// Les tests d'intégration (*.int.test.ts) ont leur propre configuration.
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['node_modules', '.next', '**/*.int.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
