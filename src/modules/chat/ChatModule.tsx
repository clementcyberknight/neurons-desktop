import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
  Plus,
  ArrowUp,
  Brain,
  Search,
  Copy,
  Check,
  MessageSquare,
  ChevronDown,
  Trash2,
  CheckSquare,
  Square,
  Maximize2,
  Minimize2,
  Mic,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useLiveQuery } from 'dexie-react-hooks'
import { SchemaRenderer } from '@/components/ai/SchemaRenderer'
import type { LLMOutputSchema } from '@/types/schemas'
import { db } from '@/db/localDb'
import type { ChatMessage } from '@/types/database'

interface Props {
  activeChatId?: string | null
  viewMode?: 'history_list' | 'chat'
  onViewModeChange?: (mode: 'history_list' | 'chat') => void
  onChatCreated?: (id: string | null) => void
  onAskAI?: (prompt: string) => void
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / (1000 * 60))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} minutes ago`
  const hours = Math.floor(minutes / 60)
  if (hours === 1) return '1 hour ago'
  if (hours < 24) return `${hours} hours ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return '1 day ago'
  if (days < 7) return `${days} days ago`

  const date = new Date(timestamp)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${monthNames[date.getMonth()]} ${date.getDate()}`
}

export const ChatModule: React.FC<Props> = ({
  activeChatId,
  viewMode = 'chat',
  onViewModeChange,
  onChatCreated,
}) => {
  // Query all sessions for the Chats and tasks overview list
  const allSessions =
    useLiveQuery(() => db.chatSessions.orderBy('lastMessageAt').reverse().toArray()) || []

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(activeChatId ?? null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [thinkMode, setThinkMode] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showScrollBottom, setShowScrollBottom] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  // Overview list state
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchInput, setShowSearchInput] = useState(false)
  const [filterType, setFilterType] = useState<'All' | 'Chats' | 'Tasks'>('All')
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const emptyTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Sync with prop when activeChatId changes from sidebar
  useEffect(() => {
    setCurrentSessionId(activeChatId ?? null)
  }, [activeChatId])

  // Auto-adjust textarea heights for multiline
  useEffect(() => {
    const adjustRef = (ref: React.RefObject<HTMLTextAreaElement | null>) => {
      if (!ref.current) return
      if (isExpanded) {
        ref.current.style.height = '240px'
      } else {
        ref.current.style.height = 'auto'
        const sHeight = ref.current.scrollHeight
        ref.current.style.height = `${Math.min(Math.max(sHeight, 24), 160)}px`
      }
    }

    adjustRef(textareaRef)
    adjustRef(emptyTextareaRef)
  }, [input, isExpanded])

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages, loading])

  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 100)
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Filtered sessions for the overview list
  const filteredSessions = useMemo(() => {
    let list = [...allSessions]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter((s) => s.title.toLowerCase().includes(q))
    }
    return list
  }, [allSessions, searchQuery])

  const handleOpenSession = (id: string) => {
    setCurrentSessionId(id)
    onChatCreated?.(id)
    onViewModeChange?.('chat')
  }

  const handleStartNewChat = () => {
    setCurrentSessionId(null)
    setMessages([])
    onChatCreated?.(null)
    onViewModeChange?.('chat')
  }

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return
    try {
      await db.chatSessions.bulkDelete(selectedIds)
      setSelectedIds([])
      setIsSelectMode(false)
      if (currentSessionId && selectedIds.includes(currentSessionId)) {
        handleStartNewChat()
      }
    } catch (e) {
      console.error('Failed to delete selected sessions:', e)
    }
  }

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
            raw: 'Hey Clement 👏\nWhat are we building, breaking, or plotting today? 🚀',
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
              summary: 'Zone A holds 40% of all pallets (400 units), Zone B holds 35% (350 units), Zone C holds 15% (150 units), and Zone D holds 10% (100 units).',
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
                { staff_id: 'PHC_01', name: 'Dr. Sarah Johnson', role: 'Licensed Pharmacist', day: 'Monday', shift: '08:00 - 16:30' },
                { staff_id: 'PHC_02', name: 'Mr. David Kim', role: 'Staff Pharmacist', day: 'Tuesday', shift: '09:00 - 17:30' },
                { staff_id: 'PHC_03', name: 'Ms. Clara Lee', role: 'Pharmacy Technician', day: 'Wednesday', shift: '08:00 - 16:30' },
                { staff_id: 'PHC_01', name: 'Dr. Sarah Johnson', role: 'Licensed Pharmacist', day: 'Thursday', shift: '12:00 - 20:30' },
                { staff_id: 'PHC_02', name: 'Mr. David Kim', role: 'Staff Pharmacist', day: 'Friday', shift: '08:00 - 16:30' },
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
              reasoning: 'Cashier ID #104 executed an unauthorized 80% manual discount override on POS Station 3 on transaction TXN_8820.',
              recommended_action: 'Lock till station, restrict cashier #104 override permissions for 24 hours, and conduct managerial till audit.',
            },
            outputType: 'RED_FLAG_ALERT',
            latencyMs: 280,
          }
        } else {
          response = {
            raw: "To minimize cashier discrepancy losses during peak hours while keeping customer throughput high, I recommend implementing 3 key operational controls:\n\n1. **Real-time POS Discrepancy Alerts**: Configure the register to flag manual discount overrides or float differences over ₦5,000 immediately.\n2. **Staggered Shift Handover Buffers**: Give cashiers a dedicated 10-minute float verification window before peak rush rather than counting mid-line.\n3. **Quick-Scan Barcode Presets**: Minimize manual numeric item entry, which causes 78% of inadvertent price discrepancies.\n\nWould you like me to draft an official store policy document or generate an automated task for the store manager?",
            outputType: 'CONVERSATIONAL_CHAT',
            latencyMs: 310,
          }
        }
      }

      // Ensure newlines are unescaped properly for markdown rendering
      const cleanContent = typeof response.raw === 'string'
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

  // ═════════════════════════════════════════════════════════════════
  // VIEW 1: FULL "CHATS AND TASKS" OVERVIEW LIST PAGE (WHITE THEME)
  // ═════════════════════════════════════════════════════════════════
  if (viewMode === 'history_list') {
    return (
      <div className="flex flex-col h-full bg-white text-neutral-900 font-sans select-none overflow-y-auto no-scrollbar">
        {/* Top Header Toolbar with Clean White Theme */}
        <div className="max-w-4xl w-full mx-auto px-6 pt-10 pb-6">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
              Chats and tasks
            </h1>

            <div className="flex items-center gap-2">
              {/* Search Toggle Button */}
              <button
                onClick={() => setShowSearchInput((prev) => !prev)}
                className={`p-2 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                  showSearchInput
                    ? 'bg-neutral-100 border-neutral-300 text-neutral-900'
                    : 'bg-white border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
                title="Search chats & tasks"
              >
                <Search className="h-4 w-4" />
              </button>

              {/* Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setFilterType((prev) => (prev === 'All' ? 'Chats' : prev === 'Chats' ? 'Tasks' : 'All'))}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-all cursor-pointer shadow-2xs"
                >
                  <span className="text-neutral-400">Filter by</span>
                  <span className="text-neutral-900 font-semibold">{filterType}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-neutral-400 ml-0.5" />
                </button>
              </div>

              {/* Select Button */}
              <button
                onClick={() => {
                  setIsSelectMode((prev) => !prev)
                  setSelectedIds([])
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer shadow-2xs ${
                  isSelectMode
                    ? 'bg-black text-white border-black font-semibold'
                    : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                {isSelectMode ? 'Done' : 'Select'}
              </button>

              {/* New Button */}
              <button
                onClick={handleStartNewChat}
                className="px-4 py-1.5 rounded-xl bg-black text-white hover:bg-neutral-800 text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                New
              </button>
            </div>
          </div>

          {/* Collapsible Search Input */}
          {showSearchInput && (
            <div className="mt-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversation history..."
                className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 focus:bg-white focus:outline-none focus:border-neutral-900 transition-all shadow-2xs"
                autoFocus
              />
            </div>
          )}

          {/* Batch Selection Action Bar */}
          {isSelectMode && selectedIds.length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between text-xs shadow-2xs">
              <span className="text-neutral-700 font-medium">
                {selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} selected
              </span>
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors cursor-pointer shadow-xs"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Selected</span>
              </button>
            </div>
          )}
        </div>

        {/* Main List of Conversations */}
        <div className="max-w-4xl w-full mx-auto px-6 pb-16 flex-1">
          <div className="divide-y divide-neutral-100">
            {filteredSessions.map((session) => {
              const isSelected = selectedIds.includes(session.id)
              return (
                <div
                  key={session.id}
                  onClick={() => {
                    if (isSelectMode) {
                      handleToggleSelect(session.id)
                    } else {
                      handleOpenSession(session.id)
                    }
                  }}
                  className={`group flex items-center justify-between py-3.5 px-3 -mx-3 rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-100/80'
                      : 'hover:bg-neutral-50 text-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-4">
                    {isSelectMode ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleSelect(session.id)
                        }}
                        className="text-neutral-400 hover:text-neutral-900"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-neutral-900" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    ) : (
                      <MessageSquare className="h-4 w-4 text-neutral-400 group-hover:text-neutral-700 shrink-0 transition-colors" />
                    )}
                    <span className="text-sm font-medium text-neutral-900 truncate">
                      {session.title}
                    </span>
                  </div>

                  <div className="text-xs text-neutral-400 font-normal shrink-0 pl-4 group-hover:text-neutral-600 transition-colors">
                    {formatRelativeTime(session.lastMessageAt || session.createdAt)}
                  </div>
                </div>
              )
            })}

            {filteredSessions.length === 0 && (
              <div className="py-16 text-center text-neutral-400 text-sm">
                No conversation history found. Click <span className="text-neutral-900 font-semibold cursor-pointer underline" onClick={handleStartNewChat}>New</span> to start a new chat.
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ═════════════════════════════════════════════════════════════════
  // VIEW 2: CONVERSATION / NEW CHAT DETAIL VIEW
  // ═════════════════════════════════════════════════════════════════
  const activeSession = allSessions.find((s) => s.id === currentSessionId)

  return (
    <div className="flex flex-col h-full bg-white relative select-none font-sans overflow-hidden">
      {/* Clean Start Screen Matching Screenshot ("Good to see you, Akhimien.") */}
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 max-w-3xl mx-auto w-full -mt-16">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-medium text-neutral-800 tracking-tight">
              Good to see you, Akhimien.
            </h1>
          </div>

          {/* Clean Centered Floating Multiline Input Capsule */}
          <div className="w-full max-w-2xl">
            <div
              className={`rounded-3xl border border-neutral-200 bg-[#f4f4f4] px-4 py-3 flex flex-col justify-between focus-within:bg-white focus-within:border-neutral-300 focus-within:shadow-xs transition-all ${
                isExpanded ? 'min-h-[300px]' : 'min-h-[64px]'
              }`}
            >
              {/* Textarea + Expand button in top row */}
              <div className="flex items-start justify-between w-full gap-2">
                <textarea
                  ref={emptyTextareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder="Ask anything"
                  rows={1}
                  className={`w-full bg-transparent text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none resize-none no-scrollbar leading-relaxed ${
                    isExpanded ? 'h-[230px] overflow-y-auto' : 'max-h-[160px]'
                  }`}
                  autoFocus
                />

                <button
                  type="button"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors cursor-pointer shrink-0"
                  title={isExpanded ? 'Collapse input' : 'Expand input fully'}
                >
                  {isExpanded ? (
                    <Minimize2 className="h-3.5 w-3.5" />
                  ) : (
                    <Maximize2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              {/* Bottom Toolbar: Attach on left, Think + Mic + Send on right */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  className="p-1.5 rounded-full text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/70 transition-colors cursor-pointer shrink-0"
                  title="Attach files or context"
                >
                  <Plus className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setThinkMode((prev) => !prev)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      thinkMode
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-neutral-500 hover:bg-neutral-200/70 hover:text-neutral-800'
                    }`}
                  >
                    <Brain className="h-3.5 w-3.5" />
                    <span>Think</span>
                  </button>

                  <button
                    type="button"
                    className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/50 transition-colors cursor-pointer"
                    title="Voice input"
                  >
                    <Mic className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSend()}
                    disabled={!input.trim() || loading}
                    className={`h-8 w-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      input.trim()
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                        : 'bg-neutral-300/80 text-white cursor-not-allowed'
                    }`}
                    title="Send message"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Disclaimer Text */}
            <div className="text-center text-[11px] text-neutral-400 mt-2 select-none">
              Neurons can make mistakes. Check important info.
            </div>
          </div>
        </div>
      ) : (
        /* Conversation Feed */
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-6 no-scrollbar space-y-6 max-w-3xl mx-auto w-full"
        >
          {/* Centered Session Timestamp */}
          <div className="text-center text-xs text-neutral-400 select-none pb-2">
            {activeSession
              ? formatRelativeTime(activeSession.createdAt)
              : 'Today'}
          </div>

          {messages.map((msg) => {
            const isUser = msg.role === 'user'
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}
              >
                <div
                  className={`max-w-[85%] text-sm leading-relaxed ${
                    isUser
                      ? 'bg-[#f4f4f4] text-neutral-900 px-4 py-3 rounded-2xl rounded-br-xs'
                      : 'bg-transparent text-neutral-900 px-1 py-1'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="space-y-3">
                      {msg.parsedJson ? (
                        <SchemaRenderer
                          schema={msg.parsedJson}
                          rawText={msg.content}
                        />
                      ) : (
                        <div className="prose prose-sm text-neutral-900 break-words leading-relaxed">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Message Action Bar (Copy / Feedback) */}
                {!isUser && (
                  <div className="flex items-center gap-1 mt-1.5 px-1 text-neutral-400">
                    <button
                      onClick={() => handleCopy(msg.content, msg.id)}
                      className="p-1 rounded-md hover:bg-neutral-100 hover:text-neutral-700 transition-colors cursor-pointer"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                    {msg.latencyMs && (
                      <span className="text-[10px] font-mono text-neutral-400 ml-1">
                        {msg.latencyMs}ms
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Loading Typing Indicator */}
          {loading && (
            <div className="flex items-center gap-2 text-neutral-400 py-2">
              <div className="h-2 w-2 rounded-full bg-neutral-400 animate-bounce" />
              <div className="h-2 w-2 rounded-full bg-neutral-400 animate-bounce [animation-delay:0.2s]" />
              <div className="h-2 w-2 rounded-full bg-neutral-400 animate-bounce [animation-delay:0.4s]" />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Clean Floating Bottom Multiline Input Bar for Active Chat */}
      {messages.length > 0 && (
        <div className="px-4 pb-3 pt-1 bg-white">
          <div className="max-w-3xl mx-auto">
            <div
              className={`rounded-3xl border border-neutral-200 bg-[#f4f4f4] px-4 py-3 flex flex-col justify-between focus-within:bg-white focus-within:border-neutral-300 focus-within:shadow-xs transition-all ${
                isExpanded ? 'min-h-[300px]' : 'min-h-[64px]'
              }`}
            >
              {/* Textarea + Expand button in top row */}
              <div className="flex items-start justify-between w-full gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder="Ask anything"
                  rows={1}
                  className={`w-full bg-transparent text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none resize-none no-scrollbar leading-relaxed ${
                    isExpanded ? 'h-[230px] overflow-y-auto' : 'max-h-[160px]'
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors cursor-pointer shrink-0"
                  title={isExpanded ? 'Collapse input' : 'Expand input fully'}
                >
                  {isExpanded ? (
                    <Minimize2 className="h-3.5 w-3.5" />
                  ) : (
                    <Maximize2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              {/* Bottom Toolbar: Attach on left, Think + Mic + Send on right */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  className="p-1.5 rounded-full text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/70 transition-colors cursor-pointer shrink-0"
                  title="Attach files or context"
                >
                  <Plus className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setThinkMode((prev) => !prev)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      thinkMode
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-neutral-500 hover:bg-neutral-200/70 hover:text-neutral-800'
                    }`}
                  >
                    <Brain className="h-3.5 w-3.5" />
                    <span>Think</span>
                  </button>

                  <button
                    type="button"
                    className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/50 transition-colors cursor-pointer"
                    title="Voice input"
                  >
                    <Mic className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSend()}
                    disabled={!input.trim() || loading}
                    className={`h-8 w-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      input.trim()
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                        : 'bg-neutral-300/80 text-white cursor-not-allowed'
                    }`}
                    title="Send message"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Disclaimer Text */}
            <div className="text-center text-[11px] text-neutral-400 mt-2 select-none">
              Neurons can make mistakes. Check important info.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
