'use client'

import { useLoadScript } from '@react-google-maps/api'
import { ReactNode } from 'react'

const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

// Static libraries array - prevent unnecessary reloads
const libraries: ('places' | 'marker')[] = ['places', 'marker']

interface GoogleMapsLoaderProps {
  children: ReactNode
}

export default function GoogleMapsLoader({ children }: GoogleMapsLoaderProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey,
    libraries,
  })

  if (loadError) {
    return <div>Error loading Google Maps</div>
  }

  if (!isLoaded) {
    return <div>Loading maps...</div>
  }

  return <>{children}</>
}
