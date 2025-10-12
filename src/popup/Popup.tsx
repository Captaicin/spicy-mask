import React, { useEffect, useState } from 'react'
import { sendMessage } from '../shared/messaging'
import { DEFAULT_COLOR } from '../shared/constants'
import { log, warn } from '../shared/logger'

const Popup: React.FC = () => {
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'error'>('loading')

  useEffect(() => {
    sendMessage({ type: 'SHOW_OVERLAY' })
      .then((response) => {
        if (!response.ok) {
          warn('Overlay display request was not acknowledged', response)
        }
      })
      .catch((err) => warn('Failed to request overlay display', err))

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
        const response = await sendMessage({ type: 'GET_COLOR' })
        if (response.ok && typeof response.data === 'string') {
          setColor(response.data)
        }
        setStatus('idle')
      } catch (err) {
        warn('Failed to load color', err)
        setStatus('error')
      }
    }

    bootstrap()
  }, [])

  const handleColorChange = async (value: string) => {
    setColor(value)
    setStatus('saving')

    try {
      const response = await sendMessage({ type: 'SET_COLOR', payload: { color: value } })
      if (response.ok) {
        setStatus('idle')
      } else {
        setStatus('error')
      }
    } catch (err) {
      warn('Failed to save color', err)
      setStatus('error')
    }
  }

  return (
    <div className="panel">
      <h1>Spicy Mask</h1>
      <p className="subtitle">Pick a highlight color for the content script overlay.</p>
      <label className="field">
        <span>Highlight color</span>
        <input type="color" value={color} onChange={(event) => handleColorChange(event.target.value)} />
      </label>
      <p className="hint">
        Status: {status === 'idle' && 'Ready'}
        {status === 'loading' && 'Loading…'}
        {status === 'saving' && 'Saving…'}
        {status === 'error' && 'Something went wrong'}
      </p>
    </div>
  )
}

export default Popup
