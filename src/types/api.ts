import type {
  DocumentRecord,
  POSTransaction,
  InventoryItem,
  StaffMember,
  ShiftEntry,
  FinanceRecord,
  CustomerDebtRecord,
  SupplierPayableRecord,
  BankAccountRecord,
  InvoiceRecord,
  TaskRecord,
  AlertRecord,
  ChatSession,
  UserProfile,
  AppSettings,
} from './database'

export type ApiSuccess<T> = {
  status: 'success'
  data: T
  requestId: string
  timestamp: number
}

export type ApiError = {
  status: 'error'
  error: {
    code: ApiErrorCode | string
    message: string
    details?: unknown
  }
  requestId: string
  timestamp: number
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'IDEMPOTENCY_KEY_MISSING'
  | 'IDEMPOTENCY_CONFLICT'
  | 'INTERNAL_ERROR'
  | 'PAYLOAD_TOO_LARGE'

export interface InventoryDelta {
  itemId: string
  delta: number
}

export interface SyncMutations {
  documents?: DocumentRecord[]
  transactions?: POSTransaction[]
  inventory?: InventoryItem[]
  inventoryDeltas?: InventoryDelta[]
  staff?: StaffMember[]
  shifts?: ShiftEntry[]
  finance?: FinanceRecord[]
  customerDebts?: CustomerDebtRecord[]
  supplierPayables?: SupplierPayableRecord[]
  bankAccounts?: BankAccountRecord[]
  invoices?: InvoiceRecord[]
  tasks?: TaskRecord[]
  alerts?: AlertRecord[]
  chatSessions?: ChatSession[]
  userProfiles?: UserProfile[]
  appSettings?: AppSettings[]
}

export interface SyncPushPayload {
  orgId: string
  clientId: string
  lastSyncedAt: number
  mutations: SyncMutations
}

export interface SyncPushResult {
  syncedAt: number
  acceptedCount: number
  rejectedCount: number
  deltasApplied: number
}

export interface SyncPullPayload {
  orgId: string
  lastSyncedAt: number
}

export interface SyncPullData {
  changes: {
    documents: DocumentRecord[]
    transactions: POSTransaction[]
    inventory: InventoryItem[]
    staff: StaffMember[]
    shifts: ShiftEntry[]
    finance: FinanceRecord[]
    customerDebts: CustomerDebtRecord[]
    supplierPayables: SupplierPayableRecord[]
    bankAccounts: BankAccountRecord[]
    invoices: InvoiceRecord[]
    tasks: TaskRecord[]
    alerts: AlertRecord[]
    chatSessions: ChatSession[]
    userProfiles: UserProfile[]
    appSettings: AppSettings[]
  }
  serverTime: number
}
