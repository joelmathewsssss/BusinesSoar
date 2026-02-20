'use client'

import { useCallback, useState } from 'react'
import { GoogleMap, Marker, InfoWindow, useLoadScript } from '@react-google-maps/api'
import Link from 'next/link'

interface Business {
  id: string
  name: string
  latitude: number
  longitude: number
}

interface BusinessMapProps {
  businesses: Business[]
}

const mapContainerStyle = {
  width: '100%',
  height: '500px',
}

const defaultCenter = {
  lat: 40.7128, // Default to NYC if no businesses
  lng: -74.0060,
}

const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

export default function BusinessMap({ businesses }: BusinessMapProps) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey,
  })

  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)

  // Calculate map center based on businesses
  const getMapCenter = useCallback(() => {
    if (businesses.length === 0) return defaultCenter

    const avgLat = businesses.reduce((sum, b) => sum + b.latitude, 0) / businesses.length
    const avgLng = businesses.reduce((sum, b) => sum + b.longitude, 0) / businesses.length

    return { lat: avgLat, lng: avgLng }
  }, [businesses])

  // Calculate zoom level based on business spread
  const getZoomLevel = useCallback(() => {
    if (businesses.length === 0) return 12

    if (businesses.length === 1) return 14

    const lats = businesses.map((b) => b.latitude)
    const lngs = businesses.map((b) => b.longitude)

    const latDiff = Math.max(...lats) - Math.min(...lats)
    const lngDiff = Math.max(...lngs) - Math.min(...lngs)

    const maxDiff = Math.max(latDiff, lngDiff)

    if (maxDiff > 10) return 4
    if (maxDiff > 5) return 6
    if (maxDiff > 2) return 8
    if (maxDiff > 0.5) return 10
    if (maxDiff > 0.1) return 12
    return 14
  }, [businesses])

  if (!isLoaded) {
    return (
      <div className="w-full h-[500px] bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center rounded border border-emerald-200 dark:border-emerald-700">
        <p className="text-emerald-600 dark:text-emerald-400">Loading map...</p>
      </div>
    )
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      zoom={getZoomLevel()}
      center={getMapCenter()}
      options={{
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
      }}
    >
      {businesses.map((business) => (
        <Marker
          key={business.id}
          position={{
            lat: business.latitude,
            lng: business.longitude,
          }}
          onClick={() => setSelectedBusiness(business)}
        />
      ))}

      {selectedBusiness && (
        <InfoWindow
          position={{
            lat: selectedBusiness.latitude,
            lng: selectedBusiness.longitude,
          }}
          onCloseClick={() => setSelectedBusiness(null)}
        >
          <div className="p-2">
            <h3 className="font-semibold text-emerald-900 dark:text-emerald-50">{selectedBusiness.name}</h3>
            <Link
              href={`/business/${selectedBusiness.id}`}
              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200 text-sm underline"
            >
              View Details
            </Link>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  )
}
