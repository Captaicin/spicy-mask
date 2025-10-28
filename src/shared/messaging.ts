import { Msg, MsgResponse } from './types'

type MessageHandler = (
  message: Msg,
  sender: chrome.runtime.MessageSender,
) => Promise<MsgResponse> | MsgResponse

export const sendMessage = (message: Msg): Promise<MsgResponse> => {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response: MsgResponse) => {
      resolve(response)
    })
  })
}

export const onMessage = (handler: MessageHandler): (() => void) => {
  const listener: Parameters<typeof chrome.runtime.onMessage.addListener>[0] = (
    message,
    sender,
    sendResponse,
  ) => {
    Promise.resolve(handler(message as Msg, sender))
      .then((result) => sendResponse(result))
      .catch((error: unknown) => {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        sendResponse({ ok: false, error: errorMessage || 'Unknown error' })
      })

    return true
  }

  chrome.runtime.onMessage.addListener(listener)

  return () => chrome.runtime.onMessage.removeListener(listener)
}
