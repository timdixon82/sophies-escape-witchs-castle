# Changelog

## [0.6.0](https://github.com/timdixon82/sophies-escape-witchs-castle/compare/v0.5.0...v0.6.0) (2026-07-14)


### Features

* **audio:** candle/fire ambient with random dungeon sound scheduler ([#40](https://github.com/timdixon82/sophies-escape-witchs-castle/issues/40)) ([976d4d6](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/976d4d6bad366f64b593a8c4158d11423c94ca63))
* full-screen inventory with icons, spoon fixes, iPad tap affordance, semgrep fix ([#41](https://github.com/timdixon82/sophies-escape-witchs-castle/issues/41)) ([bf0b738](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/bf0b73803670296c0566205b3188f0cea651d1d7))
* **player:** add first-person Sophie player model ([#36](https://github.com/timdixon82/sophies-escape-witchs-castle/issues/36)) ([6336e44](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/6336e44db0ac7406d466a21193a2c408229df942))
* **ui:** inventory list layout, help panel, iPad width, HUD keyboard shortcuts ([#33](https://github.com/timdixon82/sophies-escape-witchs-castle/issues/33)) ([f4520da](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/f4520da83d4e2809909d4d4db9afc4018156c718))
* **ux:** brightness, item-use mechanic, audio system, speech synthesis, captions ([ac6b4f9](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/ac6b4f945e193577860084b28e74af6f748fe3b8))
* **ux:** collision fixes, brightness, item-use mechanic, audio, speech, captions ([803df85](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/803df8552e718904793e57a388d17603bc7ec135))


### Bug Fixes

* add dependabot cooldown block to satisfy semgrep dependabot-missing-cooldown rule ([#51](https://github.com/timdixon82/sophies-escape-witchs-castle/issues/51)) ([4b6b9de](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/4b6b9de37827f499e4688c1c6d727dc25a567783))
* **build:** inject git hash into SW VERSION on each build ([#35](https://github.com/timdixon82/sophies-escape-witchs-castle/issues/35)) ([48bb55d](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/48bb55dde4d0e613ef2618322339576cf855e14b))
* **css:** cancel margin: auto on position-fixed dialogs to restore layout ([ee4f0a1](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/ee4f0a18068778ad5a5165b8dc717f200b041c46))
* **css:** right-pin inventory sidebar and fill-viewport pause/main-menu dialogs ([f621a3f](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/f621a3f719249c2d93f617daa6149e5ce717b643))
* **gameplay:** collision, item graphics, look range, labels setting, door routing ([3c98190](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/3c981905a1dbf5a497341e0a41f34a5944a7cf46))
* **gameplay:** collision, item graphics, look range, labels setting, door routing ([00a8548](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/00a85488726d371298c278a576faf731b0bf32d1))
* minimum 30 cm hitboxes on all items, door creak on traversal ([#42](https://github.com/timdixon82/sophies-escape-witchs-castle/issues/42)) ([2453ed6](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/2453ed6531c8b9f80c333c2f5fd36ce6c7395373))
* pa11y WCAG2AAA standard, HUD button spacing, favicon ([#37](https://github.com/timdixon82/sophies-escape-witchs-castle/issues/37)) ([e790a35](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/e790a3528a995a9fb27d09d50982cd7dc28d5c75))
* **player:** raise shoe geometry above floor surface ([#39](https://github.com/timdixon82/sophies-escape-witchs-castle/issues/39)) ([ec4455a](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/ec4455ad57c065edc572ac988d1c6346729e9236))
* **player:** remove lower body, realistic hands, brightness max 4.0x ([#43](https://github.com/timdixon82/sophies-escape-witchs-castle/issues/43)) ([c5723d0](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/c5723d01427d868585eccfab8fce235c210f2dd4))
* **player:** show feet on look-down only, hands at screen edges ([#38](https://github.com/timdixon82/sophies-escape-witchs-castle/issues/38)) ([50892d2](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/50892d245547757896bb12b2d654790fd7114acd))
* **render:** place Stone Corridor doors against walls and spawn player at entry door ([3514bfb](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/3514bfb834c5b99c414f5ea0cac632e831924d1d))
* **render:** remove full item group on pickup, raycaster targets interactables only ([2fc437b](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/2fc437b300276f3d60430683b7f0c303398b695c))
* **render:** remove full item group on pickup, raycaster targets interactables only ([882a145](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/882a145de5e5cb933d2ef4acb177da6bec32a74e))
* **render:** Stone Corridor doors against walls, entry spawn position ([e40817a](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/e40817a19d77d9dc28ea51109537ad7527b6988d))
* **room-manager:** remove interactable labelEls on teardown to prevent DOM orphans ([2d66ae8](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/2d66ae8788c0b24baacd370b34671444d356a331))
* **ui:** centre dialogs and add overflow scrollbar ([2371bd3](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/2371bd3ee1b2270be7c49475f78e682559f6a90d))
* **ui:** centre dialogs on screen and add overflow scrollbar ([04b5d65](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/04b5d65622b0dcf1a7a46ddc39051046e775f7ed))
* **ui:** keyboard nav list shows new room items after door transition ([d5e0dbb](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/d5e0dbb4ac13edeace86d3ae6b970e1ba6d002a8))
* **ui:** refresh keyboard nav list after enterRoom completes ([bb43da6](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/bb43da6a59e9c813c92467ede935f1f495869a6b))

## [0.5.0](https://github.com/timdixon82/sophies-escape-witchs-castle/compare/v0.4.0...v0.5.0) (2026-06-05)


### Features

* **render:** differentiate floor and ceiling materials per room ([7e9be94](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/7e9be94d3d917fa19ffcb856771624d452edb1f9))
* **render:** distinctive per-item 3D shapes (spoon, candle, petal, key, etc.) ([5e5e964](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/5e5e9648a23d3f754d04788bab9f78c4e2ea2234))
* **render:** door frame, rails, and handle on all room doors ([9989c16](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/9989c162c67ee5d28cc23049466b01d80cd75f25))
* **render:** full visual overhaul — cartoon-style detail, bug fix (item pickup) ([1446fcb](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/1446fcbb14819726bf1770ff49ac107489e2228a))
* **render:** full visual overhaul — cartoon-style detail, bug fix (item pickup) ([1446fcb](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/1446fcbb14819726bf1770ff49ac107489e2228a))
* **render:** per-room fog and background colour ([29e8536](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/29e8536679429ec3f42adc327adec39f793ab979))
* **render:** room geometry additions — pillars, beams, alcoves, weapon racks ([cec4f03](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/cec4f03634703d1dc974302ab5f1f8599f7e56ef))
* **render:** tailored per-room lighting rigs ([ccc6c45](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/ccc6c4540e77eac4935b60ab4ec56544ceda2889))
* **scripts:** add next-q.sh for session Q-number display ([0bb2feb](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/0bb2feb84c4e56f66e2131b84566db84f9c63224))
* **scripts:** add next-q.sh so session-start displays the next Q-number ([f49c788](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/f49c788f9625ad6999b9c30e89f7e3d16fa4da6b))


### Bug Fixes

* **a11y:** add skip link for WCAG 2.4.1 Bypass Blocks ([032bda2](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/032bda29fdf6f5826fbb42011a99ea58c5d8a112))
* **a11y:** add tabindex=-1 to main landmark and bump SW cache version ([19752c4](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/19752c4b06be0502d7e50bb72abe00b3c0c988a8))
* **a11y:** update loading bar aria-valuenow during boot sequence ([225af7b](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/225af7b5901e9040ddc045a0c1b55049d37a2e36))
* **a11y:** update loading bar aria-valuenow during boot sequence ([cbde6c8](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/cbde6c8ae6633ad37e49b368c4010a144da3da24))
* **a11y:** use hidden span as skip-link focus target (display:contents blocks focus on main) ([16b0aa3](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/16b0aa343044c7e2cb5c94ade98c5cf072e965cb))
* CI ChromeDriver path, skip link, cell door navigation ([771779d](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/771779dcd209a80266be62229a60560a02924f86))
* CI ChromeDriver path, skip link, cell door navigation ([771779d](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/771779dcd209a80266be62229a60560a02924f86))
* **ci:** broaden ChromeDriver path detection and pass --chrome-path to axe ([e6ccb5c](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/e6ccb5c0419eb173d57c78e6ead3db370f83c196))
* **controls:** A/D and arrow keys now strafe left/right ([358f09b](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/358f09ba62658ba34893509f31c3700219fd95cb))
* **controls:** correct room-manager import path in first-person-controller ([5ffbe8e](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/5ffbe8eb07fb88081bbf93f45435f2927f63b217))
* **controls:** full rotation, strafe, and per-room movement bounds ([40bd800](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/40bd80044bc2655cd7085cf2bf08b8449f7273f5))
* **controls:** full rotation, strafe, and per-room movement bounds ([40bd800](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/40bd80044bc2655cd7085cf2bf08b8449f7273f5))
* **controls:** per-room movement bounds replace hardcoded 2.3×2.7m clamp ([2d62667](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/2d62667c12d330a5d71113b05b0b2000e1208ffb))
* **controls:** remove 80° yaw clamp — allow full 360° horizontal rotation ([66f5fea](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/66f5feafcb154e3a9342d7711f4baafc196d78e4))
* **gameplay:** cell door becomes navigable after puzzle solved ([07d631a](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/07d631a5c7e87dce98a5ea5ec8ee8ccd2f3855f3))
* **gameplay:** remove item mesh from scene on pickup ([3b5c600](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/3b5c600c7398843880840e909e78200185816986))
* **lint:** remove unused _makeItemSmallIronKey (key is produced by cauldron puzzle, not room-placed) ([fab3a8a](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/fab3a8a08e2514dcee294e1bef769d9c8a3f2920))
* **release:** stylelint errors in base.css and pa11y.json ignore entries for SE-002 false positives ([23477b2](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/23477b27a227217e2f6bd1466213cbec7139d53a))
* **release:** v0.5.0 release prep — stylelint and pa11y false positives ([4d856be](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/4d856bef139b6505fb20061a1af3ea5c74f45354))
* **release:** v0.5.0 release prep — stylelint and pa11y false positives ([4d856be](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/4d856bef139b6505fb20061a1af3ea5c74f45354))
* **render:** add missing ITEMS import to room-manager.js ([83cf9ad](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/83cf9ad6e02bb9247d4eb34ba3b44e665491ffe1))
* **render:** default emissive to white so hover highlight works on all item colours ([bd57dc8](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/bd57dc8c96c03ddb045384f4b3b6447f75a3d4ec))
* **render:** remove item mesh surgically on pickup, fixing stale keyboard-nav entry ([dac0ff6](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/dac0ff61d840838046428b400085068b640d61f8))

## [0.4.0](https://github.com/timdixon82/sophies-escape-witchs-castle/compare/v0.3.0...v0.4.0) (2026-05-25)


### Features

* **gameplay:** add hover highlight, 3D item labels, and silent-miss feedback ([ba3038a](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/ba3038a25839ad684ad5335c9f49d6a9579ddcd8))


### Bug Fixes

* **023:** gameplay fixes — hover highlight, item labels, silent-miss announcement ([13de5c7](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/13de5c7fd0df177ba3c1006729fb461d09752857))
* **gameplay:** hover highlight, 3D item labels, and silent-miss feedback ([13de5c7](https://github.com/timdixon82/sophies-escape-witchs-castle/commit/13de5c7fd0df177ba3c1006729fb461d09752857))

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
