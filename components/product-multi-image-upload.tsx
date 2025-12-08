import { useState, useRef } from 'react'
import { Upload, X, Loader, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface UploadedImage {
  url: string
  isMain?: boolean
  mediaType?: 'image' | 'video'
}

interface ProductMultiImageUploadProps {
  onImagesSelect: (images: UploadedImage[]) => void
  disabled?: boolean
  initialImages?: UploadedImage[]
}

export function ProductMultiImageUpload({ 
  onImagesSelect, 
  disabled = false,
  initialImages = []
}: ProductMultiImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>(initialImages)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getMediaType = (mimeType: string): 'image' | 'video' => {
    if (mimeType.startsWith('video/')) return 'video'
    return 'image'
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setError(null)
    const newImages: UploadedImage[] = []

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ]

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      if (!allowedTypes.includes(file.type)) {
        setError('Chỉ hỗ trợ file JPG, PNG, WEBP, MP4, WEBM, MOV')
        continue
      }

      const maxSize = getMediaType(file.type) === 'video' ? 100 * 1024 * 1024 : 5 * 1024 * 1024
      if (file.size > maxSize) {
        const maxMB = maxSize / (1024 * 1024)
        setError(`File quá lớn. Tối đa ${maxMB}MB`)
        continue
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
        newImages.push({
          url: data.url,
          isMain: uploadedImages.length === 0 && newImages.length === 0,
          mediaType: getMediaType(file.type),
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload thất bại')
        setUploadProgress(0)
      } finally {
        setUploading(false)
      }
    }

    const updated = [...uploadedImages, ...newImages]
    setUploadedImages(updated)
    onImagesSelect(updated)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemove = (index: number) => {
    const updated = uploadedImages.filter((_, i) => i !== index)
    setUploadedImages(updated)
    onImagesSelect(updated)
  }

  const handleSetMainImage = (index: number) => {
    const updated = uploadedImages.map((img, i) => ({
      ...img,
      isMain: i === index,
    }))
    setUploadedImages(updated)
    onImagesSelect(updated)
  }

  return (
    <div className="space-y-4">
      {uploadedImages.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {uploadedImages.map((image, index) => (
            <div key={index} className="relative group">
              <div className="relative w-full h-24 bg-muted rounded-lg overflow-hidden">
                {image.mediaType === 'video' ? (
                  <video
                    src={image.url}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src={image.url}
                    alt={`Product ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                )}
                {image.isMain && (
                  <div className="absolute top-1 right-1 bg-orange-600 text-white px-2 py-1 rounded text-xs font-semibold">
                    Chính
                  </div>
                )}
                {image.mediaType === 'video' && (
                  <div className="absolute bottom-1 left-1 bg-black/70 text-white px-1.5 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                    🎬 Video
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors rounded-lg flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 w-7 p-0 bg-white hover:bg-white"
                  onClick={() => handleSetMainImage(index)}
                  title="Đặt làm ảnh chính"
                >
                  ⭐
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 w-7 p-0 bg-white hover:bg-destructive hover:text-white"
                  onClick={() => handleRemove(index)}
                  title="Xóa"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-slate-50 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
          onChange={handleFileChange}
          disabled={disabled || uploading}
          className="hidden"
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="w-full"
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader className="h-5 w-5 animate-spin" />
              <span>Đang upload... {Math.round(uploadProgress)}%</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-medium">Chọn ảnh/video hoặc kéo thả</p>
              <p className="text-xs text-muted-foreground">JPG, PNG, WEBP (5MB) hoặc MP4, WEBM, MOV (100MB)</p>
            </div>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-3 py-2 rounded text-sm flex items-center gap-2">
          <X className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  )
}
