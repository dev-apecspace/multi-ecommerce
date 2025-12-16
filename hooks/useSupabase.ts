import { useCallback, useState } from 'react'

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: Record<string, any>
  params?: Record<string, any>
}

interface FetchState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useSupabaseFetch<T = any>(url: string, initialData: T | null = null) {
  const [state, setState] = useState<FetchState<T>>({
    data: initialData,
    loading: false,
    error: null,
  })

  const fetchData = useCallback(
    async (options: FetchOptions = {}) => {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      try {
        let fullUrl = url
        if (options.params) {
          const params = new URLSearchParams(options.params)
          fullUrl = `${url}?${params.toString()}`
        }

        const response = await fetch(fullUrl, {
          method: options.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          body: options.body ? JSON.stringify(options.body) : undefined,
        })

        if (!response.ok) {
          throw new Error(`API Error: ${response.statusText}`)
        }

        const data = await response.json()
        setState({ data, loading: false, error: null })
        return data
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }))
        throw error
      }
    },
    [url]
  )

  return { ...state, fetchData }
}

export function useProducts(limit = 20, offset = 0, filters?: Record<string, any>) {
  const params = { limit, offset, ...filters }
  return useSupabaseFetch('/api/products', null, { params })
}

export function useCategories(withSubcategories = false) {
  return useSupabaseFetch('/api/categories', null, {
    params: { withSubcategories },
  })
}

export function useVendors(limit = 20, offset = 0, status?: string) {
  const params = { limit, offset }
  if (status) params['status'] = status
  return useSupabaseFetch('/api/vendors', null, { params })
}

export function useOrders(userId?: number, status?: string, limit = 20, offset = 0) {
  const params: Record<string, any> = { limit, offset }
  if (userId) params.userId = userId
  if (status) params.status = status
  return useSupabaseFetch('/api/orders', null, { params })
}

export function useUser(userId: number | null) {
  const [state, setState] = useState<FetchState<any>>({
    data: null,
    loading: false,
    error: null,
  })

  const fetchUser = useCallback(async () => {
    if (!userId) return
    setState((prev) => ({ ...prev, loading: true }))

    try {
      const response = await fetch(`/api/users?id=${userId}`)
      if (!response.ok) throw new Error('Failed to fetch user')
      const data = await response.json()
      setState({ data, loading: false, error: null })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }))
    }
  }, [userId])

  return { ...state, fetchUser }
}

export function useCart(userId: number | null) {
  const [state, setState] = useState<FetchState<any[]>>({
    data: [],
    loading: false,
    error: null,
  })

  const fetchCart = useCallback(async () => {
    if (!userId) return
    setState((prev) => ({ ...prev, loading: true }))

    try {
      const response = await fetch(`/api/cart?userId=${userId}`)
      if (!response.ok) throw new Error('Failed to fetch cart')
      const data = await response.json()
      setState({ data, loading: false, error: null })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }))
    }
  }, [userId])

  const addToCart = useCallback(
    async (productId: number, quantity: number) => {
      if (!userId) return
      try {
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, productId, quantity }),
        })
        if (!response.ok) throw new Error('Failed to add to cart')
        await fetchCart()
      } catch (error) {
        console.error('Add to cart error:', error)
      }
    },
    [userId, fetchCart]
  )

  const removeFromCart = useCallback(
    async (cartItemId: number) => {
      try {
        const response = await fetch(`/api/cart?id=${cartItemId}`, {
          method: 'DELETE',
        })
        if (!response.ok) throw new Error('Failed to remove from cart')
        await fetchCart()
      } catch (error) {
        console.error('Remove from cart error:', error)
      }
    },
    [fetchCart]
  )

  return { ...state, fetchCart, addToCart, removeFromCart }
}

export function useFavorites(userId: number | null) {
  const [state, setState] = useState<FetchState<any[]>>({
    data: [],
    loading: false,
    error: null,
  })

  const fetchFavorites = useCallback(async () => {
    if (!userId) return
    setState((prev) => ({ ...prev, loading: true }))

    try {
      const response = await fetch(`/api/favorites?userId=${userId}`)
      if (!response.ok) throw new Error('Failed to fetch favorites')
      const data = await response.json()
      setState({ data, loading: false, error: null })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }))
    }
  }, [userId])

  const addFavorite = useCallback(
    async (productId: number) => {
      if (!userId) return
      try {
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, productId }),
        })
        if (!response.ok) throw new Error('Failed to add favorite')
        await fetchFavorites()
      } catch (error) {
        console.error('Add favorite error:', error)
      }
    },
    [userId, fetchFavorites]
  )

  const removeFavorite = useCallback(
    async (productId: number) => {
      if (!userId) return
      try {
        const response = await fetch(`/api/favorites?userId=${userId}&productId=${productId}`, {
          method: 'DELETE',
        })
        if (!response.ok) throw new Error('Failed to remove favorite')
        await fetchFavorites()
      } catch (error) {
        console.error('Remove favorite error:', error)
      }
    },
    [userId, fetchFavorites]
  )

  return { ...state, fetchFavorites, addFavorite, removeFavorite }
}

export function useReviews(productId: number | null, limit = 10, offset = 0) {
  const [state, setState] = useState<FetchState<any>>({
    data: null,
    loading: false,
    error: null,
  })

  const fetchReviews = useCallback(async () => {
    if (!productId) return
    setState((prev) => ({ ...prev, loading: true }))

    try {
      const params = new URLSearchParams({
        productId: String(productId),
        limit: String(limit),
        offset: String(offset),
      })
      const response = await fetch(`/api/reviews?${params}`)
      if (!response.ok) throw new Error('Failed to fetch reviews')
      const data = await response.json()
      setState({ data, loading: false, error: null })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }))
    }
  }, [productId, limit, offset])

  const addReview = useCallback(
    async (review: Record<string, any>) => {
      try {
        const response = await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(review),
        })
        if (!response.ok) throw new Error('Failed to add review')
        await fetchReviews()
      } catch (error) {
        console.error('Add review error:', error)
      }
    },
    [fetchReviews]
  )

  const updateReview = useCallback(
    async (id: number, updates: Record<string, any>) => {
      try {
        const response = await fetch('/api/reviews', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...updates }),
        })
        if (!response.ok) throw new Error('Failed to update review')
        await fetchReviews()
      } catch (error) {
        console.error('Update review error:', error)
      }
    },
    [fetchReviews]
  )

  return { ...state, fetchReviews, addReview, updateReview }
}

export function useBanners(status = 'active') {
  const [state, setState] = useState<FetchState<any[]>>({
    data: [],
    loading: false,
    error: null,
  })

  const fetchBanners = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }))
    try {
      const response = await fetch(`/api/banners?status=${status}`)
      if (!response.ok) throw new Error('Failed to fetch banners')
      const data = await response.json()
      setState({ data, loading: false, error: null })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }))
    }
  }, [status])

  return { ...state, fetchBanners }
}

export function usePromotions(status?: string, type?: string) {
  const [state, setState] = useState<FetchState<any[]>>({
    data: [],
    loading: false,
    error: null,
  })

  const fetchPromotions = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }))
    try {
      const params = new URLSearchParams()
      if (status) params.append('status', status)
      if (type) params.append('type', type)
      const response = await fetch(`/api/promotions?${params}`)
      if (!response.ok) throw new Error('Failed to fetch promotions')
      const data = await response.json()
      setState({ data, loading: false, error: null })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }))
    }
  }, [status, type])

  return { ...state, fetchPromotions }
}

export function useNotifications(userId: number | null) {
  const [state, setState] = useState<FetchState<any[]>>({
    data: [],
    loading: false,
    error: null,
  })

  const fetchNotifications = useCallback(async (unreadOnly = false) => {
    if (!userId) return
    setState((prev) => ({ ...prev, loading: true }))
    try {
      const response = await fetch(`/api/notifications?userId=${userId}&unreadOnly=${unreadOnly}`)
      if (!response.ok) throw new Error('Failed to fetch notifications')
      const data = await response.json()
      setState({ data, loading: false, error: null })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }))
    }
  }, [userId])

  const markAsRead = useCallback(
    async (notificationId: number) => {
      try {
        const response = await fetch(`/api/notifications?id=${notificationId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ read: true }),
        })
        if (!response.ok) throw new Error('Failed to mark as read')
        await fetchNotifications()
      } catch (error) {
        console.error('Mark as read error:', error)
      }
    },
    [fetchNotifications]
  )

  return { ...state, fetchNotifications, markAsRead }
}

export function useAddresses(userId: number | null) {
  const [state, setState] = useState<FetchState<any[]>>({
    data: [],
    loading: false,
    error: null,
  })

  const fetchAddresses = useCallback(async () => {
    if (!userId) return
    setState((prev) => ({ ...prev, loading: true }))
    try {
      const response = await fetch(`/api/addresses?userId=${userId}`)
      if (!response.ok) throw new Error('Failed to fetch addresses')
      const data = await response.json()
      setState({ data, loading: false, error: null })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }))
    }
  }, [userId])

  const addAddress = useCallback(
    async (address: Record<string, any>) => {
      try {
        const response = await fetch('/api/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...address, userId }),
        })
        if (!response.ok) throw new Error('Failed to add address')
        await fetchAddresses()
      } catch (error) {
        console.error('Add address error:', error)
      }
    },
    [userId, fetchAddresses]
  )

  const updateAddress = useCallback(
    async (addressId: number, updates: Record<string, any>) => {
      try {
        const response = await fetch(`/api/addresses?id=${addressId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })
        if (!response.ok) throw new Error('Failed to update address')
        await fetchAddresses()
      } catch (error) {
        console.error('Update address error:', error)
      }
    },
    [fetchAddresses]
  )

  const deleteAddress = useCallback(
    async (addressId: number) => {
      try {
        const response = await fetch(`/api/addresses?id=${addressId}`, {
          method: 'DELETE',
        })
        if (!response.ok) throw new Error('Failed to delete address')
        await fetchAddresses()
      } catch (error) {
        console.error('Delete address error:', error)
      }
    },
    [fetchAddresses]
  )

  return { ...state, fetchAddresses, addAddress, updateAddress, deleteAddress }
}

export function useAdminVendors(status?: string) {
  const [state, setState] = useState<FetchState<any>>({
    data: null,
    loading: false,
    error: null,
  })

  const fetchVendors = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }))
    try {
      let url = '/api/admin/vendors'
      if (status) {
        url += `?status=${encodeURIComponent(status)}`
      }
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch vendors')
      const result = await response.json()
      setState({ data: result.data, loading: false, error: null })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }))
    }
  }, [status])

  const approveVendor = useCallback(
    async (vendorId: number) => {
      try {
        const response = await fetch(`/api/admin/vendors?id=${vendorId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'approved' }),
        })
        if (!response.ok) throw new Error('Failed to approve vendor')
        await fetchVendors()
      } catch (error) {
        console.error('Approve vendor error:', error)
      }
    },
    [fetchVendors]
  )

  const rejectVendor = useCallback(
    async (vendorId: number) => {
      try {
        const response = await fetch(`/api/admin/vendors?id=${vendorId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'rejected' }),
        })
        if (!response.ok) throw new Error('Failed to reject vendor')
        await fetchVendors()
      } catch (error) {
        console.error('Reject vendor error:', error)
      }
    },
    [fetchVendors]
  )

  return { ...state, fetchVendors, approveVendor, rejectVendor }
}

// export function useAdminStatistics() {
//   const [state, setState] = useState<FetchState<any>>({
//     data: null,
//     loading: false,
//     error: null,
//   })

//   const fetchStatistics = useCallback(async () => {
//     setState((prev) => ({ ...prev, loading: true }))
//     try {
//       const response = await fetch('/api/admin/statistics')
//       if (!response.ok) throw new Error('Failed to fetch statistics')
//       const data = await response.json()
//       setState({ data, loading: false, error: null })
//     } catch (error) {
//       setState((prev) => ({
//         ...prev,
//         loading: false,
//         error: error instanceof Error ? error.message : 'Unknown error',
//       }))
//     }
//   }, [])

//   return { ...state, fetchStatistics }
// }

export function useSellerDashboard(vendorId: number | null) {
  const [state, setState] = useState<FetchState<any>>({
    data: null,
    loading: false,
    error: null,
  })

  const fetchDashboard = useCallback(async () => {
    if (!vendorId) return
    setState((prev) => ({ ...prev, loading: true }))
    try {
      const response = await fetch(`/api/seller/dashboard`, {
        credentials: 'include'
      })
      if (!response.ok) {
        setState({ data: { vendor: {}, stats: {} }, loading: false, error: null })
        return
      }
      const data = await response.json()
      setState({ data, loading: false, error: null })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        data: { vendor: {}, stats: {} },
        error: null,
      }))
    }
  }, [vendorId])

  return { ...state, fetchDashboard }
}

export function useSellerWallet(vendorId: number | null) {
  const [state, setState] = useState<FetchState<any>>({
    data: null,
    loading: false,
    error: null,
  })

  const fetchWallet = useCallback(async () => {
    if (!vendorId) return
    setState((prev) => ({ ...prev, loading: true }))
    try {
      const response = await fetch(`/api/seller/wallet`, {
        credentials: 'include'
      })
      if (!response.ok) {
        setState({ data: { balance: 0, totalEarnings: 0, totalWithdrawals: 0, pendingAmount: 0, completedWithdrawalCount: 0, pendingWithdrawalCount: 0 }, loading: false, error: null })
        return
      }
      const data = await response.json()
      setState({ data, loading: false, error: null })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        data: { balance: 0, totalEarnings: 0, totalWithdrawals: 0, pendingAmount: 0, completedWithdrawalCount: 0, pendingWithdrawalCount: 0 },
        error: null,
      }))
    }
  }, [vendorId])

  return { ...state, fetchWallet }
}

export function useSellerWithdrawals(vendorId: number | null) {
  const [state, setState] = useState<FetchState<any>>({
    data: null,
    loading: false,
    error: null,
  })

  const fetchWithdrawals = useCallback(async () => {
    if (!vendorId) return
    setState((prev) => ({ ...prev, loading: true }))
    try {
      const response = await fetch(`/api/seller/withdrawals`, {
        credentials: 'include'
      })
      if (!response.ok) {
        setState({ data: { data: [], pagination: { total: 0, limit: 20, offset: 0 } }, loading: false, error: null })
        return
      }
      const data = await response.json()
      setState({ data, loading: false, error: null })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        data: { data: [], pagination: { total: 0, limit: 20, offset: 0 } },
        error: null,
      }))
    }
  }, [vendorId])

  const requestWithdrawal = useCallback(
    async (amount: number, bankAccount: string, bankName: string) => {
      if (!vendorId) return
      try {
        const response = await fetch('/api/seller/withdrawals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            amount,
            bankAccount,
            bankName,
            status: 'pending',
          }),
        })
        if (!response.ok) throw new Error('Failed to request withdrawal')
        await fetchWithdrawals()
      } catch (error) {
        console.error('Request withdrawal error:', error)
      }
    },
    [vendorId, fetchWithdrawals]
  )

  return { ...state, fetchWithdrawals, requestWithdrawal }
}

export function useSellerChat(vendorId: number | null) {
  const [state, setState] = useState<FetchState<any>>({
    data: null,
    loading: false,
    error: null,
  })

  const fetchChat = useCallback(async (unreadOnly = false) => {
    if (!vendorId) return
    setState((prev) => ({ ...prev, loading: true }))
    try {
      const response = await fetch(`/api/seller/chat?unreadOnly=${unreadOnly}`)
      if (!response.ok) throw new Error('Failed to fetch chat')
      const data = await response.json()
      setState({ data, loading: false, error: null })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }))
    }
  }, [vendorId])

  const sendMessage = useCallback(
    async (customerName: string, message: string) => {
      if (!vendorId) return
      try {
        const response = await fetch('/api/seller/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName,
            message,
            status: 'unread',
          }),
        })
        if (!response.ok) throw new Error('Failed to send message')
        await fetchChat()
      } catch (error) {
        console.error('Send message error:', error)
      }
    },
    [vendorId, fetchChat]
  )

  return { ...state, fetchChat, sendMessage }
}

export function useSellerGuides(category?: string) {
  const [state, setState] = useState<FetchState<any>>({
    data: null,
    loading: false,
    error: null,
  })

  const fetchGuides = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }))
    try {
      const params = new URLSearchParams()
      if (category) params.append('category', category)
      const response = await fetch(`/api/seller/guides?${params}`)
      if (!response.ok) throw new Error('Failed to fetch guides')
      const data = await response.json()
      setState({ data, loading: false, error: null })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }))
    }
  }, [category])

  return { ...state, fetchGuides }
}

export function useAdminStatistics() {
  const [state, setState] = useState<FetchState<any>>({
    data: null,
    loading: false,
    error: null,
  })

  const fetchStatistics = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }))
    try {
      const response = await fetch('/api/admin/statistics')
      if (!response.ok) throw new Error('Failed to fetch statistics')
      const data = await response.json()
      setState({ data, loading: false, error: null })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }))
    }
  }, [])

  return { ...state, fetchStatistics }
}

export function useAdminReports(type?: string, reportStatus?: string) {
  const [state, setState] = useState<FetchState<any[]>>({
    data: [],
    loading: false,
    error: null,
  })

  const fetchReports = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }))
    try {
      const params = new URLSearchParams()
      if (type) params.append('type', type)
      if (reportStatus) params.append('status', reportStatus)
      const response = await fetch(`/api/admin/reports?${params}`)
      if (!response.ok) throw new Error('Failed to fetch reports')
      const data = await response.json()
      setState({ data, loading: false, error: null })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }))
    }
  }, [type, reportStatus])

  return { ...state, fetchReports }
}
