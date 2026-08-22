import React, { useRef, useEffect } from 'react'
import type { ChatMessage, ChatSession } from '@/types/database'
import { ChatMessageItem } from './ChatMessageItem'
import { formatRelativeTime } from '@/utils/formatTime'

interface ChatMessageListProps {
  messages: ChatMessage[]
  activeSession?: ChatSession
  loading: boolean
  copiedId: string | null
  onCopy: (text: string, id: string) => void
  onScroll?: () => void
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  activeSession,
  loading,
  copiedId,
  onCopy,
  onScroll,
  scrollContainerRef,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  return (
    <div
      ref={scrollContainerRef}
      onScroll={onScroll}
      className="flex-1 overflow-y-auto px-4 py-6 no-scrollbar space-y-6 max-w-3xl mx-auto w-full"
    >
      {/* Session Timestamp */}
      <div className="text-center text-xs text-neutral-400 select-none pb-2">
        {activeSession ? formatRelativeTime(activeSession.createdAt) : 'Today'}
      </div>

      {/* Messages */}
      {messages.map((msg) => (
        <ChatMessageItem
          key={msg.id}
          message={msg}
          copiedId={copiedId}
          onCopy={onCopy}
        />
      ))}

      {/* Loading Typing Bounce Indicator */}
      {loading && (
        <div className="flex items-center gap-2 text-neutral-400 py-2">
          <div className="h-2 w-2 rounded-full bg-neutral-400 animate-bounce" />
          <div className="h-2 w-2 rounded-full bg-neutral-400 animate-bounce [animation-delay:0.2s]" />
          <div className="h-2 w-2 rounded-full bg-neutral-400 animate-bounce [animation-delay:0.4s]" />
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}
