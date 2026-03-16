import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FiSearch, FiArrowLeft, FiArrowRight } from 'react-icons/fi'
import { fetchPostList } from '../api/blog'
import { motion } from 'framer-motion'
import { pageVariants, itemVariants, cardVariants, inViewOnce } from '../utils/motion'

function cleanText(html) {
  if (!html) return ''
  const div = document.createElement('div')
  div.innerHTML = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')
  return div.textContent.replace(/https?:\/\/\S+/g, '').trim()
}

export function BlogListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const page = parseInt(searchParams.get('page') || '1', 10)
  const q = searchParams.get('q') || ''
  const category = searchParams.get('category') || ''

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchPostList({ page, q, category })
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
  }, [page, q, category])

  const updateParams = (updates) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([k, v]) => {
      if (v) next.set(k, v)
      else next.delete(k)
    })
    next.delete('page')
    if (updates.page) next.set('page', updates.page)
    setSearchParams(next)
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  if (loading && !data) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <p className="text-gray-500 dark:text-slate-400">Loading...</p>
      </div>
    )
  }

  const posts = data?.results ?? data?.posts ?? []
  const paginator = data?.paginator ?? {}
  const totalPages = paginator.num_pages ?? 1
  const currentPage = paginator.number ?? page
  const categories = data?.categories ?? []

  return (
    <motion.div
      className="max-w-6xl mx-auto px-4 py-6"
      variants={pageVariants}
      initial="hidden"
      animate="show"
    >
      {/* 顶部整行搜索区 */}
      <motion.section variants={itemVariants} className="pb-6 border-b border-gray-200 dark:border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const form = e.target
            const input = form.querySelector('input[name=\"q\"]')
            updateParams({ q: input?.value?.trim() || '' })
          }}
          className="flex items-center gap-2 w-full"
        >
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search..."
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
      </motion.section>

      <motion.div variants={itemVariants} className="grid md:grid-cols-12 gap-6 mt-6">
        <motion.aside variants={itemVariants} className="md:col-span-3 space-y-8 md:pr-4 border-r border-gray-200 dark:border-slate-800">
          <motion.section variants={itemVariants} className="pb-6">
            <h3 className="font-semibold mb-3 text-gray-800 dark:text-slate-100 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" /> Categories
            </h3>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => updateParams({ category: '' })}
                  className={`block w-full text-center text-sm font-medium rounded-lg border px-3 py-2 transition-all ${
                    !category
                      ? 'bg-gray-900 text-white border-gray-900 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100'
                      : 'text-gray-700 border-gray-300 hover:bg-gray-100 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800'
                  }`}
                >
                  All
                </button>
              </li>
              {categories.map((c) => (
                <motion.li key={c.slug} variants={itemVariants}>
                  <button
                    type="button"
                    onClick={() => updateParams({ category: c.slug })}
                    className={`block w-full text-center text-sm font-medium rounded-lg border px-3 py-2 transition-all ${
                      category === c.slug
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'text-gray-700 border-gray-300 hover:bg-gray-100 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800'
                    }`}
                  >
                    {c.name}
                  </button>
                </motion.li>
              ))}
            </ul>
          </motion.section>
        </motion.aside>

        <motion.section variants={itemVariants} className="md:col-span-9">
          {posts.length === 0 ? (
            <motion.div
              variants={itemVariants}
              className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500 dark:border-slate-800 dark:bg-black dark:text-slate-300"
            >
              No posts found.
            </motion.div>
          ) : (
            <div className="space-y-5">
              {posts.map((p) => (
                <motion.article
                  key={p.id}
                  variants={cardVariants}
                  initial="hidden"
                  whileInView="show"
                  viewport={inViewOnce}
                  className="group rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-md hover:border-gray-300 transition dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-slate-700"
                >
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-64 md:flex-shrink-0 md:border-r border-gray-200 dark:border-slate-800 cursor-pointer">
                      <Link to={`/blog/${p.slug}`}>
                        {p.cover_url ? (
                          <img
                            src={p.cover_url}
                            alt={p.title}
                            className="w-full h-56 md:h-full object-cover group-hover:brightness-105 transition"
                          />
                        ) : (
                          <div className="w-full h-56 md:h-full grid place-items-center bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500">
                            No Image
                          </div>
                        )}
                      </Link>
                    </div>
                    <div className="flex-1 p-5 md:p-6">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                        <time dateTime={p.created_at}>{new Date(p.created_at).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</time>
                        {p.category && (
                          <Link
                            to={`/blog?category=${p.category.slug}`}
                            className="inline-flex px-2 py-1 rounded border text-gray-800 hover:bg-gray-50 dark:text-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
                          >
                            {p.category.name}
                          </Link>
                        )}
                      </div>
                      <h2 className="mt-2 text-xl md:text-2xl font-semibold leading-snug tracking-tight text-black group-hover:text-blue-700 transition dark:text-slate-50 dark:group-hover:text-blue-300">
                        <Link to={`/blog/${p.slug}`}>{p.title}</Link>
                      </h2>
                      {p.subtitle && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400 line-clamp-2">{p.subtitle}</p>
                      )}
                      <p className="mt-3 text-gray-700 dark:text-slate-300 line-clamp-3">
                        {p.excerpt || cleanText(p.body || '').slice(0, 240)}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          to={`/blog/${p.slug}`}
                          className="inline-flex gap-2 px-4 py-2 rounded-lg border border-slate-500 bg-slate-900 text-slate-50 text-sm hover:bg-slate-800 hover:border-slate-400"
                        >
                          Read Post
                        </Link>
                        {p.category && (
                          <Link
                            to={`/blog?category=${p.category.slug}`}
                            className="inline-flex gap-2 px-3 py-2 rounded-lg border text-sm text-gray-800 hover:bg-gray-50 dark:text-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
                          >
                            More in {p.category.name}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}

              {totalPages > 1 && (
                <nav className="mt-8 flex items-center justify-between">
                  <div>
                    {currentPage > 1 ? (
                      <button
                        type="button"
                        onClick={() => updateParams({ page: currentPage - 1 })}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border bg-white text-gray-800 hover:bg-gray-50 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        <FiArrowLeft className="w-4 h-4" />
                        <span>Previous</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700">
                        <FiArrowLeft className="w-4 h-4" />
                        <span>Previous</span>
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-slate-400">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div>
                    {currentPage < totalPages ? (
                      <button
                        type="button"
                        onClick={() => updateParams({ page: currentPage + 1 })}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border bg-white text-gray-800 hover:bg-gray-50 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        <span>Next</span>
                        <FiArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700">
                        <span>Next</span>
                        <FiArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </nav>
              )}
            </div>
          )}
        </motion.section>
      </motion.div>
    </motion.div>
  )
}
