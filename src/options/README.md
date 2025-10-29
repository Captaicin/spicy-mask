# Options Page

## Role

- This is the React bundle entry for the extension's options page.
- It renders a static informational page that explains the available `FormFilter` implementations and their behavior to developers.

## Configuration Files

| Path          | Description                                                                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.html`  | The HTML shell for the options page. Defines the `#root` container and the `main.tsx` bundle entry point.                                                  |
| `main.tsx`    | React 18 `createRoot` bootstrap code. Imports global styles (`../styles/globals.css`).                                                                     |
| `Options.tsx` | The actual options UI component. Provides a list of filters, informational sections, and **user settings like whether to enable highlighting by default.** |

## Render Tree

- `<main class="page">`: The main layout container.
- "Available filters" card: Iterates over `AllFormFilter`, `TextFormFilter`, and `MockFormFilter` instances and displays their metadata (label, description).
- "How mirroring works" / "Permissions reminder" sections: Provide text-based guides.

## Extension Points

- Adding a new `FormFilter` instance to the `filters` array will automatically display it on the options page.
- If you need to save user settings, import the `shared/storage` utility and connect it to form elements.

## Styling

- All visual styles are defined in `src/styles/globals.css`, reusing common classes like `page`, `card`, and `info`.
