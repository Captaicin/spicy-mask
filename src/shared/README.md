# Shared Utilities

## Role

- A layer that collects helpers and types reused between the background, content, and popup scripts.
- Encapsulates messaging, DOM utilities, storage, and logging to provide cross-module consistency.

## Configuration Files

| Path           | Description                                                                                                                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `types.ts`     | Defines runtime message types (`Msg`, `MsgResponse`) and detection results (`GeminiEntityType`, `GeminiApiResult`). This file should be updated when adding new messages or extending the detection schema. |
| `messaging.ts` | Promise-based communication utilities that wrap `chrome.runtime.sendMessage`/`onMessage`. Provides type-safe routing.                                                                                       |
| `logger.ts`    | Console logging wrapper. Adds a `[Spicy Mask]` prefix to all logs. Provides `log`/`warn`/`error`.                                                                                                           |
| `storage.ts`   | Promise-based get/set wrappers for `chrome.storage.sync` and constant keys (`STORAGE_KEYS`).                                                                                                                |
| `dom.ts`       | `createOverlayShadow` for creating/removing shadow DOM overlay hosts. Used by the form mirroring UI.                                                                                                        |
| `constants.ts` | Defines shared constants between modules (`MIRROR_OVERLAY_PREFIX`).                                                                                                                                         |

## Usage Considerations

- When extending message types, keep `types.ts` as the single source of truth to ensure both the background service worker and the popup refer to the same types.
- The detection type (`GeminiEntityType`) includes `phone_number`, `email`, and `contextual_pii`, and the `reason` field is used to convey the basis for detection. Both the background and content scripts must adhere to this schema.
- Since `createOverlayShadow` adds a host directly to the document body, `destroy()` must be called after use to prevent memory leaks.
- The storage API does not provide failure callbacks synchronously, so add `chrome.runtime.lastError` checking logic if necessary.
