import { onMessage } from '../shared/messaging'
import type { Msg, MsgResponse } from '../shared/types'
import { runPiiAnalysis } from './geminiService'

chrome.runtime.onInstalled.addListener(() => {})

onMessage(async (message: Msg): Promise<MsgResponse> => {
  switch (message.type) {
    case 'PING':
      return { ok: true, data: 'pong' }
    case 'RUN_GEMINI_PII_ANALYSIS': {
      const matches = await runPiiAnalysis(message.payload.text)
      return { ok: true, data: matches }
    }
    default:
      return { ok: false, error: 'Unknown message' }
  }
})