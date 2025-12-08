import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      User: {
        Row: {
          id: number
          email: string
          password: string
          phone: string | null
          name: string
          status: string
          joinDate: string
          orders: number
          totalSpent: number
          role: string
          createdAt: string
          updatedAt: string
        }
        Insert: Omit<Database['public']['Tables']['User']['Row'], 'id' | 'createdAt' | 'updatedAt'>
        Update: Partial<Database['public']['Tables']['User']['Insert']>
      }
      UserProfile: {
        Row: {
          id: number
          userId: number
          avatar: string | null
          joinDate: string
          createdAt: string
          updatedAt: string
        }
        Insert: Omit<Database['public']['Tables']['UserProfile']['Row'], 'id' | 'createdAt' | 'updatedAt'>
        Update: Partial<Database['public']['Tables']['UserProfile']['Insert']>
      }
      Address: {
        Row: {
          id: number
          userId: number
          label: string
          street: string
          ward: string
          district: string
          city: string
          postalCode: string | null
          isDefault: boolean
          createdAt: string
          updatedAt: string
        }
        Insert: Omit<Database['public']['Tables']['Address']['Row'], 'id' | 'createdAt' | 'updatedAt'>
        Update: Partial<Database['public']['Tables']['Address']['Insert']>
      }
      Vendor: {
        Row: {
          id: number
          name: string
          userId: number | null
          status: string
          documentStatus: string
          joinDate: string
          rating: number
          products: number
          followers: number
          businessLicense: string | null
          businessAddress: string | null
          bankAccount: string | null
          bankAccountHolder: string | null
          taxId: string | null
          businessDocuments: Array<{ name: string; url: string; documentType: string }> | null
          createdAt: string
          updatedAt: string
        }
        Insert: Omit<Database['public']['Tables']['Vendor']['Row'], 'id' | 'createdAt' | 'updatedAt'>
        Update: Partial<Database['public']['Tables']['Vendor']['Insert']>
      }

      Product: {
        Row: {
          id: number
          name: string
          description: string | null
          price: number
          originalPrice: number | null
          image: string | null
          categoryId: number
          subcategoryId: number
          vendorId: number
          rating: number
          reviews: number
          stock: number
          sold: number
          specifications: string | null
          shippingInfo: string | null
          warranty: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: Omit<Database['public']['Tables']['Product']['Row'], 'id' | 'createdAt' | 'updatedAt'>
        Update: Partial<Database['public']['Tables']['Product']['Insert']>
      }
      CartItem: {
        Row: {
          id: number
          userId: number
          productId: number
          quantity: number
          createdAt: string
          updatedAt: string
        }
        Insert: Omit<Database['public']['Tables']['CartItem']['Row'], 'id' | 'createdAt' | 'updatedAt'>
        Update: Partial<Database['public']['Tables']['CartItem']['Insert']>
      }
      Order: {
        Row: {
          id: number
          orderNumber: string
          userId: number
          vendorId: number
          status: string
          total: number
          date: string
          paymentMethod: string | null
          shippingAddress: string | null
          estimatedDelivery: string | null
          cancellationReason: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: Omit<Database['public']['Tables']['Order']['Row'], 'id' | 'createdAt' | 'updatedAt'>
        Update: Partial<Database['public']['Tables']['Order']['Insert']>
      }
      Review: {
        Row: {
          id: number
          productId: number
          customerId: number
          customerName: string
          rating: number
          comment: string | null
          date: string
          verified: boolean
          createdAt: string
        }
        Insert: Omit<Database['public']['Tables']['Review']['Row'], 'id' | 'createdAt'>
        Update: Partial<Database['public']['Tables']['Review']['Insert']>
      }
      Banner: {
        Row: {
          id: number
          title: string
          image: string | null
          link: string | null
          discount: string | null
          startDate: string
          endDate: string
          status: string
          createdAt: string
          updatedAt: string
        }
        Insert: Omit<Database['public']['Tables']['Banner']['Row'], 'id' | 'createdAt' | 'updatedAt'>
        Update: Partial<Database['public']['Tables']['Banner']['Insert']>
      }
      Notification: {
        Row: {
          id: number
          userId: number
          type: string
          title: string
          message: string | null
          date: string
          read: boolean
          createdAt: string
        }
        Insert: Omit<Database['public']['Tables']['Notification']['Row'], 'id' | 'createdAt'>
        Update: Partial<Database['public']['Tables']['Notification']['Insert']>
      }
      [key: string]: any
    }
    Views: {
      [key: string]: any
    }
  }
}
