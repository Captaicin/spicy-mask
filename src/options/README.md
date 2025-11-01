# Options Page

## Role

- This is the React bundle entry for the extension's options page.
- It allows users to configure general settings for the extension.

## Configuration Files

| Path          | Description                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------------- |
| `index.html`  | The HTML shell for the options page. Defines the `#root` container and the `main.tsx` bundle entry point.    |
| `main.tsx`    | React 18 `createRoot` bootstrap code. Imports global styles (`../styles/globals.css`).                       |
| `Options.tsx` | The main options UI component. Provides user settings like whether to enable highlighting by default.      |

## Features

- **General Settings**: Contains settings that apply to the entire extension.
- **Default Highlighting**: A toggle switch to control whether PII highlighting is enabled by default when a page loads.
- **Contribution Link**: A link to the project's GitHub repository to encourage contributions.

## Extension Points

- To add new settings, you can add new state and UI elements in `Options.tsx` and use the `shared/storage` utility to save the user's preferences.

## Styling

- All visual styles are defined in `src/styles/globals.css` and use design tokens from `src/styles/designTokens.ts`.
- The page uses a dark theme with `backgroundPrimary` and `textPrimary` colors from the design tokens.