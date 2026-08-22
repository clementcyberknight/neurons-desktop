import React, { useState, useRef, useEffect } from 'react'
import {
  X,
  Send,
  Loader2,
  Copy,
  PlusCircle,
  RotateCcw,
  Sparkles,
  Check,
  FileText,
  CornerDownLeft,
  ListChecks,
  FileCheck2,
  TableProperties,
} from 'lucide-react'
import { aiChatService, type AIChatMessage } from '@/services/aiChatService'
import aiSparklesIcon from '@/assets/icons-pack/Ai-Sparkles--Streamline-Plump.png'

interface Props {
  documentTitle: string
  documentContent: string
  documentCategory: string
  onClose: () => void
  onInsertContent: (htmlOrText: string) => void
}

interface MessageItem {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  latencyMs?: number
}

const PROMPT_SUGGESTIONS = [
  {
    icon: FileText,
    label: 'Summarize this document',
    prompt: 'Please provide a concise executive summary of this document, highlighting the key points, requirements, and takeaways.',
  },
  {
    icon: ListChecks,
    label: 'Generate compliance checklist',
    prompt: 'Extract an actionable, step-by-step compliance checklist from this document with checkbox action items.',
  },
  {
    icon: FileCheck2,
    label: 'Improve tone & clarity',
    prompt: 'Review the document text and suggest refined wording with professional corporate tone, fixing any grammatical awkwardness.',
  },
  {
    icon: TableProperties,
    label: 'Create executive table breakdown',
    prompt: 'Format the primary data, roles, or operational schedules in this document into a structured HTML table with headers.',
  },
]

export const DocumentAISidePanel: React.FC<Props> = ({
  documentTitle,
  documentContent,
  documentCategory,
  onClose,
  onInsertContent,
}) => {
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [insertedId, setInsertedId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSend = async (textToSend?: string) => {
    const promptText = (textToSend || input).trim()
    if (!promptText || isLoading) return

    const userMsgId = `usr-${Date.now()}`
    const newMessages: MessageItem[] = [
      ...messages,
      {
        id: userMsgId,
        role: 'user',
        content: promptText,
        timestamp: Date.now(),
      },
    ]

    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    // Build plain text snippet of document for context
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = documentContent
    const plainDocText = tempDiv.innerText.slice(0, 4000)

    const systemPrompt = `You are Neurons Document AI Copilot, an expert business analyst and documentation assistant for African businesses.
Current Document Title: "${documentTitle}"
Document Category: ${documentCategory.toUpperCase()}
Document Body Excerpt:
"""
${plainDocText || 'Document is currently blank.'}
"""

Instructions:
- Provide direct, concise, high-value assistance tailored to this specific document.
- When generating tables or formatted blocks, use clean standard HTML (<table>, <tr>, <th>, <td>, <ul>, <li>, <strong>) so they can be inserted directly into the document editor.
- Always be practical, commercially rigorous, and helpful.`

    try {
      const historyPayload: AIChatMessage[] = newMessages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const response = await aiChatService.sendMessage(promptText, {
        systemPrompt,
        history: historyPayload,
        currentModule: 'documents',
      })

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: response.raw,
          timestamp: Date.now(),
          latencyMs: response.latencyMs,
        },
      ])
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unable to connect to AI engine'
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **AI Engine Notice**: ${errMsg}. Please try sending your message again.`,
          timestamp: Date.now(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleInsert = (id: string, text: string) => {
    onInsertContent(text)
    setInsertedId(id)
    setTimeout(() => setInsertedId(null), 2000)
  }

  const handleClearChat = () => {
    setMessages([])
  }

  return (
    <aside className="w-96 bg-white border-l border-neutral-200 flex flex-col h-full shrink-0 shadow-lg z-20 select-none animate-in slide-in-from-right duration-200">
      {/* 1. Header */}
      <div className="h-14 border-b border-neutral-200 px-4 flex items-center justify-between shrink-0 bg-white">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-blue-50 border border-blue-200/60 flex items-center justify-center p-1 shadow-2xs">
            <img src={aiSparklesIcon} alt="AI Copilot" className="h-4 w-4 object-contain" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-neutral-900 tracking-tight flex items-center gap-1.5">
              <span>Neurons AI</span>
              <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 text-[10px] font-mono font-medium">Docs</span>
            </h3>
            <p className="text-[10px] text-neutral-400 truncate max-w-[160px]">{documentTitle || 'Document Assistant'}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
              title="Clear Conversation"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 transition-colors cursor-pointer"
            title="Close AI Panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2. Chat / Suggestion Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 no-scrollbar bg-white">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-6">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-md mb-3">
              <Sparkles className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-neutral-900">
              Generate new content & ideas
            </h4>
            <p className="text-xs text-neutral-500 mt-1 max-w-[260px] leading-relaxed">
              Ask questions about your document, draft sections, or generate checklists and tables.
            </p>

            {/* Quick Suggestion Chips */}
            <div className="w-full mt-6 space-y-2 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono px-1">
                Suggested Actions
              </span>
              {PROMPT_SUGGESTIONS.map((item, idx) => {
                const Icon = item.icon
                return (
                  <button
                    key={idx}
                    onClick={() => handleSend(item.prompt)}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-neutral-200 bg-white hover:border-blue-400 hover:bg-blue-50/40 text-neutral-700 hover:text-neutral-900 transition-all text-xs font-medium cursor-pointer shadow-2xs group"
                  >
                    <Icon className="h-4 w-4 text-neutral-400 group-hover:text-blue-600 shrink-0 transition-colors" />
                    <span className="truncate flex-1">{item.label}</span>
                    <CornerDownLeft className="h-3 w-3 text-neutral-300 group-hover:text-blue-500 shrink-0 opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          /* Clean Google Gemini Flat Message List */
          messages.map((m) => (
            <div key={m.id} className="space-y-1.5">
              {m.role === 'user' ? (
                /* User Prompt: Soft pill in upper right */
                <div className="flex justify-end">
                  <div className="bg-[#e8f0fe] text-[#1f1f1f] px-3.5 py-1.5 rounded-2xl text-xs font-medium max-w-[85%] leading-relaxed select-text shadow-2xs">
                    {m.content}
                  </div>
                </div>
              ) : (
                /* AI Response: Flat, no bubble, clean text with sparkle icon & actions */
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-1.5 text-blue-600">
                    <img src={aiSparklesIcon} alt="" className="h-3.5 w-3.5 object-contain" />
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-neutral-400">Neurons AI</span>
                  </div>

                  <div className="text-xs text-[#1f1f1f] leading-relaxed whitespace-pre-wrap select-text font-normal">
                    {m.content}
                  </div>

                  {/* Action Ribbon: Insert in Doc, Copy, Latency */}
                  <div className="flex items-center gap-3 pt-1 text-[11px] text-neutral-400 select-none">
                    <button
                      onClick={() => handleInsert(m.id, m.content)}
                      className="inline-flex items-center gap-1 text-neutral-600 hover:text-blue-600 transition-colors cursor-pointer font-medium hover:bg-neutral-100 px-1.5 py-0.5 rounded"
                      title="Insert directly into document"
                    >
                      {insertedId === m.id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span className="text-emerald-600 font-semibold">Inserted</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle className="h-3 w-3" />
                          <span>Insert in Doc</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleCopy(m.id, m.content)}
                      className="inline-flex items-center gap-1 text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer hover:bg-neutral-100 px-1.5 py-0.5 rounded"
                      title="Copy response"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    {m.latencyMs !== undefined && (
                      <span className="font-mono text-[10px] text-neutral-400 ml-auto">{m.latencyMs}ms</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {/* Flat Google Docs Collecting Info / Generating Indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-[#444746] py-2 animate-pulse">
            <div className="relative h-5 w-5 flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600 absolute" />
              <img src={aiSparklesIcon} alt="" className="h-2 w-2 object-contain" />
            </div>
            <span>Collecting info...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Bottom Input Box */}
      <div className="p-3 border-t border-neutral-200 bg-white shrink-0">
        <div className="relative flex items-end gap-1.5 rounded-2xl border border-neutral-200 bg-neutral-50/80 p-1.5 focus-within:bg-white focus-within:border-neutral-400 focus-within:ring-2 focus-within:ring-neutral-900/5 transition-all">
          <textarea
            ref={textareaRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI about this document..."
            className="w-full resize-none bg-transparent px-2.5 py-1 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none max-h-28"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="h-7 w-7 rounded-xl bg-neutral-900 text-white flex items-center justify-center hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer shadow-xs"
            title="Send (Enter)"
          >
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </button>
        </div>
        <p className="text-[10px] text-neutral-400 text-center mt-1.5">
          Press <kbd className="font-mono bg-neutral-100 px-1 py-0.5 rounded border border-neutral-200 text-neutral-600">Enter</kbd> to send, <kbd className="font-mono bg-neutral-100 px-1 py-0.5 rounded border border-neutral-200 text-neutral-600">Shift+Enter</kbd> for new line
        </p>
      </div>
    </aside>
  )
}
