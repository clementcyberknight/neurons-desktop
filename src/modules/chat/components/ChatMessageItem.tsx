import React from 'react'
import { Copy, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { SchemaRenderer } from '@/components/ai/SchemaRenderer'
import type { ChatMessage } from '@/types/database'

interface ChatMessageItemProps {
  message: ChatMessage
  copiedId: string | null
  onCopy: (text: string, id: string) => void
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  copiedId,
  onCopy,
}) => {
  const isUser = message.role === 'user'

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}>
      <div
        className={`max-w-[85%] text-sm leading-relaxed ${
          isUser
            ? 'bg-[#f4f4f4] text-neutral-900 px-4 py-3 rounded-2xl rounded-br-xs'
            : 'bg-transparent text-neutral-900 px-1 py-1'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="space-y-3">
            {message.parsedJson ? (
              <SchemaRenderer schema={message.parsedJson} rawText={message.content} />
            ) : (
              <div className="prose prose-sm text-neutral-900 break-words leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Message Action Bar for Assistant Responses */}
      {!isUser && (
        <div className="flex items-center gap-1 mt-1.5 px-1 text-neutral-400">
          <button
            type="button"
            onClick={() => onCopy(message.content, message.id)}
            className="p-1 rounded-md hover:bg-neutral-100 hover:text-neutral-700 transition-colors cursor-pointer"
            title="Copy response"
          >
            {copiedId === message.id ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
          {message.latencyMs && (
            <span className="text-[10px] font-mono text-neutral-400 ml-1">
              {message.latencyMs}ms
            </span>
          )}
        </div>
      )}
    </div>
  )
}
