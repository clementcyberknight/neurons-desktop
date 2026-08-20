import React, { useState, useRef, useEffect } from 'react'
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  Zap,
  Cpu,
  RefreshCw,
  BarChart3,
  Calendar,
  ShieldAlert,
  Search,
  CheckCircle2,
} from 'lucide-react'
import { SchemaRenderer } from './SchemaRenderer'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  parsedJson?: Record<string, any>
  outputType?: string
  latencyMs?: number
  timestamp: number
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onActionApplied?: () => void
}

const QUICK_PROMPTS = [
  {
    icon: BarChart3,
    label: 'Pallet SKU Chart',
    prompt: 'Generate a chart showing the distribution of pallet SKU types across our warehouse zones: Zone A has 400 pallets, Zone B has 350 pallets, Zone C has 150 pallets, and Zone D has 100 pallets.',
  },
  {
    icon: ShieldAlert,
    label: 'Flag Cashier Override',
    prompt: 'Alert management: Cashier #104 processed an unauthorized 80% discount on transaction TXN_8820 without manager approval.',
  },
  {
    icon: Calendar,
    label: 'Pharmacist Rota',
    prompt: 'Create a shift schedule for next week starting 2026-09-01 for 3 pharmacists: Dr. Sarah, Mr. David, and Ms. Clara.',
  },
  {
    icon: Search,
    label: 'License Cost Audit',
    prompt: 'Investigate the audit logs and internal records to identify why Q3 software license costs exceeded our forecast by 25%.',
  },
  {
    icon: Sparkles,
    label: 'Peak Hour Advice',
    prompt: 'How can our retail store reduce cashier discrepancy losses during peak hours without slowing down checkout queues?',
  },
]

export const CopilotDrawer: React.FC<Props> = ({ isOpen, onClose, onActionApplied }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-init',
      role: 'assistant',
      content: 'Hello! I am your **offline business copilot** powered by `bau-small-1.5b`. I can analyze cashier discrepancies, generate distribution charts, build shift rotas, create audit tasks, or give operational advice with zero cloud latency.',
      timestamp: Date.now(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async (textToSend?: string) => {
    const promptText = (textToSend || input).trim()
    if (!promptText || loading) return

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: promptText,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      let response: any
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        response = await (window as any).electronAPI.generateAI({ prompt: promptText })
      } else {
        // Fallback simulation in pure browser dev mode
        await new Promise((r) => setTimeout(r, 800))
        response = {
          raw: 'Offline local engine response',
          outputType: 'CONVERSATIONAL_CHAT',
          latencyMs: 520,
        }
      }

      const assistantMsg: Message = {
        id: `msg-ai-${Date.now()}`,
        role: 'assistant',
        content: response.raw,
        parsedJson: response.parsedJson,
        outputType: response.outputType,
        latencyMs: response.latencyMs || 500,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      console.error('AI query error:', err)
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          role: 'assistant',
          content: '⚠️ Failed to connect to local inference engine. Please ensure the local runtime is active.',
          timestamp: Date.now(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-slate-950/95 text-slate-100 shadow-2xl border-l border-slate-800/80 backdrop-blur-xl transition-all duration-300">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-slate-800/80 px-4 bg-slate-900/50">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold tracking-tight text-white">BAU Copilot</h3>
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                100% Offline
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">Qwen2.5-1.5B • IQ3_XS • Peak RAM: 892MB</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user'
          return (
            <div key={msg.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[88%] rounded-2xl p-3.5 text-sm shadow-sm ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-br-none'
                    : 'bg-slate-900/90 border border-slate-800/90 rounded-bl-none text-slate-200'
                }`}
              >
                {isUser ? (
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div>
                    <SchemaRenderer
                      schema={msg.parsedJson}
                      rawText={msg.content}
                      onApplyAction={onActionApplied}
                    />
                    {msg.latencyMs && (
                      <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-slate-500 border-t border-slate-800/60 pt-1.5">
                        <span className="flex items-center gap-0.5"><Zap className="h-2.5 w-2.5 text-amber-400" /> {msg.latencyMs}ms</span>
                        <span>•</span>
                        <span>{msg.outputType || 'CONVERSATIONAL_CHAT'}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-slate-300 mt-0.5">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          )
        })}

        {loading && (
          <div className="flex gap-3 justify-start items-center text-slate-400 text-xs py-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-400">
              <Bot className="h-4 w-4 animate-pulse" />
            </div>
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full px-3 py-1.5">
              <RefreshCw className="h-3 w-3 animate-spin text-emerald-400" />
              <span>Inference in progress on CPU...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Prompt Pills */}
      <div className="border-t border-slate-800/60 px-4 py-2.5 bg-slate-950/40">
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {QUICK_PROMPTS.map((qp, idx) => {
            const Icon = qp.icon
            return (
              <button
                key={idx}
                onClick={() => handleSend(qp.prompt)}
                disabled={loading}
                className="flex items-center gap-1.5 shrink-0 rounded-full border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-xs text-slate-300 hover:border-emerald-500/40 hover:bg-slate-800/80 transition-all font-medium"
              >
                <Icon className="h-3 w-3 text-emerald-400" />
                {qp.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Input Form */}
      <div className="border-t border-slate-800/80 p-3 bg-slate-900/80">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI Copilot (e.g., 'Chart pallet inventory by zone')..."
            disabled={loading}
            className="flex-1 rounded-xl bg-slate-950/90 border border-slate-800 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 shadow-md transition-all"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
