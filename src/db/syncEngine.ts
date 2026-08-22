import { db } from './localDb'
import { apiClient, ApiClientError } from '@/services/apiClient'
import type {
  SyncPushPayload,
  SyncPullPayload,
  SyncMutations,
} from '@/types/api'

export interface SyncError {
  message: string
  code: string
  requestId?: string
  timestamp: number
}

export interface SyncStats {
  isOnline: boolean
  isSyncing: boolean
  lastSyncedAt: number | null
  pendingCount: number
  lastError: SyncError | null
}

export interface SyncResult {
  success: boolean
  syncedItems: number
  error?: SyncError
}

class SyncEngine {
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true
  private isSyncing = false
  private lastSyncedAt: number | null = null
  private lastError: SyncError | null = null
  private listeners: ((stats: SyncStats) => void)[] = []

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true
        this.lastError = null
        this.notify()
        this.triggerSync()
      })
      window.addEventListener('offline', () => {
        this.isOnline = false
        this.notify()
      })
    }
  }

  subscribe(listener: (stats: SyncStats) => void): () => void {
    this.listeners.push(listener)
    listener(this.getStats())
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private notify(): void {
    const stats = this.getStats()
    for (const listener of this.listeners) {
      try {
        listener(stats)
      } catch (err) {
        console.error('[SyncEngine] Error in stats subscriber listener:', err)
      }
    }
  }

  getStats(): SyncStats {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSyncedAt: this.lastSyncedAt,
      pendingCount: 0,
      lastError: this.lastError,
    }
  }

  async countPending(): Promise<number> {
    try {
      const [
        docs,
        txs,
        inv,
        staff,
        shifts,
        fin,
        tasks,
        alerts,
        debts,
        payables,
        banks,
        invoices,
        chat,
        audit,
      ] = await Promise.all([
        db.documents.where('synced').equals(0).count(),
        db.transactions.where('synced').equals(0).count(),
        db.inventory.where('synced').equals(0).count(),
        db.staff.where('synced').equals(0).count(),
        db.shifts.where('synced').equals(0).count(),
        db.finance.where('synced').equals(0).count(),
        db.tasks.where('synced').equals(0).count(),
        db.alerts.where('synced').equals(0).count(),
        db.customerDebts.where('synced').equals(0).count(),
        db.supplierPayables.where('synced').equals(0).count(),
        db.bankAccounts.where('synced').equals(0).count(),
        db.invoices.where('synced').equals(0).count(),
        db.chatSessions.where('synced').equals(0).count(),
        db.auditLogs.count(),
      ])
      return (
        docs +
        txs +
        inv +
        staff +
        shifts +
        fin +
        tasks +
        alerts +
        debts +
        payables +
        banks +
        invoices +
        chat +
        audit
      )
    } catch (err) {
      console.error('[SyncEngine] Error counting pending items:', err)
      return 0
    }
  }

  private async getOrgId(): Promise<string> {
    const activeUserId = localStorage.getItem('neurons_active_user_id')
    if (activeUserId) {
      const profile = await db.userProfile.get(activeUserId)
      if (profile?.id) return profile.id
    }
    const anyProfile = await db.userProfile.toCollection().first()
    if (anyProfile?.id) return anyProfile.id
    return 'default-org'
  }

  async triggerSync(): Promise<SyncResult> {
    if (!this.isOnline) {
      const offlineError: SyncError = {
        message: 'Device is offline. Changes saved locally in Dexie database.',
        code: 'OFFLINE',
        timestamp: Date.now(),
      }
      this.lastError = offlineError
      this.notify()
      return { success: false, syncedItems: 0, error: offlineError }
    }

    if (this.isSyncing) {
      return { success: false, syncedItems: 0 }
    }

    this.isSyncing = true
    this.notify()

    try {
      const orgId = await this.getOrgId()
      let clientId = localStorage.getItem('neurons_client_id')
      if (!clientId) {
        clientId = `client_${crypto.randomUUID()}`
        localStorage.setItem('neurons_client_id', clientId)
      }

      const lastSynced = this.lastSyncedAt || 0

      // 1. Gather all pending local mutations with synced === 0
      const [
        pendingDocs,
        pendingTxs,
        pendingInv,
        pendingStaff,
        pendingShifts,
        pendingFin,
        pendingTasks,
        pendingAlerts,
        pendingDebts,
        pendingPayables,
        pendingBanks,
        pendingInvoices,
        pendingChat,
      ] = await Promise.all([
        db.documents.where('synced').equals(0).toArray(),
        db.transactions.where('synced').equals(0).toArray(),
        db.inventory.where('synced').equals(0).toArray(),
        db.staff.where('synced').equals(0).toArray(),
        db.shifts.where('synced').equals(0).toArray(),
        db.finance.where('synced').equals(0).toArray(),
        db.tasks.where('synced').equals(0).toArray(),
        db.alerts.where('synced').equals(0).toArray(),
        db.customerDebts.where('synced').equals(0).toArray(),
        db.supplierPayables.where('synced').equals(0).toArray(),
        db.bankAccounts.where('synced').equals(0).toArray(),
        db.invoices.where('synced').equals(0).toArray(),
        db.chatSessions.where('synced').equals(0).toArray(),
      ])

      const mutations: SyncMutations = {}
      if (pendingDocs.length > 0) mutations.documents = pendingDocs
      if (pendingTxs.length > 0) mutations.transactions = pendingTxs
      if (pendingInv.length > 0) mutations.inventory = pendingInv
      if (pendingStaff.length > 0) mutations.staff = pendingStaff
      if (pendingShifts.length > 0) mutations.shifts = pendingShifts
      if (pendingFin.length > 0) mutations.finance = pendingFin
      if (pendingTasks.length > 0) mutations.tasks = pendingTasks
      if (pendingAlerts.length > 0) mutations.alerts = pendingAlerts
      if (pendingDebts.length > 0) mutations.customerDebts = pendingDebts
      if (pendingPayables.length > 0) mutations.supplierPayables = pendingPayables
      if (pendingBanks.length > 0) mutations.bankAccounts = pendingBanks
      if (pendingInvoices.length > 0) mutations.invoices = pendingInvoices
      if (pendingChat.length > 0) mutations.chatSessions = pendingChat

      const hasPending = Object.keys(mutations).length > 0
      let totalSynced = 0

      // 2. Push local mutations to backend if any exist
      if (hasPending) {
        const pushPayload: SyncPushPayload = {
          orgId,
          clientId,
          lastSyncedAt: lastSynced,
          mutations,
        }

        const pushResult = await apiClient.pushSync(pushPayload)
        totalSynced += pushResult.acceptedCount

        // Mark pushed items as synced in Dexie
        await db.transaction(
          'rw',
          [
            db.documents,
            db.transactions,
            db.inventory,
            db.staff,
            db.shifts,
            db.finance,
            db.tasks,
            db.alerts,
            db.customerDebts,
            db.supplierPayables,
            db.bankAccounts,
            db.invoices,
            db.chatSessions,
          ],
          async () => {
            await Promise.all([
              db.documents.where('synced').equals(0).modify({ synced: 1 }),
              db.transactions.where('synced').equals(0).modify({ synced: 1 }),
              db.inventory.where('synced').equals(0).modify({ synced: 1 }),
              db.staff.where('synced').equals(0).modify({ synced: 1 }),
              db.shifts.where('synced').equals(0).modify({ synced: 1 }),
              db.finance.where('synced').equals(0).modify({ synced: 1 }),
              db.tasks.where('synced').equals(0).modify({ synced: 1 }),
              db.alerts.where('synced').equals(0).modify({ synced: 1 }),
              db.customerDebts.where('synced').equals(0).modify({ synced: 1 }),
              db.supplierPayables.where('synced').equals(0).modify({ synced: 1 }),
              db.bankAccounts.where('synced').equals(0).modify({ synced: 1 }),
              db.invoices.where('synced').equals(0).modify({ synced: 1 }),
              db.chatSessions.where('synced').equals(0).modify({ synced: 1 }),
            ])
          }
        )
      }

      // 3. Flush and empty local audit activity logs to cloud
      const pendingAuditLogs = await db.auditLogs.toArray()
      if (pendingAuditLogs.length > 0) {
        try {
          await apiClient.recordAuditBatch({
            orgId,
            logs: pendingAuditLogs.map((log) => ({
              id: log.id,
              userId: log.userId,
              userName: log.userName,
              action: log.action,
              entityType: log.entityType,
              entityId: log.entityId,
              details: log.details,
              createdAt: log.createdAt,
            })),
          })
          const logIds = pendingAuditLogs.map((l) => l.id)
          await db.auditLogs.bulkDelete(logIds)
        } catch (auditErr) {
          console.warn('[SyncEngine] Failed to flush audit logs to cloud, will retry on next sync:', auditErr)
        }
      }

      // 4. Pull remote deltas modified since lastSynced
      const pullPayload: SyncPullPayload = {
        orgId,
        lastSyncedAt: lastSynced,
      }

      const pullResult = await apiClient.pullSync(pullPayload)
      const { changes, serverTime } = pullResult

      await db.transaction(
        'rw',
        [
          db.documents,
          db.transactions,
          db.inventory,
          db.staff,
          db.shifts,
          db.finance,
          db.tasks,
          db.alerts,
          db.customerDebts,
          db.supplierPayables,
          db.bankAccounts,
          db.invoices,
          db.chatSessions,
        ],
        async () => {
          if (changes.documents?.length) {
            await db.documents.bulkPut(changes.documents.map((d) => ({ ...d, synced: 1 as const })))
          }
          if (changes.transactions?.length) {
            await db.transactions.bulkPut(changes.transactions.map((t) => ({ ...t, synced: 1 as const })))
          }
          if (changes.inventory?.length) {
            await db.inventory.bulkPut(changes.inventory.map((i) => ({ ...i, synced: 1 as const })))
          }
          if (changes.staff?.length) {
            await db.staff.bulkPut(changes.staff.map((s) => ({ ...s, synced: 1 as const })))
          }
          if (changes.shifts?.length) {
            await db.shifts.bulkPut(changes.shifts.map((s) => ({ ...s, synced: 1 as const })))
          }
          if (changes.finance?.length) {
            await db.finance.bulkPut(changes.finance.map((f) => ({ ...f, synced: 1 as const })))
          }
          if (changes.tasks?.length) {
            await db.tasks.bulkPut(changes.tasks.map((t) => ({ ...t, synced: 1 as const })))
          }
          if (changes.alerts?.length) {
            await db.alerts.bulkPut(changes.alerts.map((a) => ({ ...a, synced: 1 as const })))
          }
          if (changes.customerDebts?.length) {
            await db.customerDebts.bulkPut(changes.customerDebts.map((cd) => ({ ...cd, synced: 1 as const })))
          }
          if (changes.supplierPayables?.length) {
            await db.supplierPayables.bulkPut(changes.supplierPayables.map((sp) => ({ ...sp, synced: 1 as const })))
          }
          if (changes.bankAccounts?.length) {
            await db.bankAccounts.bulkPut(changes.bankAccounts.map((ba) => ({ ...ba, synced: 1 as const })))
          }
          if (changes.invoices?.length) {
            await db.invoices.bulkPut(changes.invoices.map((inv) => ({ ...inv, synced: 1 as const })))
          }
          if (changes.chatSessions?.length) {
            await db.chatSessions.bulkPut(changes.chatSessions.map((cs) => ({ ...cs, synced: 1 as const })))
          }
        }
      )

      this.lastSyncedAt = serverTime
      this.lastError = null
      return { success: true, syncedItems: totalSynced }
    } catch (err) {
      const syncError: SyncError = {
        message: err instanceof Error ? err.message : 'Unknown sync failure',
        code: err instanceof ApiClientError ? err.code : 'SYNC_FAILED',
        requestId: err instanceof ApiClientError ? err.requestId : undefined,
        timestamp: Date.now(),
      }

      this.lastError = syncError
      console.error('[SyncEngine] Sync execution error:', syncError, err)
      return { success: false, syncedItems: 0, error: syncError }
    } finally {
      this.isSyncing = false
      this.notify()
    }
  }
}

export const syncEngine = new SyncEngine()
