# Styles

## Role

- Defines base CSS tokens and component styles used commonly across options, popups, and overlays.
- It is directly imported in React entries (`popup/main.tsx`, `options/main.tsx`) to be included in the bundle.

## Configuration Files

| Path               | Description                                                                                                                      |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `globals.css`      | Declares the root color scheme, typography, layout utilities, and styles for basic components (`panel`, `page`, `card`, `info`). |
| `designTokens.ts`  | Defines tokens used in the design system, such as colors, spacing, and typography.                                               |
| `design-system.md` | A document explaining the principles of the design system, component usage, etc.                                                 |

## Key Class Overview

- `panel`: The popup view container. Sets the vertical layout and margins.
- `subtitle`: Adjusts the color/size of secondary descriptive text.
- `page`: The basic layout for the options page. Sets the maximum width and margins.
- `card`: A card area with a translucent background and blur effect.
- `button`: Common CTA button style.
- `info`: An info box with a highlighted left border.

## Extension Tips

- Global theme properties for the form mirroring UI can be defined here, and you can use inline styles or pass them via `adoptedStyleSheets` inside the shadow DOM.
- If you need to switch between dark/light modes, extract the palette into `:root` variables and override them for each mode.
