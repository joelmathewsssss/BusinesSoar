'use client'

import { useState, useMemo } from 'react'
import BusinessMapWrapper from './BusinessMapWrapper'
import BusinessListFilter from './BusinessListFilter'

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

interface BusinessSectionProps {
  businesses: Business[]
  businessesWithLocation: (Business & { latitude: number; longitude: number })[]
}

export default function BusinessSection({ businesses, businessesWithLocation }: BusinessSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Filter businesses by selected category for the map
  const filteredBusinessesForMap = useMemo(() => {
    if (selectedCategory === 'all') {
      return businessesWithLocation
    }

    return businessesWithLocation.filter((b) => b.category?.name === selectedCategory)
  }, [businessesWithLocation, selectedCategory])

  return (
    <div className="space-y-8">
      {/* Map showing filtered businesses with location data */}
      {businessesWithLocation.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-3 text-emerald-800 dark:text-emerald-100">Business Locations</h2>
          <BusinessMapWrapper businesses={filteredBusinessesForMap} />
        </div>
      )}

      {/* Business list */}
      <div>
        <h2 className="text-xl font-semibold mb-3 text-emerald-800 dark:text-emerald-100">All Businesses</h2>
        <BusinessListFilter businesses={businesses} selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
      </div>
    </div>
  )
}
