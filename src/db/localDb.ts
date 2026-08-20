import Dexie, { type EntityTable } from 'dexie'
import type {
  DocumentRecord,
  POSTransaction,
  InventoryItem,
  StaffMember,
  ShiftEntry,
  FinanceRecord,
  TaskRecord,
  AlertRecord,
  CustomerDebtRecord,
  SupplierPayableRecord,
  BankAccountRecord,
  InvoiceRecord,
} from '@/types/database'

export class BAUDatabase extends Dexie {
  documents!: EntityTable<DocumentRecord, 'id'>
  transactions!: EntityTable<POSTransaction, 'id'>
  inventory!: EntityTable<InventoryItem, 'id'>
  staff!: EntityTable<StaffMember, 'id'>
  shifts!: EntityTable<ShiftEntry, 'id'>
  finance!: EntityTable<FinanceRecord, 'id'>
  tasks!: EntityTable<TaskRecord, 'id'>
  alerts!: EntityTable<AlertRecord, 'id'>
  customerDebts!: EntityTable<CustomerDebtRecord, 'id'>
  supplierPayables!: EntityTable<SupplierPayableRecord, 'id'>
  bankAccounts!: EntityTable<BankAccountRecord, 'id'>
  invoices!: EntityTable<InvoiceRecord, 'id'>

  constructor() {
    super('BAUBusinessDB')
    
    this.version(1).stores({
      documents: 'id, category, updatedAt, synced, isPinned',
      transactions: 'id, receiptNumber, cashierId, posStation, status, createdAt, synced',
      inventory: 'id, sku, name, category, zone, quantity, minThreshold, synced',
      staff: 'id, staffCode, department, role, status, synced',
      shifts: 'id, weekStarting, staffId, day, synced',
      finance: 'id, transactionDate, type, category, synced',
      tasks: 'id, status, priority, assigneeRole, dueDate, synced',
      alerts: 'id, severity, module, isAcknowledged, createdAt, synced',
      customerDebts: 'id, customerName, status, dueDate, updatedAt, synced',
      supplierPayables: 'id, supplierName, status, dueDate, updatedAt, synced',
      bankAccounts: 'id, bankName, accountType, updatedAt, synced',
      invoices: 'id, invoiceNumber, customerName, status, dueDate, updatedAt, synced',
    })
  }
}

export const db = new BAUDatabase()
