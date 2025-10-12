# Spicy Mask

React + TypeScript + Vite boilerplate for a Chrome extension powered by Manifest V3 and `@crxjs/vite-plugin`.

## Getting Started

1. Install dependencies: `npm i`
2. Start development build: `npm run dev`
3. Open Chrome → `chrome://extensions`
4. Enable developer mode (top-right toggle)
5. Click **Load unpacked** and choose the generated `dist/` folder

The Vite dev server rebuilds on change. Refresh the extension page to pick up updates.

## Project Structure

```
public/
  icons/           # Static icons copied as-is to the bundle
  _locales/en/     # Localized strings resolved via Chrome i18n
src/
  background/      # Service worker entry point
  content/         # Content scripts and injected logic
  popup/           # Browser action popup
  options/         # Extension options page
  shared/          # Messaging, utilities, types
  styles/          # Global styles shared by React surfaces
manifest.ts        # Typed Manifest V3 definition consumed by CRX plugin
```

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

Happy hacking!
