'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

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

type BusinessWithDistance = Business & {
  distance?: number
}

type BusinessListFilterProps = {
  businesses: Business[]
  selectedCategory?: string
  onCategoryChange?: (category: string) => void
}

type SortOption = 'rating-high' | 'rating-low' | 'name' | 'distance'

// Calculate distance between two coordinates using Haversine formula (in kilometers)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371 // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export default function BusinessListFilter({ businesses, selectedCategory: propSelectedCategory, onCategoryChange }: BusinessListFilterProps) {
  const [internalSelectedCategory, setInternalSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('rating-high')
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [requestingLocation, setRequestingLocation] = useState(false)

  // Use prop category if provided, otherwise use internal state
  const selectedCategory = propSelectedCategory ?? internalSelectedCategory

  const handleCategoryChange = (newCategory: string) => {
    setInternalSelectedCategory(newCategory)
    onCategoryChange?.(newCategory)
  }

  // Request user's location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported')
      return
    }

    setRequestingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        })
        setLocationError(null)
        setRequestingLocation(false)
      },
      (error) => {
        setLocationError(`Location access denied: ${error.message}`)
        setRequestingLocation(false)
      }
    )
  }, [])

  // Get unique categories from businesses
  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      businesses
        .map((b) => b.category?.name)
        .filter((name): name is string => Boolean(name))
    )
    return Array.from(uniqueCategories).sort()
  }, [businesses])

  // Filter and sort businesses
  const filteredAndSortedBusinesses = useMemo(() => {
    let filtered = businesses

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((b) => b.category?.name === selectedCategory)
    }

    // Add distance calculations if user location is available
    const withDistance: BusinessWithDistance[] = filtered.map((b) => {
      if (userLocation && b.latitude && b.longitude) {
        return {
          ...b,
          distance: calculateDistance(userLocation.lat, userLocation.lon, b.latitude, b.longitude),
        }
      }
      return b
    })

    // Apply sorting
    const sorted = [...withDistance].sort((a, b) => {
      switch (sortBy) {
        case 'rating-high':
          const ratingB = b.avg_rating ?? -1
          const ratingA = a.avg_rating ?? -1
          return ratingB - ratingA
        case 'rating-low':
          const ratingBLow = b.avg_rating ?? Infinity
          const ratingALow = a.avg_rating ?? Infinity
          return ratingALow - ratingBLow
        case 'name':
          return a.name.localeCompare(b.name)
        case 'distance':
          const distB = b.distance ?? Infinity
          const distA = a.distance ?? Infinity
          return distA - distB
        default:
          return 0
      }
    })

    return sorted
  }, [businesses, selectedCategory, sortBy, userLocation])

  return (
    <div className="space-y-4">
      {/* Filter and Sort Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center bg-white dark:bg-emerald-950 p-4 rounded border border-emerald-300 dark:border-emerald-700">
        <div className="flex-1">
          <label className="block text-sm mb-1 text-emerald-800 dark:text-emerald-100" htmlFor="category-filter">
            Filter by Category
          </label>
          <select
            id="category-filter"
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full rounded border border-emerald-300 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-50 px-3 py-2"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm mb-1 text-emerald-800 dark:text-emerald-100" htmlFor="sort-by">
            Sort
          </label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="w-full rounded border border-emerald-300 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-50 px-3 py-2"
          >
            <option value="rating-high">Highest Rated</option>
            <option value="rating-low">Lowest Rated</option>
            <option value="name">Name (A-Z)</option>
            {userLocation && <option value="distance">Distance (Nearest First)</option>}
          </select>
        </div>

        <div className="flex items-end">
          <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
            {filteredAndSortedBusinesses.length} result{filteredAndSortedBusinesses.length !== 1 ? 's' : ''}
          </p>
          {requestingLocation && <span className="text-xs text-emerald-500 ml-2">Getting location...</span>}
          {locationError && <span className="text-xs text-red-500 ml-2">{locationError}</span>}
        </div>
      </div>

      {/* Business List */}
      {filteredAndSortedBusinesses.length === 0 ? (
        <div className="text-center p-8 bg-white dark:bg-emerald-950 rounded border border-emerald-300 dark:border-emerald-700">
          <p className="text-emerald-700 dark:text-emerald-300">No businesses found in this category.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {filteredAndSortedBusinesses.map((b) => (
            <li
              key={b.id}
              className="border border-emerald-300 dark:border-emerald-700 rounded shadow-sm bg-white dark:bg-emerald-950 overflow-hidden hover:shadow-md transition-shadow"
            >
              <Link href={`/business/${b.id}`} className="block">
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
                    <h2 className="text-xl font-semibold text-emerald-900 dark:text-emerald-50 hover:text-emerald-600 dark:hover:text-emerald-400">
                      {b.name}
                    </h2>
                    <p className="text-emerald-700 dark:text-emerald-300 line-clamp-2">{b.description}</p>
                    <p className="text-emerald-600 dark:text-emerald-400 text-sm mt-2">
                      Category: {b.category?.name || 'N/A'} | Rating:{' '}
                      {b.avg_rating ? (
                        <>
                          <span className="font-semibold">{b.avg_rating.toFixed(1)}</span> ★
                        </>
                      ) : (
                        'No reviews yet'
                      )}
                      {b.distance && (
                        <>
                          {' '}
                          | Distance: <span className="font-semibold">{b.distance.toFixed(1)} km</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
