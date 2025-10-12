import { onMessage } from '../shared/messaging'
import { storage, STORAGE_KEYS } from '../shared/storage'
import { DEFAULT_COLOR } from '../shared/constants'
import { log, warn, error } from '../shared/logger'
import type { MsgResponse } from '../shared/types'

let currentColor = DEFAULT_COLOR

const loadInitialColor = async () => {
  try {
    const stored = await storage.get<string>(STORAGE_KEYS.color)
    if (stored) {
      currentColor = stored
      log('Loaded color from storage', stored)
    }
  } catch (err) {
    warn('Failed to load color, falling back to default', err)
  }
}

loadInitialColor().catch((err) => warn('Unexpected load error', err))

chrome.runtime.onInstalled.addListener(() => {
  log('Extension installed')
})

onMessage(async (message): Promise<MsgResponse> => {
  switch (message.type) {
    case 'PING':
      return { ok: true, data: 'pong' }
    case 'GET_COLOR':
      return { ok: true, data: currentColor }
    case 'SET_COLOR': {
      const {
        payload: { color }
      } = message
      currentColor = color
      try {
        await storage.set(STORAGE_KEYS.color, color)
        log('Color updated', color)
        return { ok: true, data: color }
      } catch (err) {
        error('Failed to persist color', err)
        return { ok: false, error: 'Failed to save color' }
      }
    }
    default:
      warn('Unhandled message', message)
      return { ok: false, error: 'Unknown message' }
  }
})
