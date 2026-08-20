import React from 'react'
import {
  Sparkles,
  Search,
  Bell,
  Download,
  ShieldCheck,
  Moon,
  Sun,
  LayoutGrid,
} from 'lucide-react'
import type { ActiveModule } from './Sidebar'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/localDb'

interface Props {
  activeModule: ActiveModule
  onOpenCopilot: () => void
  searchQuery: string
  onSearchChange: (q: string) => void
}

const MODULE_METADATA: Record<ActiveModule, { title: string; subtitle: string }> = {
  documents: {
    title: 'Documents & SOPs',
    subtitle: 'Notion-style rich markdown workspace, store operating procedures & AI reports',
  },
  pos: {
    title: 'Point of Sale & Cashier Reconciliation',
    subtitle: 'Checkout terminal, discount overrides audit & fraud anomaly monitor',
  },
  inventory: {
    title: 'Warehouse & Stock Inventory',
    subtitle: 'Stock tracking across Zone A–D with autonomous SKU distribution charts',
  },
  staff: {
    title: 'Staff & Shift Schedulers',
    subtitle: 'Employee directory, payroll rate calculation & weekly rota management',
  },
  finance: {
    title: 'Finance & P&L Analytics',
    subtitle: 'Daily turnover, expenditure logs & gross profit variance reports',
  },
  tasks: {
    title: 'Kanban Task Board',
    subtitle: 'Store action items, managerial tickets & AI-generated follow-up tasks',
  },
}

export const Header: React.FC<Props> = ({
  activeModule,
  onOpenCopilot,
  searchQuery,
  onSearchChange,
}) => {
  const meta = MODULE_METADATA[activeModule]
  const unreadAlerts = useLiveQuery(() => db.alerts.where('isAcknowledged').equals(0).count()) || 0

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
      a.download = `bau-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
    }
  }

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950/40 px-6 flex items-center justify-between shrink-0 select-none">
      {/* Title & Breadcrumb */}
      <div>
        <h2 className="text-sm font-semibold text-white tracking-tight">{meta.title}</h2>
        <p className="text-[11px] text-slate-400 hidden sm:block truncate max-w-md">{meta.subtitle}</p>
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-3">
        {/* Search Bar */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search records, SKUs, staff..."
            className="h-8.5 w-56 rounded-lg bg-slate-900 border border-slate-800 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
          />
        </div>

        {/* Export Backup */}
        <button
          onClick={handleExportBackup}
          className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all shadow-sm"
          title="Export offline JSON backup"
        >
          <Download className="h-3.5 w-3.5 text-slate-400" />
          <span className="hidden lg:inline">Backup</span>
        </button>

        {/* Copilot Trigger */}
        <button
          onClick={onOpenCopilot}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-500 transition-all"
        >
          <Sparkles className="h-3.5 w-3.5 text-emerald-200 animate-pulse" />
          <span>AI Copilot</span>
        </button>
      </div>
    </header>
  )
}
