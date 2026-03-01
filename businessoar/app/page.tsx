// app/page.tsx
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '../lib/supabaseClient'
import BusinessSection from '../components/BusinessSection'
import ThemeToggle from '../components/ThemeToggle'

export const dynamic = 'force-dynamic'

// TypeScript types 
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
        <div className="flex items-center gap-3">
          <Image
            src="/businessoar-logo.png"
            alt="BusinesSoar logo"
            width={80}
            height={80}
            className="rounded"
          />
          <h1 className="text-3xl font-bold text-emerald-900 dark:text-emerald-50">BusinesSoar</h1>
        </div>
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

      {/* Combined map and filtered list */}
      <BusinessSection businesses={businessesWithRating} businessesWithLocation={businessesWithLocation} />
    </main>
  )
}
