import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { defineConfig } from 'vite';

// DEV ONLY: vite-plugin-mkcert enables HTTPS on the Vite dev server.
//
// iOS Safari (and other browsers) require HTTPS for ES module loading on
// non-localhost origins (LAN IPs and Tailscale IPs). mkcert installs a local
// certificate authority into the system keychain so the certificate is trusted
// automatically by desktop browsers. On iOS, Tim must install the certificate
// manually — see the manual step at the bottom of this file.
//
// This plugin has zero effect on the production build. The GitHub Pages
// deployment is served over HTTPS by GitHub's own infrastructure.
//
// The plugin is deliberately excluded when Vitest is running (VITEST=true)
// so that `npm test` does not attempt keychain writes or certificate generation.
//
// Manual step for iOS trust (required once, before first HTTPS dev session):
// 1. In your terminal, run: mkcert -install
//    (If mkcert is not yet installed: brew install mkcert, then mkcert -install)
//    mkcert -install may require sudo for the keychain write:
//      sudo mkcert -install
// 2. Find the root CA file: mkcert -CAROOT prints the directory.
//    The file is rootCA.pem inside that directory.
// 3. AirDrop rootCA.pem to the iPhone, or share it via iCloud or email.
// 4. On iPhone: open Settings, then General, then VPN and Device Management.
//    Locate the downloaded certificate and tap Install.
// 5. Open Settings, then General, then About, then Certificate Trust Settings.
//    Enable full trust for the mkcert certificate authority.
// 6. Restart the Vite dev server (Sonja will do this if it is already running).
//    The dev URL changes from http:// to https://.
// 7. On iPhone Safari, navigate to the https:// address (same port, 5174).
//    The module script tag will load without the "failed to load" error.
import mkcert from 'vite-plugin-mkcert';

// Guard: only load the mkcert plugin when running `vite dev` or `vite serve`,
// not during `vite build`, `vite preview`, or `vitest run`.
const isVitestRun = Boolean(process.env['VITEST']);

// Read version from package.json (evaluated once at config load time).
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

// Get the git short hash (seven characters). Graceful fallback to 'dev' when
// the build runs outside a git repository (e.g. in a CI sandbox without git).
let gitHash = 'dev';
try {
  gitHash = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { stdio: 'pipe' }).toString().trim();
} catch { /* not in a git repo */ }

// Build-time plugin: replaces the VERSION placeholder in dist/sw.js with
// '<package-version>-<git-short-hash>' on every build, so each deployment
// produces a unique service worker cache key and browsers evict stale caches.
// Runs only during `vite build`; has no effect in dev or preview.
const swVersionPlugin = {
  name: 'sw-version',
  writeBundle(options) {
    const swFile = path.join(options.dir, 'sw.js');
    if (fs.existsSync(swFile)) {
      let content = fs.readFileSync(swFile, 'utf8');
      content = content.replace(
        /const VERSION = '[^']*'/,
        `const VERSION = '${pkg.version}-${gitHash}'`
      );
      fs.writeFileSync(swFile, content);
    }
  },
};

export default defineConfig(({ command }) => ({
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

  // Development server on port 5174 (not 8000, which is reserved for JNS).
  // HTTPS is enabled in dev mode only via vite-plugin-mkcert so iOS Safari
  // accepts ES module fetches over LAN and Tailscale IPs. In production,
  // GitHub Pages provides HTTPS natively.
  server: {
    port: 5174,
    // mkcert is activated by the plugin below; no manual https: {} config needed.
  },

  plugins: [
    // Enable HTTPS on the dev server for iOS Safari module loading.
    // vite-plugin-mkcert reads the mkcert-generated certificate from the
    // mkcert CA root directory and configures Vite's server.https automatically.
    // It has no effect when `vite build` or `vite preview` runs, and is
    // excluded entirely during `vitest run` via the VITEST guard above.
    ...(command === 'serve' && !isVitestRun ? [mkcert()] : []),
    // Inject the git-hash-stamped VERSION into dist/sw.js at build time so
    // each deployment produces a unique service worker cache key.
    ...(command === 'build' ? [swVersionPlugin] : []),
  ],
}));
