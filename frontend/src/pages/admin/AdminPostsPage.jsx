import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiSearch } from 'react-icons/fi'
import { fetchAdminPosts, deletePost } from '../../api/admin'

export function AdminPostsPage() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    load()
  }, [search])

  async function load() {
    setLoading(true)
    try {
      const data = await fetchAdminPosts(search)
      setPosts(data)
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
    if (!confirm('Delete this post?')) return
    try {
      await deletePost(id)
      setPosts((p) => p.filter((x) => x.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Posts</h1>
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
              aria-label="Search posts"
            >
              <FiSearch className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
          <Link
            to="/admin/posts/new"
            className="inline-flex items-center justify-center w-full sm:w-auto px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm sm:text-base text-center hover:bg-blue-700"
          >
            New Post
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
                  Category
                </th>
                <th className="text-left px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">
                  Status
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
              {posts.map((p) => (
                <tr key={p.id} className="border-t border-slate-200 dark:border-slate-800">
                  <td className="px-4 py-3">
                    <Link to={`/admin/posts/${p.id}/edit`} className="text-blue-600 hover:underline">
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {p.category?.name || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        p.is_published
                          ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {p.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-sm">{p.created_at?.slice(0, 10)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/admin/posts/${p.id}/edit`}
                      className="text-blue-600 hover:underline mr-2"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(p.id)}
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
          {posts.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-500">No posts yet.</div>
          )}
        </div>
      )}
    </div>
  )
}
