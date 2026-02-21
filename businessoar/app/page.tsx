// app/page.tsx
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '../lib/supabaseClient'
import BusinessMapWrapper from '../components/BusinessMapWrapper'
import ThemeToggle from '../components/ThemeToggle'

export const dynamic = 'force-dynamic'

// TypeScript types (optional but helpful)
type Business = {
  id: string
  name: string
  description: string
  image_url: string | null
  latitude: number | null
  longitude: number | null
  category: {
    name: string
  }
  avg_rating: number | null
}

export default async function HomePage() {
  // Fetch businesses with category name, location, and average rating
  const { data: businesses, error } = await supabase
    .from('businesses')
    .select(`
      id,
      name,
      description,
      image_url,
      latitude,
      longitude,
      category:category_id(name),
      reviews(rating)
    `)

  if (error) {
    console.error(error)
    return <p>Error loading businesses</p>
  }

  // Calculate average rating per business
  const businessesWithRating: Business[] = (businesses || []).map((b: any) => {
    const ratings = b.reviews?.map((r: any) => r.rating) || []
    const avg_rating = ratings.length > 0 ? ratings.reduce((a: number, c: number) => a + c, 0) / ratings.length : null
    return { ...b, avg_rating }
  })

  // Filter businesses with valid coordinates for the map
  const businessesWithLocation = businessesWithRating.filter(
    (b) => b.latitude !== null && b.longitude !== null
  ) as (Business & { latitude: number; longitude: number })[]

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-6">
        <ThemeToggle />
        <h1 className="text-3xl font-bold text-emerald-900 dark:text-emerald-50">Local Businesses</h1>
        <div className="flex gap-2">
          <Link
            href="/account"
            className="inline-flex items-center rounded bg-emerald-200 dark:bg-emerald-800 px-4 py-2 text-sm font-semibold text-emerald-900 dark:text-emerald-100 hover:bg-emerald-300 dark:hover:bg-emerald-700"
          >
            Account
          </Link>
          <Link
            href="/add-business"
            className="inline-flex items-center rounded bg-emerald-600 dark:bg-emerald-700 px-4 py-2 text-sm font-semibold text-white dark:text-emerald-50 hover:bg-emerald-700 dark:hover:bg-emerald-600"
          >
            Add a Business
          </Link>
        </div>
      </div>

      {/* Map showing businesses with location data */}
      {businessesWithLocation.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3 text-emerald-800 dark:text-emerald-100">Business Locations</h2>
          <BusinessMapWrapper businesses={businessesWithLocation} />
        </div>
      )}

      {/* Business list */}
      <h2 className="text-xl font-semibold mb-3 text-emerald-800 dark:text-emerald-100">All Businesses</h2>
      <ul className="space-y-4">
        {businessesWithRating.map((b) => (
          <li key={b.id} className="border border-emerald-300 dark:border-emerald-700 rounded shadow-sm bg-white dark:bg-emerald-950 overflow-hidden">
            <div className="flex gap-4 p-4">
              {b.image_url && (
                <div className="relative w-40 h-40 flex-shrink-0 rounded overflow-hidden">
                  <Image
                    src={b.image_url}
                    alt={b.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-emerald-900 dark:text-emerald-50">{b.name}</h2>
                <p className="text-emerald-700 dark:text-emerald-300 line-clamp-2">{b.description}</p>
                <p className="text-emerald-600 dark:text-emerald-400 text-sm mt-2">
                  Category: {b.category?.name || 'N/A'} | Rating: {b.avg_rating ? b.avg_rating.toFixed(1) : 'No reviews yet'}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}
