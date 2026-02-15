"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'

type Category = {
  id: string
  name: string
}

export default function AddBusinessPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
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
        category_id: categoryId,
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
    setCategoryId('')
    setLoading(false)
  }

  return (
    <main className="p-8">
      {checkingAuth ? (
        <p>Checking session...</p>
      ) : (
        <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Add Business</h1>
        <Link
          href="/"
          className="inline-flex items-center rounded bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900"
        >
          Back to Main Page
        </Link>
      </div>
      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2"
            rows={4}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium" htmlFor="address">
            Address
          </label>
          <input
            id="address"
            name="address"
            type="text"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium" htmlFor="category">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2"
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

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center rounded bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900 disabled:opacity-60"
        >
          {loading ? 'Saving...' : 'Save Business'}
        </button>
      </form>
        </>
      )}
    </main>
  )
}
