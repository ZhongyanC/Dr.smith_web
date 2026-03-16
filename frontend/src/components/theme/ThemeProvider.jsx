import { createContext, useState, useEffect, useCallback } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  // 全站统一使用深色模式
  const [mode] = useState('dark')

  const applyToDom = useCallback((m) => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    root.dataset.theme = m
    if (m === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [])

  useEffect(() => {
    applyToDom(mode)
  }, [mode, applyToDom])

  return (
    <ThemeContext.Provider value={{ mode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export { ThemeContext }
