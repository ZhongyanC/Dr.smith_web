import { useState, useEffect, useMemo } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { FiMenu, FiX, FiUser } from 'react-icons/fi'
import { AdminLoginModal } from '../admin/AdminLoginModal'
import { fetchMe } from '../../api/auth'

const NAV_THEMES = {
  light: {
    desktop: {
      nav: 'hidden md:block relative bg-transparent',
      container: 'max-w-6xl mx-auto px-4 flex items-center justify-center py-8',
      list: 'flex items-stretch border border-white/20 bg-white/10 backdrop-blur-xl divide-x divide-white/10 shadow-lg shadow-black/10',
      listBorder: 'border-black',
      listDivider: 'divide-[#f3efe6]',
      itemBase: 'flex items-center justify-center text-md font-light tracking-wide transition-colors duration-200',
      itemWidth: 'w-28',
      itemHeight: 'h-12',
      itemActive: 'bg-black text-white',
      itemInactive: 'bg-white/20 text-black hover:bg-black hover:text-white',
    },
    mobile: {
      toggleButton:
        'fixed top-6 right-6 md:hidden focus:outline-none z-[80] w-10 h-10 flex items-center justify-center rounded-xl border shadow-md transform transition-all duration-300 active:scale-[0.95] hover:scale-110',
      drawer: 'fixed top-0 right-0 h-full w-72 transform transition-transform duration-300 ease-in-out xl:hidden z-[60] overflow-y-auto overscroll-y-contain shadow-2xl bg-white text-black',
      drawerInner: 'mt-6 px-5 pb-8 space-y-3',
      cardBase: 'group rounded-xl flex flex-col border overflow-hidden',
      cardActive: 'border-black bg-white text-black',
      cardInactive: 'border-gray-400 bg-white text-black',
      simpleLinkBase: 'flex items-center h-12 px-4 font-light transition-colors duration-300 ease-out',
      simpleLinkActive: 'bg-black text-white',
      simpleLinkInactive: 'hover:bg-black hover:text-white',
    },
  },
  dark: {
    desktop: {
      nav: 'bg-transparent hidden md:block relative',
      container: 'max-w-6xl mx-auto px-4 flex items-center justify-center py-8',
      list: 'flex items-stretch border border-white/20 bg-black/40 backdrop-blur-xl divide-x divide-white/10 shadow-lg shadow-black/40',
      listBorder: 'border-slate-500',
      listDivider: 'divide-slate-800',
      itemBase: 'flex items-center justify-center text-md font-light tracking-wide transition-colors duration-200',
      itemWidth: 'w-28',
      itemHeight: 'h-12',
      itemActive: 'bg-white text-slate-900',
      itemInactive: 'bg-black text-white hover:bg-white hover:text-slate-900',
    },
    mobile: {
      toggleButton:
        'fixed top-6 right-6 md:hidden focus:outline-none z-[80] w-10 h-10 flex items-center justify-center rounded-xl border shadow-md transform transition-all duration-300 active:scale-[0.95] hover:scale-110',
      drawer: 'fixed top-0 right-0 h-full w-72 transform transition-transform duration-300 ease-in-out xl:hidden z-[60] overflow-y-auto overscroll-y-contain shadow-2xl bg-black text-white',
      drawerInner: 'mt-6 px-5 pb-8 space-y-3',
      cardBase: 'group rounded-xl flex flex-col border overflow-hidden',
      cardActive: 'border-white bg-black text-white',
      cardInactive: 'border-slate-700 bg-black text-white',
      simpleLinkBase: 'flex items-center h-12 px-4 font-light transition-colors duration-300 ease-out',
      simpleLinkActive: 'bg-white text-slate-900',
      simpleLinkInactive: 'hover:bg-white hover:text-slate-900',
    },
  },
}

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Blog', href: '/blog' },
  { label: 'Events', href: '/events' },
  { label: 'Workshops', href: '/workshops' },
  { label: 'Courses', href: '/courses' },
  { label: 'Newsletter', href: '/newsletter' },
  { label: 'Contact', href: '/contact' },
  { label: 'Login', href: '/admin' },
]

const getMobileTitle = (path) => {
  if (!path || path === '/') return ''
  if (path.startsWith('/blog')) return 'Blog'
  if (path.startsWith('/events')) return 'Events'
  if (path.startsWith('/workshops')) return 'Workshops'
  if (path.startsWith('/courses')) return 'Courses'
  if (path.startsWith('/newsletter')) return 'Newsletter'
  if (path.startsWith('/contact')) return 'Contact'
  return ''
}

function NavLinkItem({ item, theme, isMobile, onClick }) {
  const baseClass = theme.simpleLinkBase
  const activeClass = theme.simpleLinkActive
  const inactiveClass = theme.simpleLinkInactive

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${baseClass} block w-full ${inactiveClass}`}
        onClick={onClick}
      >
        {item.label}
      </a>
    )
  }

  return (
    <NavLink
      to={item.href}
      onClick={onClick}
      className={({ isActive }) => `${baseClass} block w-full ${isActive ? activeClass : inactiveClass}`}
    >
      {item.label}
    </NavLink>
  )
}

export function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuMounted, setMenuMounted] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const [loginOpen, setLoginOpen] = useState(false)
   const [isAdmin, setIsAdmin] = useState(false)

  // 全站统一使用深色导航样式
  const theme = useMemo(() => NAV_THEMES.dark, [])
  const isHome = location.pathname === '/'
  const mobileTitle = getMobileTitle(location.pathname)
  const desktopItems = useMemo(() => navItems.filter((item) => item.label !== 'Login'), [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
  }, [mobileOpen])

  useEffect(() => {
    if (mobileOpen) {
      setMenuMounted(false)
      const timer = setTimeout(() => setMenuMounted(true), 220)
      return () => clearTimeout(timer)
    }
    setMenuMounted(false)
  }, [mobileOpen])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // 检查当前是否已登录管理员，如果已登录则后续点击直接进入管理后台
  useEffect(() => {
    let cancelled = false
    fetchMe()
      .then((user) => {
        if (!cancelled && user) {
          setIsAdmin(true)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsAdmin(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleMobileLinkClick = () => setMobileOpen(false)
  const openLogin = () => {
    if (isAdmin) {
      navigate('/admin/posts')
    } else {
      setLoginOpen(true)
    }
  }

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up {
          opacity: 0;
          animation: fadeUp 520ms ease forwards;
        }
        .pre-fade { opacity: 0; transform: translateY(14px); }
      `}</style>

      <nav className={theme.desktop.nav}>
        <div className={theme.desktop.container}>
          <ul className={`${theme.desktop.list} ${theme.desktop.listBorder} ${theme.desktop.listDivider}`}>
            {desktopItems.map((item) => (
              <li key={item.label} className="relative group fade-up">
                {item.external ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${theme.desktop.itemBase} ${theme.desktop.itemWidth} ${theme.desktop.itemHeight} ${theme.desktop.itemInactive}`}
                  >
                    {item.label}
                  </a>
                ) : (
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      `${theme.desktop.itemBase} ${theme.desktop.itemWidth} ${theme.desktop.itemHeight} ${
                        isActive ? theme.desktop.itemActive : theme.desktop.itemInactive
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* 移动端首页：使用悬浮菜单按钮 */}
      {!mobileOpen && isHome && (
        <div className="fixed top-6 right-6 md:hidden z-[80]">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className={`${theme.mobile.toggleButton} bg-black text-white border-white/40 hover:bg-white hover:text-slate-900`}
            aria-label="Open menu"
            aria-expanded={mobileOpen}
          >
            <FiMenu className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* 移动端非首页：将按钮放进 Header 容器内，菜单展开时高度保持不变 */}
      {!isHome && mobileTitle && (
        <header className="md:hidden sticky top-0 z-[50] bg-gray-50/95 dark:bg-black/90 backdrop-blur border-b border-gray-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <h1 className="text-base font-semibold tracking-tight text-gray-900 dark:text-slate-50">
              {mobileTitle}
            </h1>
            <button
              type="button"
              onClick={() => {
                if (!mobileOpen) setMobileOpen(true)
              }}
              className={`w-10 h-10 flex items-center justify-center rounded-xl border border-white/40 bg-black text-white shadow-md transition-transform hover:scale-110 hover:bg-white hover:text-slate-900 ${
                mobileOpen ? 'opacity-0 pointer-events-none shadow-none border-transparent bg-transparent hover:scale-100' : 'active:scale-[0.95]'
              }`}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <FiMenu className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </header>
      )}

      <div
        className={`fixed inset-0 transition-opacity duration-300 z-[40] xl:hidden ${mobileOpen ? 'bg-black opacity-80 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden
      />

      <div className={`${theme.mobile.drawer} ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <nav className={theme.mobile.drawerInner}>
          {/* 移动端抽屉顶部：Login 图标 + 关闭按钮，同一行统一样式 */}
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={() => {
                handleMobileLinkClick()
                openLogin()
              }}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-white/40 bg-black text-white shadow-md active:scale-[0.95] transition-transform hover:scale-110 hover:bg-white hover:text-slate-900"
              aria-label="Admin login"
            >
              <FiUser className="w-5 h-5" aria-hidden="true" />
              <span className="sr-only">Admin login</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-white/40 bg-black text-white shadow-md active:scale-[0.95] transition-transform hover:scale-110 hover:bg-white hover:text-slate-900"
              aria-label="Close menu"
            >
              <FiX className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {navItems
            .filter((item) => item.label !== 'Login')
            .map((item, idx) => (
            <div
              key={item.label}
              className={`${theme.mobile.cardBase} ${theme.mobile.cardInactive} ${menuMounted ? 'fade-up' : mobileOpen ? 'pre-fade' : ''}`}
              style={menuMounted ? { animationDelay: `${idx * 90}ms` } : {}}
            >
              <NavLinkItem
                item={item}
                theme={theme.mobile}
                isMobile
                onClick={handleMobileLinkClick}
              />
            </div>
          ))}
        </nav>
      </div>

      <AdminLoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => {
          setLoginOpen(false)
          setIsAdmin(true)
          navigate('/admin/posts')
        }}
      />
    </>
  )
}
