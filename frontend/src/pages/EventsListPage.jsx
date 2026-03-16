import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchEventList } from '../api/events'
import { FiSearch } from 'react-icons/fi'
import { motion } from 'framer-motion'
import { pageVariants, itemVariants, cardVariants, inViewOnce } from '../utils/motion'

function formatEventDate(when) {
  const d = new Date(when)
  return {
    short: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    full: `${d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} · ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`,
  }
}

function EventCard({ event, isUpcoming }) {
  const { short, time } = formatEventDate(event.when)
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      whileInView="show"
      viewport={inViewOnce}
    >
      <Link
      to={`/events/${event.slug}`}
      className="block group rounded-2xl border border-gray-200 shadow-sm overflow-hidden bg-white dark:border-slate-800 dark:bg-slate-900"
      >
      {event.cover_url ? (
        <img
          src={event.cover_url}
          alt={event.title}
          className="w-full h-56 object-cover group-hover:opacity-95 transition"
        />
      ) : (
        <div className="w-full h-56 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900" aria-hidden />
      )}
      <div className="p-5">
        <div className="flex items-center justify-between gap-2 text-xs mb-1">
          <time className="text-gray-500 dark:text-slate-400">{short} · {time}</time>
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${
              isUpcoming
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-500/50'
                : 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/60 dark:text-slate-200 dark:border-slate-600'
            }`}
          >
            {isUpcoming ? 'Upcoming' : 'Past'}
          </span>
        </div>
        <h3 className="mt-1 text-xl font-semibold text-gray-900 group-hover:text-blue-700 transition dark:text-slate-50 dark:group-hover:text-blue-300">
          {event.title}
        </h3>
        {event.subtitle && (
          <p className="text-gray-600 mt-1 text-sm line-clamp-2 dark:text-slate-300">{event.subtitle}</p>
        )}
      </div>
      </Link>
    </motion.div>
  )
}

export function EventsListPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQ, setSearchQ] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchEventList({ q: searchQ })
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [searchQ])

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  const upcoming = data?.upcoming ?? []
  const past = data?.past ?? []

  return (
    <motion.div
      className="max-w-6xl mx-auto px-4 py-6"
      variants={pageVariants}
      initial="hidden"
      animate="show"
    >
      <motion.section variants={itemVariants} className="space-y-6">
        <motion.section variants={itemVariants} className="-mt-2">
          <div className="mb-4 space-y-3">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const input = e.target.querySelector('input[name="q"]')
                setSearchQ(input?.value?.trim() ?? '')
              }}
              className="flex items-center gap-2 w-full"
            >
              <input
                type="text"
                name="q"
                defaultValue={searchQ}
                placeholder="Search events..."
                className="flex-1 border rounded-lg px-3 py-2 text-sm border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-slate-700 dark:bg-black dark:text-slate-100"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-slate-500 bg-slate-900 text-slate-50 text-sm hover:bg-slate-800 hover:border-slate-400"
              >
                <FiSearch className="w-4 h-4" />
                <span>Search</span>
              </button>
            </form>
            <div className="flex gap-2">
              <a
                href="#upcoming_event"
                className="flex-1 text-center px-3 py-2 text-sm rounded-lg border border-slate-500 bg-slate-900 text-slate-50 hover:bg-slate-800 hover:border-slate-400"
              >
                Upcoming
              </a>
              <a
                href="#past_event"
                className="flex-1 text-center px-3 py-2 text-sm rounded-lg border border-slate-500 bg-slate-900 text-slate-50 hover:bg-slate-800 hover:border-slate-400"
              >
                Past
              </a>
            </div>
          </div>
        </motion.section>

        {loading ? (
          <motion.p variants={itemVariants} className="text-gray-500 dark:text-slate-400">Loading...</motion.p>
        ) : !upcoming.length && !past.length && !searchQ ? null : (
          <>
            {upcoming.length > 0 && (
              <motion.section variants={itemVariants} id="upcoming_event" className="scroll-mt-24">
                <h2 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-slate-50">Upcoming</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {upcoming.map((e) => (
                    <EventCard key={e.id} event={e} isUpcoming />
                  ))}
                </div>
              </motion.section>
            )}

            {past.length > 0 && (
              <motion.section variants={itemVariants} id="past_event" className="scroll-mt-24 mt-10">
                <h2 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-slate-50">Past</h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {past.map((e) => (
                    <EventCard key={e.id} event={e} isUpcoming={false} />
                  ))}
                </div>
              </motion.section>
            )}

            {!upcoming.length && !past.length && searchQ && (
              <motion.p variants={itemVariants} className="text-gray-500 dark:text-slate-400">
                No events match this search.
              </motion.p>
            )}
          </>
        )}
      </motion.section>
    </motion.div>
  )
}
