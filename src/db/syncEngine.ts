import { db } from './localDb'

export interface SyncStats {
  isOnline: boolean
  isSyncing: boolean
  lastSyncedAt: number | null
  pendingCount: number
}

class SyncEngine {
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
  private isSyncing = false
  private lastSyncedAt: number | null = null
  private listeners: ((stats: SyncStats) => void)[] = []

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true
        this.notify()
        this.triggerSync()
      })
      window.addEventListener('offline', () => {
        this.isOnline = false
        this.notify()
      })
    }
  }

  subscribe(listener: (stats: SyncStats) => void) {
    this.listeners.push(listener)
    listener(this.getStats())
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private notify() {
    const stats = this.getStats()
    this.listeners.forEach((l) => l(stats))
  }

  getStats(): SyncStats {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSyncedAt: this.lastSyncedAt,
      pendingCount: 0, // calculated dynamically during sync
    }
  }

  async countPending(): Promise<number> {
    try {
      const [docs, txs, inv, staff, shifts, fin, tasks, alerts] = await Promise.all([
        db.documents.where('synced').equals(0).count(),
        db.transactions.where('synced').equals(0).count(),
        db.inventory.where('synced').equals(0).count(),
        db.staff.where('synced').equals(0).count(),
        db.shifts.where('synced').equals(0).count(),
        db.finance.where('synced').equals(0).count(),
        db.tasks.where('synced').equals(0).count(),
        db.alerts.where('synced').equals(0).count(),
      ])
      return docs + txs + inv + staff + shifts + fin + tasks + alerts
    } catch {
      return 0
    }
  }

  async triggerSync(): Promise<{ success: boolean; syncedItems: number }> {
    if (!this.isOnline || this.isSyncing) {
      return { success: false, syncedItems: 0 }
    }

    this.isSyncing = true
    this.notify()

    try {
      // Simulate remote cloud sync batch processing
      await new Promise((r) => setTimeout(r, 1200))

      // Mark all local pending items as synced
      await db.transaction('rw', [
        db.documents,
        db.transactions,
        db.inventory,
        db.staff,
        db.shifts,
        db.finance,
        db.tasks,
        db.alerts,
      ], async () => {
        await Promise.all([
          db.documents.where('synced').equals(0).modify({ synced: 1 }),
          db.transactions.where('synced').equals(0).modify({ synced: 1 }),
          db.inventory.where('synced').equals(0).modify({ synced: 1 }),
          db.staff.where('synced').equals(0).modify({ synced: 1 }),
          db.shifts.where('synced').equals(0).modify({ synced: 1 }),
          db.finance.where('synced').equals(0).modify({ synced: 1 }),
          db.tasks.where('synced').equals(0).modify({ synced: 1 }),
          db.alerts.where('synced').equals(0).modify({ synced: 1 }),
        ])
      })

      this.lastSyncedAt = Date.now()
      return { success: true, syncedItems: 1 }
    } catch (err) {
      console.error('Sync failed:', err)
      return { success: false, syncedItems: 0 }
    } finally {
      this.isSyncing = false
      this.notify()
    }
  }
}

export const syncEngine = new SyncEngine()
