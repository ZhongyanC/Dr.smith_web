const API_BASE = '/api'

export async function submitContact(payload) {
  const res = await fetch(`${API_BASE}/contact/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg =
      typeof data.detail === 'string'
        ? data.detail
        : (data.error || 'Failed to submit contact form')
    throw new Error(msg)
  }
  return data
}

