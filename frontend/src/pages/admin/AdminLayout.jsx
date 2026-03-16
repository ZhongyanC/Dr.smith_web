import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { FiFileText, FiCalendar, FiSettings, FiExternalLink, FiLogOut, FiMail } from 'react-icons/fi'
import { fetchMe, logout } from '../../api/auth'

export function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    fetchMe()
      .then((user) => {
        if (!user) navigate('/admin/login', { replace: true, state: { from: location } })
        else setAuthChecked(true)
      })
      .catch(() => navigate('/admin/login', { replace: true }))
  }, [navigate, location])

  async function handleLogout() {
    try {
      await logout()
      navigate('/', { replace: true })
    } catch {
      navigate('/', { replace: true })
    }
  }

  const linkClass = ({ isActive }) =>
    `px-3 py-1.5 rounded-lg text-sm sm:text-base ${
      isActive
        ? 'bg-slate-700 text-white'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
    }`

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 dark:bg-black">
      <header className="flex-none border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-black">
        <div className="w-full px-3 sm:px-4 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <nav className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0">
            <NavLink to="/admin/posts" className={linkClass}>
              <span className="inline-flex items-center gap-1.5">
                <FiFileText className="w-4 h-4" />
                <span>Posts</span>
              </span>
            </NavLink>
            <NavLink to="/admin/events" className={linkClass}>
              <span className="inline-flex items-center gap-1.5">
                <FiCalendar className="w-4 h-4" />
                <span>Events</span>
              </span>
            </NavLink>
            <NavLink to="/admin/contacts" className={linkClass}>
              <span className="inline-flex items-center gap-1.5">
                <FiMail className="w-4 h-4" />
                <span>Contacts</span>
              </span>
            </NavLink>
            <NavLink to="/admin/settings" className={linkClass}>
              <span className="inline-flex items-center gap-1.5">
                <FiSettings className="w-4 h-4" />
                <span>Settings</span>
              </span>
            </NavLink>
          </nav>
          <div className="flex items-center justify-end gap-2 sm:gap-4">
            <NavLink
              to="/"
              className="px-2.5 py-1.5 text-xs sm:text-sm rounded-lg min-w-[96px] text-center border border-slate-300 dark:border-slate-700 bg-white dark:bg-black text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              <span className="inline-flex items-center gap-1.5">
                <FiExternalLink className="w-4 h-4" />
                <span>View Site</span>
              </span>
            </NavLink>
            <button
              onClick={handleLogout}
              className="px-2.5 py-1.5 text-xs sm:text-sm rounded-lg min-w-[96px] text-center border border-slate-300 dark:border-slate-700 bg-white dark:bg-black text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
            >
              <span className="inline-flex items-center gap-1.5">
                <FiLogOut className="w-4 h-4" />
                <span>Logout</span>
              </span>
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6">
        <div className="w-full">
          {authChecked ? <Outlet /> : <p className="text-slate-500">Loading...</p>}
        </div>
      </main>
    </div>
  )
}
