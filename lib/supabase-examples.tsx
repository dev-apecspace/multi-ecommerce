'use client'

import { useEffect, useState } from 'react'
import { useProducts, useCart, useFavorites, useCategories, useVendors, useOrders, useReviews } from '@/hooks/useSupabase'

export function ProductListExample() {
  const { data: products, loading, error, fetchData } = useProducts(10, 0)

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) return <div>Loading products...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="grid grid-cols-4 gap-4">
      {products?.data?.map(product => (
        <div key={product.id} className="border p-4 rounded">
          <img src={product.image} alt={product.name} className="w-full h-40 object-cover rounded" />
          <h3 className="font-bold mt-2">{product.name}</h3>
          <p className="text-green-600">₫{product.price.toLocaleString()}</p>
          <div className="flex items-center gap-1">
            <span>⭐ {product.rating}</span>
            <span className="text-gray-500">({product.reviews})</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export function CartExample({ userId }: { userId: number }) {
  const { data: cartItems, addToCart, removeFromCart, fetchCart } = useCart(userId)
  const [quantity, setQuantity] = useState(1)
  const [productId, setProductId] = useState('')

  useEffect(() => {
    fetchCart()
  }, [userId])

  const handleAddToCart = async () => {
    if (!productId) return
    await addToCart(parseInt(productId), quantity)
    setProductId('')
    setQuantity(1)
  }

  const total = cartItems?.reduce((sum, item) => sum + item.Product.price * item.quantity, 0) || 0

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Shopping Cart</h2>

      <div className="mb-6 p-4 bg-blue-50 rounded">
        <input
          type="number"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          placeholder="Product ID"
          className="border px-2 py-1 mr-2"
        />
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          min="1"
          className="border px-2 py-1 mr-2 w-20"
        />
        <button
          onClick={handleAddToCart}
          className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
        >
          Add to Cart
        </button>
      </div>

      {cartItems?.length === 0 ? (
        <p className="text-gray-500">Your cart is empty</p>
      ) : (
        <>
          {cartItems?.map(item => (
            <div key={item.id} className="flex items-center gap-4 border-b py-4">
              <img src={item.Product.image} alt={item.Product.name} className="w-20 h-20 object-cover rounded" />
              <div className="flex-1">
                <p className="font-semibold">{item.Product.name}</p>
                <p className="text-gray-600">₫{item.Product.price.toLocaleString()}</p>
                <p>Quantity: {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">₫{(item.Product.price * item.quantity).toLocaleString()}</p>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between items-center text-xl font-bold">
              <span>Total:</span>
              <span className="text-green-600">₫{total.toLocaleString()}</span>
            </div>
            <button className="w-full bg-green-600 text-white py-2 rounded mt-4 hover:bg-green-700">
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export function CategoriesExample() {
  const { data: categories, loading, error, fetchData } = useCategories(true)

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) return <div>Loading categories...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Categories</h2>
      <div className="grid grid-cols-4 gap-4">
        {categories?.map(category => (
          <div key={category.id} className="border p-4 rounded cursor-pointer hover:shadow-lg">
            <div className="text-4xl mb-2">{category.icon}</div>
            <h3 className="font-bold">{category.name}</h3>
            <p className="text-sm text-gray-600">{category.SubCategory?.length || 0} items</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function VendorsExample() {
  const { data: vendors, loading, error, fetchData } = useVendors(10, 0, 'approved')

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) return <div>Loading vendors...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Top Vendors</h2>
      <div className="space-y-3">
        {vendors?.data?.map(vendor => (
          <div key={vendor.id} className="border p-4 rounded flex items-center justify-between">
            <div>
              <h3 className="font-bold">{vendor.name}</h3>
              <p className="text-sm text-gray-600">{vendor.products} products • {vendor.followers} followers</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1">
                <span>⭐ {vendor.rating}</span>
                {vendor.Shop?.[0]?.verified && <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">Verified</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function OrdersExample({ userId }: { userId: number }) {
  const { data: orders, loading, error, fetchData } = useOrders(userId)

  useEffect(() => {
    fetchData()
  }, [userId])

  if (loading) return <div>Loading orders...</div>
  if (error) return <div>Error: {error}</div>

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    shipping: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">My Orders</h2>
      <div className="space-y-4">
        {orders?.data?.map(order => (
          <div key={order.id} className="border p-4 rounded">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-bold">Order #{order.orderNumber}</p>
                <p className="text-sm text-gray-600">{new Date(order.date).toLocaleDateString()}</p>
              </div>
              <span className={`px-3 py-1 rounded text-sm font-semibold ${statusColors[order.status as keyof typeof statusColors]}`}>
                {order.status.toUpperCase()}
              </span>
            </div>

            <div className="bg-gray-50 p-2 rounded mb-2 max-h-40 overflow-y-auto">
              {order.OrderItem?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm mb-1">
                  <span>{item.Product?.name} x{item.quantity}</span>
                  <span>₫{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span className="text-green-600">₫{order.total.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ReviewsExample({ productId }: { productId: number }) {
  const { data: reviewsData, loading, error, addReview, fetchReviews } = useReviews(productId, 5)
  const [newReview, setNewReview] = useState({
    customerName: '',
    rating: 5,
    comment: '',
  })

  useEffect(() => {
    fetchReviews()
  }, [productId])

  const handleSubmitReview = async () => {
    if (!newReview.customerName || !newReview.comment) {
      alert('Please fill in all fields')
      return
    }

    await addReview({
      productId,
      customerId: 1,
      customerName: newReview.customerName,
      rating: newReview.rating,
      comment: newReview.comment,
      verified: false,
    })

    setNewReview({ customerName: '', rating: 5, comment: '' })
  }

  if (loading) return <div>Loading reviews...</div>

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Customer Reviews</h3>

      <div className="mb-6 p-4 bg-gray-50 rounded">
        <h4 className="font-semibold mb-3">Write a Review</h4>
        <input
          type="text"
          value={newReview.customerName}
          onChange={(e) => setNewReview({ ...newReview, customerName: e.target.value })}
          placeholder="Your name"
          className="w-full border px-3 py-2 rounded mb-2"
        />
        <select
          value={newReview.rating}
          onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value) })}
          className="w-full border px-3 py-2 rounded mb-2"
        >
          {[1, 2, 3, 4, 5].map(r => (
            <option key={r} value={r}>{r} Stars</option>
          ))}
        </select>
        <textarea
          value={newReview.comment}
          onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
          placeholder="Your comment"
          className="w-full border px-3 py-2 rounded mb-2"
          rows={3}
        />
        <button
          onClick={handleSubmitReview}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Submit Review
        </button>
      </div>

      <div className="space-y-3">
        {reviewsData?.data?.map((review: any) => (
          <div key={review.id} className="border p-3 rounded">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold">{review.customerName}</p>
                <p className="text-sm text-gray-600">⭐ {review.rating}/5</p>
              </div>
              {review.verified && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Verified</span>
              )}
            </div>
            <p className="text-gray-700">{review.comment}</p>
            <p className="text-xs text-gray-500 mt-2">{new Date(review.date).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
