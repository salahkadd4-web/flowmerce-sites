import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// Tests unitaires : rapides, sans base de données.
// Les tests d'intégration (*.int.test.ts) ont leur propre configuration.
const ROOT = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['node_modules', '.next', '**/*.int.test.ts'],
  },
  resolve: {
    // Une seule copie de React : sous Windows, un terminal ouvert en « c:\ » (minuscule)
    // donne deux chemins au même module, et les hooks échouent (« reading 'useState' »).
    dedupe: ['react', 'react-dom'],
    alias: {
      'next/image': fileURLToPath(new URL('./test/next-image-stub.tsx', import.meta.url)),
      'next/font/google': fileURLToPath(new URL('./test/next-font-stub.ts', import.meta.url)),
      'next/navigation':fileURLToPath(new URL('./test/next-navigation-stub.ts', import.meta.url)),
      '@': ROOT,
    },
  },
})
