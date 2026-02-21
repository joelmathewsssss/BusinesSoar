'use client'

import { useCallback, useRef, useEffect, useState } from 'react'
import { StandaloneSearchBox } from '@react-google-maps/api'

interface PlaceData {
  formattedAddress: string
  lat: number
  lng: number
  placeId: string
}

interface GoogleAddressInputProps {
  value: string
  onChange: (data: PlaceData) => void
  placeholder?: string
  className?: string
}

const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

export default function GoogleAddressInput({
  value,
  onChange,
  placeholder = 'Enter your address',
  className = '',
}: GoogleAddressInputProps) {
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [inputValue, setInputValue] = useState(value)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  const handlePlaceChanged = useCallback(() => {
    if (searchBoxRef.current) {
      const places = searchBoxRef.current.getPlaces()

      if (places && places.length > 0) {
        const place = places[0]

        if (place.geometry && place.geometry.location) {
          const placeData: PlaceData = {
            formattedAddress: place.formatted_address || '',
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            placeId: place.place_id || '',
          }

          setInputValue(place.formatted_address || '')
          onChange(placeData)
        }
      }
    }
  }, [onChange])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }


  return (
    <StandaloneSearchBox
      onLoad={(ref) => {
        searchBoxRef.current = ref
      }}
      onPlacesChanged={handlePlaceChanged}
    >
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        className={`w-full rounded border border-emerald-300 dark:border-emerald-700 px-3 py-2 dark:bg-emerald-950 dark:text-emerald-50 focus:border-emerald-500 focus:ring-emerald-500 ${className}`}
      />
    </StandaloneSearchBox>
  )
}
