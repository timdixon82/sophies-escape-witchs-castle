import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages sub-path. Change to '/' if a custom domain is attached (ADR 009).
  base: '/sophies-escape-witchs-castle/',

  build: {
    // Target browsers named in NFR-BROWSER-01: Chrome 120+, Safari 17+, Firefox 120+, Edge 120+.
    target: 'es2022',

    // Do not inline assets as data URIs; every asset must be a real file so the
    // service worker can cache it by URL (ADR 008).
    assetsInlineLimit: 0,

    outDir: 'dist',

    rollupOptions: {
      input: 'index.html',
    },
  },

  // Web Workers use ES module format (ADR 009).
  worker: {
    format: 'es',
  },

  // Development server on port 5173 (not 8000, which is reserved for JNS).
  server: {
    port: 5173,
  },
});
