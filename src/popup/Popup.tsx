import React, { useEffect, useState } from 'react'
import { sendMessage } from '../shared/messaging'
import { log, warn } from '../shared/logger'

const Popup: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'error'>('idle')

  useEffect(() => {
    const showOverlay = async () => {
      try {
        const response = await sendMessage({ type: 'SHOW_OVERLAY' })
        if (!response.ok) {
          warn('Overlay display request was not acknowledged', response)
        }
      } catch (err) {
        warn('Failed to request overlay display', err)
        setStatus('error')
      }
    }

    showOverlay()

    const handleUnload = () => {
      sendMessage({ type: 'HIDE_OVERLAY' })
        .then((response) => {
          if (!response.ok) {
            warn('Overlay hide request was not acknowledged', response)
          }
        })
        .catch((err) => warn('Failed to hide overlay on unload', err))
    }

    window.addEventListener('unload', handleUnload)

    return () => {
      handleUnload()
      window.removeEventListener('unload', handleUnload)
    }
  }, [])

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const ping = await sendMessage({ type: 'PING' })
        log('Background ready', ping)
      } catch (err) {
        warn('Popup failed to reach background service worker', err)
        setStatus('error')
      }
    }

    bootstrap()
  }, [])

  const handleShow = () => {
    sendMessage({ type: 'SHOW_OVERLAY' }).catch((err) => warn('Failed to show overlay via popup', err))
  }

  const handleHide = () => {
    sendMessage({ type: 'HIDE_OVERLAY' }).catch((err) => warn('Failed to hide overlay via popup', err))
  }

  const handleToggle = () => {
    sendMessage({ type: 'TOGGLE_OVERLAY' }).catch((err) => warn('Failed to toggle overlay via popup', err))
  }

  return (
    <div className="panel">
      <h1>Spicy Mask</h1>
      <p className="subtitle">Manage the overlay panel for debugging filtered form inputs.</p>

      <button className="button" onClick={handleShow}>
        Show overlay panel
      </button>
      <button className="button" onClick={handleHide}>
        Hide overlay panel
      </button>
      <button className="button" onClick={handleToggle}>
        Toggle overlay panel
      </button>

      <p className="hint">Status: {status === 'idle' ? 'Connected' : 'Check background script console'}</p>
    </div>
  )
}

export default Popup
