"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'
import GoogleAddressInput from '../../components/GoogleAddressInput'
import GoogleMapsLoader from '../../components/GoogleMapsLoader'
import ImageUpload from '../../components/ImageUpload'

type Category = {
  id: string
  name: string
}

interface PlaceData {
  formattedAddress: string
  lat: number
  lng: number
  placeId: string
}

export default function AddBusinessPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [placeId, setPlaceId] = useState<string | null>(null)
  const [categoryId, setCategoryId] = useState('')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imagePublicUrl, setImagePublicUrl] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    let active = true

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!active) return

      if (!session) {
        router.replace('/login?redirect=/add-business')
        return
      }

      setUserId(session.user.id)
      setCheckingAuth(false)
      
      const loadCategories = async () => {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name')
          .order('name')

        if (error) {
          setError(error.message)
          return
        }

        setCategories((data || []) as Category[])
      }

      loadCategories()
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && active) {
        router.replace('/login?redirect=/add-business')
      }
    })

    return () => {
      active = false
      subscription?.unsubscribe()
    }
  }, [router])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const { error } = await supabase
      .from('businesses')
      .insert({
        name,
        description,
        address,
        latitude,
        longitude,
        place_id: placeId,
        image_url: imagePublicUrl,
        category_id: categoryId,
        user_id: userId,
      })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess('Business added successfully.')
    setName('')
    setDescription('')
    setAddress('')
    setLatitude(null)
    setLongitude(null)
    setPlaceId(null)
    setImageUrl(null)
    setImagePublicUrl(null)
    setCategoryId('')
    setLoading(false)
  }

  return (
    <GoogleMapsLoader>
      <main className="p-8">
        {checkingAuth ? (
          <p>Checking session...</p>
        ) : (
          <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-emerald-900 dark:text-emerald-50">Add Business</h1>
        <Link
          href="/"
          className="inline-flex items-center rounded bg-emerald-600 dark:bg-emerald-700 px-4 py-2 text-sm font-semibold text-white dark:text-emerald-50 hover:bg-emerald-700 dark:hover:bg-emerald-600"
        >
          Back to Main Page
        </Link>
      </div>
      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-emerald-800 dark:text-emerald-100" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded border border-emerald-300 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-50 px-3 py-2 focus:border-emerald-500 focus:ring-emerald-500"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-emerald-800 dark:text-emerald-100" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="w-full rounded border border-emerald-300 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-50 px-3 py-2 focus:border-emerald-500 focus:ring-emerald-500"
            rows={4}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-emerald-800 dark:text-emerald-100" htmlFor="address">
            Address
          </label>
          <GoogleAddressInput
            value={address}
            onChange={(placeData: PlaceData) => {
              setAddress(placeData.formattedAddress)
              setLatitude(placeData.lat)
              setLongitude(placeData.lng)
              setPlaceId(placeData.placeId)
            }}
            placeholder="Search for your business address..."
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-emerald-800 dark:text-emerald-100">
            Business Image
          </label>
          <ImageUpload
            onUploadComplete={(imagePath, publicUrl) => {
              setImageUrl(imagePath)
              setImagePublicUrl(publicUrl)
            }}
            onError={(error) => setError(error)}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-emerald-800 dark:text-emerald-100" htmlFor="category">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="w-full rounded border border-emerald-300 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-50 px-3 py-2 focus:border-emerald-500 focus:ring-emerald-500"
            required
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-emerald-700 dark:text-emerald-300">{error}</p>}
        {success && <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">{success}</p>}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center rounded bg-emerald-600 dark:bg-emerald-700 px-4 py-2 text-sm font-semibold text-white dark:text-emerald-50 hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-60"
        >
          {loading ? 'Saving...' : 'Save Business'}
        </button>
      </form>
        </>
      )}
    </main>
    </GoogleMapsLoader>
  )
}
