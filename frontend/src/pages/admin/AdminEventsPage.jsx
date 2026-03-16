import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiSearch } from 'react-icons/fi'
import { fetchAdminEvents, deleteEvent } from '../../api/admin'

export function AdminEventsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    load()
  }, [search])

  async function load() {
    setLoading(true)
    try {
      const data = await fetchAdminEvents(search)
      setEvents(data)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this event?')) return
    try {
      await deleteEvent(id)
      setEvents((e) => e.filter((x) => x.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  function formatWhen(when) {
    if (!when) return '-'
    try {
      const d = new Date(when)
      return d.toLocaleString()
    } catch {
      return when
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Events</h1>
        <div className="flex gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-3 pr-10 py-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-sm sm:text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 dark:focus:border-blue-400 dark:focus:ring-blue-400/40 transition-colors"
            />
            <button
              type="button"
              onClick={() => load()}
              className="absolute inset-y-0 right-1 my-1 w-8 inline-flex items-center justify-center rounded-md text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Search events"
            >
              <FiSearch className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
          <Link
            to="/admin/events/new"
            className="inline-flex items-center justify-center w-full sm:w-auto px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm sm:text-base text-center hover:bg-blue-700"
          >
            New Event
          </Link>
        </div>
      </div>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300">
          {error}
        </div>
      )}
      {loading ? (
        <p className="text-slate-500">Loading...</p>
      ) : (
        <div className="border rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="min-w-full">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="text-left px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">
                  Title
                </th>
                <th className="text-left px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">
                  When
                </th>
                <th className="text-left px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-t border-slate-200 dark:border-slate-800">
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/events/${e.id}/edit`}
                      className="text-blue-600 hover:underline"
                    >
                      {e.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {formatWhen(e.when)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        e.is_published
                          ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {e.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/admin/events/${e.id}/edit`}
                      className="text-blue-600 hover:underline mr-2"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(e.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
          {events.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-500">No events yet.</div>
          )}
        </div>
      )}
    </div>
  )
}
