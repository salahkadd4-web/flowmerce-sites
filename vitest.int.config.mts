import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// Tests d'intégration : base PostgreSQL de test (.env.test), un fichier à la fois
// pour que les remises à zéro de la base ne se marchent pas dessus.
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.int.test.ts'],
    exclude: ['node_modules', '.next'],
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
})
