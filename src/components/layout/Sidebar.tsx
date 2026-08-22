import React, { useEffect } from 'react'
import {
  SquarePen,
  PanelLeftClose,
  PanelLeftOpen,
  History,
  Clock,
  LogOut,
  Cpu,
  Cloud,
} from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/localDb'
import { initializeSeedDataIfEmpty } from '@/db/seedData'
import { useAuth } from '@/context/AuthContext'

// Internal Icons Pack (Offline-First)
import iconDocument from '@/assets/icons-pack/File-Folder--Streamline-Plump.png'
import iconInventory from '@/assets/icons-pack/Shipping-Box-2--Streamline-Plump.png'
import iconPos from '@/assets/icons-pack/Cashier-Machine-2--Streamline-Plump.png'
import iconFinance from '@/assets/icons-pack/Money-Trend--Streamline-Plump.png'
import iconSales from '@/assets/icons-pack/Shopping-Cart-2--Streamline-Plump.png'
import iconStaff from '@/assets/icons-pack/User-Team-Group-Member--Streamline-Plump.png'
import iconTask from '@/assets/icons-pack/List-To-Do-Tasks-Checklist--Streamline-Plump.png'
import iconExpense from '@/assets/icons-pack/Receipt--Streamline-Plump.png'
import iconCashbook from '@/assets/icons-pack/Cashier--Streamline-Plump.png'
import { openWebsite } from '@/utils/openWebsite'

export type ActiveModule =
  | 'chat'
  | 'documents'
  | 'inventory'
  | 'pos'
  | 'finance'
  | 'sales'
  | 'staff'
  | 'tasks'
  | 'expense'
  | 'cashbook'

interface Props {
  activeModule: ActiveModule
  onSelectModule: (module: ActiveModule) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  onNewAction?: () => void
  activeChatId?: string | null
  chatViewMode?: 'history_list' | 'chat'
  onSelectChatSession?: (id: string | null) => void
  onOpenHistory?: () => void
}

const NAV_ITEMS: { id: ActiveModule; label: string; icon: string }[] = [
  { id: 'documents', label: 'Documents', icon: iconDocument },
  { id: 'inventory', label: 'Inventory', icon: iconInventory },
  { id: 'pos', label: 'Point of Sales', icon: iconPos },
  { id: 'finance', label: 'Finance', icon: iconFinance },
  { id: 'sales', label: 'Sales', icon: iconSales },
  { id: 'staff', label: 'Staffs', icon: iconStaff },
  { id: 'tasks', label: 'Task', icon: iconTask },
  { id: 'expense', label: 'Expense', icon: iconExpense },
  { id: 'cashbook', label: 'Cashbook', icon: iconCashbook },
]

export const Sidebar: React.FC<Props> = ({
  activeModule,
  onSelectModule,
  isCollapsed = false,
  onToggleCollapse,
  onNewAction,
  activeChatId,
  chatViewMode = 'chat',
  onSelectChatSession,
  onOpenHistory,
}) => {
  const { user, logout } = useAuth()

  // Query chats and task history from Dexie database
  const chatSessions =
    useLiveQuery(() => db.chatSessions.orderBy('lastMessageAt').reverse().limit(30).toArray()) || []

  useEffect(() => {
    // Ensure chat sessions exist on load
    initializeSeedDataIfEmpty().catch(console.error)
  }, [])

  const handleNewActionClick = () => {
    if (onNewAction) {
      onNewAction()
    } else {
      onSelectModule('chat')
    }
  }

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join('')
    : 'NB'

  if (isCollapsed) {
    return (
      <aside className="w-14 shrink-0 flex flex-col justify-between border-r border-neutral-200 bg-[#f9f9f9] text-neutral-800 h-screen select-none py-3 items-center">
        <div className="flex flex-col items-center gap-2.5">
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-lg hover:bg-neutral-200 text-neutral-600 transition-colors cursor-pointer"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="h-5 w-5" />
          </button>

          {(() => {
            const isNewChatActive = activeModule === 'chat' && (activeChatId === null || activeChatId === undefined)
            return (
              <button
                onClick={handleNewActionClick}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  isNewChatActive
                    ? 'bg-neutral-200 ring-1 ring-neutral-300 text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:bg-neutral-200/70 hover:text-neutral-900'
                }`}
                title="New chat"
              >
                <SquarePen className="h-4 w-4" />
              </button>
            )
          })()}

          <div className="w-8 h-px bg-neutral-200 my-1" />

          {/* Quick Module Icons */}
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectModule(item.id)}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                activeModule === item.id ? 'bg-neutral-200 ring-1 ring-neutral-300' : 'hover:bg-neutral-200/70'
              }`}
              title={item.label}
            >
              <img src={item.icon} alt={item.label} className="h-4 w-4 object-contain" />
            </button>
          ))}
        </div>

        {/* User Avatar */}
        <div
          onClick={logout}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white text-xs font-semibold cursor-pointer shadow-xs"
          title={`${user?.fullName || 'User'} (${user?.companyName || 'Business'}) • Click to Logout`}
        >
          {initials}
        </div>
      </aside>
    )
  }

  return (
    <aside className="w-64 shrink-0 flex flex-col justify-between border-r border-neutral-200 bg-[#f9f9f9] text-neutral-800 h-screen select-none font-sans">
      {/* Top Header & Actions */}
      <div className="flex flex-col min-h-0 flex-1 overflow-y-auto">
        {/* Neurons Header */}
        <div className="flex items-center justify-between px-3.5 h-12 pt-1">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold text-neutral-900 tracking-tight">
              Neurons
            </h1>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-black text-white">
              {user?.aiModelMode === 'cloud_api' ? 'Cloud AI' : 'Local 800MB'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1.5 rounded-lg hover:bg-neutral-200/70 text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* "New chat" button */}
        <div className="px-3 py-1.5">
          {(() => {
            const isNewChatActive = activeModule === 'chat' && chatViewMode === 'chat' && activeChatId === null
            return (
              <button
                onClick={handleNewActionClick}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left cursor-pointer ${
                  isNewChatActive
                    ? 'bg-neutral-200/90 text-black font-semibold shadow-2xs'
                    : 'text-neutral-700 hover:bg-neutral-200/60 hover:text-neutral-900 font-medium'
                }`}
              >
                <SquarePen className="h-4 w-4 text-neutral-700" />
                <span>New chat</span>
              </button>
            )
          })()}
        </div>

        {/* Module Navigation List */}
        <div className="px-3 py-1.5 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeModule === item.id
            return (
              <button
                key={item.id}
                onClick={() => onSelectModule(item.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-neutral-200/90 text-black shadow-2xs font-bold'
                    : 'text-neutral-700 hover:bg-neutral-200/60 hover:text-neutral-900'
                }`}
              >
                <img src={item.icon} alt={item.label} className="h-4 w-4 object-contain shrink-0" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>

        {/* Chats and tasks Section (Below Cashbook) */}
        <div className="pt-3.5 pb-2 px-3">
          <div className="flex items-center justify-between px-2 mb-1.5 text-neutral-500">
            <button
              onClick={() => {
                if (onOpenHistory) onOpenHistory()
                else onSelectChatSession?.(null)
              }}
              className={`text-xs font-semibold tracking-tight transition-colors cursor-pointer text-left ${
                activeModule === 'chat' && chatViewMode === 'history_list'
                  ? 'text-neutral-900 font-bold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Chats and tasks
            </button>
            <button
              onClick={() => {
                if (onOpenHistory) onOpenHistory()
                else onSelectChatSession?.(null)
              }}
              className="p-1 rounded-md hover:bg-neutral-200/70 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
              title="View all chats & tasks"
            >
              <History className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-0.5 max-h-[240px] overflow-y-auto no-scrollbar">
            {chatSessions.map((session) => {
              const isSelected = activeModule === 'chat' && chatViewMode === 'chat' && activeChatId === session.id
              return (
                <button
                  key={session.id}
                  onClick={() => {
                    onSelectChatSession?.(session.id)
                    onSelectModule('chat')
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left group cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-200/90 text-neutral-900 font-medium shadow-2xs'
                      : 'text-neutral-600 hover:bg-neutral-200/60 hover:text-neutral-900'
                  }`}
                  title={session.title}
                >
                  <span className="text-[10px] text-neutral-400 group-hover:text-neutral-600 shrink-0 select-none font-mono">○</span>
                  <span className="truncate">{session.title}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-neutral-200 bg-[#f9f9f9]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white text-xs font-bold shrink-0 shadow-2xs">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-neutral-900 truncate leading-tight">
                {user?.fullName || 'Business Admin'}
              </div>
              <div className="text-[11px] text-neutral-500 truncate leading-tight">
                {user?.companyName || 'Neurons Business'}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
            title="Sign out of workspace"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
