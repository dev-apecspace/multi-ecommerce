import { ChatLayout } from './chat-layout'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/jwt'
import { redirect } from 'next/navigation'

export default async function ChatPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  
  if (!token) {
    redirect('/auth/login')
  }
  
  const payload = await verifyToken(token)
  if (!payload) {
    redirect('/auth/login')
  }
  
  // Ensure userId is a number
  const userId = typeof payload.id === 'string' ? parseInt(payload.id) : payload.id
  
  return <ChatLayout userId={userId} />
}
