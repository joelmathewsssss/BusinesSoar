'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '../../../lib/supabaseClient'
import ImageUpload from '../../../components/ImageUpload'

interface Business {
  id: string
  user_id: string
  name: string
  description: string
  image_url: string | null
  address: string
  latitude: number | null
  longitude: number | null
  category: {
    name: string
  }
  reviews: Review[]
}

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at?: string | null
  user_id?: string | null
  reviewer_id?: string | null
  author_id?: string | null
  profile_id?: string | null
}

interface Deal {
  id: string
  title?: string | null
  name?: string | null
  description?: string | null
  price?: number | null
  discount?: number | null
  expires_at?: string | null
}

export default function BusinessPage() {
  const params = useParams()
  const businessId = params.id as string
  
  const [business, setBusiness] = useState<Business | null>(null)
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [avgRating, setAvgRating] = useState<number | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [editingBusiness, setEditingBusiness] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editImagePublicUrl, setEditImagePublicUrl] = useState<string | null>(null)
  const [savingBusiness, setSavingBusiness] = useState(false)
  const [businessFormError, setBusinessFormError] = useState<string | null>(null)
  const [businessFormSuccess, setBusinessFormSuccess] = useState<string | null>(null)
  const [dealName, setDealName] = useState('')
  const [dealDescription, setDealDescription] = useState('')
  const [addingDeal, setAddingDeal] = useState(false)
  const [dealFormError, setDealFormError] = useState<string | null>(null)
  const [dealFormSuccess, setDealFormSuccess] = useState<string | null>(null)

  const calculateAverageRating = (reviews: Review[]) => {
    if (!reviews || reviews.length === 0) return null
    const ratings = reviews.map((review) => review.rating)
    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
  }

  const getReviewOwner = (review: Review): { field: string; value: string } | null => {
    if (review.user_id) return { field: 'user_id', value: review.user_id }
    if (review.reviewer_id) return { field: 'reviewer_id', value: review.reviewer_id }
    if (review.author_id) return { field: 'author_id', value: review.author_id }
    if (review.profile_id) return { field: 'profile_id', value: review.profile_id }
    return null
  }

  const isReviewOwner = (review: Review) => {
    if (!currentUserId) return false
    const owner = getReviewOwner(review)
    return Boolean(owner && owner.value === currentUserId)
  }

  const canDeleteReview = (review: Review) => {
    return isOwner || isReviewOwner(review)
  }

  const formatReviewDate = (dateValue?: string | null) => {
    if (!dateValue) return null
    const date = new Date(dateValue)
    if (Number.isNaN(date.getTime())) return null
    return date.toLocaleDateString()
  }

  const refreshReviews = async (targetBusinessId: string) => {
    const { data: reviewsData = [], error: reviewsFetchError } = await supabase
      .from('reviews')
      .select('*')
      .eq('business_id', targetBusinessId)

    if (reviewsFetchError) {
      console.error('Reviews fetch error:', reviewsFetchError)
      return null
    }

    return reviewsData as Review[]
  }

  useEffect(() => {
    if (!businessId) return

    const fetchBusiness = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setCurrentUserId(session?.user?.id ?? null)

        // Fetch the basic business data
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', businessId)
          .single()

        if (businessError) {
          console.error('Business fetch error:', businessError)
          setError('Business not found')
          setLoading(false)
          return
        }

        if (!businessData) {
          setError('Business not found')
          setLoading(false)
          return
        }

        // Fetch category if it exists
        let category = null
        if (businessData.category_id) {
          const { data: categoryData, error: catError } = await supabase
            .from('categories')
            .select('name')
            .eq('id', businessData.category_id)
            .single()
          
          if (!catError) {
            category = categoryData
          }
        }

        const reviewsData = (await refreshReviews(businessId)) || []

        const { data: dealsData = [], error: dealsError } = await supabase
          .from('deals')
          .select('*')
          .eq('business_id', businessId)

        if (dealsError) {
          console.error('Deals fetch error:', dealsError)
        }

        setDeals(dealsData as Deal[])

        const businessWithRelations = {
          ...businessData,
          category,
          reviews: reviewsData,
        }

        setBusiness(businessWithRelations)
        setEditName(businessData.name || '')
        setEditDescription(businessData.description || '')
        setEditAddress(businessData.address || '')
        setEditImagePublicUrl(businessData.image_url || null)

        setAvgRating(calculateAverageRating(reviewsData))

        setLoading(false)
      } catch (err) {
        console.error('Exception error:', err)
        setError('Error loading business')
        setLoading(false)
      }
    }

    fetchBusiness()
  }, [businessId])

  const handleReviewSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!business || !currentUserId || submittingReview) return

    setSubmittingReview(true)
    setReviewError(null)

    const basePayload = {
      business_id: business.id,
      rating: reviewRating,
      comment: reviewComment.trim() || null,
    }

    const attempts = [
      { ...basePayload, user_id: currentUserId },
      { ...basePayload, reviewer_id: currentUserId },
      { ...basePayload, author_id: currentUserId },
      { ...basePayload, profile_id: currentUserId },
      basePayload,
    ]

    let submitError: { message: string } | null = null

    for (const payload of attempts) {
      const { error } = await supabase
        .from('reviews')
        .insert(payload)

      if (!error) {
        submitError = null
        break
      }

      submitError = error
    }

    if (submitError) {
      setReviewError(submitError.message)
      setSubmittingReview(false)
      return
    }

    const refreshedReviews = await refreshReviews(business.id)

    if (!refreshedReviews) {
      setReviewError('Review was added, but failed to refresh reviews list.')
      setSubmittingReview(false)
      return
    }

    setBusiness((currentBusiness) => {
      if (!currentBusiness) return currentBusiness
      return { ...currentBusiness, reviews: refreshedReviews }
    })
    setAvgRating(calculateAverageRating(refreshedReviews))
    setReviewComment('')
    setReviewRating(5)
    setSubmittingReview(false)
  }

  const handleDeleteReview = async (review: Review) => {
    if (!business || !currentUserId || deletingReviewId) return

    const owner = getReviewOwner(review)
    const userIsBusinessOwner = currentUserId === business.user_id
    const userIsReviewOwner = Boolean(owner && owner.value === currentUserId)

    if (!userIsBusinessOwner && !userIsReviewOwner) {
      setReviewError('You can only delete your own review.')
      return
    }

    setDeletingReviewId(review.id)
    setReviewError(null)

    let deleteError: { message: string } | null = null

    if (userIsBusinessOwner) {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', review.id)
      deleteError = error
    } else if (owner) {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', review.id)
        .eq(owner.field, currentUserId)
      deleteError = error
    }

    if (deleteError) {
      setReviewError(deleteError.message)
      setDeletingReviewId(null)
      return
    }

    const refreshedReviews = await refreshReviews(business.id)

    if (!refreshedReviews) {
      setReviewError('Review deleted, but failed to refresh reviews list.')
      setDeletingReviewId(null)
      return
    }

    setBusiness((currentBusiness) => {
      if (!currentBusiness) return currentBusiness
      return { ...currentBusiness, reviews: refreshedReviews }
    })
    setAvgRating(calculateAverageRating(refreshedReviews))
    setDeletingReviewId(null)
  }

  const handleBusinessUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!business || !currentUserId || currentUserId !== business.user_id || savingBusiness) return

    setSavingBusiness(true)
    setBusinessFormError(null)
    setBusinessFormSuccess(null)

    const { error: updateError } = await supabase
      .from('businesses')
      .update({
        name: editName.trim(),
        description: editDescription.trim(),
        address: editAddress.trim(),
        image_url: editImagePublicUrl,
      })
      .eq('id', business.id)
      .eq('user_id', currentUserId)

    if (updateError) {
      setBusinessFormError(updateError.message)
      setSavingBusiness(false)
      return
    }

    setBusiness({
      ...business,
      name: editName.trim(),
      description: editDescription.trim(),
      address: editAddress.trim(),
      image_url: editImagePublicUrl,
    })
    setBusinessFormSuccess('Business updated successfully.')
    setEditingBusiness(false)
    setSavingBusiness(false)
  }

  const handleAddDeal = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!business || !currentUserId || currentUserId !== business.user_id || addingDeal) return

    const trimmedName = dealName.trim()
    const trimmedDescription = dealDescription.trim()

    if (!trimmedName) {
      setDealFormError('Deal name is required')
      return
    }

    setAddingDeal(true)
    setDealFormError(null)
    setDealFormSuccess(null)

    const tryByName = await supabase
      .from('deals')
      .insert({
        business_id: business.id,
        name: trimmedName,
        description: trimmedDescription || null,
      })
      .select('*')
      .single()

    let createdDeal = tryByName.data as Deal | null
    let createError = tryByName.error

    if (createError) {
      const tryByTitle = await supabase
        .from('deals')
        .insert({
          business_id: business.id,
          title: trimmedName,
          description: trimmedDescription || null,
        })
        .select('*')
        .single()

      createdDeal = tryByTitle.data as Deal | null
      createError = tryByTitle.error
    }

    if (createError) {
      setDealFormError(createError.message)
      setAddingDeal(false)
      return
    }

    if (createdDeal) {
      setDeals((currentDeals) => [createdDeal as Deal, ...currentDeals])
    }
    setDealName('')
    setDealDescription('')
    setDealFormSuccess('Deal added successfully.')
    setAddingDeal(false)
  }

  if (loading) {
    return (
      <main className="p-8">
        <p className="text-center text-emerald-600 dark:text-emerald-400">Loading business...</p>
      </main>
    )
  }

  if (error || !business) {
    return (
      <main className="p-8">
        <div className="text-center">
          <p className="text-emerald-900 dark:text-emerald-50 mb-4">{error || 'Business not found'}</p>
          <Link
            href="/"
            className="inline-flex items-center rounded bg-emerald-600 dark:bg-emerald-700 px-4 py-2 text-sm font-semibold text-white dark:text-emerald-50 hover:bg-emerald-700 dark:hover:bg-emerald-600"
          >
            Back to Home
          </Link>
        </div>
      </main>
    )
  }

  const mapLink = business.latitude && business.longitude 
    ? `https://www.google.com/maps?q=${business.latitude},${business.longitude}`
    : null
  const canAddReview = Boolean(currentUserId) && currentUserId !== business.user_id
  const isOwner = currentUserId === business.user_id

  return (
    <main className="p-8">
      <Link
        href="/"
        className="inline-flex items-center rounded bg-emerald-200 dark:bg-emerald-800 px-4 py-2 text-sm font-semibold text-emerald-900 dark:text-emerald-100 hover:bg-emerald-300 dark:hover:bg-emerald-700 mb-6"
      >
        ← Back to Home
      </Link>

      <div className="max-w-2xl mx-auto bg-white dark:bg-emerald-950 rounded-lg shadow-lg overflow-hidden">
        {/* Business Image */}
        {business.image_url && (
          <div className="relative w-full h-96">
            <Image
              src={business.image_url}
              alt={business.name}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Business Details */}
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-emerald-900 dark:text-emerald-50 mb-2">
              {business.name}
            </h1>
            {business.category && (
              <p className="text-emerald-600 dark:text-emerald-400 text-lg">
                {business.category.name}
              </p>
            )}
          </div>

          {/* Rating */}
          {avgRating !== null && (
            <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900 rounded">
              <p className="text-emerald-900 dark:text-emerald-50">
                <span className="text-2xl font-bold">★ {avgRating.toFixed(1)}</span>
                <span className="text-sm ml-2">
                  ({business.reviews?.length || 0} {business.reviews?.length === 1 ? 'review' : 'reviews'})
                </span>
              </p>
            </div>
          )}

          {/* Address */}
          {business.address && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-emerald-900 dark:text-emerald-50 mb-2">
                Address
              </h2>
              <p className="text-emerald-700 dark:text-emerald-200 mb-3">{business.address}</p>
              {mapLink && (
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded bg-emerald-600 dark:bg-emerald-700 px-4 py-2 text-sm font-semibold text-white dark:text-emerald-50 hover:bg-emerald-700 dark:hover:bg-emerald-600"
                >
                  View on Map
                </a>
              )}
            </div>
          )}

          {/* Description */}
          {business.description && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-emerald-900 dark:text-emerald-50 mb-2">
                About
              </h2>
              <p className="text-emerald-700 dark:text-emerald-200 whitespace-pre-wrap">
                {business.description}
              </p>
            </div>
          )}

          {/* Owner Edit Section */}
          {isOwner && (
            <div className="mb-6 p-4 border border-emerald-300 dark:border-emerald-700 rounded">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-emerald-900 dark:text-emerald-50">Manage Business</h2>
                <button
                  type="button"
                  onClick={() => {
                    setEditingBusiness((state) => !state)
                    setBusinessFormError(null)
                    setBusinessFormSuccess(null)
                  }}
                  className="inline-flex items-center rounded bg-emerald-600 dark:bg-emerald-700 px-3 py-2 text-sm font-semibold text-white dark:text-emerald-50 hover:bg-emerald-700 dark:hover:bg-emerald-600"
                >
                  {editingBusiness ? 'Cancel' : 'Edit Business'}
                </button>
              </div>

              {editingBusiness && (
                <form onSubmit={handleBusinessUpdate} className="space-y-3">
                  <div>
                    <label className="block text-sm mb-1 text-emerald-800 dark:text-emerald-100" htmlFor="edit-name">
                      Name
                    </label>
                    <input
                      id="edit-name"
                      type="text"
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      className="w-full rounded border border-emerald-300 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-50 px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-1 text-emerald-800 dark:text-emerald-100" htmlFor="edit-description">
                      Description
                    </label>
                    <textarea
                      id="edit-description"
                      value={editDescription}
                      onChange={(event) => setEditDescription(event.target.value)}
                      rows={4}
                      className="w-full rounded border border-emerald-300 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-50 px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-1 text-emerald-800 dark:text-emerald-100" htmlFor="edit-address">
                      Address
                    </label>
                    <input
                      id="edit-address"
                      type="text"
                      value={editAddress}
                      onChange={(event) => setEditAddress(event.target.value)}
                      className="w-full rounded border border-emerald-300 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-50 px-3 py-2"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm mb-1 text-emerald-800 dark:text-emerald-100">
                      Business Image
                    </label>
                    {editImagePublicUrl && (
                      <div className="relative w-40 h-40 rounded overflow-hidden border border-emerald-300 dark:border-emerald-700">
                        <Image
                          src={editImagePublicUrl}
                          alt={editName || business.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <ImageUpload
                      onUploadComplete={(_imagePath, publicUrl) => {
                        setEditImagePublicUrl(publicUrl)
                        setBusinessFormError(null)
                      }}
                      onError={(uploadError) => setBusinessFormError(uploadError)}
                    />
                  </div>

                  {businessFormError && <p className="text-sm text-red-600 dark:text-red-400">{businessFormError}</p>}
                  {businessFormSuccess && <p className="text-sm text-emerald-600 dark:text-emerald-400">{businessFormSuccess}</p>}

                  <button
                    type="submit"
                    disabled={savingBusiness}
                    className="inline-flex items-center rounded bg-emerald-600 dark:bg-emerald-700 px-4 py-2 text-sm font-semibold text-white dark:text-emerald-50 hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-60"
                  >
                    {savingBusiness ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Deals Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-emerald-900 dark:text-emerald-50 mb-4">
              Deals
            </h2>

            {isOwner && (
              <form onSubmit={handleAddDeal} className="mb-4 space-y-3 p-4 border border-emerald-300 dark:border-emerald-700 rounded">
                <p className="text-sm font-medium text-emerald-900 dark:text-emerald-50">Add a deal</p>
                <div>
                  <label className="block text-sm mb-1 text-emerald-800 dark:text-emerald-100" htmlFor="deal-name">
                    Deal Name
                  </label>
                  <input
                    id="deal-name"
                    type="text"
                    value={dealName}
                    onChange={(event) => setDealName(event.target.value)}
                    className="w-full rounded border border-emerald-300 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-50 px-3 py-2"
                    placeholder="e.g. 20% off lunch"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1 text-emerald-800 dark:text-emerald-100" htmlFor="deal-description">
                    Description
                  </label>
                  <textarea
                    id="deal-description"
                    value={dealDescription}
                    onChange={(event) => setDealDescription(event.target.value)}
                    rows={3}
                    className="w-full rounded border border-emerald-300 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-50 px-3 py-2"
                    placeholder="Optional details"
                  />
                </div>

                {dealFormError && <p className="text-sm text-red-600 dark:text-red-400">{dealFormError}</p>}
                {dealFormSuccess && <p className="text-sm text-emerald-600 dark:text-emerald-400">{dealFormSuccess}</p>}

                <button
                  type="submit"
                  disabled={addingDeal}
                  className="inline-flex items-center rounded bg-emerald-600 dark:bg-emerald-700 px-4 py-2 text-sm font-semibold text-white dark:text-emerald-50 hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-60"
                >
                  {addingDeal ? 'Adding...' : 'Add Deal'}
                </button>
              </form>
            )}

            {deals.length === 0 ? (
              <p className="text-emerald-700 dark:text-emerald-200">No deals available right now.</p>
            ) : (
              <div className="space-y-4">
                {deals.map((deal) => (
                  <div
                    key={deal.id}
                    className="p-4 border border-emerald-300 dark:border-emerald-700 rounded bg-emerald-50 dark:bg-emerald-900"
                  >
                    <h3 className="font-semibold text-emerald-900 dark:text-emerald-50 mb-1">
                      {deal.title || deal.name || 'Deal'}
                    </h3>
                    {deal.description && (
                      <p className="text-emerald-700 dark:text-emerald-200 mb-1">{deal.description}</p>
                    )}
                    <p className="text-sm text-emerald-600 dark:text-emerald-300">
                      {deal.price != null ? `Price: $${deal.price}` : ''}
                      {deal.price != null && deal.discount != null ? ' • ' : ''}
                      {deal.discount != null ? `Discount: ${deal.discount}%` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reviews Section */}
          <div>
            <h2 className="text-lg font-semibold text-emerald-900 dark:text-emerald-50 mb-4">
              Customer Reviews
            </h2>

            {business.reviews && business.reviews.length > 0 ? (
              <div className="space-y-4 mb-6">
                {business.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-4 border border-emerald-300 dark:border-emerald-700 rounded bg-emerald-50 dark:bg-emerald-900"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-semibold text-emerald-900 dark:text-emerald-50">
                        {'★'.repeat(review.rating)}
                      </span>
                      <div className="flex items-center gap-3">
                        {formatReviewDate(review.created_at) && (
                          <span className="text-xs text-emerald-700 dark:text-emerald-300">
                            {formatReviewDate(review.created_at)}
                          </span>
                        )}
                        {canDeleteReview(review) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(review)}
                            disabled={deletingReviewId === review.id}
                            className="text-sm text-red-600 dark:text-red-400 hover:underline disabled:opacity-60"
                          >
                            {deletingReviewId === review.id ? 'Deleting...' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-emerald-700 dark:text-emerald-200">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-emerald-700 dark:text-emerald-200 mb-4">
                {canAddReview ? 'No reviews yet — be the first to leave one.' : 'No reviews yet.'}
              </p>
            )}

            {canAddReview && (
              <form onSubmit={handleReviewSubmit} className="space-y-3 p-4 border border-emerald-300 dark:border-emerald-700 rounded">
                <p className="text-sm font-medium text-emerald-900 dark:text-emerald-50">Add your review</p>
                <div>
                  <label className="block text-sm mb-1 text-emerald-800 dark:text-emerald-100" htmlFor="rating">
                    Rating
                  </label>
                  <select
                    id="rating"
                    value={reviewRating}
                    onChange={(event) => setReviewRating(Number(event.target.value))}
                    className="w-full rounded border border-emerald-300 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-50 px-3 py-2"
                  >
                    {[5, 4, 3, 2, 1].map((value) => (
                      <option key={value} value={value}>{value} star{value > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm mb-1 text-emerald-800 dark:text-emerald-100" htmlFor="comment">
                    Comment
                  </label>
                  <textarea
                    id="comment"
                    value={reviewComment}
                    onChange={(event) => setReviewComment(event.target.value)}
                    rows={3}
                    className="w-full rounded border border-emerald-300 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-50 px-3 py-2"
                    placeholder="Share your experience..."
                  />
                </div>

                {reviewError && <p className="text-sm text-red-600 dark:text-red-400">{reviewError}</p>}

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="inline-flex items-center rounded bg-emerald-600 dark:bg-emerald-700 px-4 py-2 text-sm font-semibold text-white dark:text-emerald-50 hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-60"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            )}

            {!currentUserId && (
              <p className="text-sm text-emerald-700 dark:text-emerald-200">
                <Link href="/login" className="underline">Log in</Link> to add a review.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
