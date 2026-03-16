const API = '/api'

function getCsrfToken() {
  const match = document.cookie.match(/csrftoken=([^;]+)/)
  return match ? match[1] : null
}

export async function fetchCsrf() {
  const res = await fetch(`${API}/auth/csrf/`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to get CSRF token')
  const data = await res.json()
  return data.csrfToken
}

export async function login(username, password, turnstileToken) {
  let csrf = getCsrfToken()
  if (!csrf) {
    csrf = await fetchCsrf()
  }
  const res = await fetch(`${API}/auth/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrf,
    },
    credentials: 'include',
    body: JSON.stringify({ username, password, turnstile_token: turnstileToken }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Login failed')
  return data
}

export async function logout() {
  const csrf = getCsrfToken()
  const res = await fetch(`${API}/auth/logout/`, {
    method: 'POST',
    headers: csrf ? { 'X-CSRFToken': csrf } : {},
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Logout failed')
}

export async function fetchMe() {
  const res = await fetch(`${API}/auth/me/`, { credentials: 'include' })
  if (res.status === 401 || res.status === 403) return null
  if (!res.ok) throw new Error('Failed to fetch user')
  const data = await res.json()
  return data.user
}

export async function fetchSettings() {
  const res = await fetch(`${API}/auth/settings/`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch settings')
  return res.json()
}

export async function updateSettings(data) {
  let csrf = getCsrfToken()
  if (!csrf) csrf = await fetchCsrf()
  const res = await fetch(`${API}/auth/settings/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrf,
    },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = typeof err.detail === 'object' ? Object.values(err.detail).flat().join(' ') : (err.detail || 'Update failed')
    throw new Error(msg)
  }
  return res.json()
}
