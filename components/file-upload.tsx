'use client'

import { useState, useRef } from 'react'
import { Upload, X, FileText, AlertCircle, Loader } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FileUploadProps {
  onFileSelect: (url: string, fileName: string) => void
  accept?: string
  maxSize?: number
  disabled?: boolean
}

export function FileUpload({ onFileSelect, accept = '.pdf,.doc,.docx,.jpg,.png', maxSize = 10 * 1024 * 1024, disabled = false }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    if (file.size > maxSize) {
      setError(`File quá lớn. Tối đa ${maxSize / 1024 / 1024}MB`)
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Simulate progress
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
      setUploadedFile({ url: data.url, name: file.name })
      onFileSelect(data.url, file.name)
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
    setUploadedFile(null)
    setError(null)
  }

  return (
    <div className="space-y-2">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          uploading ? 'border-primary bg-blue-50' : uploadedFile ? 'border-green-300 bg-green-50' : 'border-border hover:border-primary cursor-pointer'
        }`}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
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
        ) : !uploadedFile ? (
          <div className="space-y-2">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Kéo thả file hoặc click để chọn</p>
              <p className="text-xs text-muted-foreground">PDF, DOC, DOCX, JPG, PNG (tối đa 10MB)</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <FileText className="h-8 w-8 mx-auto text-green-600" />
            <p className="text-sm font-medium text-green-600">{uploadedFile.name}</p>
            <p className="text-xs text-muted-foreground">Đã upload thành công</p>
            <Button
              type="button"
              variant="ghost"
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
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  )
}
