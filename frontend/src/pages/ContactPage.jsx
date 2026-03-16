import { useEffect, useState, useRef } from 'react'
import { submitContact } from '../api/contact'
import { motion } from 'framer-motion'
import { pageVariants, itemVariants } from '../utils/motion'

export function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  })
  const [status, setStatus] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState(null)
  const widgetRef = useRef(null)

  useEffect(() => {
    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY
    if (!siteKey) {
      // When not configured locally, skip rendering Turnstile to avoid runtime errors
      console.warn('VITE_TURNSTILE_SITE_KEY is not configured; Turnstile widget will not render.')
      return
    }

    if (!window.turnstile) return
    if (widgetRef.current) {
      try {
        window.turnstile.reset(widgetRef.current)
      } catch {
        // ignore
      }
      return
    }
    const el = document.getElementById('cf-turnstile')
    if (!el) return
    widgetRef.current = window.turnstile.render(el, {
      sitekey: siteKey,
      theme: 'auto',
      callback: (token) => {
        setTurnstileToken(token)
      },
      'error-callback': () => {
        setTurnstileToken(null)
      },
      'expired-callback': () => {
        setTurnstileToken(null)
      },
    })
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus(null)
    if (!turnstileToken) {
      setStatus('Please complete the verification first.')
      return
    }
    setSubmitting(true)
    try {
      await submitContact({
        name: form.name,
        email: form.email,
        phone: form.phone,
        message: form.message,
        turnstile_token: turnstileToken,
      })
      setStatus('success')
      setForm({
        name: '',
        email: '',
        phone: '',
        message: '',
      })
      setTurnstileToken(null)
      if (window.turnstile && widgetRef.current) {
        try {
          window.turnstile.reset(widgetRef.current)
        } catch {
          // ignore
        }
      }
    } catch (err) {
      setStatus(err.message || 'Failed to send message.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      className="max-w-6xl mx-auto px-4 py-10 md:py-14"
      variants={pageVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants} className="grid gap-8 md:grid-cols-2">
        <motion.section variants={itemVariants} className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-slate-50">
            Contact Dr. Smith
          </h1>
          <p className="text-base text-gray-600 dark:text-slate-300">
            Feel free to reach out regarding research collaborations, speaking engagements, or other professional inquiries.
          </p>
          <div className="mt-4 space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">Email</p>
              <a
                href="mailto:smcbsmith@ku.edu"
                className="mt-0.5 inline-flex items-center text-sm font-medium text-blue-700 hover:underline dark:text-blue-400"
              >
                smcbsmith@ku.edu
              </a>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">Phone</p>
              <a
                href="tel:+1-785-864-1470"
                className="mt-0.5 inline-flex items-center text-sm text-gray-800 hover:underline dark:text-slate-100"
              >
                785-864-1470
              </a>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">Institution</p>
              <p className="mt-0.5 text-sm text-gray-800 dark:text-slate-100">
                UNIVERSITY OF KANSAS<br />
                308 Murphy Hall<br />
                1530 Naismith Drive<br />
                Lawrence, KS 66045-3103
              </p>
            </div>
          </div>
        </motion.section>

        <motion.section variants={itemVariants}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50 mb-4">
            Contact Form
          </h2>

          {status === 'success' && (
            <p className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-700/60 dark:bg-green-900/30 dark:text-green-300">
              Your message has been sent successfully. We will get back to you as soon as possible.
            </p>
          )}
          {status && status !== 'success' && (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700/60 dark:bg-red-900/30 dark:text-red-300">
              {status}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">
                  Name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm border-gray-300 bg-white text-gray-900 dark:bg-black dark:text-slate-100 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 dark:focus:border-blue-400 dark:focus:ring-blue-400/40 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">
                  Email<span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm border-gray-300 bg-white text-gray-900 dark:bg-black dark:text-slate-100 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 dark:focus:border-blue-400 dark:focus:ring-blue-400/40 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm border-gray-300 bg-white text-gray-900 dark:bg-black dark:text-slate-100 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 dark:focus:border-blue-400 dark:focus:ring-blue-400/40 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">
                Message<span className="text-red-500">*</span>
              </label>
              <textarea
                name="message"
                rows={5}
                required
                minLength={5}
                maxLength={500}
                value={form.message}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm border-gray-300 bg-white text-gray-900 dark:bg-black dark:text-slate-100 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 dark:focus:border-blue-400 dark:focus:ring-blue-400/40 transition-colors"
              />
            </div>

            <div className="mt-2">
              <div
                id="cf-turnstile"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-xl border border-white/40 bg-black px-5 py-2.5 text-sm font-medium text-white shadow-md transition-colors hover:bg-white hover:text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed dark:border-slate-600"
              >
                {submitting ? 'Sending…' : 'Send'}
              </button>
            </div>
          </form>
        </motion.section>
      </motion.div>
    </motion.div>
  )
}

