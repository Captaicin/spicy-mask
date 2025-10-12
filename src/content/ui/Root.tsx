import React, { useEffect, useState } from 'react'
import { sendMessage } from '../../shared/messaging'
import { DEFAULT_COLOR } from '../../shared/constants'
import { warn } from '../../shared/logger'
import { formOverlayController, type FormOverlayState } from '../forms/FormOverlayController'

const Root: React.FC = () => {
  const [color, setColor] = useState(() => formOverlayController.getColor() || DEFAULT_COLOR)
  const [status, setStatus] = useState<'loading' | 'idle' | 'saving' | 'error'>('loading')
  const [overlayState, setOverlayState] = useState<FormOverlayState>(() => formOverlayController.getState())

  useEffect(() => formOverlayController.subscribe(setOverlayState), [])

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const response = await sendMessage({ type: 'GET_COLOR' })
        if (response.ok && typeof response.data === 'string') {
          setColor(response.data)
          formOverlayController.setColor(response.data)
        }
        setStatus('idle')
      } catch (err) {
        warn('Failed to initialize color from background', err)
        setStatus('error')
      }
    }

    bootstrap()
  }, [])

  const handleToggle = () => {
    formOverlayController.setEnabled(!overlayState.enabled)
  }

  const handleFilterChange: React.ChangeEventHandler<HTMLSelectElement> = (event) => {
    formOverlayController.setFilterById(event.target.value)
  }

  const handleRefresh = () => {
    formOverlayController.refresh()
  }

  const handleColorChange = async (value: string) => {
    setColor(value)
    formOverlayController.setColor(value)

    setStatus('saving')
    try {
      const response = await sendMessage({ type: 'SET_COLOR', payload: { color: value } })
      if (response.ok) {
        setStatus('idle')
      } else {
        setStatus('error')
      }
    } catch (err) {
      warn('Failed to persist color', err)
      setStatus('error')
    }
  }

  const { enabled, filterId, filters, total, filtered } = overlayState

  return (
    <div
      style={{
        minWidth: 240,
        padding: '16px',
        borderRadius: 16,
        background: 'rgba(17, 24, 39, 0.95)',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        boxShadow: '0 16px 36px rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}
    >
      <header>
        <h2 style={{ margin: 0, fontSize: 18 }}>Spicy Mask</h2>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#cbd5f5' }}>
          Mirror filtered form fields in a shadow DOM overlay.
        </p>
      </header>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
          <span>Highlight color</span>
          <input
            type="color"
            value={color}
            onChange={(event) => handleColorChange(event.target.value)}
            disabled={status === 'saving'}
            style={{ width: '100%', height: 36, borderRadius: 8, border: 'none' }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
          <span>Form filter</span>
          <select
            value={filterId}
            onChange={handleFilterChange}
            style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid rgba(203, 213, 225, 0.4)' }}
          >
            {filters.map((filter) => (
              <option key={filter.id} value={filter.id}>
                {filter.label}
              </option>
            ))}
          </select>
          <small style={{ fontSize: 11, color: '#cbd5f5' }}>
            {filters.find((filter) => filter.id === filterId)?.description ?? ''}
          </small>
        </label>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={handleToggle}
          style={{
            width: '100%',
            padding: '10px 12px',
            fontWeight: 600,
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            background: enabled ? '#22c55e' : '#ef4444',
            color: '#0f172a'
          }}
        >
          {enabled ? 'Disable overlays' : 'Enable overlays'}
        </button>
        <button
          onClick={handleRefresh}
          style={{
            width: '100%',
            padding: '10px 12px',
            fontWeight: 500,
            borderRadius: 10,
            border: '1px solid rgba(203, 213, 225, 0.4)',
            background: 'rgba(15, 23, 42, 0.6)',
            color: '#e2e8f0',
            cursor: 'pointer'
          }}
        >
          Rescan forms
        </button>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 8,
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: 12,
          padding: '12px'
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: '#cbd5f5' }}>Detected</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{total}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#cbd5f5' }}>Mirroring</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{enabled ? filtered : 0}</div>
        </div>
      </section>

      <footer style={{ fontSize: 11, color: '#94a3b8' }}>
        {status === 'loading' && 'Initializing…'}
        {status === 'saving' && 'Saving color to storage…'}
        {status === 'error' && 'Could not sync with background. Check extension permissions.'}
        {status === 'idle' && `${filtered} fields match the ${filterId} filter.`}
      </footer>
    </div>
  )
}

export default Root
