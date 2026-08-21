import { db } from './localDb'
import type {
  DocumentRecord,
  POSTransaction,
  InventoryItem,
  StaffMember,
  ShiftEntry,
  FinanceRecord,
  TaskRecord,
  AlertRecord,
  ChatSession,
} from '@/types/database'

export async function initializeSeedDataIfEmpty() {
  const count = await db.inventory.count()
  const now = Date.now()

  // 1. Initial Inventory (4 Zones)
  const initialInventory: InventoryItem[] = [
    { id: 'inv-1', sku: 'MED-PCM-500', name: 'Paracetamol 500mg Tablets (Pack 100)', category: 'pharmaceuticals', zone: 'Zone A', quantity: 400, minThreshold: 50, unitPrice: 2500, costPrice: 1800, unit: 'packs', lastRestocked: now, createdAt: now, updatedAt: now, synced: 1 },
    { id: 'inv-2', sku: 'MED-AMX-250', name: 'Amoxicillin 250mg Capsules', category: 'pharmaceuticals', zone: 'Zone A', quantity: 280, minThreshold: 40, unitPrice: 4200, costPrice: 3100, unit: 'boxes', lastRestocked: now, createdAt: now, updatedAt: now, synced: 1 },
    { id: 'inv-3', sku: 'ELC-POS-R01', name: 'Thermal POS Receipt Paper Rolls 80mm', category: 'supplies', zone: 'Zone B', quantity: 350, minThreshold: 50, unitPrice: 1200, costPrice: 750, unit: 'rolls', lastRestocked: now, createdAt: now, updatedAt: now, synced: 1 },
    { id: 'inv-4', sku: 'ELC-BAR-WLS', name: 'Wireless Handheld Barcode Scanner', category: 'electronics', zone: 'Zone B', quantity: 45, minThreshold: 10, unitPrice: 38500, costPrice: 28000, unit: 'units', lastRestocked: now, createdAt: now, updatedAt: now, synced: 1 },
    { id: 'inv-5', sku: 'FMCG-DET-1KG', name: 'Industrial Antiseptic Disinfectant 5L', category: 'fmcg', zone: 'Zone C', quantity: 150, minThreshold: 20, unitPrice: 8900, costPrice: 6200, unit: 'gallons', lastRestocked: now, createdAt: now, updatedAt: now, synced: 1 },
    { id: 'inv-6', sku: 'MED-GLV-LAT', name: 'Medical Examination Gloves (Box 100)', category: 'supplies', zone: 'Zone D', quantity: 100, minThreshold: 25, unitPrice: 5500, costPrice: 3800, unit: 'boxes', lastRestocked: now, createdAt: now, updatedAt: now, synced: 1 },
  ]

  // 2. Initial Staff
  const initialStaff: StaffMember[] = [
    { id: 'stf-1', staffCode: 'PHC_01', fullName: 'Dr. Sarah Johnson', role: 'Licensed Pharmacist', department: 'Pharmacy', hourlyRate: 4500, monthlySalary: 450000, phone: '+234 803 123 4567', email: 'sarah.j@baucorp.com', status: 'active', createdAt: now, updatedAt: now, synced: 1 },
    { id: 'stf-2', staffCode: 'PHC_02', fullName: 'Mr. David Kim', role: 'Staff Pharmacist', department: 'Pharmacy', hourlyRate: 3200, monthlySalary: 320000, phone: '+234 802 987 6543', email: 'david.k@baucorp.com', status: 'active', createdAt: now, updatedAt: now, synced: 1 },
    { id: 'stf-3', staffCode: 'PHC_03', fullName: 'Ms. Clara Lee', role: 'Pharmacy Technician', department: 'Pharmacy', hourlyRate: 2200, monthlySalary: 220000, phone: '+234 814 555 0192', email: 'clara.l@baucorp.com', status: 'active', createdAt: now, updatedAt: now, synced: 1 },
    { id: 'stf-4', staffCode: 'MGT_01', fullName: 'Akhimien Clement', role: 'Store Manager', department: 'Management', hourlyRate: 6000, monthlySalary: 600000, phone: '+234 809 111 2233', email: 'clement@baucorp.com', status: 'active', createdAt: now, updatedAt: now, synced: 1 },
    { id: 'stf-5', staffCode: 'POS_04', fullName: 'Cashier ID #104', role: 'Cashier', department: 'Retail Floor', hourlyRate: 1800, monthlySalary: 180000, phone: '+234 818 333 4455', email: 'cashier104@baucorp.com', status: 'active', createdAt: now, updatedAt: now, synced: 1 },
  ]

  // 3. Shift Entries for Current Week
  const initialShifts: ShiftEntry[] = [
    { id: 'shf-1', weekStarting: '2026-09-01', staffId: 'stf-1', staffName: 'Dr. Sarah Johnson', role: 'Licensed Pharmacist', day: 'Monday', shiftTime: '08:00 - 16:30', isCovered: true, createdAt: now, updatedAt: now, synced: 1 },
    { id: 'shf-2', weekStarting: '2026-09-01', staffId: 'stf-2', staffName: 'Mr. David Kim', role: 'Staff Pharmacist', day: 'Tuesday', shiftTime: '09:00 - 17:30', isCovered: true, createdAt: now, updatedAt: now, synced: 1 },
    { id: 'shf-3', weekStarting: '2026-09-01', staffId: 'stf-3', staffName: 'Ms. Clara Lee', role: 'Pharmacy Technician', day: 'Wednesday', shiftTime: '08:00 - 16:30', isCovered: true, createdAt: now, updatedAt: now, synced: 1 },
    { id: 'shf-4', weekStarting: '2026-09-01', staffId: 'stf-1', staffName: 'Dr. Sarah Johnson', role: 'Licensed Pharmacist', day: 'Thursday', shiftTime: '12:00 - 20:30', isCovered: true, createdAt: now, updatedAt: now, synced: 1 },
    { id: 'shf-5', weekStarting: '2026-09-01', staffId: 'stf-2', staffName: 'Mr. David Kim', role: 'Staff Pharmacist', day: 'Friday', shiftTime: '08:00 - 16:30', isCovered: true, createdAt: now, updatedAt: now, synced: 1 },
  ]

  // 4. Initial Documents
  const initialDocuments: DocumentRecord[] = [
    {
      id: 'doc-1',
      title: 'Store Audit & Cashier Float Reconciliation Policy (Q3 2026)',
      category: 'policy',
      tags: ['SOP', 'Audit', 'Finance'],
      author: 'Store Manager',
      isPinned: true,
      content: `# Standard Operating Procedure: POS Float & Discrepancies\n\n**Effective Date:** August 20, 2026\n**Scope:** All Retail Branches & Checkout Stations\n\n## 1. Daily Reconciliation Protocol\n- Cashiers must perform a physical cash count at start and end of every shift.\n- Any discrepancy exceeding **₦5,000** triggers an automatic managerial alert.\n\n## 2. Override Authorization\n- Discounts exceeding 15% require dual-key biometric or manager PIN entry.\n- Manual refunds without original barcode receipts are strictly prohibited.\n\n## 3. Weekly Audit Sign-off\n- Branch manager inspects inventory discrepancy logs every Monday morning.`,
      createdAt: now - 86400000 * 2,
      updatedAt: now - 86400000 * 2,
      synced: 1,
    },
    {
      id: 'doc-2',
      title: 'Warehouse Pallet SKU Distribution & Logistics Guide',
      category: 'sop',
      tags: ['Warehouse', 'Inventory', 'Zones'],
      author: 'Inventory Lead',
      isPinned: false,
      content: `# Warehouse Layout & Zone Allocation\n\n- **Zone A:** High-velocity pharmaceutical formulations (40% capacity).\n- **Zone B:** POS supplies and electronic hardware accessories (35% capacity).\n- **Zone C:** Chemical disinfectants and bulk sanitization liquids (15% capacity).\n- **Zone D:** Personal protective equipment (PPE) and quarantine stock (10% capacity).`,
      createdAt: now - 86400000 * 5,
      updatedAt: now - 86400000 * 5,
      synced: 1,
    }
  ]

  // 5. Initial POS Transactions
  const initialTransactions: POSTransaction[] = [
    {
      id: 'txn-1',
      receiptNumber: 'REC-2026-0819-01',
      cashierId: 'POS_04',
      cashierName: 'Cashier ID #104',
      posStation: 'POS Station 1',
      items: [
        { sku: 'MED-PCM-500', name: 'Paracetamol 500mg Tablets', quantity: 4, unitPrice: 2500, subtotal: 10000 },
        { sku: 'FMCG-DET-1KG', name: 'Antiseptic Disinfectant', quantity: 1, unitPrice: 8900, subtotal: 8900 }
      ],
      subtotal: 18900,
      discountPercent: 0,
      discountAmount: 0,
      totalAmount: 18900,
      paymentMethod: 'card',
      hasManualOverride: false,
      status: 'completed',
      createdAt: now - 3600000 * 3,
      updatedAt: now - 3600000 * 3,
      synced: 1,
    },
    {
      id: 'txn-2',
      receiptNumber: 'TXN_8820',
      cashierId: 'POS_04',
      cashierName: 'Cashier ID #104',
      posStation: 'POS Station 3',
      items: [
        { sku: 'ELC-BAR-WLS', name: 'Wireless Handheld Barcode Scanner', quantity: 1, unitPrice: 38500, subtotal: 38500 }
      ],
      subtotal: 38500,
      discountPercent: 80,
      discountAmount: 30800,
      totalAmount: 7700,
      paymentMethod: 'cash',
      hasManualOverride: true,
      overrideReason: 'VIP Customer Override (No Approval PIN)',
      status: 'flagged',
      createdAt: now - 3600000 * 1,
      updatedAt: now - 3600000 * 1,
      synced: 1,
    }
  ]

  // 6. Initial Tasks
  const initialTasks: TaskRecord[] = [
    {
      id: 'tsk-1',
      title: 'Review Cashier ID #104 Refund Overrides Report',
      description: 'Audit transaction TXN_8820 for unauthorized 80% manual discount and reconcile till float.',
      status: 'todo',
      priority: 'HIGH',
      assigneeRole: 'Store Manager',
      dueDate: '2026-08-25',
      subtasks: [
        { id: 'sub-1', text: 'Extract POS audit log timestamp for TXN_8820', completed: true },
        { id: 'sub-2', text: 'Verify manager approval authorization code', completed: false },
        { id: 'sub-3', text: 'Reconcile drawer cash shortfall of ₦30,800', completed: false }
      ],
      origin: 'ai_generated',
      createdAt: now - 1800000,
      updatedAt: now - 1800000,
      synced: 1,
    },
    {
      id: 'tsk-2',
      title: 'Perform Monthly Controlled Substance Stock Audit',
      description: 'Physical count and log reconciliation for Zone A high-value items.',
      status: 'in_progress',
      priority: 'MEDIUM',
      assigneeRole: 'Licensed Pharmacist',
      dueDate: '2026-08-28',
      subtasks: [
        { id: 'sub-4', text: 'Count physical blister packs in Safe A-02', completed: true },
        { id: 'sub-5', text: 'Match against digital ledger dispensing numbers', completed: false }
      ],
      origin: 'manual',
      createdAt: now - 86400000,
      updatedAt: now - 86400000,
      synced: 1,
    }
  ]

  // 7. Initial Alerts
  const initialAlerts: AlertRecord[] = [
    {
      id: 'alt-1',
      title: 'Unauthorized 80% Discount Override Detected',
      severity: 'HIGH',
      module: 'POS Cashier Reconciliation',
      anomalyType: 'UNAUTHORIZED_DISCOUNT_OVERRIDE',
      reasoning: 'Cashier ID #104 executed an unauthorized 80% manual discount override on POS Station 3 on transaction TXN_8820.',
      recommendedAction: 'Lock till station, restrict cashier #104 override permissions, and conduct managerial till audit.',
      isAcknowledged: false,
      transactionId: 'TXN_8820',
      createdAt: now - 3600000,
      updatedAt: now - 3600000,
      synced: 1,
    }
  ]

  // 8. Initial Finance Entries
  const initialFinance: FinanceRecord[] = [
    { id: 'fin-1', transactionDate: '2026-08-19', type: 'income', category: 'POS Sales', description: 'Daily retail floor cash & card turnover', amount: 1450000, currency: 'NGN', createdAt: now - 86400000, updatedAt: now - 86400000, synced: 1 },
    { id: 'fin-2', transactionDate: '2026-08-18', type: 'expense', category: 'Inventory Restock', description: 'Pharmaceutical wholesale shipment restock', amount: 620000, currency: 'NGN', createdAt: now - 86400000 * 2, updatedAt: now - 86400000 * 2, synced: 1 },
    { id: 'fin-3', transactionDate: '2026-08-15', type: 'expense', category: 'Salaries & Payroll', description: 'Bi-weekly staff advance disbursement', amount: 350000, currency: 'NGN', createdAt: now - 86400000 * 5, updatedAt: now - 86400000 * 5, synced: 1 },
  ]

  // 9. Initial Chat & Task Conversations (Keep track of conversations with AI)
  const initialChatSessions: ChatSession[] = [
    {
      id: 'chat-1',
      title: 'Improving agents.md for Electron app optimization',
      messages: [
        {
          id: 'msg-1-1',
          role: 'user',
          content: 'How do we optimize AGENTS.md for Electron desktop performance and offline-first safety?',
          timestamp: now - 1000 * 60 * 46,
        },
        {
          id: 'msg-1-2',
          role: 'assistant',
          content: 'To maximize performance and reliability in Neurons Desktop on Electron:\n\n1. **Zero Type Cheating**: Enforce strict TypeScript without `any` escapes.\n2. **Memory Safety**: Disallow unbounded `.toArray()` queries on 100k records.\n3. **Worker Isolation**: Run AI inference and heavy tasks off the UI thread.\n4. **Context Isolation**: Always maintain `contextIsolation: true` and `nodeIntegration: false`.',
          timestamp: now - 1000 * 60 * 46 + 5000,
        },
      ],
      lastMessageAt: now - 1000 * 60 * 46,
      createdAt: now - 1000 * 60 * 46,
      updatedAt: now - 1000 * 60 * 46,
      synced: 1,
    },
    {
      id: 'chat-2',
      title: 'Adding config file to OpenCode',
      messages: [
        {
          id: 'msg-2-1',
          role: 'user',
          content: 'Can you generate the configuration JSON for OpenCode runtime settings?',
          timestamp: now - 86400000 * 3,
        },
        {
          id: 'msg-2-2',
          role: 'assistant',
          content: 'Here is the generated runtime configuration schema with offline caching enabled.',
          timestamp: now - 86400000 * 3 + 3000,
        },
      ],
      lastMessageAt: now - 86400000 * 3,
      createdAt: now - 86400000 * 3,
      updatedAt: now - 86400000 * 3,
      synced: 1,
    },
    {
      id: 'chat-3',
      title: 'my best chat for marketing',
      messages: [
        {
          id: 'msg-3-1',
          role: 'user',
          content: 'Draft a marketing strategy for retail pharmacy customer retention and loyalty programs.',
          timestamp: now - 86400000 * 5,
        },
        {
          id: 'msg-3-2',
          role: 'assistant',
          content: 'Here is a 4-pillar retention roadmap including automated SMS refill alerts, loyalty tier point multipliers, and wellness bundles.',
          timestamp: now - 86400000 * 5 + 4000,
        },
      ],
      lastMessageAt: now - 86400000 * 5,
      createdAt: now - 86400000 * 5,
      updatedAt: now - 86400000 * 5,
      synced: 1,
    },
    {
      id: 'chat-4',
      title: 'Review request',
      messages: [
        {
          id: 'msg-4-1',
          role: 'user',
          content: 'Please review the cashbook ledger reconciliations for this week.',
          timestamp: now - 86400000 * 5 - 3600000 * 2,
        },
        {
          id: 'msg-4-2',
          role: 'assistant',
          content: 'All cashbook debit and credit records match the till balances with zero discrepancies.',
          timestamp: now - 86400000 * 5 - 3600000 * 2 + 4000,
        },
      ],
      lastMessageAt: now - 86400000 * 5 - 3600000 * 2,
      createdAt: now - 86400000 * 5 - 3600000 * 2,
      updatedAt: now - 86400000 * 5 - 3600000 * 2,
      synced: 1,
    },
    {
      id: 'chat-5',
      title: 'Integrating AI into business management application',
      messages: [
        {
          id: 'msg-5-1',
          role: 'user',
          content: 'How should small retail businesses integrate on-device AI for stock management?',
          timestamp: now - 86400000 * 6,
        },
        {
          id: 'msg-5-2',
          role: 'assistant',
          content: 'On-device AI provides instant anomaly detection, automated shift generation, and proactive reorder warnings without incurring cloud server latency or fees.',
          timestamp: now - 86400000 * 6 + 2000,
        },
      ],
      lastMessageAt: now - 86400000 * 6,
      createdAt: now - 86400000 * 6,
      updatedAt: now - 86400000 * 6,
      synced: 1,
    },
    {
      id: 'chat-6',
      title: 'Using husky to enforce code quality standards',
      messages: [
        {
          id: 'msg-6-1',
          role: 'user',
          content: 'Set up pre-commit git hooks with husky to verify typescript compilation before commit.',
          timestamp: now - 86400000 * 7,
        },
        {
          id: 'msg-6-2',
          role: 'assistant',
          content: 'Configured `.husky/pre-commit` to execute `npx tsc --noEmit` on staged files.',
          timestamp: now - 86400000 * 7 + 3000,
        },
      ],
      lastMessageAt: now - 86400000 * 7,
      createdAt: now - 86400000 * 7,
      updatedAt: now - 86400000 * 7,
      synced: 1,
    },
    {
      id: 'chat-7',
      title: 'Refactoring logger implementation for TypeScript 7',
      messages: [
        {
          id: 'msg-7-1',
          role: 'user',
          content: 'Refactor electron console loggers to write to rotating file stream.',
          timestamp: now - 86400000 * 7 - 3600000 * 5,
        },
        {
          id: 'msg-7-2',
          role: 'assistant',
          content: 'Structured JSON log streaming implemented with automatic daily log file rotation.',
          timestamp: now - 86400000 * 7 - 3600000 * 5 + 2500,
        },
      ],
      lastMessageAt: now - 86400000 * 7 - 3600000 * 5,
      createdAt: now - 86400000 * 7 - 3600000 * 5,
      updatedAt: now - 86400000 * 7 - 3600000 * 5,
      synced: 1,
    },
    {
      id: 'chat-8',
      title: 'Crypto trading platform agent architecture guide',
      messages: [
        {
          id: 'msg-8-1',
          role: 'user',
          content: 'Design architectural plan for high-frequency algorithmic risk evaluator.',
          timestamp: now - 86400000 * 10,
        },
        {
          id: 'msg-8-2',
          role: 'assistant',
          content: 'Defined streaming order book analyzer using ring buffers and sub-millisecond execution pipelines.',
          timestamp: now - 86400000 * 10 + 4000,
        },
      ],
      lastMessageAt: now - 86400000 * 10,
      createdAt: now - 86400000 * 10,
      updatedAt: now - 86400000 * 10,
      synced: 1,
    },
    {
      id: 'chat-9',
      title: 'Adding bun lint to prompt',
      messages: [
        {
          id: 'msg-9-1',
          role: 'user',
          content: 'Configure bun linter script with strict formatting rules.',
          timestamp: now - 86400000 * 14,
        },
        {
          id: 'msg-9-2',
          role: 'assistant',
          content: 'Added `bun lint` command with biome/eslint zero warning thresholds.',
          timestamp: now - 86400000 * 14 + 1500,
        },
      ],
      lastMessageAt: now - 86400000 * 14,
      createdAt: now - 86400000 * 14,
      updatedAt: now - 86400000 * 14,
      synced: 1,
    },
    {
      id: 'chat-10',
      title: "Beginner's guide to process management and system commands",
      messages: [
        {
          id: 'msg-10-1',
          role: 'user',
          content: 'Write an internal developer guide for managing background processes safely.',
          timestamp: now - 86400000 * 15,
        },
        {
          id: 'msg-10-2',
          role: 'assistant',
          content: 'Comprehensive guide drafted covering signals, PID tracking, and graceful shutdown handlers.',
          timestamp: now - 86400000 * 15 + 3000,
        },
      ],
      lastMessageAt: now - 86400000 * 15,
      createdAt: now - 86400000 * 15,
      updatedAt: now - 86400000 * 15,
      synced: 1,
    },
    {
      id: 'chat-11',
      title: 'TPU 8t and 8i serving capacity for Deepseek Flash',
      messages: [
        {
          id: 'msg-11-1',
          role: 'user',
          content: 'Calculate memory bandwidth and batch throughput on TPU v5e vs on-device NPU.',
          timestamp: now - 86400000 * 17,
        },
        {
          id: 'msg-11-2',
          role: 'assistant',
          content: 'Detailed latency and FLOPs benchmarking breakdown produced across int8 and bf16 precision.',
          timestamp: now - 86400000 * 17 + 4500,
        },
      ],
      lastMessageAt: now - 86400000 * 17,
      createdAt: now - 86400000 * 17,
      updatedAt: now - 86400000 * 17,
      synced: 1,
    },
  ]

  if (count === 0) {
    await db.inventory.bulkAdd(initialInventory)
    await db.staff.bulkAdd(initialStaff)
    await db.shifts.bulkAdd(initialShifts)
    await db.documents.bulkAdd(initialDocuments)
    await db.transactions.bulkAdd(initialTransactions)
    await db.tasks.bulkAdd(initialTasks)
    await db.alerts.bulkAdd(initialAlerts)
    await db.finance.bulkAdd(initialFinance)
  }

  const chatCount = await db.chatSessions.count()
  if (chatCount === 0) {
    await db.chatSessions.bulkAdd(initialChatSessions)
  }
}
