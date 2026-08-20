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
  role: 'Licensed Pharmacist' | 'Staff Pharmacist' | 'Pharmacy Technician' | 'Store Manager' | 'Cashier' | 'Inventory Auditor'
  department: 'Pharmacy' | 'Retail Floor' | 'Warehouse' | 'Management'
  hourlyRate: number
  monthlySalary: number
  phone: string
  email: string
  status: 'active' | 'on_leave' | 'inactive'
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
