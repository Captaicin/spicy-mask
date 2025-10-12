import { onMessage } from '../shared/messaging'
import { log, warn } from '../shared/logger'
import type { Msg, MsgResponse } from '../shared/types'

chrome.runtime.onInstalled.addListener(() => {
  log('Extension installed')
})

const dispatchToActiveTab = async (message: Msg): Promise<boolean> => {
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (activeTab?.id != null) {
      await chrome.tabs.sendMessage(activeTab.id, message)
      return true
    }
  } catch (err) {
    warn('Failed to dispatch message to active tab', { message, err })
  }
  return false
}

onMessage(async (message): Promise<MsgResponse> => {
  switch (message.type) {
    case 'PING':
      return { ok: true, data: 'pong' }
    case 'SHOW_OVERLAY':
    case 'HIDE_OVERLAY':
    case 'TOGGLE_OVERLAY': {
      const delivered = await dispatchToActiveTab(message)
      return {
        ok: delivered,
        data: delivered ? 'dispatched' : 'no-active-tab'
      }
    }
    default:
      warn('Unhandled message', message)
      return { ok: false, error: 'Unknown message' }
  }
})
