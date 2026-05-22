import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      setupFiles: ['./src/test-setup.ts'],
      env: {
        VITE_FIREBASE_API_KEY: 'mock-api-key',
        VITE_FIREBASE_AUTH_DOMAIN: 'mock-auth-domain',
        VITE_FIREBASE_PROJECT_ID: 'mock-project-id',
        VITE_FIREBASE_STORAGE_BUCKET: 'mock-storage-bucket',
        VITE_FIREBASE_MESSAGING_SENDER_ID: 'mock-sender-id',
        VITE_FIREBASE_APP_ID: 'mock-app-id',
        VITE_FIREBASE_MEASUREMENT_ID: 'mock-measurement-id',
      },
    },
  }),
)
