'use client'

import GoogleMapsLoader from './GoogleMapsLoader'
import BusinessMap from './BusinessMap'

interface Business {
  id: string
  name: string
  latitude: number
  longitude: number
}

interface BusinessMapWrapperProps {
  businesses: Business[]
}

export default function BusinessMapWrapper({ businesses }: BusinessMapWrapperProps) {
  return (
    <GoogleMapsLoader>
      <BusinessMap businesses={businesses} />
    </GoogleMapsLoader>
  )
}
