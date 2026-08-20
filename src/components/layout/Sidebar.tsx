import React from 'react'
import {
  FileText,
  CreditCard,
  Package,
  Users,
  TrendingUp,
  CheckSquare,
  Sparkles,
  Cloud,
  CloudOff,
  RefreshCw,
  Layers,
  Settings,
  Bell,
  ShieldCheck,
} from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/localDb'
import { syncEngine, type SyncStats } from '@/db/syncEngine'

export type ActiveModule = 'documents' | 'pos' | 'inventory' | 'staff' | 'finance' | 'tasks'

interface Props {
  activeModule: ActiveModule
  onSelectModule: (module: ActiveModule) => void
  onOpenCopilot: () => void
}

export const Sidebar: React.FC<Props> = ({ activeModule, onSelectModule, onOpenCopilot }) => {
  const [syncStats, setSyncStats] = React.useState<SyncStats>(syncEngine.getStats())
  const [syncing, setSyncing] = React.useState(false)

  React.useEffect(() => {
    return syncEngine.subscribe(setSyncStats)
  }, [])

  // Live queries for sidebar badge counts
  const alertCount = useLiveQuery(() => db.alerts.where('isAcknowledged').equals(0).count()) || 0
  const lowStockCount = useLiveQuery(() => db.inventory.filter((i) => i.quantity <= i.minThreshold).count()) || 0
  const pendingTasksCount = useLiveQuery(() => db.tasks.where('status').equals('todo').count()) || 0

  const handleManualSync = async () => {
    setSyncing(true)
    await syncEngine.triggerSync()
    setSyncing(false)
  }

  const menuItems = [
    {
      id: 'documents' as ActiveModule,
      name: 'Documents',
      icon: FileText,
      badge: null,
      color: 'text-indigo-400',
    },
    {
      id: 'pos' as ActiveModule,
      name: 'POS & Sales',
      icon: CreditCard,
      badge: alertCount > 0 ? `${alertCount} flag` : null,
      badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/30',
      color: 'text-emerald-400',
    },
    {
      id: 'inventory' as ActiveModule,
      name: 'Inventory',
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} low` : null,
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      color: 'text-amber-400',
    },
    {
      id: 'staff' as ActiveModule,
      name: 'Staff & Rota',
      icon: Users,
      badge: null,
      color: 'text-blue-400',
    },
    {
      id: 'finance' as ActiveModule,
      name: 'Finance & P&L',
      icon: TrendingUp,
      badge: null,
      color: 'text-teal-400',
    },
    {
      id: 'tasks' as ActiveModule,
      name: 'Task Board',
      icon: CheckSquare,
      badge: pendingTasksCount > 0 ? `${pendingTasksCount}` : null,
      badgeColor: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
      color: 'text-purple-400',
    },
  ]

  return (
    <aside className="w-64 shrink-0 flex flex-col justify-between border-r border-slate-800 bg-sidebar text-slate-300 h-screen select-none">
      {/* Brand Header */}
      <div>
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-sidebar-border bg-slate-950/20">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              BAU Copilot <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1 py-0.2 rounded border border-emerald-800/40">1.5B</span>
            </h1>
            <p className="text-[11px] text-slate-500 truncate">Offline Business OS</p>
          </div>
        </div>

        {/* AI Quick Button */}
        <div className="px-3 pt-3">
          <button
            onClick={onOpenCopilot}
            className="w-full flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-600/90 to-teal-600/90 px-3 py-2.5 text-xs font-semibold text-white shadow-md hover:from-emerald-500 hover:to-teal-500 transition-all group"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-200 animate-pulse" />
              <span>Ask AI Copilot</span>
            </div>
            <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-mono text-emerald-100 uppercase">
              Ctrl+K
            </span>
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="p-3 space-y-1">
          <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
            Modular Workspace
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeModule === item.id
            return (
              <button
                key={item.id}
                onClick={() => onSelectModule(item.id)}
                className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${item.color}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-mono font-medium ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Footer Sync & Status */}
      <div className="p-3 border-t border-sidebar-border bg-slate-950/40 space-y-2">
        {/* Offline / Cloud Status */}
        <div className="flex items-center justify-between rounded-lg bg-slate-900/80 p-2 border border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            {syncStats.isOnline ? (
              <Cloud className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <CloudOff className="h-3.5 w-3.5 text-slate-500" />
            )}
            <span className="text-[11px] text-slate-300 font-medium">
              {syncStats.isOnline ? 'Online / Local DB' : 'Offline Mode (Local)'}
            </span>
          </div>
          <button
            onClick={handleManualSync}
            disabled={syncing || !syncStats.isOnline}
            className="p-1 text-slate-400 hover:text-emerald-400 disabled:opacity-40 transition-colors"
            title="Sync with Cloud"
          >
            <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>

        {/* Hardware Compliance Badge */}
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-emerald-500" /> ADTC 2026 Ready
          </span>
          <span>RAM: &lt;1GB</span>
        </div>
      </div>
    </aside>
  )
}
