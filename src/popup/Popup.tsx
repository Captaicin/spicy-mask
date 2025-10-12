import React, { useEffect, useState } from 'react'
import { sendMessage } from '../shared/messaging'
import { log, warn } from '../shared/logger'

const Popup: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'error'>('idle')

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
