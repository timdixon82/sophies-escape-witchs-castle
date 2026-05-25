# Changelog

## [0.3.0](https://github.com/timdixon82/sophies-escape-witchs-castle/compare/v0.2.0...v0.3.0) (2026-05-25)


### Features

* audio stub, analytics, service worker, main.js orchestrator ([adfa565](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/adfa5653605845818194f7ea8f67eb84c33bbd91))
* design tokens, base styles, and overlay styles ([b53d540](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/b53d540fe5a2fd72245ad2204e7a8ff460c6ddcd))
* first-person controller stub (ADR 001, ADR 005) ([10d15ea](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/10d15eaf7754e1cb14d28a4ae236c5231a81ade7))
* game state, reducer, and 17 unit tests (ADR 004) ([855bf08](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/855bf0878e4a40e4c2e41fa0a426404973b24fbe))
* index.html with CSP meta tag and overlay shells HTML ([e0b5150](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/e0b5150eb7ba823e5d78f1e04cd03d31d766c4de))
* input bridge — keyboard, mouse, touch (ADR 005) ([c85d466](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/c85d466d0e3a71a972dd46d451567c0144f4f948))
* overlay controller, inventory panel, hint panel, room data ([373f3c3](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/373f3c3ea130555e71a1ff48e37b83ba486afc7d))
* Three.js engine initialiser with Dungeon Cell room placeholder ([f7e2ada](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/f7e2adad93c117c136045ac4c8e9ff5cbb8a817d))
* **ui:** add help overlay dialog, HUD button, and keyboard shortcuts ([5b9cb9f](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/5b9cb9fd8fa079e6c825e793798abf09d821d5b2))
* v0.1 scaffold (Three.js, first-person stub, overlays, CSP) ([15b62e3](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/15b62e373ea3427cabdbf789f2d9d449d51d02e4))
* v0.1 scaffold (Three.js, first-person stub, overlays, CSP) ([15b62e3](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/15b62e373ea3427cabdbf789f2d9d449d51d02e4))
* **v0.2:** Sophie's Escape v0.2 — ten rooms, full puzzle system, accessibility fixes ([4d3240d](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/4d3240d1bb2b060652f42d4b16a714997cca8a35))


### Bug Fixes

* **a11y:** add &lt;main&gt; landmark and fix S-09 regression (no landmark) ([ecac1c6](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/ecac1c66373936813bbf4984164f4a0c39f104c4))
* **a11y:** resolve four Level A WCAG 2.2 findings and dialog cancel defect ([1835613](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/1835613164c0f412d66eab1898dc2c280969ed23))
* add [open] to overlay CSS selectors so dialogs hide when closed ([#6](https://github.com/timdixon82/sophies-escape-witchs-castle/issues/6)) ([e8112c2](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/e8112c2081ff3d40418f7791fe37335a9a8c676e))
* aria-hidden loading screen on hide; defer canvas focus for VoiceOver ([c24432a](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/c24432a619a55cd214480845d105ef498c642c9e))
* aria-hidden loading screen on hide; defer canvas focus for VoiceOver ([c2d5628](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/c2d56284ae7946ead169f95e40fd5169abfab0b1))
* enforce [hidden]{display:none!important} so loading screen is actually hidden ([cdedf4f](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/cdedf4f89afbdd07165e9a3d6a3343f06bae3b2f))
* **graphics:** raise room ambient lighting and lighten wall colours ([e0bef55](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/e0bef55366e7c5b9040b6d3b9fd10871d7ffb8b1))
* **graphics:** raise room ambient lighting and lighten wall colours; add help screen ([0415b26](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/0415b262a416d50d2665a5ef8b8cf2cc5ef8b704))
* guard ResizeObserver against zero-dimension canvas on hidden load ([667c2d6](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/667c2d606c4e266818ebb2787b80fc6cf04b361a))
* **ios:** add global error handler and boot timeout for iOS Safari diagnostics ([beb23d8](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/beb23d8b06727a58dffe5c147269f5d4bfecb2c6))
* **ios:** add onerror to module script tag to close silent-failure gap ([4f55bb9](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/4f55bb9c74b452bfea7c8f3ff6aad72c9a90ef6b))
* **ios:** add step-by-step boot logging to surface hang location on iOS Safari ([d9acc27](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/d9acc2750acc88498ecf1fdd59e00283bb24893c))
* **ios:** enable HTTPS on the Vite dev server for iOS Safari module loading ([095e624](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/095e624566ec97b68913a883513414365d9badda))
* **ios:** fix three root causes of loading screen hang on iOS Safari ([fb3b0f0](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/fb3b0f0e8ab2b0093a6112eef4b33494a1ae1637))
* **ios:** move diagnostic to pre-module inline script; add dev cache-control ([f313285](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/f3132859b46305d37dff172be9b219577ce8818c))
* route New Game through overlay controller; collapse diagnostics to top-left icon ([6a34fca](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/6a34fca92847759b39cddde322f1353eb0af2832))
* route New Game through overlay controller; collapse diagnostics to top-left icon ([e14c3b0](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/e14c3b073373dfde0d908ac9efef5f9b74edfc5b))
* **state:** remove Math.random() UUID fallback; throw on missing crypto.randomUUID (F-002) ([8deb313](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/8deb3135a938c1f038999b520f8aea3f1f884268))
