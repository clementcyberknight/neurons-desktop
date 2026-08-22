import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/localDb'
import type { ChatMessage } from '@/types/database'
import type { LLMOutputSchema } from '@/types/schemas'
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
      let response: {
        raw?: string
        parsedJson?: LLMOutputSchema
        outputType?: string
        latencyMs?: number
      } = {
        raw: '',
        outputType: 'CONVERSATIONAL_CHAT',
        latencyMs: 0,
      }

      if (typeof window !== 'undefined' && window.electronAPI) {
        const result = await window.electronAPI.generateAI({ prompt: promptText })
        response = {
          raw: result.data || result.error || 'No response generated',
          outputType: 'CONVERSATIONAL_CHAT',
          latencyMs: 300,
        }
      } else {
        // Fallback simulation in dev
        await new Promise((r) => setTimeout(r, 450))
        const lower = promptText.toLowerCase().trim()

        if (lower === 'hey' || lower === 'hi' || lower === 'hello' || lower.startsWith('hey ')) {
          response = {
            raw: 'Hey there 👏\nWhat are we building, breaking, or plotting today? 🚀',
            outputType: 'CONVERSATIONAL_CHAT',
            latencyMs: 180,
          }
        } else if (lower.includes('noun')) {
          response = {
            raw: 'A **noun** is a word that names a **person**, **place**, **thing**, **animal**, or **idea**.\n\n### Examples\n- 👤 **Person**: teacher, Clement, doctor\n- 📍 **Place**: Nigeria, school, Lagos\n- 📦 **Thing**: phone, laptop, car\n- 🐕 **Animal**: dog, lion, eagle\n- 💡 **Idea**: freedom, happiness, intelligence\n\n**Example sentence:**\n> Here, *student*, *laptop*, and *Lagos* are nouns.',
            outputType: 'CONVERSATIONAL_CHAT',
            latencyMs: 240,
          }
        } else if (lower.includes('thanks') || lower.includes('thank you')) {
          response = {
            raw: "You're very welcome! Let me know whenever you're ready for the next task or analysis.",
            outputType: 'CONVERSATIONAL_CHAT',
            latencyMs: 150,
          }
        } else if (lower.includes('chart') || lower.includes('stock') || lower.includes('warehouse')) {
          response = {
            raw: 'Warehouse pallet SKU distribution chart generated.',
            parsedJson: {
              output_type: 'GENERATIVE_CHART',
              chart_type: 'bar',
              title: 'Warehouse Zone Pallet SKU Distribution',
              summary:
                'Zone A holds 40% of all pallets (400 units), Zone B holds 35% (350 units), Zone C holds 15% (150 units), and Zone D holds 10% (100 units).',
              data: {
                labels: ['Zone A', 'Zone B', 'Zone C', 'Zone D'],
                datasets: [{ label: 'Pallet Count', values: [400, 350, 150, 100] }],
              },
            },
            outputType: 'GENERATIVE_CHART',
            latencyMs: 320,
          }
        } else if (lower.includes('shift') || lower.includes('rota') || lower.includes('schedule')) {
          response = {
            raw: 'Shift rota generated for staff members.',
            parsedJson: {
              output_type: 'SHIFT_SCHEDULE',
              week_starting: '2026-09-01',
              schedule: [
                {
                  staff_id: 'PHC_01',
                  name: 'Dr. Sarah Johnson',
                  role: 'Licensed Pharmacist',
                  day: 'Monday',
                  shift: '08:00 - 16:30',
                },
                {
                  staff_id: 'PHC_02',
                  name: 'Mr. David Kim',
                  role: 'Staff Pharmacist',
                  day: 'Tuesday',
                  shift: '09:00 - 17:30',
                },
                {
                  staff_id: 'PHC_03',
                  name: 'Ms. Clara Lee',
                  role: 'Pharmacy Technician',
                  day: 'Wednesday',
                  shift: '08:00 - 16:30',
                },
                {
                  staff_id: 'PHC_01',
                  name: 'Dr. Sarah Johnson',
                  role: 'Licensed Pharmacist',
                  day: 'Thursday',
                  shift: '12:00 - 20:30',
                },
                {
                  staff_id: 'PHC_02',
                  name: 'Mr. David Kim',
                  role: 'Staff Pharmacist',
                  day: 'Friday',
                  shift: '08:00 - 16:30',
                },
              ],
            },
            outputType: 'SHIFT_SCHEDULE',
            latencyMs: 290,
          }
        } else if (lower.includes('override') || lower.includes('alert') || lower.includes('discrepancy')) {
          response = {
            raw: 'POS Alert logged.',
            parsedJson: {
              output_type: 'RED_FLAG_ALERT',
              severity: 'HIGH',
              flagged_module: 'POS Cashier Reconciliation',
              anomaly_type: 'UNAUTHORIZED_DISCOUNT_OVERRIDE',
              transaction_id: 'TXN_8820',
              reasoning:
                'Cashier ID #104 executed an unauthorized 80% manual discount override on POS Station 3 on transaction TXN_8820.',
              recommended_action:
                'Lock till station, restrict cashier #104 override permissions for 24 hours, and conduct managerial till audit.',
            },
            outputType: 'RED_FLAG_ALERT',
            latencyMs: 280,
          }
        } else {
          response = {
            raw:
              "To minimize cashier discrepancy losses during peak hours while keeping customer throughput high, I recommend implementing 3 key operational controls:\n\n1. **Real-time POS Discrepancy Alerts**: Configure the register to flag manual discount overrides or float differences over ₦5,000 immediately.\n2. **Staggered Shift Handover Buffers**: Give cashiers a dedicated 10-minute float verification window before peak rush rather than counting mid-line.\n3. **Quick-Scan Barcode Presets**: Minimize manual numeric item entry, which causes 78% of inadvertent price discrepancies.\n\nWould you like me to draft an official store policy document or generate an automated task for the store manager?",
            outputType: 'CONVERSATIONAL_CHAT',
            latencyMs: 310,
          }
        }
      }

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
