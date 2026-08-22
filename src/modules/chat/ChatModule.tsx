import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/localDb'
import type { ChatMessage } from '@/types/database'
import { aiChatService } from '@/services/aiChatService'
import { ChatHistoryOverview } from './components/ChatHistoryOverview'
import { ChatWelcomeScreen } from './components/ChatWelcomeScreen'
import { ChatMessageList } from './components/ChatMessageList'
import { ChatInputCapsule } from './components/ChatInputCapsule'

interface Props {
  activeChatId?: string | null
  viewMode?: 'history_list' | 'chat'
  onViewModeChange?: (mode: 'history_list' | 'chat') => void
  onChatCreated?: (id: string | null) => void
  onAskAI?: (prompt: string) => void
}

export const ChatModule: React.FC<Props> = ({
  activeChatId,
  viewMode = 'chat',
  onViewModeChange,
  onChatCreated,
}) => {
  // Query all sessions for overview list
  const allSessions =
    useLiveQuery(() => db.chatSessions.orderBy('lastMessageAt').reverse().toArray()) || []

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(activeChatId ?? null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [thinkMode, setThinkMode] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Sync with prop when activeChatId changes from sidebar
  useEffect(() => {
    setCurrentSessionId(activeChatId ?? null)
  }, [activeChatId])

  // Load chat session messages when currentSessionId changes
  useEffect(() => {
    if (!currentSessionId) {
      setMessages([])
      return
    }

    const loadSession = async () => {
      try {
        const session = await db.chatSessions.get(currentSessionId)
        if (session && session.messages) {
          setMessages(session.messages)
        } else {
          setMessages([])
        }
      } catch (err) {
        console.error('Failed to load chat session:', err)
        setMessages([])
      }
    }

    loadSession()
  }, [currentSessionId])

  // Copy message text
  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  // Open session
  const handleOpenSession = useCallback(
    (id: string) => {
      setCurrentSessionId(id)
      onChatCreated?.(id)
      onViewModeChange?.('chat')
    },
    [onChatCreated, onViewModeChange]
  )

  // Start new chat
  const handleStartNewChat = useCallback(() => {
    setCurrentSessionId(null)
    setMessages([])
    onChatCreated?.(null)
    onViewModeChange?.('chat')
  }, [onChatCreated, onViewModeChange])

  // Delete batch sessions
  const handleDeleteSessions = useCallback(
    async (ids: string[]) => {
      try {
        await db.chatSessions.bulkDelete(ids)
        if (currentSessionId && ids.includes(currentSessionId)) {
          handleStartNewChat()
        }
      } catch (e) {
        console.error('Failed to delete selected sessions:', e)
      }
    },
    [currentSessionId, handleStartNewChat]
  )

  // Send message
  const handleSend = async (textToSend?: string) => {
    const promptText = (textToSend || input).trim()
    if (!promptText || loading) return

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: promptText,
      timestamp: Date.now(),
      thinkMode,
    }

    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setIsExpanded(false)
    setLoading(true)

    const t0 = Date.now()

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const response = await aiChatService.sendMessage(promptText, {
        thinkMode,
        history,
        currentModule: 'chat',
      })

      const cleanContent =
        typeof response.raw === 'string'
          ? response.raw.replace(/\\n/g, '\n')
          : response.raw

      const assistantMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        role: 'assistant',
        content: cleanContent,
        parsedJson: response.parsedJson,
        outputType: response.outputType,
        latencyMs: response.latencyMs || Date.now() - t0,
        timestamp: Date.now(),
      }

      const finalMessages = [...newMessages, assistantMsg]
      setMessages(finalMessages)

      // Persist to Dexie ChatSession table
      try {
        const now = Date.now()
        if (currentSessionId) {
          await db.chatSessions.update(currentSessionId, {
            messages: finalMessages,
            lastMessageAt: now,
            updatedAt: now,
            synced: 0,
          })
        } else {
          const newId = `chat-${now}`
          const title = promptText.length > 42 ? promptText.slice(0, 42).trim() + '...' : promptText
          await db.chatSessions.add({
            id: newId,
            title,
            messages: finalMessages,
            lastMessageAt: now,
            createdAt: now,
            updatedAt: now,
            synced: 0,
          })
          setCurrentSessionId(newId)
          onChatCreated?.(newId)
        }
      } catch (saveErr) {
        console.error('Failed to persist chat session to local database:', saveErr)
      }
    } catch (err) {
      console.error('AI Error:', err)
      const errMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: '⚠️ Offline AI engine encountered an error. Please try again.',
        timestamp: Date.now(),
      }
      setMessages([...newMessages, errMsg])
    } finally {
      setLoading(false)
    }
  }

  // 1. History Overview List Mode
  if (viewMode === 'history_list') {
    return (
      <ChatHistoryOverview
        sessions={allSessions}
        onOpenSession={handleOpenSession}
        onStartNewChat={handleStartNewChat}
        onDeleteSessions={handleDeleteSessions}
      />
    )
  }

  // 2. Active Chat Conversation Mode
  const activeSession = allSessions.find((s) => s.id === currentSessionId)

  return (
    <div className="flex flex-col h-full bg-white relative select-none font-sans overflow-hidden">
      {messages.length === 0 ? (
        <ChatWelcomeScreen
          input={input}
          setInput={setInput}
          loading={loading}
          thinkMode={thinkMode}
          setThinkMode={setThinkMode}
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
          onSend={handleSend}
        />
      ) : (
        <>
          <ChatMessageList
            messages={messages}
            activeSession={activeSession}
            loading={loading}
            copiedId={copiedId}
            onCopy={handleCopy}
            scrollContainerRef={scrollContainerRef}
          />

          {/* Floating Bottom Input Bar */}
          <div className="px-4 pb-3 pt-1 bg-white">
            <div className="max-w-3xl mx-auto">
              <ChatInputCapsule
                input={input}
                setInput={setInput}
                loading={loading}
                thinkMode={thinkMode}
                setThinkMode={setThinkMode}
                isExpanded={isExpanded}
                setIsExpanded={setIsExpanded}
                onSend={handleSend}
                showDisclaimer
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
export default ChatModule
