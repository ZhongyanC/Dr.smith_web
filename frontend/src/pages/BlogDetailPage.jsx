import { useState, useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiArrowLeft, FiArrowRight, FiMessageSquare, FiSend } from 'react-icons/fi'
import { fetchPost } from '../api/blog'
import { fetchComments, createComment, deleteComment } from '../api/comments'
import { fetchSettings } from '../api/auth'

export function BlogDetailPage() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [related, setRelated] = useState([])
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [commentForm, setCommentForm] = useState({ name: '', email: '', url: '', comment: '', reply_to: 0 })
  const [submitStatus, setSubmitStatus] = useState(null)
  const [replyingTo, setReplyingTo] = useState(null)
  const addCommentRef = useRef(null)
  const [currentUserDisplayName, setCurrentUserDisplayName] = useState(null)
  const [canModerateComments, setCanModerateComments] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [commentTurnstileToken, setCommentTurnstileToken] = useState(null)
  const commentTurnstileRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchPost(slug)
      .then((d) => {
        if (!cancelled) {
          setPost(d.post ?? d)
          setRelated(d.related ?? [])
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [slug])

  // 如果已登录，预填并锁定评论表单中的 Name / Email
  useEffect(() => {
    let cancelled = false
    fetchSettings()
      .then((s) => {
        if (cancelled) return
        const display = s.display_name || s.username || ''
        const email = s.email || 'smcbsmith@ku.edu'
        if (display) {
          setCurrentUserDisplayName(display)
          setCanModerateComments(true)
          setCommentForm((f) => ({
            ...f,
            name: display,
            email,
          }))
        }
      })
      .catch(() => {
        // 未登录或获取失败时忽略，按游客表单处理
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Cloudflare Turnstile for comments（带简单重试，避免脚本尚未加载）
  useEffect(() => {
    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY
    if (!siteKey) {
      console.warn('VITE_TURNSTILE_SITE_KEY is not configured; Turnstile widget for comments will not render.')
      return
    }

    let attempts = 0
    const maxAttempts = 20
    const interval = setInterval(() => {
      attempts += 1
      if (commentTurnstileRef.current) {
        // 已经渲染过
        clearInterval(interval)
        return
      }
      if (!window.turnstile) {
        if (attempts >= maxAttempts) clearInterval(interval)
        return
      }
      const el = document.getElementById('cf-turnstile-comment')
      if (!el) {
        if (attempts >= maxAttempts) clearInterval(interval)
        return
      }
      try {
        commentTurnstileRef.current = window.turnstile.render(el, {
          sitekey: siteKey,
          theme: 'auto',
          callback: (token) => {
            setCommentTurnstileToken(token)
          },
          'error-callback': () => {
            setCommentTurnstileToken(null)
          },
          'expired-callback': () => {
            setCommentTurnstileToken(null)
          },
        })
        clearInterval(interval)
      } catch {
        if (attempts >= maxAttempts) clearInterval(interval)
      }
    }, 200)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!post?.id) return
    fetchComments(post.id)
      .then((data) => setComments(data.comments ?? data ?? []))
      .catch(() => setComments([]))
  }, [post?.id])

  function countComments(nodes) {
    if (!Array.isArray(nodes)) return 0
    return nodes.reduce((sum, c) => sum + 1 + countComments(c.children || []), 0)
  }

  function stripHtml(html) {
    if (!html) return ''
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent?.trim().slice(0, 80) || ''
  }

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    setSubmitStatus(null)
    if (!commentTurnstileToken) {
      setSubmitStatus('Please complete the verification first.')
      return
    }
    try {
      await createComment(post.id, {
        name: commentForm.name,
        email: commentForm.email,
        url: commentForm.url || undefined,
        comment: commentForm.comment,
        turnstile_token: commentTurnstileToken,
        reply_to: commentForm.reply_to || 0,
      })
      setCommentForm({ ...commentForm, comment: '', reply_to: 0 })
      setReplyingTo(null)
      setCommentTurnstileToken(null)
      if (window.turnstile && commentTurnstileRef.current) {
        try {
          window.turnstile.reset(commentTurnstileRef.current)
        } catch {
          // ignore
        }
      }
      const data = await fetchComments(post.id)
      setComments(data.comments ?? data ?? [])
      setSubmitStatus('success')
    } catch (err) {
      setSubmitStatus(err.message)
    }
  }

  const handleReplyClick = (c) => {
    setReplyingTo(c)
    setCommentForm((f) => ({ ...f, reply_to: c.id }))
    setSubmitStatus(null)
    setTimeout(() => addCommentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <p className="text-red-500">{error}</p>
        <Link to="/blog" className="mt-4 inline-block text-blue-600 hover:underline">← Back to Blog</Link>
      </div>
    )
  }

  if (loading || !post) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <p className="text-gray-500 dark:text-slate-400">Loading...</p>
      </div>
    )
  }

  const renderComments = (list, depth = 0) => {
    if (!Array.isArray(list)) return null
    return (
      <ul className={depth ? 'ml-6 mt-2 space-y-2' : 'space-y-4'}>
        {list.map((c) => (
          <li key={c.id} className="border-l-2 border-gray-200 dark:border-slate-700 pl-4">
            <div className="text-sm text-gray-600 dark:text-slate-300 flex items-center gap-2 flex-wrap">
              <strong>{c.user_name ?? c.name}</strong>
              <span className="text-gray-500 dark:text-slate-500">
                {c.submit_date ? new Date(c.submit_date).toLocaleDateString() : ''}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (replyingTo?.id === c.id) {
                    setReplyingTo(null)
                    setCommentForm((f) => ({ ...f, reply_to: 0 }))
                  } else {
                    handleReplyClick(c)
                  }
                }}
                className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
              >
                Reply
              </button>
              {canModerateComments && (
                <button
                  type="button"
                  onClick={() => setDeleteTarget(c)}
                  className="text-red-500 dark:text-red-400 hover:underline text-xs ml-2"
                >
                  Delete
                </button>
              )}
            </div>
            <div className="mt-1 text-gray-800 dark:text-slate-200 prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: c.comment ?? c.body ?? '' }} />
            {c.children?.length ? renderComments(c.children, depth + 1) : null}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <style>{`
        @keyframes fadeInBackdrop {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleInDialog {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .delete-dialog-backdrop {
          animation: fadeInBackdrop 160ms ease-out forwards;
        }
        .delete-dialog-panel {
          animation: scaleInDialog 180ms ease-out forwards;
        }
      `}</style>
      <section className="relative overflow-hidden rounded-3xl border border-gray-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {post.cover_url && (
          <>
            <img
              src={post.cover_url}
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: 'blur(28px) brightness(0.55) saturate(1.1)', transform: 'scale(1.15)' }}
            />
            <div className="absolute inset-0 bg-black/30" />
          </>
        )}
        {!post.cover_url && (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-300 dark:from-slate-800 dark:to-slate-900" />
        )}

        <div className="relative p-5 md:p-8">
          <div className="grid md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-5">
              <div className="rounded-2xl bg-white/10 ring-1 ring-white/20 overflow-hidden shadow dark:bg-black/20 dark:ring-white/10">
                {post.cover_url ? (
                  <img src={post.cover_url} alt={post.title} className="w-full h-[320px] md:h-[360px] object-cover" />
                ) : (
                  <div className="w-full h-[240px] grid place-items-center text-white/70">No Image</div>
                )}
              </div>
            </div>

            <div className="md:col-span-7">
              <div className="flex items-center gap-2">
                {post.category && (
                  <div className="ml-auto flex items-center gap-2">
                    <Link
                      to={`/blog?category=${post.category.slug}`}
                      className="inline-flex gap-2 px-3 py-1.5 rounded-lg border border-white/30 bg-white/10 text-white/90 text-sm hover:bg-white/20"
                    >
                      {post.category.name}
                    </Link>
                  </div>
                )}
              </div>

              <h1 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow">{post.title}</h1>
              {post.subtitle && <p className="mt-2 text-white/90 text-base md:text-lg">{post.subtitle}</p>}

              <div className="mt-3 text-sm text-white/80 flex flex-wrap items-center gap-3">
                <time dateTime={post.created_at}>
                  {new Date(post.created_at).toLocaleString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </div>
            </div>
          </div>
        </div>
      </section>

      <article className="mt-8 rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-black">
        <div
          className="prose prose-slate max-w-none p-6 md:p-10 dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: post.body ?? '' }}
        />
      </article>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border bg-white text-gray-800 hover:bg-gray-50 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <FiArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>
        {post.category && (
          <Link
            to={`/blog?category=${post.category.slug}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border bg-white text-gray-800 hover:bg-gray-50 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <FiArrowRight className="w-4 h-4" />
            <span>More in {post.category.name}</span>
          </Link>
        )}
      </div>

      {related?.length > 0 && (
        <section className="mt-10">
          <h3 className="font-semibold mb-3 text-gray-800 dark:text-slate-100">Related</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {related.map((r) => (
              <Link
                key={r.id}
                to={`/blog/${r.slug}`}
                className="block rounded-2xl border border-gray-200 bg-white hover:shadow-sm transition overflow-hidden dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              >
                {r.cover_url ? (
                  <img src={r.cover_url} alt={r.title} className="w-full h-36 object-cover" />
                ) : (
                  <div className="w-full h-36 grid place-items-center bg-gray-100 text-gray-400 text-sm dark:bg-slate-800 dark:text-slate-500">No Image</div>
                )}
                <div className="p-4">
                  <div className="font-semibold line-clamp-2 text-gray-900 dark:text-slate-50">{r.title}</div>
                  {r.subtitle && <div className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 mt-1">{r.subtitle}</div>}
                  <div className="text-xs text-gray-500 dark:text-slate-500 mt-2">{new Date(r.created_at).toLocaleDateString()}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <div className="h-px w-full bg-gray-200 dark:bg-slate-800 mb-6" />
        <h2 id="comments" className="font-semibold text-lg text-gray-800 dark:text-slate-100 flex items-center gap-2">
          <FiMessageSquare className="w-5 h-5" />
          <span>Comments ({countComments(comments)})</span>
        </h2>

        <div className="mt-4">
          {comments.length > 0 ? (
            renderComments(comments)
          ) : (
            <p className="text-gray-500 dark:text-slate-400 text-sm">No comments yet. Be the first to leave a comment!</p>
          )}
        </div>

        <div ref={addCommentRef} id="add-comment" className="mt-8 px-1 md:px-2">
          <h3 className="font-semibold mb-4 text-gray-800 dark:text-slate-100">
            {replyingTo ? 'Reply to comment' : 'Leave a comment'}
          </h3>

          {replyingTo && (
            <div className="mb-4 p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border-l-4 border-blue-500">
              <p className="text-sm text-gray-700 dark:text-slate-200">
                Replying to <strong>{replyingTo.user_name ?? replyingTo.name}</strong>
                {stripHtml(replyingTo.comment ?? replyingTo.body) && (
                  <> &ldquo;{stripHtml(replyingTo.comment ?? replyingTo.body)}{stripHtml(replyingTo.comment ?? replyingTo.body).length >= 80 ? '…' : ''}&rdquo;</>
                )}
              </p>
              <button
                type="button"
                onClick={() => { setReplyingTo(null); setCommentForm((f) => ({ ...f, reply_to: 0 })) }}
                className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Cancel reply
              </button>
            </div>
          )}

          {submitStatus === 'success' && (
            <p className="mb-4 text-green-600 dark:text-green-400">Comment submitted successfully.</p>
          )}
          {submitStatus && submitStatus !== 'success' && (
            <p className="mb-4 text-red-600 dark:text-red-400">{submitStatus}</p>
          )}

          <form onSubmit={handleCommentSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={commentForm.name}
                  onChange={(e) => setCommentForm({ ...commentForm, name: e.target.value })}
                  disabled={!!currentUserDisplayName}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm border-gray-300 bg-white text-gray-800 dark:bg-black dark:text-slate-100 dark:border-slate-700 ${
                    currentUserDisplayName
                      ? 'opacity-80 cursor-not-allowed'
                      : 'hover:border-gray-400 dark:hover:border-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 dark:focus:border-blue-400 dark:focus:ring-blue-400/40'
                  } transition-colors`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">Email</label>
                <input
                  type="email"
                  name="email"
                  required={!currentUserDisplayName}
                  value={commentForm.email}
                  onChange={(e) => setCommentForm({ ...commentForm, email: e.target.value })}
                  disabled={!!currentUserDisplayName}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm border-gray-300 bg-white text-gray-800 dark:bg-black dark:text-slate-100 dark:border-slate-700 ${
                    currentUserDisplayName
                      ? 'opacity-60 cursor-not-allowed'
                      : 'hover:border-gray-400 dark:hover:border-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 dark:focus:border-blue-400 dark:focus:ring-blue-400/40'
                  } transition-colors`}
                />
              </div>
            </div>
            {/* Website (optional) 字段仅后端支持，前端隐藏 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">Comment</label>
              <textarea
                name="comment"
                rows={5}
                required
                minLength={3}
                maxLength={500}
                value={commentForm.comment}
                onChange={(e) => setCommentForm({ ...commentForm, comment: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm border-gray-300 bg-white text-gray-800 dark:bg-black dark:text-slate-100 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 dark:focus:border-blue-400 dark:focus:ring-blue-400/40 transition-colors"
              />
            </div>
            <div>
              <div
                id="cf-turnstile-comment"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border bg-white text-gray-800 hover:bg-gray-50 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 text-sm"
            >
              <FiSend className="w-4 h-4" />
              <span>{replyingTo ? 'Reply to Comment' : 'Submit Comment'}</span>
            </button>
          </form>
        </div>
      </section>

      {deleteTarget && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 delete-dialog-backdrop"
            aria-hidden="true"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative w-full max-w-sm delete-dialog-panel">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-black">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  Delete comment?
                </h3>
              </div>
              <div className="px-5 py-4 space-y-3 text-sm">
                <p className="text-slate-700 dark:text-slate-200">
                  This action cannot be undone. The comment and all its replies will be permanently removed.
                </p>
                {(deleteTarget.comment || deleteTarget.body) && (
                  <p className="px-3 py-2 rounded-lg bg-slate-50 text-slate-700 text-xs dark:bg-slate-900 dark:text-slate-200 line-clamp-3">
                    {(deleteTarget.comment || deleteTarget.body).replace(/<[^>]+>/g, '')}
                  </p>
                )}
              </div>
              <div className="px-5 py-3 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="inline-flex items-center justify-center px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-black dark:text-slate-100 dark:hover:bg-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!deleteTarget) return
                    try {
                      await deleteComment(deleteTarget.id)
                      const data = await fetchComments(post.id)
                      setComments(data.comments ?? data ?? [])
                    } catch (err) {
                      console.error('Failed to delete comment:', err)
                    } finally {
                      setDeleteTarget(null)
                    }
                  }}
                  className="inline-flex items-center justify-center px-3 py-1.5 text-xs sm:text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
