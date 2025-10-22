// This file exports a singleton Set to act as a registry for all UI container
// elements created by the extension. This allows other parts of the code,
// like the FormScanner, to securely identify and ignore UI elements created
// by the extension itself.

export const uiContainerRegistry = new Set<HTMLElement>()
