import React from 'react'

const filters = [
  {
    id: 'all',
    label: 'All inputs',
    description: 'Target every eligible input, textarea, and select element on the page.'
  },
  {
    id: 'text',
    label: 'Textual inputs',
    description: 'Limit mirroring to text-like inputs and textareas such as email, password, or search.'
  },
  {
    id: 'mock',
    label: 'Mock / test inputs',
    description: 'Surface elements that look like test scaffolding (data attributes, "mock" identifiers, etc.).'
  }
]

const Options: React.FC = () => {
  return (
    <main className="page">
      <h1>Spicy Mask Options</h1>
      <p className="subtitle">
        Spicy Mask mirrors form controls that match the selected filter. Use the extension action to open the
        overlay panel on any page and choose which filter applies.
      </p>

      <section className="card">
        <h2>Available filters</h2>
        <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filters.map((filter) => (
            <li key={filter.id}>
              <strong>{filter.label}</strong>: {filter.description}
            </li>
          ))}
        </ul>
      </section>

      <section className="info">
        <h2>How to debug mirrored inputs</h2>
        <p>
          Toggle the overlay panel from the extension popup. Each mirrored input renders inside a hidden
          shadow DOM host. Check the browser console for detailed logs about mirror creation, updates, and
          value propagation.
        </p>
      </section>

      <section className="info">
        <h2>Permissions reminder</h2>
        <p>
          Host permissions remain broad for development convenience. Narrow them down before shipping to
          production in order to follow the principle of least privilege.
        </p>
      </section>
    </main>
  )
}

export default Options
