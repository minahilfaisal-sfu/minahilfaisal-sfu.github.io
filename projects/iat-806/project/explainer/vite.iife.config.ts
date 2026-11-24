import { defineConfig } from 'vite'

// Single-file build for a plain <script> tag. Exposes window.Explainer.
// biome-ignore lint/style/noDefaultExport: vite expects a default export
export default defineConfig({
  build: {
    target: 'es2020',
    sourcemap: true,
    emptyOutDir: false,
    lib: {
      entry: 'src/browser.ts',
      name: 'Explainer',
      formats: ['iife'],
      fileName: () => 'explainer.iife.js',
    },
  },
})
