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

type Favorite = {
  id: string
  business_id: string
  business_name: string
}

type User = {
  id: string
  email: string
}

type Review = {
  id: string
  rating: number
  comment: string | null
  created_at?: string | null
  business_id?: string | null
  business_name?: string
}

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [favorites, setFavorites] = useState<Favorite[]>([])
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

      const reviewSelect = 'id, rating, comment, created_at, business_id'
      const reviewAttempts = [
        { reviewerField: 'user_id', query: `user_id.eq.${session.user.id}` },
        { reviewerField: 'reviewer_id', query: `reviewer_id.eq.${session.user.id}` },
        { reviewerField: 'author_id', query: `author_id.eq.${session.user.id}` },
        { reviewerField: 'profile_id', query: `profile_id.eq.${session.user.id}` },
      ]

      let userReviews: Review[] = []

      for (const attempt of reviewAttempts) {
        const { data: reviewData, error: reviewError } = await supabase
          .from('reviews')
          .select(reviewSelect)
          .or(attempt.query)

        if (!reviewError) {
          userReviews = (reviewData || []) as Review[]
          break
        }
      }

      if (userReviews.length > 0) {
        const businessIds = userReviews
          .map((review) => review.business_id)
          .filter((value): value is string => Boolean(value))

        if (businessIds.length > 0) {
          const { data: reviewBusinesses } = await supabase
            .from('businesses')
            .select('id, name')
            .in('id', businessIds)

          const nameById = new Map((reviewBusinesses || []).map((item: any) => [item.id, item.name]))

          userReviews = userReviews.map((review) => ({
            ...review,
            business_name: review.business_id ? nameById.get(review.business_id) || 'Business' : 'Business',
          }))
        }
      }

      setReviews(userReviews)

      // Fetch favorites
      const { data: favoritesData, error: favoritesError } = await supabase
        .from('favorites')
        .select('id, business_id')
        .eq('user_id', session.user.id)

      if (!favoritesError && favoritesData) {
        const favBusinessIds = favoritesData.map((fav: any) => fav.business_id)
        
        if (favBusinessIds.length > 0) {
          const { data: favBusinesses } = await supabase
            .from('businesses')
            .select('id, name')
            .in('id', favBusinessIds)

          const userFavorites: Favorite[] = (favoritesData || []).map((fav: any) => {
            const business = (favBusinesses || []).find((b: any) => b.id === fav.business_id)
            return {
              id: fav.id,
              business_id: fav.business_id,
              business_name: business?.name || 'Business',
            }
          })
          setFavorites(userFavorites)
        }
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
                  <li key={b.id}>
                    <Link
                      href={`/business/${b.id}`}
                      className="block border border-emerald-300 dark:border-emerald-700 p-4 rounded shadow-sm bg-white dark:bg-emerald-950 hover:bg-emerald-50 dark:hover:bg-emerald-900 transition-colors"
                    >
                      <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-50">{b.name}</h3>
                      <p className="text-emerald-700 dark:text-emerald-300">{b.description}</p>
                      <p className="text-sm text-emerald-600 dark:text-emerald-400">
                        Category: {Array.isArray(b.category) ? b.category[0]?.name || 'N/A' : b.category?.name || 'N/A'}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Favorites */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-emerald-900 dark:text-emerald-50">Your Favorites</h2>
            {favorites.length === 0 ? (
              <p className="text-emerald-700 dark:text-emerald-300">You haven't favorited any businesses yet.</p>
            ) : (
              <ul className="space-y-4">
                {favorites.map((favorite) => (
                  <li key={favorite.id}>
                    <Link
                      href={`/business/${favorite.business_id}`}
                      className="block border border-emerald-300 dark:border-emerald-700 p-4 rounded shadow-sm bg-white dark:bg-emerald-950 hover:bg-emerald-50 dark:hover:bg-emerald-900 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">❤️</span>
                        <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-50">{favorite.business_name}</h3>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Reviews */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-emerald-900 dark:text-emerald-50">Your Reviews</h2>
            {reviews.length === 0 ? (
              <p className="text-emerald-700 dark:text-emerald-300">You haven't added any reviews yet.</p>
            ) : (
              <ul className="space-y-4">
                {reviews.map((review) => (
                  <li key={review.id}>
                    <Link
                      href={`/business/${review.business_id}`}
                      className="block border border-emerald-300 dark:border-emerald-700 p-4 rounded shadow-sm bg-white dark:bg-emerald-950 hover:bg-emerald-50 dark:hover:bg-emerald-900 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">{review.business_name || 'Business'}</p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">
                          {review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}
                        </p>
                      </div>
                      <p className="text-emerald-900 dark:text-emerald-50 font-semibold mb-1">{'★'.repeat(review.rating)}</p>
                      {review.comment && <p className="text-emerald-700 dark:text-emerald-300">{review.comment}</p>}
                    </Link>
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
