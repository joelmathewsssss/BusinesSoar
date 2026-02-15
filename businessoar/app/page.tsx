// app/page.tsx
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'

export const dynamic = 'force-dynamic'

// TypeScript types (optional but helpful)
type Business = {
  id: string
  name: string
  description: string
  category: {
    name: string
  }
  avg_rating: number | null
}

export default async function HomePage() {
  // Fetch businesses with category name and average rating
  const { data: businesses, error } = await supabase
    .from('businesses')
    .select(`
      id,
      name,
      description,
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

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Local Businesses</h1>
        <Link
          href="/add-bussiness"
          className="inline-flex items-center rounded bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900"
        >
          Add a Business
        </Link>
      </div>
      <ul className="space-y-4">
        {businessesWithRating.map((b) => (
          <li key={b.id} className="border p-4 rounded shadow-sm">
            <h2 className="text-xl font-semibold">{b.name}</h2>
            <p className="text-gray-700">{b.description}</p>
            <p className="text-gray-500">
              Category: {b.category?.name || 'N/A'} | Rating: {b.avg_rating ? b.avg_rating.toFixed(1) : 'No reviews yet'}
            </p>
          </li>
        ))}
      </ul>
    </main>
  )
}
