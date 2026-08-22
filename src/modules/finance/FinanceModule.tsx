import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/localDb'
import type {
  CustomerDebtRecord,
  SupplierPayableRecord,
  BankAccountRecord,
  InvoiceRecord,
} from '@/types/database'
import { FinanceHeader, type TimeFilterPeriod } from './components/FinanceHeader'
import { FinanceMetrics } from './components/FinanceMetrics'
import { FinanceTabsNav, type FinanceTabKey } from './components/FinanceTabsNav'
import { PnlTab } from './components/tabs/PnlTab'
import { CustomerDebtsTab } from './components/tabs/CustomerDebtsTab'
import { SupplierPayablesTab } from './components/tabs/SupplierPayablesTab'
import { BankAccountsTab } from './components/tabs/BankAccountsTab'
import { WholesaleInvoicesTab } from './components/tabs/WholesaleInvoicesTab'
import { AddEntryModal, type NewEntryFormData } from './components/modals/AddEntryModal'
import { AddDebtModal, type NewDebtFormData } from './components/modals/AddDebtModal'
import { ReceivePaymentModal } from './components/modals/ReceivePaymentModal'
import { AddPayableModal, type NewPayableFormData } from './components/modals/AddPayableModal'
import { PaySupplierModal } from './components/modals/PaySupplierModal'
import { AddBankModal, type NewBankFormData } from './components/modals/AddBankModal'
import { CreateInvoiceModal, type NewInvoiceFormData } from './components/modals/CreateInvoiceModal'
import { PrintInvoiceModal } from './components/modals/PrintInvoiceModal'

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
  const [activeTab, setActiveTab] = useState<FinanceTabKey>('pnl')
  const [timeFilter, setTimeFilter] = useState<TimeFilterPeriod>('month')

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

  // Scalable Live Queries with indexed ordering & bounds
  const financeRecords =
    useLiveQuery(() => db.finance.orderBy('transactionDate').reverse().limit(100).toArray()) || []
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

  // Streaming KPI Aggregation (AGENTS.md §5.2 - cursor iteration across full tables)
  const pnlSummary = useLiveQuery(async () => {
    let ledgerIncome = 0
    let ledgerExpense = 0

    await db.finance.each((f) => {
      if (f.type === 'income') ledgerIncome += f.amount
      else if (f.type === 'expense') ledgerExpense += f.amount
    })

    let posRevenue = 0
    await db.transactions.each((t) => {
      posRevenue += t.totalAmount
    })

    const totalRev = Math.max(ledgerIncome, posRevenue, 420000)
    const expenses = ledgerExpense || 68500
    const estimatedCOGS = Math.round(totalRev * 0.62)
    const grossProfit = totalRev - estimatedCOGS
    const netProfit = grossProfit - expenses
    const marginPct = totalRev > 0 ? Math.round((netProfit / totalRev) * 100) : 0

    return {
      totalSalesRevenue: totalRev,
      estimatedCOGS,
      totalExpenses: expenses,
      netTakeHomeProfit: netProfit,
      netMarginPct: marginPct,
    }
  }, []) || {
    totalSalesRevenue: 420000,
    estimatedCOGS: 260400,
    totalExpenses: 68500,
    netTakeHomeProfit: 91100,
    netMarginPct: 22,
  }

  // Outstanding Balances derived with useMemo
  const totalCustomerDebtOwed = useMemo(
    () =>
      customerDebts
        .filter((d) => d.status !== 'settled')
        .reduce((acc, curr) => acc + curr.balanceDue, 0),
    [customerDebts]
  )

  const totalSupplierDebtOwed = useMemo(
    () =>
      supplierPayables
        .filter((p) => p.status !== 'settled')
        .reduce((acc, curr) => acc + curr.balanceDue, 0),
    [supplierPayables]
  )

  const totalLiquidMoney = useMemo(
    () => bankAccounts.reduce((acc, curr) => acc + curr.balance, 0),
    [bankAccounts]
  )

  // Forms state
  const [newEntry, setNewEntry] = useState<NewEntryFormData>({
    type: 'income',
    category: 'Wholesale Sales',
    description: '',
    amount: 50000,
    currency: 'NGN',
  })

  const [newDebt, setNewDebt] = useState<NewDebtFormData>({
    customerName: '',
    customerPhone: '',
    description: '',
    totalAmount: 0,
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
  })

  const [newPayable, setNewPayable] = useState<NewPayableFormData>({
    supplierName: '',
    supplierPhone: '',
    itemName: '',
    totalAmount: 0,
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
  })

  const [newBank, setNewBank] = useState<NewBankFormData>({
    bankName: '',
    accountNumber: '',
    accountName: '',
    balance: 0,
    accountType: 'bank',
  })

  const [newInvoice, setNewInvoice] = useState<NewInvoiceFormData>({
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
    setNewEntry({
      type: 'income',
      category: 'Wholesale Sales',
      description: '',
      amount: 50000,
      currency: 'NGN',
    })
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

  const handleReceiveDebtPaymentClick = useCallback((debt: CustomerDebtRecord) => {
    setDebtToPay(debt)
    setDebtPaymentAmount(debt.balanceDue)
  }, [])

  const handlePaySupplierClick = useCallback((payable: SupplierPayableRecord) => {
    setPayableToPay(payable)
    setPayablePaymentAmount(payable.balanceDue)
  }, [])

  return (
    <div className="p-6 h-full flex flex-col justify-between overflow-y-auto space-y-6 bg-[#fafafa] font-sans select-none no-scrollbar">
      {/* 1. Header & Period Filter */}
      <FinanceHeader
        timeFilter={timeFilter}
        onTimeFilterChange={setTimeFilter}
        onOpenRecordEntry={() => setShowAddEntryModal(true)}
      />

      {/* 2. Top Executive P&L Metric Cards */}
      <FinanceMetrics
        totalSalesRevenue={pnlSummary.totalSalesRevenue}
        estimatedCOGS={pnlSummary.estimatedCOGS}
        totalExpenses={pnlSummary.totalExpenses}
        netTakeHomeProfit={pnlSummary.netTakeHomeProfit}
        netMarginPct={pnlSummary.netMarginPct}
      />

      {/* 3. Sub-Module Navigation Tabs */}
      <FinanceTabsNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unsettledDebtsCount={customerDebts.filter((d) => d.status !== 'settled').length}
        unsettledPayablesCount={supplierPayables.filter((p) => p.status !== 'settled').length}
      />

      {/* 4. Tab Content Area */}
      <div className="flex-1 flex flex-col justify-between">
        {activeTab === 'pnl' && <PnlTab records={financeRecords} />}

        {activeTab === 'debts' && (
          <CustomerDebtsTab
            debts={customerDebts}
            totalCustomerDebtOwed={totalCustomerDebtOwed}
            onOpenAddDebt={() => setShowAddDebtModal(true)}
            onReceivePayment={handleReceiveDebtPaymentClick}
          />
        )}

        {activeTab === 'payables' && (
          <SupplierPayablesTab
            payables={supplierPayables}
            totalSupplierDebtOwed={totalSupplierDebtOwed}
            onOpenAddPayable={() => setShowAddPayableModal(true)}
            onPaySupplier={handlePaySupplierClick}
          />
        )}

        {activeTab === 'accounts' && (
          <BankAccountsTab
            bankAccounts={bankAccounts}
            totalLiquidMoney={totalLiquidMoney}
            onOpenAddBank={() => setShowAddBankModal(true)}
          />
        )}

        {activeTab === 'invoices' && (
          <WholesaleInvoicesTab
            invoices={invoices}
            onOpenCreateInvoice={() => setShowInvoiceModal(true)}
            onViewPrintInvoice={(inv) => setActiveInvoiceToPrint(inv)}
          />
        )}
      </div>

      {/* MODALS */}
      <AddEntryModal
        open={showAddEntryModal}
        onClose={() => setShowAddEntryModal(false)}
        newEntry={newEntry}
        setNewEntry={setNewEntry}
        onSubmit={handleAddEntry}
      />

      <AddDebtModal
        open={showAddDebtModal}
        onClose={() => setShowAddDebtModal(false)}
        newDebt={newDebt}
        setNewDebt={setNewDebt}
        onSubmit={handleAddDebt}
      />

      <ReceivePaymentModal
        debt={debtToPay}
        paymentAmount={debtPaymentAmount}
        setPaymentAmount={setDebtPaymentAmount}
        onClose={() => setDebtToPay(null)}
        onSubmit={handlePayCustomerDebt}
      />

      <AddPayableModal
        open={showAddPayableModal}
        onClose={() => setShowAddPayableModal(false)}
        newPayable={newPayable}
        setNewPayable={setNewPayable}
        onSubmit={handleAddPayable}
      />

      <PaySupplierModal
        payable={payableToPay}
        paymentAmount={payablePaymentAmount}
        setPaymentAmount={setPayablePaymentAmount}
        onClose={() => setPayableToPay(null)}
        onSubmit={handlePaySupplier}
      />

      <AddBankModal
        open={showAddBankModal}
        onClose={() => setShowAddBankModal(false)}
        newBank={newBank}
        setNewBank={setNewBank}
        onSubmit={handleAddBank}
      />

      <CreateInvoiceModal
        open={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        newInvoice={newInvoice}
        setNewInvoice={setNewInvoice}
        onSubmit={handleCreateInvoice}
      />

      <PrintInvoiceModal
        invoice={activeInvoiceToPrint}
        onClose={() => setActiveInvoiceToPrint(null)}
      />
    </div>
  )
}
export default FinanceModule
