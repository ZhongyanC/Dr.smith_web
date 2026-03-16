import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { ThemeProvider } from './components/theme/ThemeProvider'
import { Nav } from './components/layout/Nav'
import { Footer } from './components/layout/Footer'
import { HomePage } from './pages/HomePage'
import { BlogListPage } from './pages/BlogListPage'
import { BlogDetailPage } from './pages/BlogDetailPage'
import { EventsListPage } from './pages/EventsListPage'
import { EventsDetailPage } from './pages/EventsDetailPage'
import { ContactPage } from './pages/ContactPage'
import { WorkshopsPage } from './pages/WorkshopsPage'
import { CoursesPage } from './pages/CoursesPage'
import { NewsletterPage } from './pages/NewsletterPage'
import { AdminContactsPage } from './pages/admin/AdminContactsPage'
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminPostsPage } from './pages/admin/AdminPostsPage'
import { AdminPostEditPage } from './pages/admin/AdminPostEditPage'
import { AdminEventsPage } from './pages/admin/AdminEventsPage'
import { AdminEventEditPage } from './pages/admin/AdminEventEditPage'
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage'
import { AdminLoginModal } from './components/admin/AdminLoginModal'
import { fetchMe } from './api/auth'

function SiteLayout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'
  const [loginOpen, setLoginOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchMe()
      .then((user) => {
        if (!cancelled && user) setIsAdmin(true)
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div
      className={`min-h-[100dvh] flex flex-col ${
        isHome ? 'bg-black text-white' : 'bg-gray-50 text-gray-800 dark:bg-black dark:text-slate-50'
      }`}
    >
      <div id="nav-root" className="flex-none relative z-[30]">
        <Nav />
      </div>
      <main
        className={`flex-1 relative z-[20] ${isHome ? 'flex flex-col' : 'overflow-auto'}`}
      >
        {children}
      </main>
      <div id="footer-root" className="flex-none relative z-[20]">
        <Footer
          isAdmin={isAdmin}
          onAdminLoginClick={() => {
            if (isAdmin) {
              navigate('/admin/posts')
            } else {
              setLoginOpen(true)
            }
          }}
        />
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
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminPostsPage />} />
            <Route path="posts" element={<AdminPostsPage />} />
            <Route path="posts/new" element={<AdminPostEditPage />} />
            <Route path="posts/:id/edit" element={<AdminPostEditPage />} />
            <Route path="events" element={<AdminEventsPage />} />
            <Route path="events/new" element={<AdminEventEditPage />} />
            <Route path="events/:id/edit" element={<AdminEventEditPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="contacts" element={<AdminContactsPage />} />
          </Route>
          <Route path="*" element={
            <SiteLayout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/blog" element={<BlogListPage />} />
                <Route path="/blog/:slug" element={<BlogDetailPage />} />
                <Route path="/events" element={<EventsListPage />} />
                <Route path="/events/:slug" element={<EventsDetailPage />} />
                <Route path="/workshops" element={<WorkshopsPage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/newsletter" element={<NewsletterPage />} />
                <Route path="/contact" element={<ContactPage />} />
              </Routes>
            </SiteLayout>
          } />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
