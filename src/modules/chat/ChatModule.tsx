import React, { useState, useRef, useEffect } from 'react'
import {
  Plus,
  ArrowUp,
  Brain,
  Zap,
  BarChart3,
  ShieldAlert,
  Calendar,
  Search,
  Copy,
  Check,
  Share2,
  RotateCcw,
  MoreHorizontal,
  Pencil,
  ArrowDown,
  RefreshCw,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { SchemaRenderer } from '@/components/ai/SchemaRenderer'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  parsedJson?: Record<string, any>
  outputType?: string
  latencyMs?: number
  timestamp: number
  thinkMode?: boolean
}

interface Props {
  onAskAI?: (prompt: string) => void
}

const BUSINESS_SUGGESTIONS = [
  {
    icon: ShieldAlert,
    title: 'Audit Cashier Overrides',
    prompt: 'Alert management: Check for unauthorized discount overrides or till float shortfalls in POS Station 3.',
  },
  {
    icon: BarChart3,
    title: 'Warehouse Stock Chart',
    prompt: 'Generate a chart showing pallet SKU quantities across warehouse Zone A, Zone B, Zone C, and Zone D.',
  },
  {
    icon: Calendar,
    title: 'Pharmacist Shift Rota',
    prompt: 'Build a weekly shift schedule for 3 pharmacists: Dr. Sarah, Mr. David, and Ms. Clara starting next Monday.',
  },
  {
    icon: Search,
    title: 'Cost & Variance Audit',
    prompt: 'Investigate internal expense records to identify why software licenses and operational costs exceeded forecast.',
  },
]

export const ChatModule: React.FC<Props> = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [thinkMode, setThinkMode] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showScrollBottom, setShowScrollBottom] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const t0 = Date.now()

    try {
      let response: any
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        response = await (window as any).electronAPI.generateAI({ prompt: promptText })
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

      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      console.error('AI Error:', err)
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          role: 'assistant',
          content: '⚠️ Offline AI engine encountered an error. Please try again.',
          timestamp: Date.now(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white relative select-none font-sans overflow-hidden">
      {/* Empty State / Start Screen */}
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 max-w-3xl mx-auto w-full -mt-10">
          {/* Centered Heading */}
          <h2 className="text-2xl sm:text-3xl font-medium text-neutral-800 tracking-tight text-center mb-6">
            Where should we begin?
          </h2>

          {/* Sleek Prompt Capsule Bar */}
          <div className="w-full max-w-2xl bg-white border border-neutral-200 rounded-full px-3 py-2 shadow-sm hover:shadow-md focus-within:shadow-md focus-within:border-neutral-300 transition-all flex items-center gap-2">
            {/* Left '+' Attachment Action */}
            <button
              type="button"
              onClick={() => inputRef.current?.focus()}
              className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-600 hover:text-black transition-colors shrink-0 cursor-pointer"
              title="Add attachment / context"
            >
              <Plus className="h-5 w-5" />
            </button>

            {/* Input Field */}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Ask anything"
              autoFocus
              className="flex-1 text-sm text-neutral-800 placeholder-neutral-400 bg-transparent focus:outline-none px-1"
            />

            {/* Right Controls: Think toggle + Blue Send Action */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setThinkMode((prev) => !prev)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  thinkMode
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
                title="Deep Thinking Mode"
              >
                <Brain className="h-3.5 w-3.5" />
                <span>Think</span>
              </button>

              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className={`h-8 w-8 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                  input.trim()
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                }`}
                title="Send message"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quick Business Prompts Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-8 w-full max-w-2xl">
            {BUSINESS_SUGGESTIONS.map((item, idx) => {
              const Icon = item.icon
              return (
                <button
                  key={idx}
                  onClick={() => handleSend(item.prompt)}
                  className="group flex items-start gap-3 p-3 rounded-2xl border border-neutral-200 bg-white hover:bg-neutral-50/80 hover:border-neutral-300 transition-all text-left shadow-2xs cursor-pointer"
                >
                  <div className="p-2 rounded-xl bg-neutral-100 group-hover:bg-white text-neutral-800 transition-colors shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-neutral-900">{item.title}</h4>
                    <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">{item.prompt}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        /* Active Conversation Stream */
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-6 space-y-6 max-w-3xl mx-auto w-full [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {messages.map((msg) => {
              const isUser = msg.role === 'user'

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}
                >
                  {/* Message Body */}
                  {isUser ? (
                    /* User Prompt: Clean soft badge on right, NO avatar */
                    <div className="max-w-[80%] rounded-3xl bg-[#f0f4f9] px-4 py-2.5 text-sm text-neutral-900 leading-relaxed">
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ) : (
                    /* AI Assistant: Free flowing text on white canvas, NO bot avatar, NO container border */
                    <div className="w-full text-neutral-900 text-[14px] leading-relaxed">
                      {msg.parsedJson ? (
                        <SchemaRenderer
                          schema={msg.parsedJson}
                          rawText={msg.content}
                          onApplyAction={() => {}}
                        />
                      ) : (
                        <div className="prose prose-sm max-w-none text-neutral-800 leading-relaxed prose-headings:font-semibold prose-headings:text-neutral-900 prose-p:my-2 prose-ul:my-2 prose-li:my-0.5">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Toolbar Below Message */}
                  {isUser ? (
                    <div className="flex items-center gap-1.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400">
                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="p-1 rounded hover:bg-neutral-100 hover:text-neutral-700 transition-colors cursor-pointer"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => setInput(msg.content)}
                        className="p-1 rounded hover:bg-neutral-100 hover:text-neutral-700 transition-colors cursor-pointer"
                        title="Edit prompt"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-2 text-neutral-400">
                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className="p-1 rounded hover:bg-neutral-100 hover:text-neutral-700 transition-colors cursor-pointer"
                        title="Copy response"
                      >
                        {copiedId === msg.id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => handleCopy(msg.content, `${msg.id}-share`)}
                        className="p-1 rounded hover:bg-neutral-100 hover:text-neutral-700 transition-colors cursor-pointer"
                        title="Share"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleSend(messages[messages.length - 2]?.content || msg.content)}
                        className="p-1 rounded hover:bg-neutral-100 hover:text-neutral-700 transition-colors cursor-pointer"
                        title="Regenerate response"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="p-1 rounded hover:bg-neutral-100 hover:text-neutral-700 transition-colors cursor-pointer"
                        title="More options"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}

            {loading && (
              <div className="flex items-center gap-2 text-neutral-500 text-xs py-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-neutral-600" />
                <span>Generating offline response...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Floating Scroll To Bottom Button */}
          {showScrollBottom && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10">
              <button
                onClick={scrollToBottom}
                className="h-8 w-8 rounded-full bg-white border border-neutral-200 shadow-md flex items-center justify-center text-neutral-600 hover:text-black hover:bg-neutral-50 transition-all cursor-pointer"
                title="Scroll to bottom"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Fixed Bottom Capsule Input */}
          <div className="p-4 bg-white shrink-0">
            <div className="w-full max-w-2xl mx-auto bg-white border border-neutral-200 rounded-full px-3 py-2 shadow-sm hover:shadow-md focus-within:shadow-md focus-within:border-neutral-300 transition-all flex items-center gap-2">
              <button
                type="button"
                className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-600 hover:text-black transition-colors shrink-0 cursor-pointer"
                title="Add attachment / context"
              >
                <Plus className="h-5 w-5" />
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Ask anything"
                disabled={loading}
                className="flex-1 text-sm text-neutral-800 placeholder-neutral-400 bg-transparent focus:outline-none px-1"
              />

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setThinkMode((prev) => !prev)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    thinkMode
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                  title="Deep Thinking Mode"
                >
                  <Brain className="h-3.5 w-3.5" />
                  <span>Think</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || loading}
                  className={`h-8 w-8 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                    input.trim()
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                  }`}
                  title="Send message"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
