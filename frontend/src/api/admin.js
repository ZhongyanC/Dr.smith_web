const API = '/api'

function getCsrfToken() {
  const match = document.cookie.match(/csrftoken=([^;]+)/)
  return match ? match[1] : null
}

async function authFetch(url, options = {}) {
  let csrf = getCsrfToken()
  if (!csrf && (options.method === 'POST' || options.method === 'PUT' || options.method === 'DELETE')) {
    const res = await fetch(`${API}/auth/csrf/`, { credentials: 'include' })
    const data = await res.json()
    csrf = data.csrfToken
  }
  const headers = {
    ...options.headers,
    ...(csrf ? { 'X-CSRFToken': csrf } : {}),
  }
  const res = await fetch(url, { ...options, headers, credentials: 'include' })
  if (res.status === 403) {
    const err = new Error('AUTH_REQUIRED')
    err.status = 403
    throw err
  }
  return res
}

// Categories
export async function fetchCategories() {
  const res = await authFetch(`${API}/admin/categories/`)
  if (!res.ok) throw new Error('Failed to fetch categories')
  const data = await res.json()
  return data.results
}

export async function createCategory(name, slug) {
  const res = await authFetch(`${API}/admin/categories/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, slug: slug || undefined }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(JSON.stringify(err))
  }
  return res.json()
}

export async function updateCategory(id, data) {
  const res = await authFetch(`${API}/admin/categories/${id}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(JSON.stringify(err))
  }
  return res.json()
}

export async function deleteCategory(id) {
  const res = await authFetch(`${API}/admin/categories/${id}/`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Delete failed')
}

// Posts
export async function fetchAdminPosts(q = '') {
  const url = q ? `${API}/admin/posts/?q=${encodeURIComponent(q)}` : `${API}/admin/posts/`
  const res = await authFetch(url)
  if (!res.ok) throw new Error('Failed to fetch posts')
  const data = await res.json()
  return data.results
}

export async function fetchAdminPost(id) {
  const res = await authFetch(`${API}/admin/posts/${id}/`)
  if (!res.ok) throw new Error('Post not found')
  return res.json()
}

export async function createPost(data) {
  const body = data instanceof FormData ? data : toPostBody(data)
  const opts = { method: 'POST', body }
  if (!(body instanceof FormData)) opts.headers = { 'Content-Type': 'application/json' }
  const res = await authFetch(`${API}/admin/posts/`, opts)
  if (!res.ok) {
    const err = await res.json()
    throw new Error(JSON.stringify(err))
  }
  return res.json()
}

export async function updatePost(id, data) {
  const body = data instanceof FormData ? data : toPostBody(data)
  const opts = { method: 'PUT', body }
  if (!(body instanceof FormData)) opts.headers = { 'Content-Type': 'application/json' }
  const res = await authFetch(`${API}/admin/posts/${id}/`, opts)
  if (!res.ok) {
    const err = await res.json()
    throw new Error(JSON.stringify(err))
  }
  return res.json()
}

export async function deletePost(id) {
  const res = await authFetch(`${API}/admin/posts/${id}/`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Delete failed')
}

export async function uploadImage(file) {
  const fd = new FormData()
  fd.append('file', file)
  const res = await authFetch(`${API}/admin/upload/`, {
    method: 'POST',
    body: fd,
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Upload failed')
  }
  const data = await res.json()
  return data.url
}

// Events
export async function fetchAdminEvents(q = '') {
  const url = q ? `${API}/admin/events/?q=${encodeURIComponent(q)}` : `${API}/admin/events/`
  const res = await authFetch(url)
  if (!res.ok) throw new Error('Failed to fetch events')
  const data = await res.json()
  return data.results
}

export async function fetchAdminEvent(id) {
  const res = await authFetch(`${API}/admin/events/${id}/`)
  if (!res.ok) throw new Error('Event not found')
  return res.json()
}

export async function createEvent(data) {
  const body = data instanceof FormData ? data : toEventBody(data)
  const opts = { method: 'POST', body }
  if (!(body instanceof FormData)) opts.headers = { 'Content-Type': 'application/json' }
  const res = await authFetch(`${API}/admin/events/`, opts)
  if (!res.ok) {
    const err = await res.json()
    throw new Error(JSON.stringify(err))
  }
  return res.json()
}

export async function updateEvent(id, data) {
  const body = data instanceof FormData ? data : toEventBody(data)
  const opts = { method: 'PUT', body }
  if (!(body instanceof FormData)) opts.headers = { 'Content-Type': 'application/json' }
  const res = await authFetch(`${API}/admin/events/${id}/`, opts)
  if (!res.ok) {
    const err = await res.json()
    throw new Error(JSON.stringify(err))
  }
  return res.json()
}

export async function deleteEvent(id) {
  const res = await authFetch(`${API}/admin/events/${id}/`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Delete failed')
}

// Contacts
export async function fetchAdminContacts(q = '') {
  const url = q ? `${API}/admin/contacts/?q=${encodeURIComponent(q)}` : `${API}/admin/contacts/`
  const res = await authFetch(url)
  if (!res.ok) throw new Error('Failed to fetch contacts')
  const data = await res.json()
  return data.results
}

export async function deleteContact(id) {
  const res = await authFetch(`${API}/admin/contacts/${id}/`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Delete failed')
}

function toPostBody(obj) {
  if (obj instanceof FormData) return obj
  const hasFile = obj.cover instanceof File
  if (hasFile) {
    const fd = new FormData()
    fd.append('title', obj.title || '')
    fd.append('subtitle', obj.subtitle || '')
    fd.append('body', obj.body || '')
    fd.append('is_published', obj.is_published ? 'true' : 'false')
    if (obj.category_id) fd.append('category_id', obj.category_id)
    fd.append('cover', obj.cover)
    return fd
  }
  return JSON.stringify({
    title: obj.title,
    subtitle: obj.subtitle,
    body: obj.body,
    is_published: obj.is_published,
    category_id: obj.category_id || null,
  })
}

function normalizeWhen(when) {
  if (!when) return when
  const s = String(when).trim()
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) return s + ':00'
  return s
}

function toEventBody(obj) {
  if (obj instanceof FormData) return obj
  const when = normalizeWhen(obj.when)
  const hasFile = obj.cover instanceof File
  if (hasFile) {
    const fd = new FormData()
    fd.append('title', obj.title || '')
    fd.append('subtitle', obj.subtitle || '')
    fd.append('body', obj.body || '')
    // slug 由后端根据 title 自动生成，不提交
    fd.append('when', when || '')
    fd.append('is_published', obj.is_published ? 'true' : 'false')
    fd.append('cover', obj.cover)
    return fd
  }
  // slug 由后端根据 title 自动生成，不提交
  return JSON.stringify({
    title: obj.title,
    subtitle: obj.subtitle,
    body: obj.body,
    when: when || undefined,
    is_published: obj.is_published,
  })
}
