import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { FiArrowLeft, FiSave, FiExternalLink, FiCalendar } from 'react-icons/fi'
import { fetchAdminEvent, createEvent, updateEvent, uploadImage } from '../../api/admin'
import { RichTextEditor } from '../../components/admin/RichTextEditor'

function toLocalDateTime(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const h = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${y}-${m}-${day}T${h}:${min}`
  } catch {
    return ''
  }
}

export function AdminEventEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id || id === 'new'
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    slug: '',
    when: '',
    body: '',
    is_published: true,
    cover: null,
  })
  const whenInputRef = useState(() => ({ current: null }))[0]

  useEffect(() => {
    if (isNew) return
    fetchAdminEvent(id)
      .then((e) => {
        setForm({
          title: e.title || '',
          subtitle: e.subtitle || '',
          slug: e.slug || '',
          when: toLocalDateTime(e.when),
          body: e.body || '',
          is_published: e.is_published ?? true,
          cover: null,
        })
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id, isNew])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((f) => ({
      ...f,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (isNew) {
        const created = await createEvent(form)
        navigate(`/admin/events/${created.id}/edit`, { replace: true })
      } else {
        await updateEvent(id, form)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-slate-500">Loading...</p>

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Link to="/admin/events" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700">
          <FiArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          {isNew ? 'New Event' : 'Edit Event'}
        </h1>
      </div>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-200">Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-black text-slate-800 dark:text-slate-100"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-200">Subtitle</label>
          <input
            name="subtitle"
            value={form.subtitle}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-black text-slate-800 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-200">Date & Time</label>
          <div className="relative">
            <input
              ref={whenInputRef}
              name="when"
              type="datetime-local"
              value={form.when}
              onChange={handleChange}
              className="w-full pr-12 px-3 py-2 border rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-black text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 dark:focus:border-blue-400 dark:focus:ring-blue-400/40 transition-colors"
              required
            />
            <button
              type="button"
              onClick={() => {
                const el = whenInputRef.current
                if (!el) return
                try {
                  el.showPicker?.()
                } catch {}
                el.focus()
              }}
              className="absolute inset-y-0 right-1 my-1 w-10 inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-black text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Pick date and time"
              title="Pick date and time"
            >
              <FiCalendar className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-200">Body</label>
          <RichTextEditor
            value={form.body}
            onChange={(html) => setForm((f) => ({ ...f, body: html }))}
            onUploadImage={uploadImage}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-200">Cover Image</label>
          <div className="space-y-1.5">
            <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg bg-white dark:bg-black text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
              <span className="text-sm font-medium">Choose image</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {form.cover ? form.cover.name : 'No file selected'}
              </span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    cover: e.target.files && e.target.files[0] ? e.target.files[0] : null,
                  }))
                }
              />
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Recommended: high‑quality horizontal image (JPG or PNG).
            </p>
          </div>
        </div>
        <div>
          <label className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              name="is_published"
              checked={form.is_published}
              onChange={handleChange}
            />
            Published
          </label>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <FiSave className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </button>
          {!isNew && (
            <Link
              to={`/events/${form.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-black text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <FiExternalLink className="w-4 h-4" />
              <span>View</span>
            </Link>
          )}
        </div>
      </form>
    </div>
  )
}
