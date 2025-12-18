'use client'

import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

export interface Conversation {
  id: number
  userId: number
  vendorId: number
  updatedAt: string
  unreadCount?: number
  Vendor?: {
    id: number
    name: string
    logo?: string | null
  }
  User?: {
    id: number
    name: string
    email: string
    UserProfile?: {
      avatar?: string | null
    }
  }
  lastMessage?: {
    content: string
    createdAt: string
    isRead: boolean
    senderId: number
  }
}

interface ChatListProps {
  conversations: Conversation[]
  selectedId: number | null
  onSelect: (id: number) => void
  mode: 'client' | 'seller'
  className?: string
}

export function ChatList({ conversations, selectedId, onSelect, mode, className }: ChatListProps) {
  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="flex flex-col gap-1 p-2">
        {conversations.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 text-sm">
            Không có cuộc trò chuyện nào
          </div>
        ) : (
          conversations.map((conv) => {
            const isSelected = selectedId === conv.id
            
            // Determine display name and avatar based on mode
            // If I am client, I see Vendor info
            // If I am seller, I see User info
            const displayName = mode === 'client' 
              ? conv.Vendor?.name || 'Unknown Shop'
              : conv.User?.name || 'Unknown User'
              
            const avatarUrl = mode === 'client'
              ? conv.Vendor?.logo
              : conv.User?.UserProfile?.avatar

            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg text-left transition-colors relative w-full",
                  isSelected 
                    ? "bg-accent text-accent-foreground" 
                    : conv.lastMessage && !conv.lastMessage.isRead
                      ? "bg-muted/30 hover:bg-muted/50"
                      : "hover:bg-muted/30"
                )}
              >
                <div className="relative flex-shrink-0">
                  <Avatar>
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback>{displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {conv.lastMessage && !conv.lastMessage.isRead && (
                    <div className="absolute top-0 right-0 h-3 w-3 bg-blue-500 rounded-full border-2 border-background"></div>
                  )}
                </div>
                
                <div className="flex-1 overflow-hidden min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={cn(
                      "font-medium truncate",
                      conv.lastMessage && !conv.lastMessage.isRead ? "font-semibold" : ""
                    )}>
                      {displayName}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                      {conv.updatedAt && formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true, locale: vi })}
                    </span>
                  </div>
                  
                  {conv.lastMessage && (
                    <p className={cn(
                      "text-xs truncate",
                      conv.lastMessage.isRead
                        ? "text-muted-foreground"
                        : "text-foreground font-medium"
                    )}>
                      {mode === 'client' 
                        ? (conv.lastMessage.senderId === conv.userId ? 'Bạn' : displayName)
                        : (conv.lastMessage.senderId === conv.vendorId ? 'Bạn' : displayName)
                      }
                      {": "}
                      {conv.lastMessage.content}
                    </p>
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>
    </ScrollArea>
  )
}
