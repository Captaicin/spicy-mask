export const storage = {
  get<T>(key: string): Promise<T | undefined> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(key, (result) => {
        resolve(result[key] as T | undefined)
      })
    })
  },
  set<T>(key: string, value: T): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ [key]: value }, () => resolve())
    })
  }
}

export const STORAGE_KEYS = {
  color: 'color',
  DEFAULT_HIGHLIGHT_ON: 'defaultHighlightOn',
} as const
