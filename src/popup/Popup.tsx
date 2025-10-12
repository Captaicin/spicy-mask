import React, { useEffect, useState } from 'react'
import { sendMessage } from '../shared/messaging'

const Popup: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'error'>('idle')

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await sendMessage({ type: 'PING' })
      } catch (_err) {
        setStatus('error')
      }
    }

    bootstrap()
  }, [])

  return (
    <div className="panel">
      <h1>Spicy Mask</h1>
      <p className="subtitle">
        Mirroring runs automatically using the configured form filter. Update `src/content/filterConfig.ts` to
        inject a different filter strategy when collaborating with your team.
      </p>
      <p className="hint">Status: {status === 'idle' ? 'Connected' : 'Check service worker logs'}</p>
    </div>
  )
}

export default Popup
