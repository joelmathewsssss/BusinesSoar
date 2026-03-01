'use client'

import { useCallback, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Image from 'next/image'

interface ImageUploadProps {
  onUploadComplete: (imageUrl: string, publicUrl: string) => void
  onError?: (error: string) => void
  className?: string
}

export default function ImageUpload({
  onUploadComplete,
  onError,
  className = '',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      // Validate file type
      if (!file.type.startsWith('image/')) {
        const error = 'Please select an image file'
        onError?.(error)
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        const error = 'Image must be less than 5MB'
        onError?.(error)
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
        setFileName(file.name)
      }
      reader.readAsDataURL(file)

      // Upload to Supabase Storage
      setUploading(true)
      const error = await uploadImage(file)
      setUploading(false)

      if (error) {
        onError?.(error)
        setPreview(null)
        setFileName(null)
      }
    },
    [onError]
  )

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return 'You must be logged in to upload images'
      }

      const timestamp = Date.now()
      const fileExtension = file.name.split('.').pop()
      const fileName = `${user.id}-${timestamp}.${fileExtension}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('business-images')
        .upload(`businesses/${fileName}`, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) {
        console.error('Upload error:', error)
        return error.message
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/business-images/businesses/${fileName}`

      onUploadComplete(data.path, publicUrl)
      return null
    } catch (err) {
      console.error('Upload exception:', err)
      return err instanceof Error ? err.message : 'Unknown error occurred'
    }
  }

  const handleClear = () => {
    setPreview(null)
    setFileName(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
          aria-label="Upload business image"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center rounded bg-emerald-600 dark:bg-emerald-700 px-4 py-2 text-sm font-semibold text-white dark:text-emerald-50 hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-60"
        >
          {uploading ? 'Uploading...' : 'Choose Image'}
        </button>
        {preview && (
          <button
            type="button"
            onClick={handleClear}
            disabled={uploading}
            className="inline-flex items-center rounded bg-red-600 dark:bg-red-700 px-4 py-2 text-sm font-semibold text-white dark:text-red-50 hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-60"
          >
            Clear
          </button>
        )}
      </div>

      {preview && fileName && (
        <div className="relative w-full h-48 rounded border border-emerald-200 dark:border-emerald-700 overflow-hidden bg-emerald-50 dark:bg-emerald-950">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm truncate">
            {fileName}
          </div>
        </div>
      )}
    </div>
  )
}
