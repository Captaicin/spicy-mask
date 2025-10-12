import React, { useEffect, useState } from 'react'
import { sendMessage } from '../../shared/messaging'
import { DEFAULT_COLOR } from '../../shared/constants'
import { log, warn } from '../../shared/logger'

const applyHighlight = (color: string) => {
  document.querySelectorAll('p, span, div').forEach((node) => {
    const element = node as HTMLElement
    element.style.outline = `2px dashed ${color}`
    element.style.outlineOffset = '4px'
  })
}

const clearHighlight = () => {
  document.querySelectorAll('p, span, div').forEach((node) => {
    const element = node as HTMLElement
    element.style.outline = ''
    element.style.outlineOffset = ''
  })
}

const Root: React.FC = () => {
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [enabled, setEnabled] = useState(true)
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const ping = await sendMessage({ type: 'PING' })
        log('Background responded', ping)
        const response = await sendMessage({ type: 'GET_COLOR' })
        if (response.ok && typeof response.data === 'string') {
          setColor(response.data)
          applyHighlight(response.data)
          return
        }
      } catch (err) {
        warn('Failed to initialize color from background', err)
      }
      applyHighlight(DEFAULT_COLOR)
    }

    bootstrap()
  }, [])

  const handleToggle = () => {
    setEnabled((prev) => {
      const next = !prev
      if (next) {
        applyHighlight(color)
      } else {
        clearHighlight()
      }
      return next
    })
  }

  const handleColorChange = async (value: string) => {
    setColor(value)
    if (!enabled) {
      return
    }

    setStatus('saving')
    try {
      const response = await sendMessage({ type: 'SET_COLOR', payload: { color: value } })
      if (response.ok) {
        applyHighlight(value)
        setStatus('idle')
      } else {
        setStatus('error')
      }
    } catch (err) {
      warn('Failed to persist color', err)
      setStatus('error')
    }
  }

  return (
    <div
      style={{
        minWidth: 200,
        padding: '12px 16px',
        borderRadius: 12,
        background: 'rgba(17, 24, 39, 0.9)',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        boxShadow: '0 12px 32px rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(8px)'
      }}
    >
      <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>Spicy Mask</h2>
      <p style={{ margin: '0 0 12px', fontSize: 12 }}>
        Highlight text blocks on the page. Adjust the color or turn the overlay off.
      </p>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
        <span>Highlight color</span>
        <input
          type="color"
          value={color}
          onChange={(event) => handleColorChange(event.target.value)}
          style={{ width: '100%' }}
        />
      </label>
      <button
        onClick={handleToggle}
        style={{
          marginTop: 12,
          width: '100%',
          padding: '8px 12px',
          fontWeight: 600,
          borderRadius: 8,
          border: 'none',
          cursor: 'pointer',
          background: enabled ? '#22c55e' : '#ef4444',
          color: '#0f172a'
        }}
      >
        {enabled ? 'Disable highlight' : 'Enable highlight'}
      </button>
      {status === 'saving' && (
        <p style={{ marginTop: 8, fontSize: 11 }}>Saving…</p>
      )}
      {status === 'error' && (
        <p style={{ marginTop: 8, fontSize: 11, color: '#fbbf24' }}>
          Could not save color. Try again.
        </p>
      )}
    </div>
  )
}

export default Root
