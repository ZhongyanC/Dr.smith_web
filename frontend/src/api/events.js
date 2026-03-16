const API_BASE = ''

export async function fetchEventList(params = {}) {
  const { q = '' } = params
  const search = new URLSearchParams()
  if (q) search.set('q', q)
  const qs = search.toString()
  const url = `${API_BASE}/api/events/${qs ? `?${qs}` : ''}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch events')
  return res.json()
}

export async function fetchEvent(slug) {
  const res = await fetch(`${API_BASE}/api/events/${slug}/`)
  if (!res.ok) throw new Error('Event not found')
  return res.json()
}
