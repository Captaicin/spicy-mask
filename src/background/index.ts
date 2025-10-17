import { onMessage } from '../shared/messaging'
import type { Msg, MsgResponse } from '../shared/types'
import { scanGeminiEntities } from './geminiScan'

chrome.runtime.onInstalled.addListener(() => {})

onMessage(async (message: Msg): Promise<MsgResponse> => {
  switch (message.type) {
    case 'PING':
      return { ok: true, data: 'pong' }
    case 'RUN_GEMINI_SCAN': {
      const matches = await scanGeminiEntities(message.payload.text)
      return { ok: true, data: matches }
    }
    default:
      return { ok: false, error: 'Unknown message' }
  }
})