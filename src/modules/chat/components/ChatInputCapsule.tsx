import React, { useRef, useEffect } from 'react'
import { Plus, Brain, Mic, ArrowUp, Maximize2, Minimize2 } from 'lucide-react'

interface ChatInputCapsuleProps {
  input: string
  setInput: (val: string) => void
  loading: boolean
  thinkMode: boolean
  setThinkMode: React.Dispatch<React.SetStateAction<boolean>>
  isExpanded: boolean
  setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>
  onSend: (text?: string) => void
  placeholder?: string
  autoFocus?: boolean
  showDisclaimer?: boolean
}

export const ChatInputCapsule: React.FC<ChatInputCapsuleProps> = ({
  input,
  setInput,
  loading,
  thinkMode,
  setThinkMode,
  isExpanded,
  setIsExpanded,
  onSend,
  placeholder = 'Ask anything',
  autoFocus = false,
  showDisclaimer = true,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-adjust height for multiline input
  useEffect(() => {
    if (!textareaRef.current) return
    if (isExpanded) {
      textareaRef.current.style.height = '240px'
    } else {
      textareaRef.current.style.height = 'auto'
      const sHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = `${Math.min(Math.max(sHeight, 24), 160)}px`
    }
  }, [input, isExpanded])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div className="w-full">
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
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className={`w-full bg-transparent text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none resize-none no-scrollbar leading-relaxed ${
              isExpanded ? 'h-[230px] overflow-y-auto' : 'max-h-[160px]'
            }`}
            autoFocus={autoFocus}
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
                  ? 'bg-blue-100 text-blue-700 font-semibold'
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
              onClick={() => onSend()}
              disabled={!input.trim() || loading}
              className={`h-8 w-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                input.trim() && !loading
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

      {showDisclaimer && (
        <div className="text-center text-[11px] text-neutral-400 mt-2 select-none">
          Neurons can make mistakes. Check important info.
        </div>
      )}
    </div>
  )
}
