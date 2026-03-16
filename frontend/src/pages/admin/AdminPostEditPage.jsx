import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { FiArrowLeft, FiSave, FiExternalLink } from 'react-icons/fi'
import {
  fetchAdminPost,
  createPost,
  updatePost,
  fetchCategories,
  createCategory,
  deleteCategory,
  uploadImage,
} from '../../api/admin'
import { RichTextEditor } from '../../components/admin/RichTextEditor'

export function AdminPostEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id || id === 'new'
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState([])
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    slug: '',
    body: '',
    is_published: true,
    category_id: null,
    cover: null,
  })

  useEffect(() => {
    fetchCategories().then(setCategories)
  }, [])

  useEffect(() => {
    if (isNew) return
    fetchAdminPost(id)
      .then((p) => {
        setForm({
          title: p.title || '',
          subtitle: p.subtitle || '',
          slug: p.slug || '',
          body: p.body || '',
          is_published: p.is_published ?? true,
          category_id: p.category?.id || null,
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
      const { slug: _slug, ...rest } = form
      const data = {
        ...rest,
        category_id: form.category_id || null,
      }
      if (isNew) {
        const created = await createPost(data)
        navigate(`/admin/posts/${created.id}/edit`, { replace: true })
      } else {
        await updatePost(id, data)
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
        <Link to="/admin/posts" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700">
          <FiArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          {isNew ? 'New Post' : 'Edit Post'}
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
          <label className="block text-sm font-medium mb-1">Body</label>
          <RichTextEditor
            value={form.body}
            onChange={(html) => setForm((f) => ({ ...f, body: html }))}
            onUploadImage={uploadImage}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-200">Cover Image</label>
          <div className="space-y-1.5">
            <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
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
          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-200">Category</label>
          <div className="flex gap-2 flex-wrap items-center">
            <select
              name="category_id"
              value={form.category_id || ''}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  category_id: e.target.value ? parseInt(e.target.value, 10) : null,
                }))
              }
              className="flex-1 min-w-[200px] px-3 py-2 border rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-black text-slate-800 dark:text-slate-100"
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {form.category_id && (
              <button
                type="button"
                onClick={async () => {
                  const currentId = form.category_id
                  const currentCat = categories.find((c) => c.id === currentId)
                  if (!currentId || !currentCat) return
                  const ok = window.confirm(
                    `Delete category "${currentCat.name}"?\n\nThis will remove it from all posts and cannot be undone.`
                  )
                  if (!ok) return
                  try {
                    await deleteCategory(currentId)
                    const nextCats = await fetchCategories()
                    setCategories(nextCats)
                    setForm((f) => ({ ...f, category_id: null }))
                  } catch (err) {
                    setError(err.message)
                  }
                }}
                className="px-3 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30 text-sm"
              >
                Delete current category
              </button>
            )}
            {!showNewCategory ? (
              <button
                type="button"
                onClick={() => setShowNewCategory(true)}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-black text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                + New
              </button>
            ) : (
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category name"
                  className="px-3 py-2 border rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-black text-slate-800 dark:text-slate-100"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={async () => {
                    const name = newCategoryName.trim()
                    if (!name) return
                    try {
                      const cat = await createCategory(name)
                      await fetchCategories().then(setCategories)
                      setForm((f) => ({ ...f, category_id: cat.id }))
                      setNewCategoryName('')
                      setShowNewCategory(false)
                    } catch (err) {
                      setError(err.message)
                    }
                  }}
                  className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewCategory(false)
                    setNewCategoryName('')
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-black text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            )}
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
          {!isNew && form.slug && (
            <Link
              to={`/blog/${form.slug}`}
              target="_blank"
              rel="noreferrer"
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
