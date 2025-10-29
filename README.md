# Spicy Mask - AI Context-Aware Guardian

Spicy Mask is an on-device AI security extension that intelligently prevents personal information leakage by understanding the user's input on web pages in real-time. This project leverages the built-in Gemini Nano on-device LLM, ensuring that no personally identifiable information (PII) ever leaves your machine, providing the highest level of privacy.

## Features

- **Multi-Layered PII Detection:**
  - **Real-time Pattern-based Detection:** Automatically detects common PII patterns (e.g., credit card numbers, SSN, email addresses) in real-time as you type, using a regex engine.
  - **On-Demand Contextual PII Detection:** Leverages the **on-device Gemini Nano model** to perform deeper, context-aware analysis of text to find more nuanced PII (e.g., passwords, API Keys, addresses) when requested by the user. As this is an on-device model, your data is processed locally and never sent to an external server, ensuring your privacy.
  - **Real-time User-Defined Detection:** Allows users to add their own custom words to be detected in real-time.
- **Manual Text Masking:** Allows users to manually mask any selected text by right-clicking and choosing the "Mask selected text" option.
- **PII Management Panel:** Provides an in-context UI to view all detected PII, manage session-level ignored values, add or remove custom PII detection rules, and toggle the PII highlighting feature on or off.

## Usage

Once the extension is installed, it will automatically start working in the background.

- **Automatic PII Detection:** As you type in input fields, the extension automatically highlights potential PII detected by the real-time regex and user-defined rule detectors.
- **On-Demand Deep Scan:** For a more thorough analysis, you can click the 🌶️ icon to initiate a deep scan with Gemini Nano, which can find contextual PII like addresses, passwords, and API keys.
- **Masking:** Once PII is detected, you can click on the highlighted text to open a popover with options to mask the detected information.
- **Manual Masking:** You can also select any text in an input field, right-click, and choose "Mask selected text" to mask it manually.

## Configuration

You can enable or disable the PII highlighting feature from the extension's options page.

1.  Click on the Spicy Mask icon in the Chrome toolbar.
2.  Select "Options".
3.  Check or uncheck the features you want to use.

## Technology Stack

- **Platform:** Google Chrome Extension V3
- **AI:** Gemini Nano (via the `LanguageModel` API)
- **Languages:** TypeScript, HTML, CSS
- **Frameworks/Libraries:** React, Vite

## Getting Started

1. Install dependencies: `npm i`
2. Start build: `npm run build`
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
    - `geminiService.ts`: Acts as a thin proxy to the `LanguageModel` API for PII detection.
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
      - `TargetHighlighter.ts`: A core class that creates and synchronizes a highlight overlay on top of a target field. It uses `ResizeObserver`, `MutationObserver`, and tracks scrollable parent elements to precisely detect changes in the original field's size, position, style, and scroll state, updating the overlay without visual inconsistencies via `requestAnimationFrame`.
      - `TextHighlightOverlay.tsx`: A React UI layer that visualizes detected text and provides masking actions, a scan tool, and the PII management panel.
      - `ManagementPanel.tsx`: A UI for viewing and managing detected PII, ignored values, and adding/removing user-defined rules.
      - `filters/`
        - `index.ts`: Barrel exports for filter implementations.
        - `AllFormFilter.ts`, `LargeTextFormFilter.ts`, `TextFormFilter.ts`, `MockFormFilter.ts`: Built-in filter strategies.
    - `detection/`
      - `DetectionEngine.ts`: Runs all detectors, maintains a session-wide "PII Dictionary" of all unique values found (providing a robust cache), and manages ignored values.
      - `index.ts`: Detection engine entry/export.
      - `detectors/`
        - `BaseDetector.ts`: Shared detector contracts.
        - `GeminiDetector.ts`: Receives raw PII suggestions from the background service and finds all match indices in the text.
        - `RegexDetector.ts`: A PII engine using prioritized regular expressions. It validates credit card numbers with the Luhn algorithm and phone numbers with `libphonenumber-js` for high accuracy.
        - `UserRuleDetector.ts`: Detects all occurrences of user-defined PII patterns.
        - `geminiClient.ts`: Thin messaging client for `RUN_GEMINI_PII_ANALYSIS`.
        - `index.ts`: Registers default detectors.
        - `pii/piiPatterns.ts`: Defines PII patterns, priorities, and validation logic for the `RegexDetector`.
    - `masking/`
      - `plainTextMasker.ts`: Masking utility for simple text inputs.
      - `contentEditableMasker.ts`: Advanced masking utility for `contenteditable` elements that preserves HTML formatting.
      - `index.ts`: Barrel export.
  - `options/`
    - `index.html`: Options page shell.
    - `main.tsx`: React bootstrap.
    - `Options.tsx`: Options UI component to configure extension settings, such as the default state for PII highlighting.
    - `README.md`: Module notes.
  - `popup/`
    - `index.html`: Popup page shell.
    - `main.tsx`: React bootstrap.
    - `Popup.tsx`: Popup UI messaging `PING` to background.
    - `README.md`: Module notes.
  - `shared/`
    - `types.ts`: Shared types for messaging (`Msg`) and detection (`DetectionMatch`).
    - `messaging.ts`: Promise-based Chrome messaging helpers.
    - `logger.ts`: Prefixed logging utilities.
    - `storage.ts`: Chrome storage sync helper & constants.
    - `dom.ts`: Shadow overlay factory.
    - `constants.ts`: Shared constants (`MIRROR_OVERLAY_PREFIX`).
    - `README.md`: Shared layer documentation.
  - `styles/`
    - `globals.css`: Shared styling tokens for popup/options UI.
    - `designTokens.ts`: Design system tokens (colors, spacing, etc.).
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
