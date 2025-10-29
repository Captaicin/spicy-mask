# Content Script Module

## Role

- Operates on top of browser pages, scanning form elements and injecting mirroring UI.
- Executes the detection engine and masking logic for sensitive text detection.
- Determines the target forms for mirroring through a filter strategy (`FormFilter`).
- Integrates results by distinguishing between user-triggered (Start Scan) and automatic detection, and persists manual detection results even after masking.

## Execution Flow

1. `index.ts` checks the DOM ready state and calls `init()`.
2. `FormOverlayController` reads the filter configuration (`filterConfig.ts`) and starts DOM scanning.
3. `FormScanner` collects target form elements, and the filter determines the final target list.
4. `FormMirrorManager` renders a shadow DOM overlay and a `MirrorField` React component for each target.
5. `MirrorField` integrates with the detection engine (`detection/`) and masking module (`masking/`) to configure the highlighting and masking UI.
6. The controller cleans up resources when the page is unloaded.

## Top-level Files

| Path                    | Description                                                                                                                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.ts`              | Content script entry point. Initializes core modules like `FormOverlayController` and `contextMenuHandler`, and handles unload cleanup.                                                            |
| `filterConfig.ts`       | Configuration file for selecting the `FormFilter` to use. `LargeTextFormFilter` is set as the default, and can be easily replaced with `AllFormFilter` or `TextFormFilter` by modifying this file. |
| `contextMenuHandler.ts` | Handles the logic for the context menu that masks user-selected text. Receives the `MASK_SELECTION` message from the background script to execute the `handleMaskSelection` function.              |
| `selection.ts`          | Provides utility functions for handling user selections. It calculates the relative position (`offset`) of selected text within `contenteditable` elements.                                        |

## `forms/` Subsystem

Manages the entire form scanning and mirroring UI.

| Path                       | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FormFilter.ts`            | Defines the abstract class for form filters and metadata types. The `matches` method determines if an element is a target.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `FormOverlayController.ts` | Orchestrates DOM scanning, filter application, and mirroring synchronization. Monitors DOM changes with a MutationObserver.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `FormScanner.ts`           | Collects input controls from the DOM and performs visibility/status checks.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `FormMirrorManager.ts`     | Creates a shadow overlay for each target form element and manages the React render root.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `MirrorField.tsx`          | A React component that mirrors a single form element. It receives the final detection results from the `DetectionEngine` and orchestrates highlighting and masking actions.                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `TargetHighlighter.ts`     | A core class that creates and synchronizes a highlight overlay on top of a target field. It uses `ResizeObserver`, `MutationObserver`, and tracks scrollable parent elements to precisely detect changes in the original field's size, position, style, and scroll state, updating the overlay without visual inconsistencies via `requestAnimationFrame`.                                                                                                                                                                                                                                                                   |
| `TextHighlightOverlay.tsx` | A React UI layer that provides a notification badge when PII is detected. It visualizes detected text and provides masking actions, a scan tool, and the PII management panel. The management panel can be opened via the 🌶️ icon button in the bottom-right corner of the page, and the button's border color indicates the PII status: **Green** (no PII to process), **Red** (only initial detection results exist), **Orange** (after a Gemini scan has been run). Pop-up positioning is calculated using `@floating-ui/react`, and `React.createPortal` is used to prevent it from being obscured by other UI elements. |
| `ManagementPanel.tsx`      | A UI component for viewing and managing currently detected PII, ignored values, and user-defined rules (ignore, restore, add, remove). It includes a toggle switch to turn PII highlighting on and off for the text field. When a Gemini scan is initiated, an overlay with a loading state (`loading.gif`) is displayed over the entire panel. Once the scan is complete, a summary card of the detection results appears on the overlay, and the user must click the 'Check Results' button to dismiss the overlay and view the details.                                                                                   |
| `filters/`                 | A collection of built-in filter implementations (`AllFormFilter`, `LargeTextFormFilter`, `MockFormFilter`, `TextFormFilter`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

### Filter Implementations

- `AllFormFilter`: The most comprehensive filter, allowing all input/text areas.
- `LargeTextFormFilter`: Focuses on large text areas for multi-line input, such as comments or post bodies. It excludes all `<input>` elements and targets `<textarea>` and `contenteditable` elements that meet specific conditions. For `contenteditable` elements, it only targets them if they are inside a `<form>`, have a `role="textbox"` attribute, or have an associated `<label>`, to prevent performance degradation on document editing pages like Notion.
- `TextFormFilter`: Filters mainly for general text inputs (`input`, `textarea`, etc.) and excludes hidden/inactive controls.
- `MockFormFilter`: Selects test fields based on mock/test attributes or text.

## `detection/` Subsystem

Modularizes sensitive text detection.

| Path                            | Description                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DetectionEngine.ts`            | Runs all detectors and intelligently merges the results. **When resolving duplicate detection results, it prioritizes more specific (longer) matches, and uses detector priority for ties in length.** It also maintains a session-wide "dictionary" of all unique PII found, serving as a robust cache, and manages a list of user-ignored values.                                        |
| `detectors/BaseDetector.ts`     | The base class for all detectors. Defines the `detect` method and the common input type (`DetectionInput`).                                                                                                                                                                                                                                                                                |
| `detectors/RegexDetector.ts`    | An engine that finds PII candidates with multiple regex patterns and improves accuracy through additional validation. It validates credit card numbers with the Luhn algorithm and **phone numbers with the `libphonenumber-js` library** to reduce false positives and enhance global support. It includes an internal cache and various heuristics to optimize performance and accuracy. |
| `detectors/UserRuleDetector.ts` | Detects all strings that match user-added text patterns (rules).                                                                                                                                                                                                                                                                                                                           |
| `detectors/pii/piiPatterns.ts`  | Defines the PII regex patterns and priorities used by `RegexDetector`. **For phone numbers, it uses a 'naive' pattern to find a broad range of candidates, with the core validation logic residing in `RegexDetector`.**                                                                                                                                                                   |
| `detectors/GeminiDetector.ts`   | Calls the background Gemini service to detect contextual PII (names, addresses, etc.) in the text. After receiving PII candidate values from the service, it uses a "findall" logic to locate all matching occurrences in the text and create the final `DetectionMatch` objects.                                                                                                          |
| `detectors/geminiClient.ts`     | A thin client that handles communication between `GeminiDetector` and the `background` service. It abstracts the `sendMessage` API call and sends the `RUN_GEMINI_PII_ANALYSIS` message.                                                                                                                                                                                                   |
| `detectors/index.ts`            | Configures and exports the default detectors (`RegexDetector`, `GeminiDetector`, `UserRuleDetector`) to be used in the `DetectionEngine`.                                                                                                                                                                                                                                                  |
| `index.ts`                      | Creates and exports the `DetectionEngine` singleton instance.                                                                                                                                                                                                                                                                                                                              |

## `masking/`

- `plainTextMasker.ts`: Performs masking on simple text (string) values, such as in regular `<input>` and `<textarea>` elements.
- `contentEditableMasker.ts`: Handles masking for `contenteditable` elements. It uses a `TreeWalker` to safely apply masking at the text node level while preserving the HTML structure (especially line breaks).
- `index.ts`: Re-exports masking utilities.

## External Integration Points

- `shared/logger`: Provides integrated logging for detection/masking/mirroring steps.
- `shared/dom`: Uses shadow overlay creation utilities to maintain page layout.
- `shared/constants`: Shares the overlay host ID prefix.

## Extension/Testing Guide

- To add a new detector, inherit from `BaseDetector` and add it to the `defaultDetectors` array.
- To change the filter strategy, replace the `injectedFilter` in `filterConfig.ts` with a different implementation.
- For debugging UI behavior, use the `log` output and the `TargetHighlighter` popover state.
- Since `GeminiDetector` calls the actual `LanguageModel` API, it is recommended to write tests that verify the asynchronous flow and the structure of the final returned `DetectionMatch` object.
