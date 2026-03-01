"use client"

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Turnstile from 'react-turnstile'
import { supabase } from '../../lib/supabaseClient'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [resetTurnstile, setResetTurnstile] = useState(0)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    if (!turnstileToken) {
      setError('Please complete the CAPTCHA verification')
      setLoading(false)
      return
    }

    const verifyResponse = await fetch('/api/verify-turnstile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: turnstileToken }),
    })

    const verifyData = await verifyResponse.json()

    if (!verifyData.success) {
      setError('CAPTCHA verification failed. Please try again.')
      setLoading(false)
      setResetTurnstile(prev => prev + 1)
      setTurnstileToken(null)
      return
    }

    const action =
      mode === 'signin'
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password })

    const { error } = await action

    if (error) {
      setError(error.message)
      setLoading(false)
      setResetTurnstile(prev => prev + 1)
      setTurnstileToken(null)
      return
    }

    router.replace(redirectTo)
  }

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-3xl font-bold text-emerald-900 dark:text-emerald-50">
        {mode === 'signin' ? 'Sign In' : 'Create Account'}
      </h1>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('signin')}
          className={`rounded px-3 py-1 text-sm font-semibold ${
            mode === 'signin'
              ? 'bg-emerald-600 dark:bg-emerald-700 text-white dark:text-emerald-50'
              : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setMode('signup')}
          className={`rounded px-3 py-1 text-sm font-semibold ${
            mode === 'signup'
              ? 'bg-emerald-600 dark:bg-emerald-700 text-white dark:text-emerald-50'
              : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100'
          }`}
        >
          Create Account
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-emerald-800 dark:text-emerald-100" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded border border-emerald-300 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-50 px-3 py-2 focus:border-emerald-500 focus:ring-emerald-500"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-emerald-800 dark:text-emerald-100" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded border border-emerald-300 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-50 px-3 py-2 focus:border-emerald-500 focus:ring-emerald-500"
            required
          />
        </div>

        {error && <p className="text-sm text-emerald-700 dark:text-emerald-300">{error}</p>}

        {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
          <div className="flex justify-center">
            <Turnstile
              key={resetTurnstile}
              sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
              onVerify={(token) => setTurnstileToken(token)}
              theme="light"
              appearance="always"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center rounded bg-emerald-600 dark:bg-emerald-700 px-4 py-2 text-sm font-semibold text-white dark:text-emerald-50 hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-60"
        >
          {loading
            ? 'Working...'
            : mode === 'signin'
            ? 'Sign In'
            : 'Create Account'}
        </button>
      </form>

      <Link href="/" className="text-sm text-emerald-700 dark:text-emerald-300 underline hover:text-emerald-900 dark:hover:text-emerald-100">
        Back to Home
      </Link>
    </div>
  )
}
