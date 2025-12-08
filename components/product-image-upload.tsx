'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface ProductImageUploadProps {
  onImageSelect: (url: string) => void
  disabled?: boolean
}

export function ProductImageUpload({ onImageSelect, disabled = false }: ProductImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Chỉ hỗ trợ file JPG, PNG, WEBP')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File quá lớn. Tối đa 5MB')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev
          return prev + Math.random() * 30
        })
      }, 200)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        throw new Error('Upload thất bại')
      }

      const data = await response.json()
      setUploadedImage(data.url)
      onImageSelect(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload thất bại')
      setUploadProgress(0)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = () => {
    setUploadedImage(null)
    setError(null)
  }

  return (
    <div className="space-y-2">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          uploading ? 'border-primary bg-blue-50' : uploadedImage ? 'border-green-300 bg-green-50' : 'border-border hover:border-primary cursor-pointer'
        }`}
        onClick={() => !uploading && !uploadedImage && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={uploading || disabled}
          className="hidden"
        />

        {uploading ? (
          <div className="space-y-3">
            <Loader className="h-8 w-8 mx-auto text-primary animate-spin" />
            <div>
              <p className="text-sm font-medium text-primary">Đang tải lên...</p>
              <p className="text-xs text-muted-foreground mt-1">{Math.round(uploadProgress)}%</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : uploadedImage ? (
          <div className="space-y-3">
            <div className="relative w-32 h-32 mx-auto">
              <Image
                src={uploadedImage}
                alt="Product"
                fill
                className="object-cover rounded"
              />
            </div>
            <p className="text-sm font-medium text-green-600">Hình ảnh đã upload</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleRemove()
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Thay đổi
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Kéo thả hình ảnh hoặc click để chọn</p>
              <p className="text-xs text-muted-foreground">JPG, PNG, WEBP (tối đa 5MB)</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          <span className="text-red-600">⚠</span>
          <p>{error}</p>
        </div>
      )}
    </div>
  )
}
