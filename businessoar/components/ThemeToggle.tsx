'use client'

import { useState, useEffect } from 'react'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check localStorage for saved preference or system preference
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldBeDark = savedTheme ? savedTheme === 'dark' : prefersDark
    
    setIsDark(shouldBeDark)
    
    // Apply dark mode immediately
    if (shouldBeDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newDarkMode = !isDark
    setIsDark(newDarkMode)
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light')
    
    // Immediately apply the class change
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  if (!mounted) return null

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggleTheme}
        className="relative inline-flex items-center h-8 w-14 rounded-full bg-emerald-300 dark:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 dark:focus:ring-offset-emerald-900"
        aria-label="Toggle dark mode"
      >
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white dark:bg-emerald-100 shadow transition-transform ${
            isDark ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
      <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
        {isDark ? '🌙 Dark' : '☀️ Light'}
      </span>
    </div>
  )
}
