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
  ChatSession,
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
  chatSessions!: EntityTable<ChatSession, 'id'>

  constructor() {
    super('BAUBusinessDB')

    this.version(3).stores({
      documents: 'id, category, updatedAt, createdAt, synced, isPinned, [category+updatedAt]',
      transactions: 'id, receiptNumber, cashierId, posStation, status, paymentMethod, createdAt, updatedAt, synced, [status+createdAt], [paymentMethod+createdAt]',
      inventory: 'id, sku, name, category, zone, quantity, minThreshold, type, updatedAt, createdAt, synced, [type+updatedAt], [category+updatedAt]',
      staff: 'id, staffCode, department, role, status, updatedAt, createdAt, synced, [status+updatedAt], [department+updatedAt]',
      shifts: 'id, weekStarting, staffId, day, createdAt, synced, [weekStarting+day]',
      finance: 'id, transactionDate, type, category, paymentStatus, paymentType, createdAt, updatedAt, synced, [type+transactionDate], [type+paymentStatus]',
      tasks: 'id, status, priority, assigneeRole, dueDate, createdAt, synced, [status+dueDate]',
      alerts: 'id, severity, module, isAcknowledged, createdAt, synced, [module+createdAt]',
      customerDebts: 'id, customerName, status, dueDate, updatedAt, synced, [status+dueDate]',
      supplierPayables: 'id, supplierName, status, dueDate, updatedAt, synced, [status+dueDate]',
      bankAccounts: 'id, bankName, accountType, updatedAt, synced',
      invoices: 'id, invoiceNumber, customerName, status, dueDate, updatedAt, synced, [status+dueDate]',
      chatSessions: 'id, title, lastMessageAt, createdAt, updatedAt, synced',
    })
  }
}

export const db = new BAUDatabase()
