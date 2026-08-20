import React from 'react'
import {
  SquarePen,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'

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
}) => {
  const handleNewActionClick = () => {
    if (onNewAction) {
      onNewAction()
    } else {
      onSelectModule('chat')
    }
  }

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

          <button
            onClick={handleNewActionClick}
            className="p-2 rounded-lg bg-neutral-200 hover:bg-neutral-300 text-neutral-900 transition-colors shadow-xs cursor-pointer"
            title="New Document"
          >
            <SquarePen className="h-4 w-4" />
          </button>

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
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#10a37f] text-white text-xs font-semibold cursor-pointer shadow-xs"
          title="Akhimien Clement (Free)"
        >
          AC
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
          <h1 className="text-base font-semibold text-neutral-900 tracking-tight">
            Neurons
          </h1>

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

        {/* "New chat" / "New document" button */}
        <div className="px-3 py-1.5">
          <button
            onClick={handleNewActionClick}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-neutral-200/80 hover:bg-neutral-200 text-neutral-900 text-sm font-medium transition-all text-left shadow-2xs cursor-pointer"
          >
            <SquarePen className="h-4 w-4 text-neutral-700" />
            <span>New chat</span>
          </button>
        </div>

        {/* Complete Visible Navigation List */}
        <div className="px-3 py-1 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeModule === item.id
            return (
              <button
                key={item.id}
                onClick={() => onSelectModule(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left cursor-pointer ${
                  isActive
                    ? 'bg-neutral-200/90 text-black font-semibold shadow-2xs'
                    : 'text-neutral-700 hover:bg-neutral-200/60 hover:text-neutral-900'
                }`}
              >
                <img src={item.icon} alt={item.label} className="h-4 w-4 object-contain shrink-0" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-neutral-200 bg-[#f9f9f9]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#10a37f] text-white text-xs font-semibold shrink-0">
              AC
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-neutral-900 truncate leading-tight">
                Akhimien Cleme...
              </div>
              <div className="text-xs text-neutral-500 leading-tight">
                Free
              </div>
            </div>
          </div>

          <button
            onClick={() => openWebsite('https://neurons.com')}
            className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-100 hover:text-black transition-all shrink-0 shadow-2xs cursor-pointer"
            title="Upgrade plan on neurons.com"
          >
            Upgrade
          </button>
        </div>
      </div>
    </aside>
  )
}
