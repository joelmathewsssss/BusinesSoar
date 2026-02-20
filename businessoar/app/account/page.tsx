"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'

type Business = {
  id: string
  name: string
  description: string
  category: { name: string } | { name: string }[] | null
}

type User = {
  id: string
  email: string
}

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    let active = true

    const loadUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!active) return

      if (!session) {
        router.replace('/login?redirect=/account')
        return
      }

      setUser({
        id: session.user.id,
        email: session.user.email || '',
      })

      // Fetch businesses created by this user
      const { data, error } = await supabase
        .from('businesses')
        .select(`
          id,
          name,
          description,
          category:category_id(name)
        `)
        .eq('user_id', session.user.id)

      if (error) {
        console.error('Error fetching businesses:', error)
        setError(`Error: ${error.message}`)
      } else {
        console.log('Fetched businesses:', data)
        setBusinesses((data || []) as Business[])
      }

      setLoading(false)
    }

    loadUserData()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && active) {
        router.replace('/login?redirect=/account')
      }
    })

    return () => {
      active = false
      subscription?.unsubscribe()
    }
  }, [router])

  const handleSignOut = async () => {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (loading) {
    return (
      <main className="p-8">
        <p>Loading...</p>
      </main>
    )
  }

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-emerald-900 dark:text-emerald-50">Account</h1>
        <Link
          href="/"
          className="inline-flex items-center rounded bg-emerald-200 dark:bg-emerald-800 px-4 py-2 text-sm font-semibold text-emerald-900 dark:text-emerald-100 hover:bg-emerald-300 dark:hover:bg-emerald-700"
        >
          Back to Home
        </Link>
      </div>

      {user && (
        <div className="max-w-2xl space-y-8">
          {/* User Info */}
          <div className="border border-emerald-300 dark:border-emerald-700 rounded p-4 space-y-4 bg-white dark:bg-emerald-950">
            <h2 className="text-xl font-semibold text-emerald-900 dark:text-emerald-50">Profile</h2>
            <div>
              <p className="text-sm text-emerald-600 dark:text-emerald-400">Email</p>
              <p className="text-lg font-medium text-emerald-800 dark:text-emerald-100">{user.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="inline-flex items-center rounded bg-emerald-700 dark:bg-emerald-600 px-4 py-2 text-sm font-semibold text-white dark:text-emerald-50 hover:bg-emerald-800 dark:hover:bg-emerald-700 disabled:opacity-60"
            >
              {signingOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>

          {/* Businesses */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-emerald-900 dark:text-emerald-50">Your Businesses</h2>
            {error && <p className="text-sm text-emerald-700 dark:text-emerald-300">{error}</p>}
            {businesses.length === 0 ? (
              <p className="text-emerald-700 dark:text-emerald-300">
                You haven't created any businesses yet.
                <Link href="/add-business" className="ml-2 underline text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200">
                  Create one now
                </Link>
              </p>
            ) : (
              <ul className="space-y-4">
                {businesses.map((b) => (
                  <li key={b.id} className="border border-emerald-300 dark:border-emerald-700 p-4 rounded shadow-sm bg-white dark:bg-emerald-950">
                    <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-50">{b.name}</h3>
                    <p className="text-emerald-700 dark:text-emerald-300">{b.description}</p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                      Category: {Array.isArray(b.category) ? b.category[0]?.name || 'N/A' : b.category?.name || 'N/A'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
