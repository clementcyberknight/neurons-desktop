export type SyncStatus = 'synced' | 'pending' | 'conflict'

export interface BaseEntity {
  id?: string
  createdAt: number
  updatedAt: number
  synced: 0 | 1
  isDeleted?: boolean
}

// 1. 📄 Documents
export interface DocumentRecord extends BaseEntity {
  id: string
  title: string
  content: string
  category: 'policy' | 'report' | 'memo' | 'sop' | 'notes'
  tags: string[]
  author: string
  isPinned?: boolean
}

// 2. 📊 POS & Transactions
export interface POSTransaction extends BaseEntity {
  id: string
  receiptNumber: string
  cashierId: string
  cashierName: string
  posStation: string
  items: {
    sku: string
    name: string
    quantity: number
    unitPrice: number
    subtotal: number
  }[]
  subtotal: number
  discountPercent: number
  discountAmount: number
  totalAmount: number
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'store_credit' | 'split'
  splitBreakdown?: {
    cash?: number
    card?: number
    transfer?: number
    credit?: number
  }
  hasManualOverride: boolean
  overrideReason?: string
  status: 'completed' | 'flagged' | 'refunded'
}

// 3. 📦 Inventory
export interface InventoryItem extends BaseEntity {
  id: string
  sku: string
  name: string
  image?: string
  brand?: string
  supplier?: string
  category: string
  zone: string
  quantity: number
  unit: string
  type?: 'Finished Good' | 'Raw Material'
  salesChannel?: string
  costPrice: number
  unitPrice: number
  minThreshold: number
  expiryDate?: string
  lastRestocked: number
}

// 4. 👨 Staff & Shifts
export interface StaffMember extends BaseEntity {
  id: string
  staffCode: string
  fullName: string
  role: string
  department: string
  hourlyRate: number
  monthlySalary: number
  phone: string
  email: string
  status: 'active' | 'on_leave' | 'suspended' | 'inactive'
}

export interface ShiftEntry extends BaseEntity {
  id: string
  weekStarting: string
  staffId: string
  staffName: string
  role: string
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'
  shiftTime: string
  isCovered: boolean
  notes?: string
}

// 5. 📈 Finance & SME Accounting
export interface FinanceRecord extends BaseEntity {
  id: string
  transactionDate: string
  type: 'income' | 'expense'
  category: string
  description: string
  amount: number
  currency: 'NGN' | 'USD' | 'KES' | 'GHS'
  beneficiary?: string
  paymentType?: 'Cash' | 'Bank Transfer' | 'Card' | 'Store Credit' | 'Split Payment'
  paymentStatus?: 'Paid' | 'Pending' | 'Approved'
  referenceId?: string
}

export interface CustomerDebtRecord extends BaseEntity {
  id: string
  customerName: string
  customerPhone?: string
  description: string
  totalAmount: number
  amountPaid: number
  balanceDue: number
  dueDate: string
  status: 'unpaid' | 'partial' | 'settled'
}

export interface SupplierPayableRecord extends BaseEntity {
  id: string
  supplierName: string
  supplierPhone?: string
  itemName: string
  totalAmount: number
  amountPaid: number
  balanceDue: number
  dueDate: string
  status: 'unpaid' | 'partial' | 'settled'
}

export interface BankAccountRecord extends BaseEntity {
  id: string
  bankName: string
  accountNumber: string
  accountName: string
  balance: number
  accountType: 'bank' | 'pos_terminal' | 'cash_vault'
}

export interface InvoiceRecord extends BaseEntity {
  id: string
  invoiceNumber: string
  customerName: string
  customerPhone?: string
  customerEmail?: string
  issueDate: string
  dueDate: string
  items: { description: string; quantity: number; unitPrice: number; subtotal: number }[]
  subtotal: number
  discount: number
  tax: number
  totalAmount: number
  amountPaid: number
  balanceDue: number
  status: 'draft' | 'pending' | 'paid' | 'overdue'
  notes?: string
}

// 6. 📃 Tasks
export interface TaskRecord extends BaseEntity {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'done'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  assigneeRole: string
  dueDate: string
  subtasks: { id: string; text: string; completed: boolean }[]
  origin: 'manual' | 'ai_generated'
}

// 🚨 Alerts Feed
export interface AlertRecord extends BaseEntity {
  id: string
  title: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  module: string
  anomalyType: string
  reasoning: string
  recommendedAction: string
  isAcknowledged: boolean
  transactionId?: string
}

// 💬 AI Chat & Tasks Conversation History
import type { LLMOutputSchema } from './schemas'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  parsedJson?: LLMOutputSchema
  outputType?: string
  latencyMs?: number
  timestamp: number
  thinkMode?: boolean
}

export interface ChatSession extends BaseEntity {
  id: string
  title: string
  messages: ChatMessage[]
  lastMessageAt: number
  isPinned?: boolean
}

// 👤 User Profile & Business Onboarding
export type StaffCountBracket = '1-5' | '6-20' | '21-50' | '50+'
export type TransactionVolumeBracket = 'under_500' | '500_2500' | '2500_10000' | 'over_10000'
export type MonthlyRevenueBracket = 'under_1m' | '1m_5m' | '5m_20m' | 'over_20m'
export type AIModelMode = 'local_800mb' | 'cloud_api'

export interface UserProfile extends BaseEntity {
  id: string
  orgId?: string | null
  email: string
  fullName: string
  companyName: string
  role?: string
  staffCount: StaffCountBracket
  monthlyTransactionVolume: TransactionVolumeBracket
  monthlyRevenue: MonthlyRevenueBracket
  aiModelMode: AIModelMode
  customBackendEndpoint?: string
  onboardingCompleted: boolean
  lastLoginAt: number
}

// ⚙️ App Global Settings
export interface AppSettings extends BaseEntity {
  id: string
  customBackendEndpoint: string
  aiModelMode: AIModelMode
  apiKey?: string
  localModelDownloaded: boolean
  localModelPath?: string
  theme: 'light' | 'dark' | 'system'
}

// 🛡️ Activity Audit Logs
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'OVERRIDE' | 'INVITE' | 'LOGIN' | 'REVOKE'

export interface AuditLogEntry extends BaseEntity {
  id: string
  orgId?: string | null
  userId: string
  userName: string
  action: AuditAction
  entityType: string
  entityId: string
  details: Record<string, unknown>
}


