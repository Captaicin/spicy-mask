# Popup UI

## Role

- Responsible for the extension's popup view that opens from the browser toolbar.
- Checks the basic connection status (PING) with the background service worker.

## Configuration Files

| Path         | Description                                                                                        |
| ------------ | -------------------------------------------------------------------------------------------------- |
| `index.html` | The popup HTML container. Consists of the `#root` element and the `main.tsx` script entry.         |
| `main.tsx`   | React bootstrap code. Loads global styles and the `Popup` component.                               |
| `Popup.tsx`  | The popup view component. Implements sending messages to the background and displaying the status. |

## Runtime Behavior

1. When the component mounts, it calls `sendMessage({ type: 'PING' })` to check communication with the service worker.
2. If the request fails, the status is switched to `error`, and the user is advised to check the logs.
3. The basic UI reuses global style classes (`panel`, `subtitle`, `hint`).

## Extension Points

- To add more states, extend the `status` state into an enum and add message payload/response types to `shared/types.ts`.
- To control settings from the popup, you can use `shared/storage` to integrate with Chrome storage.
