'use client'

import { useState } from 'react'
import { Plus, Trash2, FileText, AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileUpload } from '@/components/file-upload'

interface Document {
  id: string
  name: string
  url: string
  documentType: string
}

interface UploadForm {
  id: string
  documentType: string
}

interface MultiDocumentUploadProps {
  onDocumentsChange: (documents: Document[]) => void
  disabled?: boolean
  minDocuments?: number
}

export function MultiDocumentUpload({ 
  onDocumentsChange, 
  disabled = false,
  minDocuments = 1 
}: MultiDocumentUploadProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [uploadForms, setUploadForms] = useState<UploadForm[]>([])
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  const handleAddUploadForm = () => {
    const newFormId = `form-${Date.now()}`
    setUploadForms(prev => [...prev, { id: newFormId, documentType: '' }])
    setFormValues(prev => ({ ...prev, [newFormId]: '' }))
  }

  const handleRemoveUploadForm = (formId: string) => {
    setUploadForms(prev => prev.filter(form => form.id !== formId))
    setFormValues(prev => {
      const newValues = { ...prev }
      delete newValues[formId]
      return newValues
    })
  }

  const handleDocumentTypeChange = (formId: string, value: string) => {
    setFormValues(prev => ({ ...prev, [formId]: value }))
    setError(null)
  }

  const handleAddDocument = (formId: string, url: string, fileName: string) => {
    const documentType = formValues[formId]?.trim()

    const newDoc: Document = {
      id: Date.now().toString(),
      name: fileName,
      url,
      documentType: documentType || '',
    }

    const updatedDocs = [...documents, newDoc]
    setDocuments(updatedDocs)
    onDocumentsChange(updatedDocs)
    
    handleRemoveUploadForm(formId)
    setError(null)
  }

  const handleRemoveDocument = (id: string) => {
    const updatedDocs = documents.filter(doc => doc.id !== id)
    setDocuments(updatedDocs)
    onDocumentsChange(updatedDocs)
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Danh sách tài liệu đã upload */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Tài liệu đã tải lên ({documents.length})</label>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex items-center gap-2 flex-1">
                  <FileText className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-800 truncate">{doc.documentType}</p>
                    <p className="text-xs text-green-700 truncate">{doc.name}</p>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-600 hover:underline"
                    >
                      Xem file
                    </a>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveDocument(doc.id)}
                  disabled={disabled}
                  className="ml-2 p-2 hover:bg-red-100 rounded-lg text-red-600 disabled:opacity-50"
                  title="Xóa"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Danh sách upload forms - mỗi form độc lập */}
      {uploadForms.map((form) => (
        <div key={form.id} className="space-y-3 p-4 border border-border rounded-lg bg-gray-50 relative">
          {/* Icon close */}
          <button
            onClick={() => handleRemoveUploadForm(form.id)}
            disabled={disabled}
            className="absolute top-2 right-2 p-1 hover:bg-red-100 rounded text-red-600 disabled:opacity-50"
            title="Đóng"
          >
            <X className="h-5 w-5" />
          </button>

          <div>
            <label className="block text-sm font-medium mb-2">Tên tài liệu * (VD: Giấy phép kinh doanh, Hợp đồng, v.v.)</label>
            <Input
              type="text"
              placeholder="Nhập tên hoặc loại tài liệu"
              value={formValues[form.id] || ''}
              onChange={(e) => handleDocumentTypeChange(form.id, e.target.value)}
              disabled={disabled}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tải lên file</label>
            <FileUpload
              onFileSelect={(url, fileName) => {
                const documentType = formValues[form.id]?.trim()
                if (!documentType) {
                  setError('Vui lòng nhập tên tài liệu trước khi tải file')
                  return
                }
                handleAddDocument(form.id, url, fileName)
              }}
              disabled={disabled}
            />
          </div>
        </div>
      ))}

      {/* Button "Thêm tài liệu" - luôn hiển thị, luôn enable */}
      <Button
        type="button"
        variant={documents.length === 0 && uploadForms.length === 0 ? 'default' : 'outline'}
        size={documents.length === 0 && uploadForms.length === 0 ? 'lg' : 'sm'}
        onClick={handleAddUploadForm}
        disabled={disabled}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Thêm tài liệu
      </Button>

      {/* Status messages */}
      {documents.length > 0 && (
        <div className="text-xs text-muted-foreground">
          <p className="text-green-600">✓ Đã thêm {documents.length} tài liệu</p>
        </div>
      )}

      {documents.length === 0 && uploadForms.length === 0 && (
        <div className="text-xs text-muted-foreground">
          <p className="text-red-600">Cần thêm ít nhất {minDocuments} tài liệu</p>
        </div>
      )}
    </div>
  )
}
