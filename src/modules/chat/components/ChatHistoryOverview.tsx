import React, { useState, useMemo } from 'react'
import {
  Search,
  ChevronDown,
  Trash2,
  CheckSquare,
  Square,
  MessageSquare,
} from 'lucide-react'
import type { ChatSession } from '@/types/database'
import { formatRelativeTime } from '@/utils/formatTime'

interface ChatHistoryOverviewProps {
  sessions: ChatSession[]
  onOpenSession: (id: string) => void
  onStartNewChat: () => void
  onDeleteSessions: (ids: string[]) => Promise<void>
}

export const ChatHistoryOverview: React.FC<ChatHistoryOverviewProps> = ({
  sessions,
  onOpenSession,
  onStartNewChat,
  onDeleteSessions,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchInput, setShowSearchInput] = useState(false)
  const [filterType, setFilterType] = useState<'All' | 'Chats' | 'Tasks'>('All')
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const filteredSessions = useMemo(() => {
    let list = [...sessions]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter((s) => s.title.toLowerCase().includes(q))
    }
    return list
  }, [sessions, searchQuery])

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return
    await onDeleteSessions(selectedIds)
    setSelectedIds([])
    setIsSelectMode(false)
  }

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
              type="button"
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
                type="button"
                onClick={() =>
                  setFilterType((prev) =>
                    prev === 'All' ? 'Chats' : prev === 'Chats' ? 'Tasks' : 'All'
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-all cursor-pointer shadow-2xs"
              >
                <span className="text-neutral-400">Filter by</span>
                <span className="text-neutral-900 font-semibold">{filterType}</span>
                <ChevronDown className="h-3.5 w-3.5 text-neutral-400 ml-0.5" />
              </button>
            </div>

            {/* Select Button */}
            <button
              type="button"
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
              type="button"
              onClick={onStartNewChat}
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
              type="button"
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
                    onOpenSession(session.id)
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
                      className="text-neutral-400 hover:text-neutral-900 cursor-pointer"
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
              No conversation history found. Click{' '}
              <span
                className="text-neutral-900 font-semibold cursor-pointer underline"
                onClick={onStartNewChat}
              >
                New
              </span>{' '}
              to start a new chat.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
