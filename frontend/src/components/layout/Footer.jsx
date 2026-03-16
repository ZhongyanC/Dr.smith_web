import { useTheme } from '../../hooks/useTheme'

const FOOTER_THEMES = {
  light: {
    footer: 'relative bottom-0 left-0 right-0 z-[60] bg-black/45 text-gray-100 border-t border-white/25 backdrop-blur-md',
    container: 'max-w-6xl mx-auto px-4 py-3',
    inner: 'flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4',
    iconRow: 'flex items-center justify-center sm:justify-start space-x-4',
    iconWrapper: 'w-10 h-10 flex items-center justify-center bg-white/10 text-white rounded-xl hover:bg-amber-400/80 hover:text-black transform hover:scale-110 transition-all duration-300 shadow-md',
    text: 'text-gray-300 text-[11px] sm:text-xs tracking-wide',
  },
  dark: {
    footer: 'relative bottom-0 left-0 right-0 z-[60] bg-black/55 text-gray-100 border-t border-slate-700/70 backdrop-blur-md',
    container: 'max-w-6xl mx-auto px-4 py-3',
    inner: 'flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4',
    iconRow: 'flex items-center justify-center sm:justify-start space-x-4',
    iconWrapper: 'w-10 h-10 flex items-center justify-center bg-slate-900/80 text-white rounded-xl hover:bg-amber-400 hover:text-black transform hover:scale-110 transition-all duration-300 shadow-md',
    text: 'text-gray-300 text-[11px] sm:text-xs tracking-wide',
  },
}

function IconEmail() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
      <path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
  )
}

function IconFacebook() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
      <path fill="currentColor" d="M22 12a10 10 0 1 0-11.5 9.9v-7h-2v-3h2v-2.3c0-2 1.2-3.1 3-3.1.9 0 1.8.16 1.8.16v2h-1c-1 0-1.3.63-1.3 1.27V11h2.3l-.37 3h-1.93v7A10 10 0 0 0 22 12z" />
    </svg>
  )
}

function IconYouTube() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-5">
      <path fill="currentColor" d="M21.8 8s-.2-1.43-.8-2.06c-.77-.82-1.63-.82-2.02-.87C16.16 5 12 5 12 5h-.02s-4.16 0-6.98.07c-.39.05-1.25.05-2.02.87C2.4 6.57 2.2 8 2.2 8S2 9.57 2 11.14v1.72c0 1.57.2 3.14.2 3.14s.2 1.43.78 2.06c.77.82 1.78.8 2.24.9C6.84 19 12 19 12 19s4.16 0 6.98-.07c.39-.05 1.25-.05 2.02-.87.58-.63.8-2.06.8-2.06s.2-1.57.2-3.14v-1.72c0-1.57-.2-3.14-.2-3.14zM9.75 14.73V9.27L15.5 12l-5.75 2.73z" />
    </svg>
  )
}

const socialLinks = [
  { name: 'Email', url: 'mailto:smcbsmith@ku.edu', icon: IconEmail },
  { name: 'Facebook', url: 'https://www.facebook.com/drscottmcbridesmith/', icon: IconFacebook },
  { name: 'YouTube', url: 'https://www.youtube.com/', icon: IconYouTube },
]

export function Footer({ onAdminLoginClick, isAdmin }) {
  const { mode } = useTheme()
  const theme = FOOTER_THEMES[mode] || FOOTER_THEMES.dark

  return (
    <footer className={theme.footer}>
      <div className={theme.container}>
        <div className={theme.inner}>
          <div className={theme.iconRow}>
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.name}
                className={theme.iconWrapper}
              >
                <link.icon />
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3 sm:gap-4 text-center sm:text-right">
            <p className={theme.text}>COPYRIGHT © {new Date().getFullYear()} Scott McBride Smith</p>
            <button
              type="button"
              onClick={onAdminLoginClick}
              className="hidden sm:inline-flex items-center justify-center rounded-xl border border-white/40 bg-black px-3 py-1.5 text-[11px] sm:text-xs font-medium text-white shadow-md transition-colors hover:bg-white hover:text-slate-900"
            >
              {isAdmin ? 'Admin panel' : 'Admin login'}
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
