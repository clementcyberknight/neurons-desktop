import React from 'react'
import {
  Cloud,
  PanelLeftOpen,
} from 'lucide-react'
import type { ActiveModule } from './Sidebar'
import { db } from '@/db/localDb'

interface Props {
  activeModule: ActiveModule
  searchQuery?: string
  onSearchChange?: (q: string) => void
  isSidebarCollapsed?: boolean
  onToggleSidebar?: () => void
}

const MODULE_METADATA: Record<ActiveModule, { title: string; subtitle: string }> = {
  chat: {
    title: 'AI Copilot & Business Intelligence',
    subtitle: 'Ask questions, query offline ledgers, audit till logs & analyze operations',
  },
  documents: {
    title: 'Documents & Knowledge Base',
    subtitle: 'Standard operating procedures, store policies, notes & offline memos',
  },
  inventory: {
    title: 'Inventory & Stock Management',
    subtitle: 'Warehouse stock tracking across Zone A–D with real-time SKU counts',
  },
  pos: {
    title: 'Point of Sales Terminal',
    subtitle: 'Checkout register, fast SKU catalog, discounts & receipts',
  },
  finance: {
    title: 'Finance & P&L Analytics',
    subtitle: 'Revenue, expenditure turnover & overall profit margin performance',
  },
  sales: {
    title: 'Sales Ledger & Audit Trail',
    subtitle: 'Complete POS transaction records, cashier logs & override audits',
  },
  staff: {
    title: 'Staff Operations & Shift Rota',
    subtitle: 'Employee directory, hourly rates, roles & weekly rota schedule',
  },
  tasks: {
    title: 'Task Board & SOP Checklists',
    subtitle: 'Kanban action items, priority tags & store task progression',
  },
  expense: {
    title: 'Expense Management & Outflows',
    subtitle: 'Categorized business expenditures, utility bills & wholesale restocks',
  },
  cashbook: {
    title: 'Daily Cashbook & Till Reconciliation',
    subtitle: 'Physical drawer cash count, opening float & till discrepancy audit',
  },
}

export const Header: React.FC<Props> = ({
  activeModule,
  isSidebarCollapsed = false,
  onToggleSidebar,
}) => {
  const meta = MODULE_METADATA[activeModule] || MODULE_METADATA.documents

  const handleExportBackup = async () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      documents: await db.documents.toArray(),
      inventory: await db.inventory.toArray(),
      staff: await db.staff.toArray(),
      shifts: await db.shifts.toArray(),
      transactions: await db.transactions.toArray(),
      tasks: await db.tasks.toArray(),
      finance: await db.finance.toArray(),
      alerts: await db.alerts.toArray(),
    }
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      await (window as any).electronAPI.exportData(JSON.stringify(backupData, null, 2))
    } else {
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `neurons-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
    }
  }

  return (
    <header
      className="h-12 border-b border-neutral-200 bg-white px-4 flex items-center justify-between shrink-0 select-none pr-[144px]"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      {/* Title & Sidebar Toggle */}
      <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' } as any}>
        {isSidebarCollapsed && onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
            title="Open sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        )}
        <div>
          <h2 className="text-sm font-semibold text-neutral-900 tracking-tight leading-tight">{meta.title}</h2>
          <p className="text-[11px] text-neutral-500 hidden sm:block truncate max-w-md leading-tight">{meta.subtitle}</p>
        </div>
      </div>

      {/* Global Actions - Aligned with window controls */}
      <div className="flex items-center h-full" style={{ WebkitAppRegion: 'no-drag' } as any}>
        {/* Export Backup */}
        <button
          onClick={handleExportBackup}
          className="h-7.5 inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:text-black transition-all shadow-xs cursor-pointer select-none"
          title="Export offline JSON backup"
        >
          <Cloud className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
          <span className="hidden sm:inline leading-none">Backup</span>
        </button>
      </div>
    </header>
  )
}
