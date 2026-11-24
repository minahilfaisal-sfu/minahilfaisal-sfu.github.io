import { defineConfig } from 'vitest/config'

// biome-ignore lint/style/noDefaultExport: vite expects a default export
export default defineConfig({
  test: {
    watch: false,
    environment: 'happy-dom',
    mockReset: true,
    restoreMocks: true,
    unstubGlobals: true,
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/browser.ts', 'src/**/*.spec.ts'],
    },
  },
})
