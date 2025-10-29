# Background Service Worker

## Role

- As the service worker for the Chrome extension, it processes runtime messages sent from options, popup, and content scripts.
- Acts as a secure proxy to the on-device Gemini Nano API, ensuring that only the service worker can interact with the language model.
- Creates a context menu (`Mask selected text`) upon installation. When this menu item is clicked, it detects the event and sends a `MASK_SELECTION` message to the active content script.
- Provides an extension point to perform initialization by hooking into the installation event.

## Configuration Files

| Path               | Description                                                                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.ts`         | Service worker entry point. Responsible for registering installation events and message routing.                                                   |
| `geminiService.ts` | Responds to the `RUN_GEMINI_PII_ANALYSIS` message. Acts as a proxy to the `LanguageModel` API to call the LLM and return original PII suggestions. |

## Key APIs

### Installation Hook

```ts
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: 'Mask selected text',
    contexts: ['selection'],
  })
})
```

- Called when the extension is installed or updated.
- Creates the context menu (`Mask selected text`).

### Message Endpoint

```ts
onMessage(async (message) => {
  /* ... */
})
```

- Uses the `onMessage` wrapper from `src/shared/messaging.ts` to provide Promise-based routing.
- The default implementation responds with `pong` to the `PING` type, asynchronously calls `geminiService.ts` for `RUN_GEMINI_PII_ANALYSIS` and returns the result, and returns an error for unspecified types.
- To support new messages, add a case to the `switch` block and update the `Msg`/`MsgResponse` types.

## Extension Points

- **Additional Message Handlers**: Branch out contextual business logic using cases.
- **Remote Detection Integration**: `geminiService.ts` contains the actual `LanguageModel` API implementation and can be extended to support different kinds of prompts or models.
- **Background Task Scheduling**: Chrome alarms, storage change listeners, etc., can be placed in this module.
