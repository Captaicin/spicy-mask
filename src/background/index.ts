import { onMessage } from '../shared/messaging'
import type { MsgResponse } from '../shared/types'

chrome.runtime.onInstalled.addListener(() => {})

onMessage(async (message): Promise<MsgResponse> => {
  switch (message.type) {
    case 'PING':
      return { ok: true, data: 'pong' }
    default:
      return { ok: false, error: 'Unknown message' }
  }
})
