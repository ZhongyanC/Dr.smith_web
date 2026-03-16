import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import { fetchEvent } from '../api/events'

export function EventsDetailPage() {
  const { slug } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchEvent(slug)
      .then((d) => {
        if (!cancelled) setEvent(d.event ?? d)
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [slug])

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <p className="text-red-500">{error}</p>
        <Link to="/events" className="mt-4 inline-flex items-center gap-1.5 text-blue-600 hover:underline">
          <FiArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back</span>
        </Link>
      </div>
    )
  }

  if (loading || !event) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <p className="text-gray-500 dark:text-slate-400">Loading...</p>
      </div>
    )
  }

  const when = new Date(event.when)
  const dateStr = when.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const timeStr = when.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <section className="relative overflow-hidden rounded-3xl border border-gray-200 shadow-sm dark:border-slate-800">
        {event.cover_url ? (
          <>
            <img
              src={event.cover_url}
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: 'blur(28px) brightness(0.55) saturate(1.1)', transform: 'scale(1.15)' }}
            />
            <div className="absolute inset-0 bg-black/30" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900" />
        )}

        <div className="relative p-6 md:p-10">
          <div className="grid md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-5">
              {event.cover_url ? (
                <img
                  src={event.cover_url}
                  alt={event.title}
                  className="w-full rounded-2xl shadow-lg ring-1 ring-black/10 object-cover bg-white/10"
                />
              ) : (
                <div className="w-full h-64 rounded-2xl bg-white/70 dark:bg-slate-900/70" />
              )}
            </div>

            <div className="md:col-span-7 text-white">
              <div className="flex flex-wrap items-center gap-2 text-sm text-white/90">
                <time dateTime={event.when}>
                  {dateStr} · {timeStr}
                </time>
              </div>
              <h1 className="mt-2 text-3xl md:text-4xl font-bold drop-shadow-sm">{event.title}</h1>
              {event.subtitle && <p className="mt-2 text-white/90 text-base md:text-lg">{event.subtitle}</p>}
            </div>
          </div>
        </div>
      </section>

      <article className="mt-8 rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-800 dark:bg-black">
        <div
          className="prose prose-slate max-w-none p-6 md:p-10 dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: event.body ?? '' }}
        />
      </article>

      <div className="mt-6">
        <Link
          to="/events"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-white text-gray-800 hover:bg-gray-50 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <FiArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back</span>
        </Link>
      </div>
    </div>
  )
}
