import React, { useEffect, useState } from 'react'
import {
  Cloud,
  CloudOff,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  PanelLeftOpen,
  Building2,
} from 'lucide-react'
import type { ActiveModule } from './Sidebar'
import { db } from '@/db/localDb'
import { useAuth } from '@/context/AuthContext'
import { syncEngine, type SyncStats } from '@/db/syncEngine'

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
    title: 'Documents & Word Processor',
    subtitle: 'Standard operating procedures, store policies, contracts, reports & paginated docs',
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
  const { user } = useAuth()
  const meta = MODULE_METADATA[activeModule] || MODULE_METADATA.documents
  const [syncStats, setSyncStats] = useState<SyncStats>(syncEngine.getStats())
  const [pendingCount, setPendingCount] = useState<number>(0)

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((stats) => {
      setSyncStats(stats)
    })

    const updatePending = async () => {
      const count = await syncEngine.countPending()
      setPendingCount(count)
    }

    updatePending()
    const interval = setInterval(updatePending, 5000)

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  const handleManualSync = async () => {
    await syncEngine.triggerSync()
    const count = await syncEngine.countPending()
    setPendingCount(count)
  }

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
      userProfile: await db.userProfile.toArray(),
    }
    if (typeof window !== 'undefined' && window.electronAPI) {
      await window.electronAPI.exportData(JSON.stringify(backupData, null, 2))
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
      style={{ WebkitAppRegion: 'drag' }}
    >
      {/* Title & Sidebar Toggle */}
      <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' }}>
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
          <h2 className="text-sm font-bold text-neutral-900 tracking-tight leading-tight">{meta.title}</h2>
          <p className="text-[11px] text-neutral-500 hidden sm:block truncate max-w-md leading-tight">{meta.subtitle}</p>
        </div>
      </div>

      {/* Global Actions */}
      <div className="flex items-center h-full gap-2" style={{ WebkitAppRegion: 'no-drag' }}>
        {/* Active Company Name Badge */}
        {user?.companyName && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200/80 text-xs font-semibold text-neutral-800">
            <Building2 className="h-3.5 w-3.5 text-neutral-500" />
            <span className="truncate max-w-[160px]">{user.companyName}</span>
          </div>
        )}

        {/* Live Sync Status Pill */}
        <button
          onClick={handleManualSync}
          disabled={syncStats.isSyncing}
          className={`h-7.5 inline-flex items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-all shadow-xs cursor-pointer select-none ${
            syncStats.isSyncing
              ? 'border-blue-200 bg-blue-50 text-blue-700'
              : syncStats.lastError
              ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
              : !syncStats.isOnline
              ? 'border-neutral-200 bg-neutral-50 text-neutral-600'
              : pendingCount > 0
              ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          }`}
          title={
            syncStats.lastError
              ? `Sync Error: ${syncStats.lastError.message} (Click to retry)`
              : syncStats.isSyncing
              ? 'Syncing changes with cloud...'
              : !syncStats.isOnline
              ? 'Offline mode (Changes saved locally)'
              : pendingCount > 0
              ? `${pendingCount} pending items to sync (Click to sync now)`
              : 'Cloud sync up to date'
          }
        >
          {syncStats.isSyncing ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-600 shrink-0" />
              <span className="hidden sm:inline">Syncing...</span>
            </>
          ) : syncStats.lastError ? (
            <>
              <AlertCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
              <span className="hidden sm:inline">Sync Error</span>
            </>
          ) : !syncStats.isOnline ? (
            <>
              <CloudOff className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
              <span className="hidden sm:inline">Offline</span>
            </>
          ) : pendingCount > 0 ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span className="hidden sm:inline">{pendingCount} Pending</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="hidden sm:inline">Synced</span>
            </>
          )}
        </button>

        {/* Export Backup */}
        <button
          onClick={handleExportBackup}
          className="h-7.5 inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 hover:text-black transition-all shadow-xs cursor-pointer select-none"
          title="Export offline JSON backup"
        >
          <Cloud className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
          <span className="hidden sm:inline leading-none">Backup</span>
        </button>
      </div>
    </header>
  )
}
