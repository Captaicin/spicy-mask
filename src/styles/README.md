# Styles

## Role

- Defines base CSS tokens and component styles used commonly across options, popups, and overlays.
- It is directly imported in React entries (`popup/main.tsx`, `options/main.tsx`) to be included in the bundle.

## Configuration Files

| Path               | Description                                                                                                                      |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `globals.css`      | Declares the root color scheme, typography, layout utilities, and styles for basic components (`panel`, `page`, `card`, `info`). |
| `designTokens.ts`  | Defines tokens used in the design system, such as colors, spacing, and typography.                                               |


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

---

# Spicy Mask Design System

## 1. Philosophy

The Spicy Mask design system aims for **trust**, **clarity**, and **consistency**.
It helps users immediately understand what’s happening while browsing (safe, caution, danger states) and delivers a unified experience across all UI elements.

We use a calm dark navy base palette with three dynamic accent colors (Green, Orange, Red) to communicate state clearly while maintaining visual stability.

## 2. Color Palette

All colors are defined as CSS variables to ensure reusability and maintainability.

### 2.1. Base Colors – Dark Navy Theme

| Variable Name                  | Color (Hex)                                                        | Description                             |
| ------------------------------ | ------------------------------------------------------------------ | --------------------------------------- |
| `--color-background-primary`   | ![#1A202C](https://placehold.co/15x15/1A202C/1A202C.png) `#1A202C` | Primary background (charcoal / darkest) |
| `--color-background-secondary` | ![#2D3748](https://placehold.co/15x15/2D3748/2D3748.png) `#2D3748` | Surfaces like cards and panels          |
| `--color-border`               | ![#4A5568](https://placehold.co/15x15/4A5568/4A5568.png) `#4A5568` | Dividers and borders                    |
| `--color-text-primary`         | ![#F7FAFC](https://placehold.co/15x15/F7FAFC/F7FAFC.png) `#F7FAFC` | Primary text (light gray)               |
| `--color-text-secondary`       | ![#A0AEC0](https://placehold.co/15x15/A0AEC0/A0AEC0.png) `#A0AEC0` | Secondary / disabled text (gray)        |
| `--color-text-link`            | ![#63B3ED](https://placehold.co/15x15/63B3ED/63B3ED.png) `#63B3ED` | Link text (bright blue)                 |

### 2.2. Accent Colors

These colors are used in the logo and to visually represent state.

| Variable Name           | Color (Hex)                                                        | Description                                          |
| ----------------------- | ------------------------------------------------------------------ | ---------------------------------------------------- |
| `--color-accent-green`  | ![#48BB78](https://placehold.co/15x15/48BB78/48BB78.png) `#48BB78` | **Safe** status, success, allowed actions            |
| `--color-accent-orange` | ![#ED8936](https://placehold.co/15x15/ED8936/ED8936.png) `#ED8936` | **Warning** status, needs attention                  |
| `--color-accent-red`    | ![#F56565](https://placehold.co/15x15/F56565/F56565.png) `#F56565` | **Danger** status, errors, requires immediate action |

### 2.3. Highlight & Special Colors

| Variable Name                  | Color (Hex)                                                        | Description                                                                             |
| ------------------------------ | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `--color-highlight-background` | ![#FBBF24](https://placehold.co/15x15/FBBF24/FBBF24.png) `#FBBF24` | Highlight background used to mark detected sensitive items (e.g. PII) within user input |

## 3. Typography

### 3.1. Font Family

We use a system font stack for performance and cross-platform consistency.

```css
--font-family-base:
  -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial,
  sans-serif;
```

### 3.2. Font Sizes

| Variable Name    | Size (px) | Example Usage                |
| ---------------- | --------- | ---------------------------- |
| `--font-size-xs` | 12px      | Small notes, captions        |
| `--font-size-sm` | 14px      | Body text, default text      |
| `--font-size-md` | 16px      | Emphasized text, subheaders  |
| `--font-size-lg` | 18px      | Section subtitles / headings |
| `--font-size-xl` | 24px      | Page titles / main headers   |

### 3.3. Font Weights

| Variable Name          | Value | Description    |
| ---------------------- | ----- | -------------- |
| `--font-weight-normal` | 400   | Regular weight |
| `--font-weight-medium` | 500   | Medium weight  |
| `--font-weight-bold`   | 700   | Bold weight    |

## 4. Spacing & Sizing

We use a consistent spacing scale based on `1rem = 16px`.

| Variable Name | Value (rem) | Value (px) |
| ------------- | ----------- | ---------- |
| `--spacing-1` | 0.25rem     | 4px        |
| `--spacing-2` | 0.5rem      | 8px        |
| `--spacing-3` | 0.75rem     | 12px       |
| `--spacing-4` | 1rem        | 16px       |
| `--spacing-6` | 1.5rem      | 24px       |
| `--spacing-8` | 2rem        | 32px       |

## 5. Component Styles

### 5.1. Buttons

- **Primary Button**
  Main action button.
  - Background: one of the accent colors (`green`, `orange`, `red`)
  - Text color: `--color-text-primary`

- **Secondary Button**
  Supporting / less critical actions.
  - Background: `--color-background-secondary`
  - Text color: `--color-text-primary`
  - Border: `1px solid var(--color-border)`

- **Ghost Button**
  No background, text/icon only.
  - Text color: `--color-text-secondary`
  - On hover: text color switches to `--color-text-primary`

### 5.2. Cards & Panels

- `background-color`: `var(--color-background-secondary)`
- `border`: `1px solid var(--color-border)`
- `border-radius`: `8px`
- `padding`: `var(--spacing-4)`
- `box-shadow`:
  `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)`

These styles apply to surfaces like info panels, popovers, or analysis summaries.

### 5.3. Input Fields

- `background-color`: `var(--color-background-primary)`
- `border`: `1px solid var(--color-border)`
- `border-radius`: `4px`
- `color`: `var(--color-text-primary)`
- `padding`: `var(--spacing-2) var(--spacing-3)`
- `focus` state: border color changes to `var(--color-text-link)`

These inputs are used in inline overlays, side panels, and settings surfaces.

### 5.4. Popovers & Banners

- **Popovers (e.g. PII management panel)**
  Uses the same base styles as cards.
  The header area (title/status strip) can use one of the accent colors to indicate state.

- **Alert Banners (e.g. phishing warning)**
  Uses the appropriate accent color as the background (`--color-accent-orange`, `--color-accent-red`) to demand immediate user attention.