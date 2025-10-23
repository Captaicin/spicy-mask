import React from 'react'
import { AllFormFilter, MockFormFilter, TextFormFilter } from '../content/forms/filters'

const filters = [new AllFormFilter(), new TextFormFilter(), new MockFormFilter()]

const Options: React.FC = () => {
  return (
    <main className="page">
      <h1>Spicy Mask Options</h1>
      <p className="subtitle">
        Spicy Mask mirrors form controls that match the developer-supplied filter. Update{' '}
        <code>src/content/filterConfig.ts</code> to swap in a different strategy when collaborating.
      </p>

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
          Each matching form control is mirrored inside a zero-sized shadow DOM host. This keeps the page layout
          untouched while still allowing developers to inspect the mirrored inputs in DevTools.
        </p>
      </section>

      <section className="info">
        <h2>Permissions reminder</h2>
        <p>
          Host permissions remain broad for development convenience. Narrow them down before shipping to production
          in order to follow the principle of least privilege.
        </p>
      </section>
    </main>
  )
}

export default Options
