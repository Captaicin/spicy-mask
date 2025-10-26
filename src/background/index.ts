import { onMessage } from '../shared/messaging'
import type { Msg, MsgResponse } from '../shared/types'
import { runPiiAnalysis } from './geminiService'

const CONTEXT_MENU_ID = 'spicy-mask-selection'

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: 'Mask selected text',
    contexts: ['selection'],
  })
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === CONTEXT_MENU_ID && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'MASK_SELECTION' }).catch(err =>
      console.error('Failed to send MASK_SELECTION message:', err),
    )
  }
})

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