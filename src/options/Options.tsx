import React, { useEffect, useState } from 'react'
import { sendMessage } from '../shared/messaging'
import { DEFAULT_COLOR } from '../shared/constants'
import { log, warn } from '../shared/logger'

const Options: React.FC = () => {
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [message, setMessage] = useState('Loading…')

  useEffect(() => {
    const load = async () => {
      try {
        const response = await sendMessage({ type: 'GET_COLOR' })
        if (response.ok && typeof response.data === 'string') {
          setColor(response.data)
          setMessage('Color loaded from sync storage.')
        } else {
          setMessage('Using default color.')
        }
      } catch (err) {
        warn('Failed to load options', err)
        setMessage('Could not access background service worker.')
      }
    }

    load()
  }, [])

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    try {
      const response = await sendMessage({ type: 'SET_COLOR', payload: { color } })
      if (response.ok) {
        setMessage('Saved! Highlights will use the new color.')
      } else {
        setMessage('Save failed. Try again.')
      }
    } catch (err) {
      warn('Failed to persist option', err)
      setMessage('Save failed. Try again.')
    }
  }

  return (
    <main className="page">
      <h1>Spicy Mask Options</h1>
      <p className="subtitle">
        Configure defaults for your extension. Settings sync via <code>chrome.storage.sync</code>.
      </p>
      <form onSubmit={handleSubmit} className="card">
        <label className="field">
          <span>Preferred highlight color</span>
          <input type="color" value={color} onChange={(event) => setColor(event.target.value)} />
        </label>
        <button type="submit" className="button">
          Save
        </button>
      </form>
      <p className="hint">{message}</p>
      <section className="info">
        <h2>Minimal permissions reminder</h2>
        <p>
          Host permissions are intentionally broad in this example. Reduce them for real deployments to
          follow the principle of least privilege.
        </p>
      </section>
    </main>
  )
}

export default Options
