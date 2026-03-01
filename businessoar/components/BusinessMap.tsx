'use client'

import { useCallback, useState, useRef, useEffect } from 'react'
import { GoogleMap, InfoWindow } from '@react-google-maps/api'
import Link from 'next/link'
import Image from 'next/image'

interface Business {
  id: string
  name: string
  latitude: number
  longitude: number
  image_url?: string | null
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
const googleMapsMapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || ''

export default function BusinessMap({ businesses }: BusinessMapProps) {
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])

  // Handle map load and initialize markers
  const handleMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map

      // Clear existing markers
      markersRef.current.forEach((marker) => {
        marker.map = null
      })
      markersRef.current = []

      // Create advanced markers
      businesses.forEach((business) => {
        const advancedMarker = new (window as any).google.maps.marker.AdvancedMarkerElement({
          map,
          position: {
            lat: business.latitude,
            lng: business.longitude,
          },
        })

        advancedMarker.addListener('gmp-click', () => {
          setSelectedBusiness(business)
        })

        markersRef.current.push(advancedMarker)
      })
    },
    [businesses]
  )

  // Update markers when businesses change
  useEffect(() => {
    if (!mapRef.current) return

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      marker.map = null
    })
    markersRef.current = []

    // Create new markers
    businesses.forEach((business) => {
      const advancedMarker = new (window as any).google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current,
        position: {
          lat: business.latitude,
          lng: business.longitude,
        },
      })

      advancedMarker.addListener('gmp-click', () => {
        setSelectedBusiness(business)
      })

      markersRef.current.push(advancedMarker)
    })
  }, [businesses])

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

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      zoom={getZoomLevel()}
      center={getMapCenter()}
      onLoad={handleMapLoad}
      options={{
        mapId: googleMapsMapId,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
      }}
    >
      {selectedBusiness && (
        <InfoWindow
          position={{
            lat: selectedBusiness.latitude,
            lng: selectedBusiness.longitude,
          }}
          onCloseClick={() => setSelectedBusiness(null)}
        >
          <div className="p-2">
            {selectedBusiness.image_url && (
              <div className="relative w-48 h-32 mb-2 rounded overflow-hidden">
                <Image
                  src={selectedBusiness.image_url}
                  alt={selectedBusiness.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <h3 className="font-semibold !text-emerald-900" style={{ color: '#064e3b' }}>{selectedBusiness.name}</h3>
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
