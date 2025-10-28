import React, { useEffect, useState } from 'react'
import {
  AllFormFilter,
  MockFormFilter,
  TextFormFilter,
} from '../content/forms/filters'
import { storage, STORAGE_KEYS } from '../shared/storage'
import * as tokens from '../styles/designTokens'

const filters = [
  new AllFormFilter(),
  new TextFormFilter(),
  new MockFormFilter(),
]

const Options: React.FC = () => {
  const [defaultHighlight, setDefaultHighlight] = useState(false)

  useEffect(() => {
    storage.get<boolean>(STORAGE_KEYS.DEFAULT_HIGHLIGHT_ON).then((value) => {
      setDefaultHighlight(value ?? false)
    })
  }, [])

  const handleDefaultHighlightChange = (enabled: boolean) => {
    setDefaultHighlight(enabled)
    storage.set(STORAGE_KEYS.DEFAULT_HIGHLIGHT_ON, enabled)
  }

  return (
    <main className="page">
      <style>
        {`
          .switch {
            position: relative;
            display: inline-block;
            width: 34px;
            height: 20px;
          }

          .switch input { 
            opacity: 0;
            width: 0;
            height: 0;
          }

          .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: .4s;
            border-radius: 20px;
          }

          .slider:before {
            position: absolute;
            content: "";
            height: 14px;
            width: 14px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
          }

          input:checked + .slider {
            background-color: ${tokens.colors.accentGreen};
          }

          input:focus + .slider {
            box-shadow: 0 0 1px ${tokens.colors.accentGreen};
          }

          input:checked + .slider:before {
            transform: translateX(14px);
          }
        `}
      </style>
      <h1>Spicy Mask Options</h1>
      <p className="subtitle">
        Spicy Mask mirrors form controls that match the developer-supplied
        filter. Update <code>src/content/filterConfig.ts</code> to swap in a
        different strategy when collaborating.
      </p>

      <section className="card">
        <h2>General Settings</h2>
        <label
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 0',
            cursor: 'pointer',
          }}
        >
          <span>Enable highlighting by default</span>
          <div className="switch">
            <input
              type="checkbox"
              checked={defaultHighlight}
              onChange={(e) => handleDefaultHighlightChange(e.target.checked)}
            />
            <span className="slider"></span>
          </div>
        </label>
      </section>

      <section className="card">
        <h2>Available filters</h2>
        <ul className="list">
          {filters.map((filter) => (
            <li key={filter.id}>
              <strong>{filter.label}</strong>
              {filter.description ? `: ${filter.description}` : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="info">
        <h2>How mirroring works</h2>
        <p>
          Each matching form control is mirrored inside a zero-sized shadow DOM
          host. This keeps the page layout untouched while still allowing
          developers to inspect the mirrored inputs in DevTools.
        </p>
      </section>

      <section className="info">
        <h2>Permissions reminder</h2>
        <p>
          Host permissions remain broad for development convenience. Narrow them
          down before shipping to production in order to follow the principle of
          least privilege.
        </p>
      </section>
    </main>
  )
}

export default Options
