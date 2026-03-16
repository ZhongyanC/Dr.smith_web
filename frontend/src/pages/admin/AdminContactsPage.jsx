import { useEffect, useState } from 'react'
import { FiSearch, FiTrash2, FiMail } from 'react-icons/fi'
import { fetchAdminContacts, deleteContact } from '../../api/admin'
import { useNavigate } from 'react-router-dom'

export function AdminContactsPage() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [expandedIds, setExpandedIds] = useState(() => new Set())
  const navigate = useNavigate()

  useEffect(() => {
    load()
  }, [search])

  async function load() {
    setLoading(true)
    try {
      const data = await fetchAdminContacts(search)
      setContacts(data)
      setError('')
    } catch (err) {
      if (err.message === 'AUTH_REQUIRED') {
        navigate('/admin/login', { replace: true })
        return
      }
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this contact message?')) return
    try {
      await deleteContact(id)
      setContacts((list) => list.filter((c) => c.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  function formatDate(iso) {
    if (!iso) return '-'
    try {
      const d = new Date(iso)
      return d.toLocaleString()
    } catch {
      return iso
    }
  }

  function shortMessage(msg) {
    if (!msg) return ''
    const t = msg.trim()
    return t.length > 120 ? `${t.slice(0, 120)}…` : t
  }

  function toggleExpanded(id) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <FiMail className="w-6 h-6" />
          <span>Contacts</span>
        </h1>
        <div className="flex gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, email, phone, or message..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-3 pr-10 py-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-sm sm:text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 dark:focus:border-blue-400 dark:focus:ring-blue-400/40 transition-colors"
            />
            <button
              type="button"
              onClick={() => load()}
              className="absolute inset-y-0 right-1 my-1 w-8 inline-flex items-center justify-center rounded-md text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Search contacts"
            >
              <FiSearch className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
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
                    Message
                  </th>
                  <th className="text-left px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">
                    Email
                  </th>
                  <th className="text-left px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">
                    Phone
                  </th>
                  <th className="text-left px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">
                    Date
                  </th>
                  <th className="text-right px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr key={c.id} className="border-t border-slate-200 dark:border-slate-800 align-top">
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200 text-sm max-w-xs">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(c.id)}
                        className="text-left w-full focus:outline-none"
                      >
                        <span className="whitespace-pre-wrap break-words">
                          {expandedIds.has(c.id) ? (c.message || '') : shortMessage(c.message)}
                        </span>
                        {c.message && c.message.trim().length > 120 && (
                          <span className="mt-1 block text-xs text-blue-600 dark:text-blue-400 underline">
                            {expandedIds.has(c.id) ? 'Collapse' : 'Expand'}
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-100">
                      {c.name}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`mailto:${c.email}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                      >
                        {c.email}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200 whitespace-nowrap">
                      {c.phone || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-sm whitespace-nowrap">
                      {formatDate(c.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
                      >
                        <FiTrash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {contacts.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-500">No contacts yet.</div>
          )}
        </div>
      )}
    </div>
  )
}

