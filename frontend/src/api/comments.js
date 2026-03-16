const API_BASE = ''

export async function fetchComments(postId) {
  const res = await fetch(`${API_BASE}/api/posts/${postId}/comments/`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch comments')
  return res.json()
}

export async function createComment(postId, data) {
  let csrf = getCsrfToken()
  if (!csrf) {
    const csrfRes = await fetch(`${API_BASE}/api/auth/csrf/`, { credentials: 'include' })
    const csrfData = await csrfRes.json()
    csrf = csrfData.csrfToken
  }
  const res = await fetch(`${API_BASE}/api/posts/${postId}/comments/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrf,
    },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = typeof err.detail === 'object' ? JSON.stringify(err.detail) : (err.detail || err.comment?.[0] || 'Failed to post comment')
    throw new Error(msg)
  }
  return res.json()
}

export async function deleteComment(commentId) {
  let csrf = getCsrfToken()
  if (!csrf) {
    const csrfRes = await fetch(`${API_BASE}/api/auth/csrf/`, { credentials: 'include' })
    const csrfData = await csrfRes.json()
    csrf = csrfData.csrfToken
  }
  const res = await fetch(`${API_BASE}/api/comments/${commentId}/`, {
    method: 'DELETE',
    headers: {
      'X-CSRFToken': csrf,
    },
    credentials: 'include',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = typeof err.detail === 'object' ? JSON.stringify(err.detail) : (err.detail || 'Failed to delete comment')
    throw new Error(msg)
  }
}

function getCsrfToken() {
  const match = document.cookie.match(/csrftoken=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}
