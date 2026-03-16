const API_BASE = ''

export async function fetchPostList(params = {}) {
  const { page = 1, q = '', category = '' } = params
  const search = new URLSearchParams()
  if (page > 1) search.set('page', page)
  if (q) search.set('q', q)
  if (category) search.set('category', category)
  const qs = search.toString()
  const url = `${API_BASE}/api/blog/${qs ? `?${qs}` : ''}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch posts')
  return res.json()
}

export async function fetchPost(slug) {
  const res = await fetch(`${API_BASE}/api/blog/${slug}/`)
  if (!res.ok) throw new Error('Post not found')
  return res.json()
}
