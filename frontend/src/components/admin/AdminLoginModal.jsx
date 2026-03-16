import { useEffect, useRef, useState } from 'react'
import { FiX } from 'react-icons/fi'
import { login } from '../../api/auth'

export function AdminLoginModal({ open, onClose, onSuccess, position = 'center' }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState(null)
  const firstInputRef = useRef(null)
  const turnstileWidgetRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setError('')
    setLoading(false)
    setTurnstileToken(null)
    const t = setTimeout(() => firstInputRef.current?.focus(), 0)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // Cloudflare Turnstile for admin login
  useEffect(() => {
    if (!open) return
    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY
    if (!siteKey) {
      console.warn('VITE_TURNSTILE_SITE_KEY is not configured; Turnstile widget will not render.')
      return
    }
    let attempts = 0
    const maxAttempts = 20
    const interval = setInterval(() => {
      attempts += 1
      if (!window.turnstile) {
        if (attempts >= maxAttempts) clearInterval(interval)
        return
      }
      const el = document.getElementById('cf-turnstile-admin-login')
      if (!el) {
        if (attempts >= maxAttempts) clearInterval(interval)
        return
      }
      // 如果之前渲染过但 DOM 重新创建了（关闭再打开弹窗），需要重新 render
      if (turnstileWidgetRef.current && el.childElementCount > 0) {
        clearInterval(interval)
        return
      }
      try {
        // 清理旧 widget（若存在）
        if (turnstileWidgetRef.current) {
          try {
            window.turnstile.remove(turnstileWidgetRef.current)
          } catch {
            // ignore
          }
          turnstileWidgetRef.current = null
        }
        turnstileWidgetRef.current = window.turnstile.render(el, {
          sitekey: siteKey,
          theme: 'auto',
          callback: (token) => setTurnstileToken(token),
          'error-callback': () => setTurnstileToken(null),
          'expired-callback': () => setTurnstileToken(null),
        })
        clearInterval(interval)
      } catch {
        if (attempts >= maxAttempts) clearInterval(interval)
      }
    }, 200)
    return () => clearInterval(interval)
  }, [open])

  // 关闭弹窗时清理 Turnstile widget，确保下次打开能重新渲染
  useEffect(() => {
    if (open) return
    setTurnstileToken(null)
    if (window.turnstile && turnstileWidgetRef.current) {
      try {
        window.turnstile.remove(turnstileWidgetRef.current)
      } catch {
        // ignore
      }
    }
    turnstileWidgetRef.current = null
  }, [open])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY
      if (siteKey && !turnstileToken) {
        setError('Please complete the verification first.')
        return
      }
      await login(username, password, turnstileToken)
      onSuccess?.()
    } catch (err) {
      setError(err.message || 'Login failed')
      // 登录失败时让 Turnstile 重新可用（避免 token 已消费/失效）
      setTurnstileToken(null)
      if (window.turnstile && turnstileWidgetRef.current) {
        try {
          window.turnstile.reset(turnstileWidgetRef.current)
        } catch {
          // ignore
        }
      }
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[120]">
      <style>{`
        @keyframes fadeInBackdrop {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleInDialog {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .login-dialog-backdrop {
          animation: fadeInBackdrop 160ms ease-out forwards;
        }
        .login-dialog-panel {
          animation: scaleInDialog 180ms ease-out forwards;
        }
      `}</style>
      <button
        type="button"
        className="absolute inset-0 bg-black/70 login-dialog-backdrop"
        onClick={onClose}
        aria-label="Close login dialog"
      />
      <div
        className={
          position === 'bottom-right'
            ? 'absolute inset-0 flex items-end justify-end p-4 sm:p-6'
            : 'absolute inset-0 flex items-center justify-center px-4'
        }
      >
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black shadow-2xl login-dialog-panel">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Admin Login
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-black text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <FiX className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                Username
              </label>
              <input
                ref={firstInputRef}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-black border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 dark:focus:border-blue-400 dark:focus:ring-blue-400/40 transition-colors"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-black border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 dark:focus:border-blue-400 dark:focus:ring-blue-400/40 transition-colors"
                required
                autoComplete="current-password"
              />
            </div>

            <div className="pt-1 flex justify-center">
              <div id="cf-turnstile-admin-login" />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black transition-colors"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

