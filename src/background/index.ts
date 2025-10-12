import { onMessage } from '../shared/messaging'
import { log, warn } from '../shared/logger'
import type { MsgResponse } from '../shared/types'

chrome.runtime.onInstalled.addListener(() => {
  log('Extension installed')
})

onMessage(async (message): Promise<MsgResponse> => {
  switch (message.type) {
    case 'PING':
      return { ok: true, data: 'pong' }
    default:
      warn('Unhandled message', message)
      return { ok: false, error: 'Unknown message' }
  }
})
