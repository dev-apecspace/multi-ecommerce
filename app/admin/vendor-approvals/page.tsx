'use client'

import { useState, useEffect } from 'react'
import { Check, X, Clock, Mail, Phone, FileText, MapPin, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface PendingVendor {
  id: number
  name: string
  email: string
  phone: string
  shopName: string
  businessLicense: string
  businessAddress: string
  bankAccount: string
  bankAccountHolder: string
  taxId: string
  appliedAt: string
  status: 'pending' | 'approved' | 'rejected'
}

export default function VendorApprovalsPage() {
  const [vendors, setVendors] = useState<PendingVendor[]>([])
  const [loading, setLoading] = useState(false)
  const [approvalMessage, setApprovalMessage] = useState('')
  const [activeTab, setActiveTab] = useState('pending')

  useEffect(() => {
    fetchVendors()
  }, [])

  const fetchVendors = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/vendors?status=pending')
      const data = await response.json()
      setVendors(data.data || [])
    } catch (error) {
      console.error('Failed to fetch vendors:', error)
    }
    setLoading(false)
  }

  const handleApprove = async (vendorId: number) => {
    try {
      const response = await fetch('/api/auth/vendor-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorUserId: vendorId, approved: true }),
      })

      if (response.ok) {
        setApprovalMessage('Đã phê duyệt nhà bán hàng')
        setVendors((prev) => prev.filter((v) => v.id !== vendorId))
        setTimeout(() => setApprovalMessage(''), 3000)
      }
    } catch (error) {
      console.error('Failed to approve vendor:', error)
    }
  }

  const handleReject = async (vendorId: number) => {
    try {
      const response = await fetch('/api/auth/vendor-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorUserId: vendorId, approved: false }),
      })

      if (response.ok) {
        setApprovalMessage('Đã từ chối nhà bán hàng')
        setVendors((prev) => prev.filter((v) => v.id !== vendorId))
        setTimeout(() => setApprovalMessage(''), 3000)
      }
    } catch (error) {
      console.error('Failed to reject vendor:', error)
    }
  }

  const pendingVendors = vendors.filter((v) => v.status === 'pending')

  return (
    <main className="container-viewport py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Phê duyệt nhà bán hàng</h1>
        <p className="text-muted-foreground">Quản lý đơn đăng ký bán hàng đang chờ phê duyệt</p>
      </div>

      {approvalMessage && (
        <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg">
          {approvalMessage}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Đang chờ duyệt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingVendors.length}</div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      ) : pendingVendors.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">Không có đơn đăng ký nào đang chờ phê duyệt</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingVendors.map((vendor) => (
            <Card key={vendor.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column - Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{vendor.shopName}</h3>
                      <p className="text-sm text-muted-foreground">Người đăng ký: {vendor.name}</p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                        <span>{vendor.email}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                        <span>{vendor.phone}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground mt-1" />
                        <span>{new Date(vendor.appliedAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Business Info */}
                  <div className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                        <div>
                          <p className="font-medium">Giấy phép kinh doanh</p>
                          <p className="text-muted-foreground">{vendor.businessLicense}</p>
                        </div>
                      </div>
                      {vendor.taxId && (
                        <div className="flex items-start gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                          <div>
                            <p className="font-medium">Mã số thuế</p>
                            <p className="text-muted-foreground">{vendor.taxId}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom - Address & Bank Info */}
                  <div className="md:col-span-2 space-y-3">
                    {vendor.businessAddress && (
                      <div className="flex items-start gap-3 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Địa chỉ kinh doanh</p>
                          <p className="text-muted-foreground">{vendor.businessAddress}</p>
                        </div>
                      </div>
                    )}

                    {vendor.bankAccount && (
                      <div className="flex items-start gap-3 text-sm">
                        <CreditCard className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Tài khoản ngân hàng</p>
                          <p className="text-muted-foreground">
                            {vendor.bankAccount} - {vendor.bankAccountHolder}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6 pt-6 border-t border-border">
                  <Button
                    onClick={() => handleApprove(vendor.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Phê duyệt
                  </Button>
                  <Button
                    onClick={() => handleReject(vendor.id)}
                    variant="outline"
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Từ chối
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
