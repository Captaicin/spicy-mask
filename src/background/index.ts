import { onMessage } from '../shared/messaging'
import type { MsgResponse } from '../shared/types'
import { scanGeminiEntities } from './geminiScan'

chrome.runtime.onInstalled.addListener(() => {})

onMessage(async (message): Promise<MsgResponse> => {
  switch (message.type) {
    case 'PING':
      return { ok: true, data: 'pong' }
    case 'RUN_GEMINI_SCAN': {
      const matches = await scanGeminiEntities(message.text)
      return { ok: true, data: { matches } }
    }
    default:
      return { ok: false, error: 'Unknown message' }
  }
})
