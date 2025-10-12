import React, { useEffect, useState } from 'react'
import { formOverlayController, type FormOverlayState } from '../forms/FormOverlayController'

const Root: React.FC = () => {
  const [overlayState, setOverlayState] = useState<FormOverlayState>(() => formOverlayController.getState())

  useEffect(() => formOverlayController.subscribe(setOverlayState), [])

  const handleToggle = () => {
    formOverlayController.setEnabled(!overlayState.enabled)
  }

  const handleFilterChange: React.ChangeEventHandler<HTMLSelectElement> = (event) => {
    formOverlayController.setFilterById(event.target.value)
  }

  const handleRefresh = () => {
    formOverlayController.refresh()
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
        Mirroring {enabled ? filtered : 0} of {total} form fields.
      </footer>
    </div>
  )
}

export default Root
