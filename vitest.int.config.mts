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
      // Polices : téléchargées par Next à la construction, pas dans un test.
      'next/font/google': fileURLToPath(new URL('./test/next-font-stub.ts', import.meta.url)),
      '@':fileURLToPath(new URL('.', import.meta.url)),
    },
  },
})
