# Spicy Mask - AI Context-Aware Guardian

Spicy Mask is an on-device AI security extension that intelligently prevents personal information leakage and phishing threats by understanding the user's web browsing 'context' and 'action' in real-time. This project specifically aims to leverage the Gemini Nano Chrome Built-in API to securely protect user privacy and defend against phishing attacks.

## Features

- **Phishing Page Detection:** Analyzes the full text content of the currently visited web page to determine its phishing risk level.
- **Personally Identifiable Information (PII) Input Detection & Masking Suggestion:** Real-time detection of PII in text entered by the user into `<input>` or `<textarea>` fields.
- **Context-Aware Decision Engine:** Combines the phishing detection results and PII input detection results to determine the final user warning/suggestion action.

## Usage

Once the extension is installed, it will automatically start working in the background.

- **Phishing Detection:** If you visit a suspicious or dangerous website, a warning banner will be displayed at the top of the page.
- **PII Detection:** If you enter any personal information (e.g., credit card number, phone number) into an input field, a suggestion to mask the information will appear.

## Configuration

You can enable or disable the phishing and PII detection features from the extension's options page.

1.  Click on the Spicy Mask icon in the Chrome toolbar.
2.  Select "Options".
3.  Check or uncheck the features you want to use.

## Technology Stack

- **Platform:** Google Chrome Extension V3
- **AI:** Gemini Nano (Chrome Built-in API `chrome.ai.createTextSession()`)
- **Languages:** JavaScript, HTML, CSS

## Getting Started

1. Install dependencies: `npm i`
2. Start development build: `npm run dev`
3. Open Chrome → `chrome://extensions`
4. Enable developer mode (top-right toggle)
5. Click **Load unpacked** and choose the generated `dist/` folder

The Vite dev server rebuilds on change. Refresh the extension page to pick up updates.

## Project Structure

- `package.json` / `package-lock.json` / `tsconfig.json` / `vite.config.ts`: Build, dependency, and tooling configuration.
- `.eslintrc.cjs` / `.prettierrc`: Linting & formatting rules.
- `manifest.ts`: Extension manifest generator (CRX/Vite entry).
- `README.md`: High-level project overview.
- `dist/`: Generated build artifacts (extension bundle). Includes `_locales/`, `icons/`, `assets/`, and compiled `src/*` html/loader files.
- `public/`: Static assets copied into the build (e.g., `_locales/`, `icons/`).
- `node_modules/`: Third-party dependencies (omitted below).
- `src/`: Application source code
  - `background/`
    - `index.ts`: Service worker entrypoint wiring `onMessage` handlers.
    - `geminiScan.ts`: Async stubbed scan that simulates a 3s delay and returns entity matches.
    - `README.md`: Module documentation.
  - `content/`
    - `index.ts`: Content-script bootstrap (init/destroy hooks).
    - `filterConfig.ts`: Active form-filter configuration.
    - `README.md`: Detailed overview of content subsystems.
    - `forms/`
      - `FormFilter.ts`: Abstract base for form filters.
      - `FormMirrorManager.ts`: Shadow/React mirror host manager.
      - `FormOverlayController.ts`: Scanning/filter orchestration.
      - `FormScanner.ts`: DOM scanner for eligible elements.
      - `MirrorField.tsx`: React mirror UI with detection/masking integration.
      - `TargetHighlighter.ts`: Overlay highlight renderer with trigger metadata.
      - `TextHighlightOverlay.tsx`: Highlight & Start Scan UI, summary popover.
      - `filters/`
        - `index.ts`: Barrel exports for filter implementations.
        - `AllFormFilter.ts`, `TextFormFilter.ts`, `MockFormFilter.ts`: Built-in filter strategies.
    - `detection/`
      - `DetectionEngine.ts`: Async detector runner with dedupe logic.
      - `index.ts`: Detection engine entry/export.
      - `detectors/`
        - `BaseDetector.ts`: Shared detector contracts (`DetectionInput/Match`).
        - `GeminiDetector.ts`: Manual trigger detector that calls background scan.
        - `RegexDetector.ts`: Pattern-based detector emitting entity type & reason.
        - `MockDetector.ts`: (Referenced via barrel) demo detector; excluded from default build if not imported.
        - `geminiClient.ts`: Messaging client for `RUN_GEMINI_SCAN`.
        - `index.ts`: Registers default detectors (Mock, Regex, Gemini).
    - `masking/`
      - `masker.ts`: Masking utility that applies detection ranges to text.
      - `index.ts`: Barrel export.
  - `options/`
    - `index.html`: Options page shell.
    - `main.tsx`: React bootstrap.
    - `Options.tsx`: Options UI component listing filters and guidance.
    - `README.md`: Module notes.
  - `popup/`
    - `index.html`: Popup page shell.
    - `main.tsx`: React bootstrap.
    - `Popup.tsx`: Popup UI messaging `PING` to background.
    - `README.md`: Module notes.
  - `shared/`
    - `types.ts`: Shared message/detection types (`GeminiEntityType`, `GeminiScanMatch`).
    - `messaging.ts`: Promise-based Chrome messaging helpers.
    - `logger.ts`: Prefixed logging utilities.
    - `storage.ts`: Chrome storage sync helper & constants.
    - `dom.ts`: Shadow overlay factory.
    - `constants.ts`: Shared constants (`MIRROR_OVERLAY_PREFIX`).
    - `README.md`: Shared layer documentation.
  - `styles/`
    - `globals.css`: Shared styling tokens for popup/options UI.
    - `README.md`: Style module notes.

## Form Mirroring Workflow

The content script scans the active document for form controls, filters them using the strategy exported from
`src/content/filterConfig.ts`, and creates mirror elements inside hidden shadow DOM hosts. Mirrors are kept off the
layout tree (zero-sized, invisible) so they never interfere with the page UI. Developers collaborate by swapping the
injected `FormFilter` implementation in code rather than exposing selectors to end users.

## Messaging Pattern

Messages use a discriminated union defined in `src/shared/types.ts`. The `sendMessage` helper returns a typed promise,
while `onMessage` wraps listeners and ensures async handlers resolve correctly. Background responses follow the
`MsgResponse` contract so callers can safely branch on `ok`.

## Permissions

Host permissions and matches are intentionally broad for development convenience—trim them for production to comply with the principle of least privilege.

## Tooling

- Vite + `@crxjs/vite-plugin` handle bundling and manifest generation
- ESLint + Prettier enforce consistent formatting (`npm run lint` can be added as needed)
- TypeScript is configured with strict settings and React JSX transform
