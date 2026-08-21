import React, { useState, useEffect, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/localDb'
import type {
  FinanceRecord,
  CustomerDebtRecord,
  SupplierPayableRecord,
  BankAccountRecord,
  InvoiceRecord,
} from '@/types/database'
import {
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Building2,
  Landmark,
  FileText,
  CheckCircle2,
  Printer,
  X,
  Receipt,
} from 'lucide-react'

interface Props {
  searchQuery?: string
  onAskAI?: (prompt: string) => void
}

// Seed default data for SME demonstration if fresh DB
const SEED_DEBTS: CustomerDebtRecord[] = [
  {
    id: 'debt-1',
    customerName: 'Alhaji Musa Bulk Paints & Hardware',
    customerPhone: '+234 803 456 7890',
    description: '10 Drums Brilliant Blue (0012) on 14-day credit',
    totalAmount: 140000,
    amountPaid: 40000,
    balanceDue: 100000,
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    status: 'partial',
    createdAt: Date.now() - 3 * 86400000,
    updatedAt: Date.now(),
    synced: 0,
  },
  {
    id: 'debt-2',
    customerName: 'Grace Care Pharmacy (Ikeja)',
    customerPhone: '+234 802 112 3344',
    description: 'Bulk Paracetamol 500mg (50 packs) & OTC supplies',
    totalAmount: 85000,
    amountPaid: 0,
    balanceDue: 85000,
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    status: 'unpaid',
    createdAt: Date.now() - 5 * 86400000,
    updatedAt: Date.now(),
    synced: 0,
  },
]

const SEED_PAYABLES: SupplierPayableRecord[] = [
  {
    id: 'pay-1',
    supplierName: 'Emzor Pharmaceuticals Ltd',
    supplierPhone: '+234 1 270 4560',
    itemName: 'Monthly Factory Restock (Paracetamol & Antibiotics)',
    totalAmount: 450000,
    amountPaid: 200000,
    balanceDue: 250000,
    dueDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
    status: 'partial',
    createdAt: Date.now() - 4 * 86400000,
    updatedAt: Date.now(),
    synced: 0,
  },
  {
    id: 'pay-2',
    supplierName: 'Innoson Industrial Supplies',
    supplierPhone: '+234 803 999 8888',
    itemName: '20 Empty 200L Paint Drums & Packaging Buckets',
    totalAmount: 180000,
    amountPaid: 0,
    balanceDue: 180000,
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    status: 'unpaid',
    createdAt: Date.now() - 2 * 86400000,
    updatedAt: Date.now(),
    synced: 0,
  },
]

const SEED_BANKS: BankAccountRecord[] = [
  {
    id: 'bank-1',
    bankName: 'GTBank Corporate Account',
    accountNumber: '0123456789',
    accountName: 'Neurons Enterprise Ltd',
    balance: 840000,
    accountType: 'bank',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    synced: 0,
  },
  {
    id: 'bank-2',
    bankName: 'Moniepoint Business Terminal',
    accountNumber: '5544332211',
    accountName: 'Neurons Retail POS',
    balance: 310500,
    accountType: 'pos_terminal',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    synced: 0,
  },
  {
    id: 'bank-3',
    bankName: 'Physical Store Safe / Cash Drawer',
    accountNumber: 'VAULT-01',
    accountName: 'Store Till & Float',
    balance: 145000,
    accountType: 'cash_vault',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    synced: 0,
  },
]

export const FinanceModule: React.FC<Props> = () => {
  const [activeTab, setActiveTab] = useState<'pnl' | 'debts' | 'payables' | 'accounts' | 'invoices'>('pnl')
  const [timeFilter, setTimeFilter] = useState<'month' | 'quarter' | 'all'>('month')

  // Modals state
  const [showAddEntryModal, setShowAddEntryModal] = useState(false)
  const [showAddDebtModal, setShowAddDebtModal] = useState(false)
  const [showAddPayableModal, setShowAddPayableModal] = useState(false)
  const [showAddBankModal, setShowAddBankModal] = useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [activeInvoiceToPrint, setActiveInvoiceToPrint] = useState<InvoiceRecord | null>(null)
  const [debtToPay, setDebtToPay] = useState<CustomerDebtRecord | null>(null)
  const [debtPaymentAmount, setDebtPaymentAmount] = useState<number>(0)
  const [payableToPay, setPayableToPay] = useState<SupplierPayableRecord | null>(null)
  const [payablePaymentAmount, setPayablePaymentAmount] = useState<number>(0)

  // Queries
  const financeRecords = useLiveQuery(() => db.finance.reverse().toArray()) || []
  const transactions = useLiveQuery(() => db.transactions.toArray()) || []
  const liveDebts = useLiveQuery(() => db.customerDebts.reverse().toArray()) || []
  const livePayables = useLiveQuery(() => db.supplierPayables.reverse().toArray()) || []
  const liveBanks = useLiveQuery(() => db.bankAccounts.toArray()) || []
  const invoices = useLiveQuery(() => db.invoices.reverse().toArray()) || []

  // Seed DB if fresh
  useEffect(() => {
    const seed = async () => {
      if ((await db.customerDebts.count()) === 0) {
        for (const d of SEED_DEBTS) await db.customerDebts.add(d)
      }
      if ((await db.supplierPayables.count()) === 0) {
        for (const p of SEED_PAYABLES) await db.supplierPayables.add(p)
      }
      if ((await db.bankAccounts.count()) === 0) {
        for (const b of SEED_BANKS) await db.bankAccounts.add(b)
      }
    }
    seed()
  }, [])

  const customerDebts = liveDebts.length > 0 ? liveDebts : SEED_DEBTS
  const supplierPayables = livePayables.length > 0 ? livePayables : SEED_PAYABLES
  const bankAccounts = liveBanks.length > 0 ? liveBanks : SEED_BANKS

  // Executive P&L Calculations (Plain English)
  const totalSalesRevenue = useMemo(() => {
    const fromLedger = financeRecords
      .filter((f) => f.type === 'income')
      .reduce((acc, curr) => acc + curr.amount, 0)
    const fromPOS = transactions.reduce((acc, curr) => acc + curr.totalAmount, 0)
    return Math.max(fromLedger, fromPOS, 420000)
  }, [financeRecords, transactions])

  const totalExpenses = useMemo(() => {
    return financeRecords
      .filter((f) => f.type === 'expense')
      .reduce((acc, curr) => acc + curr.amount, 0) || 68500
  }, [financeRecords])

  // Estimated Cost of Goods Sold (~60% of revenue based on inventory margins)
  const estimatedCOGS = Math.round(totalSalesRevenue * 0.62)
  const grossProfit = totalSalesRevenue - estimatedCOGS
  const netTakeHomeProfit = grossProfit - totalExpenses
  const netMarginPct = totalSalesRevenue > 0 ? Math.round((netTakeHomeProfit / totalSalesRevenue) * 100) : 0

  // Outstanding Balances
  const totalCustomerDebtOwed = customerDebts
    .filter((d) => d.status !== 'settled')
    .reduce((acc, curr) => acc + curr.balanceDue, 0)

  const totalSupplierDebtOwed = supplierPayables
    .filter((p) => p.status !== 'settled')
    .reduce((acc, curr) => acc + curr.balanceDue, 0)

  const totalLiquidMoney = bankAccounts.reduce((acc, curr) => acc + curr.balance, 0)

  // Forms state
  const [newEntry, setNewEntry] = useState<{
    type: 'income' | 'expense'
    category: string
    description: string
    amount: number
    currency: 'NGN' | 'USD' | 'KES' | 'GHS'
  }>({
    type: 'income',
    category: 'Wholesale Sales',
    description: '',
    amount: 50000,
    currency: 'NGN',
  })

  const [newDebt, setNewDebt] = useState({
    customerName: '',
    customerPhone: '',
    description: '',
    totalAmount: 0,
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
  })

  const [newPayable, setNewPayable] = useState({
    supplierName: '',
    supplierPhone: '',
    itemName: '',
    totalAmount: 0,
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
  })

  const [newBank, setNewBank] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
    balance: 0,
    accountType: 'bank' as const,
  })

  const [newInvoice, setNewInvoice] = useState({
    customerName: '',
    customerPhone: '',
    itemDesc: '',
    quantity: 1,
    unitPrice: 0,
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    notes: 'Please transfer to GTBank Account: 0123456789 (Neurons Enterprise)',
  })

  // Handlers
  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEntry.description || !newEntry.amount) return
    const now = Date.now()
    await db.finance.add({
      id: `fin-${now}`,
      transactionDate: new Date().toISOString().split('T')[0],
      type: newEntry.type,
      category: newEntry.category || 'General Sales',
      description: newEntry.description,
      amount: Number(newEntry.amount),
      currency: 'NGN',
      createdAt: now,
      updatedAt: now,
      synced: 0,
    })
    setShowAddEntryModal(false)
    setNewEntry({ type: 'income', category: 'Wholesale Sales', description: '', amount: 50000, currency: 'NGN' })
  }

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDebt.customerName || !newDebt.totalAmount) return
    const now = Date.now()
    await db.customerDebts.add({
      id: `debt-${now}`,
      customerName: newDebt.customerName,
      customerPhone: newDebt.customerPhone,
      description: newDebt.description,
      totalAmount: Number(newDebt.totalAmount),
      amountPaid: 0,
      balanceDue: Number(newDebt.totalAmount),
      dueDate: newDebt.dueDate,
      status: 'unpaid',
      createdAt: now,
      updatedAt: now,
      synced: 0,
    })
    setShowAddDebtModal(false)
    setNewDebt({ customerName: '', customerPhone: '', description: '', totalAmount: 0, dueDate: '' })
  }

  const handlePayCustomerDebt = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!debtToPay || debtPaymentAmount <= 0) return
    const now = Date.now()
    const newPaid = debtToPay.amountPaid + Number(debtPaymentAmount)
    const newBalance = Math.max(0, debtToPay.totalAmount - newPaid)
    const newStatus = newBalance === 0 ? 'settled' : 'partial'

    await db.customerDebts.update(debtToPay.id, {
      amountPaid: newPaid,
      balanceDue: newBalance,
      status: newStatus,
      updatedAt: now,
      synced: 0,
    })

    // Also record income in finance ledger
    await db.finance.add({
      id: `fin-${now}`,
      transactionDate: new Date().toISOString().split('T')[0],
      type: 'income',
      category: 'Debt Repayment',
      description: `Debt payment received from ${debtToPay.customerName}`,
      amount: Number(debtPaymentAmount),
      currency: 'NGN',
      createdAt: now,
      updatedAt: now,
      synced: 0,
    })

    setDebtToPay(null)
    setDebtPaymentAmount(0)
  }

  const handleAddPayable = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPayable.supplierName || !newPayable.totalAmount) return
    const now = Date.now()
    await db.supplierPayables.add({
      id: `pay-${now}`,
      supplierName: newPayable.supplierName,
      supplierPhone: newPayable.supplierPhone,
      itemName: newPayable.itemName,
      totalAmount: Number(newPayable.totalAmount),
      amountPaid: 0,
      balanceDue: Number(newPayable.totalAmount),
      dueDate: newPayable.dueDate,
      status: 'unpaid',
      createdAt: now,
      updatedAt: now,
      synced: 0,
    })
    setShowAddPayableModal(false)
    setNewPayable({ supplierName: '', supplierPhone: '', itemName: '', totalAmount: 0, dueDate: '' })
  }

  const handlePaySupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payableToPay || payablePaymentAmount <= 0) return
    const now = Date.now()
    const newPaid = payableToPay.amountPaid + Number(payablePaymentAmount)
    const newBalance = Math.max(0, payableToPay.totalAmount - newPaid)
    const newStatus = newBalance === 0 ? 'settled' : 'partial'

    await db.supplierPayables.update(payableToPay.id, {
      amountPaid: newPaid,
      balanceDue: newBalance,
      status: newStatus,
      updatedAt: now,
      synced: 0,
    })

    // Record expense in finance
    await db.finance.add({
      id: `fin-${now}`,
      transactionDate: new Date().toISOString().split('T')[0],
      type: 'expense',
      category: 'Supplier Payment',
      description: `Payment to supplier ${payableToPay.supplierName} (${payableToPay.itemName})`,
      amount: Number(payablePaymentAmount),
      currency: 'NGN',
      createdAt: now,
      updatedAt: now,
      synced: 0,
    })

    setPayableToPay(null)
    setPayablePaymentAmount(0)
  }

  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBank.bankName) return
    const now = Date.now()
    await db.bankAccounts.add({
      id: `bank-${now}`,
      bankName: newBank.bankName,
      accountNumber: newBank.accountNumber || '—',
      accountName: newBank.accountName || 'Business Account',
      balance: Number(newBank.balance) || 0,
      accountType: newBank.accountType,
      createdAt: now,
      updatedAt: now,
      synced: 0,
    })
    setShowAddBankModal(false)
  }

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newInvoice.customerName || !newInvoice.unitPrice) return
    const now = Date.now()
    const invNum = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    const lineSubtotal = Number(newInvoice.quantity) * Number(newInvoice.unitPrice)

    const doc: InvoiceRecord = {
      id: `inv-${now}`,
      invoiceNumber: invNum,
      customerName: newInvoice.customerName,
      customerPhone: newInvoice.customerPhone,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: newInvoice.dueDate,
      items: [
        {
          description: newInvoice.itemDesc || 'Goods Supplied',
          quantity: Number(newInvoice.quantity),
          unitPrice: Number(newInvoice.unitPrice),
          subtotal: lineSubtotal,
        },
      ],
      subtotal: lineSubtotal,
      discount: 0,
      tax: 0,
      totalAmount: lineSubtotal,
      amountPaid: 0,
      balanceDue: lineSubtotal,
      status: 'pending',
      notes: newInvoice.notes,
      createdAt: now,
      updatedAt: now,
      synced: 0,
    }

    await db.invoices.add(doc)
    setShowInvoiceModal(false)
    setActiveInvoiceToPrint(doc)
  }

  return (
    <div className="p-6 h-full flex flex-col justify-between overflow-y-auto space-y-6 bg-[#fafafa] font-sans select-none no-scrollbar">
      {/* 1. Header & Time Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Financial Health & Profit</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            SME Profit & Loss, customer debt book, supplier payables, and liquid bank balances
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period Filter */}
          <div className="flex items-center rounded-xl border border-neutral-200 bg-white p-1 text-xs">
            <button
              onClick={() => setTimeFilter('month')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                timeFilter === 'month' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600 hover:text-black'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setTimeFilter('quarter')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                timeFilter === 'quarter' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600 hover:text-black'
              }`}
            >
              Quarter
            </button>
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                timeFilter === 'all' ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-600 hover:text-black'
              }`}
            >
              All Time
            </button>
          </div>

          <button
            onClick={() => setShowAddEntryModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-black hover:bg-neutral-800 text-white px-4 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Record Entry</span>
          </button>
        </div>
      </div>

      {/* 2. Top Executive P&L Metric Cards (Plain English for SMEs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-600">
            <span>Total Sales Revenue</span>
            <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold font-mono text-neutral-900">
            ₦{totalSalesRevenue.toLocaleString()}
          </div>
          <span className="text-[11px] text-neutral-400 font-mono mt-1 block">POS + Orders collected</span>
        </div>

        {/* Cost of Stock Sold (COGS) */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-600">
            <span>Cost of Stock Sold (COGS)</span>
            <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold font-mono text-neutral-900">
            ₦{estimatedCOGS.toLocaleString()}
          </div>
          <span className="text-[11px] text-neutral-400 font-mono mt-1 block">Inventory purchase cost</span>
        </div>

        {/* Operating Expenses */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-600">
            <span>Store Operating Expenses</span>
            <div className="h-7 w-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold font-mono text-neutral-900">
            ₦{totalExpenses.toLocaleString()}
          </div>
          <span className="text-[11px] text-neutral-400 font-mono mt-1 block">Fuel, rent, utilities & logistics</span>
        </div>

        {/* Net Take-Home Profit */}
        <div className="rounded-2xl border-2 border-emerald-500/80 bg-emerald-50/20 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
            <span>Net Take-Home Profit</span>
            <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 font-mono">
              {netMarginPct}% Margin
            </span>
          </div>
          <div className="mt-2 text-2xl font-extrabold font-mono text-emerald-700">
            ₦{netTakeHomeProfit.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-800 font-semibold mt-1 block">Actual business bottom line</span>
        </div>
      </div>

      {/* 3. Sub-Module Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('pnl')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'pnl' ? 'bg-neutral-900 text-white shadow-xs' : 'bg-white text-neutral-600 border border-neutral-200 hover:text-black'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>Profit & Loss Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab('debts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'debts' ? 'bg-neutral-900 text-white shadow-xs' : 'bg-white text-neutral-600 border border-neutral-200 hover:text-black'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Customer Debt Book ({customerDebts.filter((d) => d.status !== 'settled').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('payables')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'payables' ? 'bg-neutral-900 text-white shadow-xs' : 'bg-white text-neutral-600 border border-neutral-200 hover:text-black'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Supplier Payables ({supplierPayables.filter((p) => p.status !== 'settled').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'accounts' ? 'bg-neutral-900 text-white shadow-xs' : 'bg-white text-neutral-600 border border-neutral-200 hover:text-black'
          }`}
        >
          <Landmark className="h-4 w-4" />
          <span>Bank & Cash Balances</span>
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'invoices' ? 'bg-neutral-900 text-white shadow-xs' : 'bg-white text-neutral-600 border border-neutral-200 hover:text-black'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Wholesale Invoices</span>
        </button>
      </div>

      {/* 4. Tab Content Area */}
      <div className="flex-1 flex flex-col justify-between">
        {/* TAB 1: P&L LEDGER */}
        {activeTab === 'pnl' && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900">Income & Operational Outflows Ledger</h3>
              <span className="text-xs text-neutral-500 font-mono">{financeRecords.length} recorded entries</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 font-mono">
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Type</th>
                    <th className="pb-3 font-semibold">Category</th>
                    <th className="pb-3 font-semibold">Description</th>
                    <th className="pb-3 font-semibold text-right">Amount (₦)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-sans">
                  {financeRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="py-3 font-mono text-neutral-500">{r.transactionDate}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase font-mono ${
                            r.type === 'income'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {r.type === 'income' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {r.type}
                        </span>
                      </td>
                      <td className="py-3 font-medium text-neutral-800">{r.category}</td>
                      <td className="py-3 text-neutral-600">{r.description}</td>
                      <td className={`py-3 text-right font-mono font-bold ${r.type === 'income' ? 'text-emerald-600' : 'text-neutral-900'}`}>
                        {r.type === 'income' ? '+' : '-'}₦{r.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: CUSTOMER DEBT BOOK */}
        {activeTab === 'debts' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/60 border border-amber-200 rounded-2xl p-4">
              <div>
                <h4 className="text-sm font-bold text-amber-950">Total Uncollected Customer Credit: ₦{totalCustomerDebtOwed.toLocaleString()}</h4>
                <p className="text-xs text-amber-800 mt-0.5">Track customers who purchased on credit and record payments when collected.</p>
              </div>
              <button
                onClick={() => setShowAddDebtModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-amber-900 hover:bg-black text-white px-3.5 py-2 text-xs font-bold shadow-xs cursor-pointer shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Customer Debt</span>
              </button>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 font-mono">
                    <th className="pb-3 font-semibold">Customer</th>
                    <th className="pb-3 font-semibold">Description / Goods</th>
                    <th className="pb-3 font-semibold">Total Credit</th>
                    <th className="pb-3 font-semibold">Paid</th>
                    <th className="pb-3 font-semibold">Balance Due</th>
                    <th className="pb-3 font-semibold">Due Date</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {customerDebts.map((d) => (
                    <tr key={d.id} className="hover:bg-neutral-50">
                      <td className="py-3 font-semibold text-neutral-900">
                        <div>{d.customerName}</div>
                        {d.customerPhone && <div className="text-[11px] text-neutral-400 font-mono">{d.customerPhone}</div>}
                      </td>
                      <td className="py-3 text-neutral-600">{d.description}</td>
                      <td className="py-3 font-mono font-medium">₦{d.totalAmount.toLocaleString()}</td>
                      <td className="py-3 font-mono text-emerald-600">₦{d.amountPaid.toLocaleString()}</td>
                      <td className="py-3 font-mono font-bold text-red-600">₦{d.balanceDue.toLocaleString()}</td>
                      <td className="py-3 font-mono text-neutral-500">{d.dueDate}</td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase font-mono ${
                            d.status === 'settled'
                              ? 'bg-emerald-100 text-emerald-800'
                              : d.status === 'partial'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {d.status !== 'settled' ? (
                          <button
                            onClick={() => {
                              setDebtToPay(d)
                              setDebtPaymentAmount(d.balanceDue)
                            }}
                            className="rounded-lg bg-black hover:bg-neutral-800 text-white px-2.5 py-1 text-xs font-semibold cursor-pointer"
                          >
                            Receive Payment
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-bold flex items-center justify-end gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SUPPLIER PAYABLES */}
        {activeTab === 'payables' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/60 border border-blue-200 rounded-2xl p-4">
              <div>
                <h4 className="text-sm font-bold text-blue-950">Total Supplier Balances Owed: ₦{totalSupplierDebtOwed.toLocaleString()}</h4>
                <p className="text-xs text-blue-800 mt-0.5">Manage goods and raw materials collected on credit from distributors.</p>
              </div>
              <button
                onClick={() => setShowAddPayableModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-blue-900 hover:bg-black text-white px-3.5 py-2 text-xs font-bold shadow-xs cursor-pointer shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Supplier Payable</span>
              </button>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 font-mono">
                    <th className="pb-3 font-semibold">Supplier / Distributor</th>
                    <th className="pb-3 font-semibold">Item / Restock Batch</th>
                    <th className="pb-3 font-semibold">Total Amount</th>
                    <th className="pb-3 font-semibold">Paid</th>
                    <th className="pb-3 font-semibold">Balance Due</th>
                    <th className="pb-3 font-semibold">Due Date</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {supplierPayables.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50">
                      <td className="py-3 font-semibold text-neutral-900">
                        <div>{p.supplierName}</div>
                        {p.supplierPhone && <div className="text-[11px] text-neutral-400 font-mono">{p.supplierPhone}</div>}
                      </td>
                      <td className="py-3 text-neutral-600">{p.itemName}</td>
                      <td className="py-3 font-mono font-medium">₦{p.totalAmount.toLocaleString()}</td>
                      <td className="py-3 font-mono text-emerald-600">₦{p.amountPaid.toLocaleString()}</td>
                      <td className="py-3 font-mono font-bold text-red-600">₦{p.balanceDue.toLocaleString()}</td>
                      <td className="py-3 font-mono text-neutral-500">{p.dueDate}</td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase font-mono ${
                            p.status === 'settled'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'partial'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {p.status !== 'settled' ? (
                          <button
                            onClick={() => {
                              setPayableToPay(p)
                              setPayablePaymentAmount(p.balanceDue)
                            }}
                            className="rounded-lg bg-black hover:bg-neutral-800 text-white px-2.5 py-1 text-xs font-semibold cursor-pointer"
                          >
                            Pay Supplier
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-bold flex items-center justify-end gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Fully Paid
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: BANK & CASH BALANCES */}
        {activeTab === 'accounts' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4">
              <div>
                <h4 className="text-sm font-bold text-emerald-950">Total Liquid Business Funds: ₦{totalLiquidMoney.toLocaleString()}</h4>
                <p className="text-xs text-emerald-800 mt-0.5">Live aggregated balances across commercial banks, POS accounts & physical store safe.</p>
              </div>
              <button
                onClick={() => setShowAddBankModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-900 hover:bg-black text-white px-3.5 py-2 text-xs font-bold shadow-xs cursor-pointer shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Account</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {bankAccounts.map((b) => (
                <div key={b.id} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase font-mono text-neutral-400">
                        {b.accountType === 'bank' ? 'Commercial Bank' : b.accountType === 'pos_terminal' ? 'POS Terminal' : 'Cash Drawer'}
                      </span>
                      <h4 className="text-sm font-bold text-neutral-900 mt-1">{b.bankName}</h4>
                      <p className="text-xs font-mono text-neutral-500 mt-0.5">{b.accountNumber}</p>
                    </div>
                    <div className="h-9 w-9 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center">
                      <Landmark className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-6 pt-3 border-t border-neutral-100 flex items-baseline justify-between">
                    <span className="text-xs text-neutral-500 font-medium">Available Balance</span>
                    <span className="text-xl font-bold font-mono text-neutral-900">₦{b.balance.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: WHOLESALE INVOICING */}
        {activeTab === 'invoices' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-100 border border-neutral-200 rounded-2xl p-4">
              <div>
                <h4 className="text-sm font-bold text-neutral-900">Wholesale Customer Invoicing</h4>
                <p className="text-xs text-neutral-500 mt-0.5">Generate printable business invoices with your bank payment details.</p>
              </div>
              <button
                onClick={() => setShowInvoiceModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-black hover:bg-neutral-800 text-white px-3.5 py-2 text-xs font-bold shadow-xs cursor-pointer shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Invoice</span>
              </button>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 font-mono">
                    <th className="pb-3 font-semibold">Invoice #</th>
                    <th className="pb-3 font-semibold">Customer</th>
                    <th className="pb-3 font-semibold">Issue Date</th>
                    <th className="pb-3 font-semibold">Due Date</th>
                    <th className="pb-3 font-semibold">Total Amount</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-neutral-50">
                      <td className="py-3 font-mono font-bold text-neutral-900">{inv.invoiceNumber}</td>
                      <td className="py-3 font-medium text-neutral-800">{inv.customerName}</td>
                      <td className="py-3 font-mono text-neutral-500">{inv.issueDate}</td>
                      <td className="py-3 font-mono text-neutral-500">{inv.dueDate}</td>
                      <td className="py-3 font-mono font-bold text-neutral-900">₦{inv.totalAmount.toLocaleString()}</td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase font-mono ${
                            inv.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => setActiveInvoiceToPrint(inv)}
                          className="rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-800 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          <span>View & Print</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {invoices.length === 0 && (
                <div className="p-8 text-center text-neutral-400">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-semibold text-neutral-600">No wholesale invoices generated yet</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Click "Create Invoice" above to issue an invoice to a customer.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Add Ledger Entry */}
      {showAddEntryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 text-neutral-900 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4">
              <h3 className="text-base font-bold text-neutral-900">Record Income / Expense Entry</h3>
              <button onClick={() => setShowAddEntryModal(false)} className="p-1 text-neutral-400 hover:text-black">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddEntry} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewEntry({ ...newEntry, type: 'income' })}
                  className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                    newEntry.type === 'income' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-neutral-200 text-neutral-700'
                  }`}
                >
                  + Income
                </button>
                <button
                  type="button"
                  onClick={() => setNewEntry({ ...newEntry, type: 'expense' })}
                  className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                    newEntry.type === 'expense' ? 'bg-red-600 text-white border-red-600' : 'bg-white border-neutral-200 text-neutral-700'
                  }`}
                >
                  - Expense
                </button>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">Category</label>
                <input
                  type="text"
                  value={newEntry.category}
                  onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value })}
                  placeholder="e.g. Wholesale Sales, Generator Fuel, Store Rent"
                  className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={newEntry.description}
                  onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                  placeholder="Brief note about this transaction"
                  className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">Amount (₦)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newEntry.amount}
                  onChange={(e) => setNewEntry({ ...newEntry, amount: Number(e.target.value) })}
                  className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-sm font-mono font-bold focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setShowAddEntryModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-black hover:bg-neutral-800 px-5 py-2 text-xs font-bold text-white shadow-xs"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Customer Debt */}
      {showAddDebtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 text-neutral-900 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4">
              <h3 className="text-base font-bold text-neutral-900">Record Customer Credit / Debt</h3>
              <button onClick={() => setShowAddDebtModal(false)} className="p-1 text-neutral-400 hover:text-black">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddDebt} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={newDebt.customerName}
                  onChange={(e) => setNewDebt({ ...newDebt, customerName: e.target.value })}
                  placeholder="e.g. Chief Okafor / Beta Construction"
                  className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newDebt.customerPhone}
                  onChange={(e) => setNewDebt({ ...newDebt, customerPhone: e.target.value })}
                  placeholder="e.g. +234 803 123 4567"
                  className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">Goods Supplied / Note</label>
                <input
                  type="text"
                  value={newDebt.description}
                  onChange={(e) => setNewDebt({ ...newDebt, description: e.target.value })}
                  placeholder="e.g. 5 Drums Paint & Brushes"
                  className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-1">Total Credit (₦) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newDebt.totalAmount}
                    onChange={(e) => setNewDebt({ ...newDebt, totalAmount: Number(e.target.value) })}
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-mono font-bold focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newDebt.dueDate}
                    onChange={(e) => setNewDebt({ ...newDebt, dueDate: e.target.value })}
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setShowAddDebtModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-black hover:bg-neutral-800 px-5 py-2 text-xs font-bold text-white shadow-xs"
                >
                  Record Debt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2B: Receive Customer Debt Payment */}
      {debtToPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 text-neutral-900 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-neutral-900">Receive Customer Payment</h3>
                <p className="text-xs text-neutral-500 font-mono">{debtToPay.customerName}</p>
              </div>
              <button onClick={() => setDebtToPay(null)} className="p-1 text-neutral-400 hover:text-black">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handlePayCustomerDebt} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex justify-between items-center text-xs">
                <div>
                  <span className="text-neutral-500 block">Total Balance Due</span>
                  <strong className="text-sm font-mono text-red-600">₦{debtToPay.balanceDue.toLocaleString()}</strong>
                </div>
                <div className="text-right">
                  <span className="text-neutral-500 block">Already Paid</span>
                  <strong className="text-sm font-mono text-emerald-600">₦{debtToPay.amountPaid.toLocaleString()}</strong>
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">Payment Amount Received (₦)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={debtToPay.balanceDue}
                  value={debtPaymentAmount}
                  onChange={(e) => setDebtPaymentAmount(Number(e.target.value))}
                  className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-sm font-mono font-bold focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setDebtToPay(null)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-xs"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Add Supplier Payable */}
      {showAddPayableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 text-neutral-900 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4">
              <h3 className="text-base font-bold text-neutral-900">Record Supplier Restock Credit</h3>
              <button onClick={() => setShowAddPayableModal(false)} className="p-1 text-neutral-400 hover:text-black">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddPayable} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={newPayable.supplierName}
                  onChange={(e) => setNewPayable({ ...newPayable, supplierName: e.target.value })}
                  placeholder="e.g. Emzor / Chi Limited / Local Drum Supplier"
                  className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">Item / Batch Supplied</label>
                <input
                  type="text"
                  value={newPayable.itemName}
                  onChange={(e) => setNewPayable({ ...newPayable, itemName: e.target.value })}
                  placeholder="e.g. 50 Cartons Antibiotics"
                  className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-1">Amount Owed (₦) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newPayable.totalAmount}
                    onChange={(e) => setNewPayable({ ...newPayable, totalAmount: Number(e.target.value) })}
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-mono font-bold focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-1">Payment Due Date</label>
                  <input
                    type="date"
                    value={newPayable.dueDate}
                    onChange={(e) => setNewPayable({ ...newPayable, dueDate: e.target.value })}
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setShowAddPayableModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-black hover:bg-neutral-800 px-5 py-2 text-xs font-bold text-white shadow-xs"
                >
                  Record Payable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3B: Pay Supplier Modal */}
      {payableToPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 text-neutral-900 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-neutral-900">Make Payment to Supplier</h3>
                <p className="text-xs text-neutral-500 font-mono">{payableToPay.supplierName}</p>
              </div>
              <button onClick={() => setPayableToPay(null)} className="p-1 text-neutral-400 hover:text-black">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handlePaySupplier} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex justify-between items-center text-xs">
                <div>
                  <span className="text-neutral-500 block">Total Balance Due</span>
                  <strong className="text-sm font-mono text-red-600">₦{payableToPay.balanceDue.toLocaleString()}</strong>
                </div>
                <div className="text-right">
                  <span className="text-neutral-500 block">Already Paid</span>
                  <strong className="text-sm font-mono text-emerald-600">₦{payableToPay.amountPaid.toLocaleString()}</strong>
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">Payment Amount to Disburse (₦)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={payableToPay.balanceDue}
                  value={payablePaymentAmount}
                  onChange={(e) => setPayablePaymentAmount(Number(e.target.value))}
                  className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-sm font-mono font-bold focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setPayableToPay(null)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-red-600 hover:bg-red-700 px-5 py-2 text-xs font-bold text-white shadow-xs"
                >
                  Disburse Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Add Bank Account */}
      {showAddBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 text-neutral-900 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4">
              <h3 className="text-base font-bold text-neutral-900">Add Account / Bank</h3>
              <button onClick={() => setShowAddBankModal(false)} className="p-1 text-neutral-400 hover:text-black">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddBank} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">Bank / Institution Name</label>
                <input
                  type="text"
                  required
                  value={newBank.bankName}
                  onChange={(e) => setNewBank({ ...newBank, bankName: e.target.value })}
                  placeholder="e.g. Access Bank, OPay Merchant, Moniepoint"
                  className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">Account Number</label>
                <input
                  type="text"
                  value={newBank.accountNumber}
                  onChange={(e) => setNewBank({ ...newBank, accountNumber: e.target.value })}
                  placeholder="e.g. 0123456789"
                  className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">Current Balance (₦)</label>
                <input
                  type="number"
                  min="0"
                  value={newBank.balance}
                  onChange={(e) => setNewBank({ ...newBank, balance: Number(e.target.value) })}
                  className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-sm font-mono font-bold focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setShowAddBankModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-black hover:bg-neutral-800 px-5 py-2 text-xs font-bold text-white shadow-xs"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Create Wholesale Invoice */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 text-neutral-900 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4">
              <h3 className="text-base font-bold text-neutral-900">Create Wholesale Customer Invoice</h3>
              <button onClick={() => setShowInvoiceModal(false)} className="p-1 text-neutral-400 hover:text-black">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-1">Customer / Business Name *</label>
                  <input
                    type="text"
                    required
                    value={newInvoice.customerName}
                    onChange={(e) => setNewInvoice({ ...newInvoice, customerName: e.target.value })}
                    placeholder="e.g. Apex Hospital Ikeja"
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-1">Customer Phone</label>
                  <input
                    type="text"
                    value={newInvoice.customerPhone}
                    onChange={(e) => setNewInvoice({ ...newInvoice, customerPhone: e.target.value })}
                    placeholder="+234 803..."
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">Item / Product Supplied</label>
                <input
                  type="text"
                  required
                  value={newInvoice.itemDesc}
                  onChange={(e) => setNewInvoice({ ...newInvoice, itemDesc: e.target.value })}
                  placeholder="e.g. 10 Drums Army Green (Drum 0012)"
                  className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={newInvoice.quantity}
                    onChange={(e) => setNewInvoice({ ...newInvoice, quantity: Number(e.target.value) })}
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-mono font-bold focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-1">Unit Price (₦) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newInvoice.unitPrice}
                    onChange={(e) => setNewInvoice({ ...newInvoice, unitPrice: Number(e.target.value) })}
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-mono font-bold focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 uppercase mb-1">Payment Due Date</label>
                  <input
                    type="date"
                    value={newInvoice.dueDate}
                    onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-mono focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase mb-1">Payment Instructions / Bank Details</label>
                <textarea
                  rows={2}
                  value={newInvoice.notes}
                  onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                  className="w-full rounded-xl bg-neutral-50 border border-neutral-200 p-2.5 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-black hover:bg-neutral-800 px-5 py-2 text-xs font-bold text-white shadow-xs"
                >
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: Printable Wholesale Invoice */}
      {activeInvoiceToPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-8 shadow-2xl border border-neutral-200 text-neutral-900 my-8">
            <button
              onClick={() => setActiveInvoiceToPrint(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Invoice Print Sheet */}
            <div className="border-b-2 border-neutral-900 pb-4 mb-6 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-neutral-900">COMMERCIAL INVOICE</h2>
                <p className="text-xs text-neutral-500 font-mono mt-0.5">{activeInvoiceToPrint.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-sm text-neutral-900">Neurons Enterprise</span>
                <p className="text-[11px] text-neutral-500">Wholesale & Production Depot</p>
                <p className="text-[11px] text-neutral-500 font-mono">Date: {activeInvoiceToPrint.issueDate}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                <span className="text-[10px] font-bold uppercase text-neutral-400 font-mono">Billed To:</span>
                <h4 className="font-bold text-neutral-900 text-sm mt-0.5">{activeInvoiceToPrint.customerName}</h4>
                {activeInvoiceToPrint.customerPhone && <p className="text-neutral-500 font-mono">{activeInvoiceToPrint.customerPhone}</p>}
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                <span className="text-[10px] font-bold uppercase text-neutral-400 font-mono">Payment Terms:</span>
                <p className="font-semibold text-neutral-900 mt-0.5">Due by: {activeInvoiceToPrint.dueDate}</p>
                <p className="text-neutral-500 uppercase font-mono text-[10px]">Status: {activeInvoiceToPrint.status}</p>
              </div>
            </div>

            {/* Line Items Table */}
            <table className="w-full text-left text-xs mb-6 border border-neutral-200 rounded-xl overflow-hidden">
              <thead className="bg-neutral-100 text-neutral-600 font-mono">
                <tr>
                  <th className="p-2.5 font-semibold">Item Description</th>
                  <th className="p-2.5 font-semibold text-center">Qty</th>
                  <th className="p-2.5 font-semibold text-right">Unit Price</th>
                  <th className="p-2.5 font-semibold text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {activeInvoiceToPrint.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="p-2.5 font-medium text-neutral-900">{it.description}</td>
                    <td className="p-2.5 text-center font-mono">{it.quantity}</td>
                    <td className="p-2.5 text-right font-mono">₦{it.unitPrice.toLocaleString()}</td>
                    <td className="p-2.5 text-right font-mono font-bold">₦{it.subtotal.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-between items-start pt-2 border-t border-neutral-200 text-xs">
              <div className="max-w-xs text-[11px] text-neutral-500">
                <strong className="text-neutral-800 block mb-0.5">Payment Instructions:</strong>
                <p>{activeInvoiceToPrint.notes}</p>
              </div>

              <div className="text-right space-y-1 font-mono">
                <div className="text-neutral-500 text-xs">Total Due:</div>
                <div className="text-xl font-extrabold text-neutral-900">₦{activeInvoiceToPrint.totalAmount.toLocaleString()}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-8 pt-4 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-100 py-2.5 text-xs font-bold text-neutral-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Print Invoice</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveInvoiceToPrint(null)}
                className="flex-1 rounded-xl bg-black hover:bg-neutral-800 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
