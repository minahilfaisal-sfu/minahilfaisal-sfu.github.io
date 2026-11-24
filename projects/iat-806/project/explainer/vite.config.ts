import { defineConfig } from 'vite'

// ESM build for bundlers (npm users) + the proxy handler for servers.
// biome-ignore lint/style/noDefaultExport: vite expects a default export
export default defineConfig({
  build: {
    target: 'es2022',
    sourcemap: true,
    emptyOutDir: false,
    lib: {
      entry: { index: 'src/index.ts', proxy: 'src/server/proxy.ts' },
      formats: ['es'],
    },
  },
})
