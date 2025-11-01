# Popup UI

## Role

- Responsible for the extension's popup view that opens from the browser toolbar.
- Checks the basic connection status with the background service worker.
- Provides a link to the project's GitHub repository.

## Configuration Files

| Path         | Description                                                                                        |
| ------------ | -------------------------------------------------------------------------------------------------- |
| `index.html` | The popup HTML container. Consists of the `#root` element and the `main.tsx` script entry.         |
| `main.tsx`   | React bootstrap code. Loads global styles and the `Popup` component.                               |
| `Popup.tsx`  | The popup view component. Implements sending messages to the background and displaying the status. |

## Runtime Behavior

1. When the component mounts, it calls `sendMessage({ type: 'PING' })` to check communication with the service worker.
2. If the request is successful, it displays a "Connected" status.
3. If the request fails, the status is switched to an error state, and the user is advised to check the service worker logs.
4. A link to the GitHub repository is displayed to encourage contributions.

## Extension Points

- To add more states or actions, you can extend the `status` state, add more message types in `shared/messaging.ts`, and handle them in the background script.
- To control settings from the popup, you can use the `shared/storage` utility.

## Styling

- The UI is styled using classes from `src/styles/globals.css` and inline styles using design tokens from `src/styles/designTokens.ts`.
- It features a dark theme consistent with the rest of the extension.