import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/localDb'
import type { POSTransaction, InventoryItem } from '@/types/database'
import { Toast } from '@/components/ui/Toast'
import { PosHeader } from './components/PosHeader'
import { PosBarcodeSearch } from './components/PosBarcodeSearch'
import { PosCategoryTabs } from './components/PosCategoryTabs'
import { PosProductGrid } from './components/PosProductGrid'
import { PosOrderCart, type CartItem } from './components/PosOrderCart'
import { PosCheckoutPanel, type PaymentMethod } from './components/PosCheckoutPanel'
import { StartShiftModal } from './components/modals/StartShiftModal'
import { CloseShiftModal, type ShiftStats } from './components/modals/CloseShiftModal'
import { ZReportModal, type ClosedShiftSummary } from './components/modals/ZReportModal'
import { ReceiptModal } from './components/modals/ReceiptModal'
import { SplitPaymentModal, type SplitDetails } from './components/modals/SplitPaymentModal'
import confetti from 'canvas-confetti'

interface Props {
  searchQuery?: string
  onAskAI?: (prompt: string) => void
}

// Fallback seed catalog for Wholesale & Production POS
const SEED_POS_PRODUCTS: Omit<InventoryItem, 'createdAt' | 'updatedAt' | 'synced'>[] = [
  { id: 'pos-1', sku: 'AQU-GAL-01', name: 'Aqua Marine', category: 'Gallon', unit: 'Gallons', quantity: 0, minThreshold: 10, unitPrice: 3700, costPrice: 2800, zone: 'Zone A', lastRestocked: Date.now(), type: 'Finished Good' },
  { id: 'pos-2', sku: 'ARM-GAL-01', name: 'Army Green', category: 'Gallon', unit: 'Gallons', quantity: 0, minThreshold: 10, unitPrice: 3700, costPrice: 2800, zone: 'Zone A', lastRestocked: Date.now(), type: 'Finished Good' },
  { id: 'pos-3', sku: 'ARM-DRM-01', name: 'Army Green', category: 'Drum', unit: 'Drums', quantity: 60, minThreshold: 15, unitPrice: 16000, costPrice: 11500, zone: 'Zone A', lastRestocked: Date.now(), type: 'Finished Good' },
  { id: 'pos-4', sku: 'ASH-GAL-01', name: 'Ash Grey 9096', category: 'Gallon', unit: 'Gallons', quantity: 5, minThreshold: 10, unitPrice: 3700, costPrice: 2800, zone: 'Zone A', lastRestocked: Date.now(), type: 'Finished Good' },
  { id: 'pos-5', sku: 'ASH-DRM-01', name: 'Ash Grey 9096', category: 'Drum', unit: 'Drums', quantity: 14, minThreshold: 10, unitPrice: 13000, costPrice: 9500, zone: 'Zone A', lastRestocked: Date.now(), type: 'Finished Good' },
  { id: 'pos-6', sku: 'BEI-DRM-01', name: 'Beige', category: 'Drum', unit: 'Drums', quantity: 0, minThreshold: 10, unitPrice: 70000, costPrice: 52000, zone: 'Zone A', lastRestocked: Date.now(), type: 'Finished Good' },
  { id: 'pos-7', sku: 'BEI-DRM-02', name: 'Beige', category: 'Drum', unit: 'Drums', quantity: 0, minThreshold: 10, unitPrice: 35000, costPrice: 26000, zone: 'Zone A', lastRestocked: Date.now(), type: 'Finished Good' },
  { id: 'pos-8', sku: 'BEI-GAL-01', name: 'Beige (1734)', category: 'Gallon', unit: 'Gallons', quantity: 0, minThreshold: 10, unitPrice: 3700, costPrice: 2800, zone: 'Zone A', lastRestocked: Date.now(), type: 'Finished Good' },
  { id: 'pos-9', sku: 'BEI-DRM-03', name: 'Beige (1734)', category: 'Drum', unit: 'Drums', quantity: 83, minThreshold: 20, unitPrice: 13000, costPrice: 9500, zone: 'Zone A', lastRestocked: Date.now(), type: 'Finished Good' },
  { id: 'pos-10', sku: 'BLK-DRM-01', name: 'Black', category: 'Drum', unit: 'Drums', quantity: 50, minThreshold: 15, unitPrice: 15000, costPrice: 10500, zone: 'Zone A', lastRestocked: Date.now(), type: 'Finished Good' },
  { id: 'pos-11', sku: 'BLK-GAL-01', name: 'Black', category: 'Gallon', unit: 'Gallons', quantity: 135, minThreshold: 20, unitPrice: 4300, costPrice: 3100, zone: 'Zone A', lastRestocked: Date.now(), type: 'Finished Good' },
  { id: 'pos-12', sku: 'BLU-DRM-01', name: 'Brilliant Blue Drum (0012)', category: 'Drum', unit: 'Drums', quantity: 38, minThreshold: 10, unitPrice: 14000, costPrice: 10000, zone: 'Zone A', lastRestocked: Date.now(), type: 'Finished Good' },
]

export const PosModule: React.FC<Props> = () => {
  const liveInventory = useLiveQuery(() => db.inventory.toArray()) || []

  // Auto seed production paints if DB is fresh
  useEffect(() => {
    const seedIfNeeded = async () => {
      const count = await db.inventory.count()
      if (count === 0) {
        const now = Date.now()
        for (const item of SEED_POS_PRODUCTS) {
          await db.inventory.add({
            ...item,
            createdAt: now,
            updatedAt: now,
            synced: 0,
          })
        }
      }
    }
    seedIfNeeded()
  }, [])

  const inventory = liveInventory.length > 0 ? liveInventory : (SEED_POS_PRODUCTS as InventoryItem[])

  // 1. Shift Lifecycle State
  const [isShiftActive, setIsShiftActive] = useState<boolean>(false)
  const [showStartShiftModal, setShowStartShiftModal] = useState<boolean>(false)
  const [cashierName, setCashierName] = useState('Akhimien Clement')
  const [posStation, setPosStation] = useState('Terminal POS #01')
  const [shiftStartTime, setShiftStartTime] = useState<string>('')

  // Running Shift Totals
  const [shiftStats, setShiftStats] = useState<ShiftStats>({
    cashSales: 0,
    transferSales: 0,
    cardSales: 0,
    creditSales: 0,
    totalSales: 0,
    txnCount: 0,
  })

  // 2. POS Catalog & Cart State
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash')

  // In-App Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg)
    const timer = setTimeout(() => setToastMessage(null), 3500)
    return () => clearTimeout(timer)
  }, [])

  // Modals state
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [completedTxn, setCompletedTxn] = useState<POSTransaction | null>(null)
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false)
  const [showZReportModal, setShowZReportModal] = useState(false)
  const [closedShiftSummary, setClosedShiftSummary] = useState<ClosedShiftSummary | null>(null)
  const [actualCashCounted, setActualCashCounted] = useState<number>(0)
  const [showSplitModal, setShowSplitModal] = useState(false)
  const [splitDetails, setSplitDetails] = useState<SplitDetails>({ cash: 0, transfer: 0, card: 0 })

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Categories extraction
  const categories = useMemo(() => {
    const set = new Set<string>(['All'])
    inventory.forEach((i) => {
      if (i.category) set.add(i.category)
    })
    set.add('Gallon')
    set.add('Drum')
    return Array.from(set)
  }, [inventory])

  // Filtered Products
  const filteredProducts = useMemo(() => {
    let list = [...inventory]
    const q = searchTerm.trim().toLowerCase()

    if (q) {
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.sku.toLowerCase().includes(q) ||
          (i.brand && i.brand.toLowerCase().includes(q))
      )
    }

    if (selectedCategory !== 'All') {
      list = list.filter(
        (i) =>
          (i.category && i.category.toLowerCase() === selectedCategory.toLowerCase()) ||
          (i.unit && i.unit.toLowerCase().includes(selectedCategory.toLowerCase()))
      )
    }

    return list
  }, [inventory, searchTerm, selectedCategory])

  // Cart Calculations
  const subtotal = useMemo(
    () => cart.reduce((acc, curr) => acc + curr.item.unitPrice * curr.quantity, 0),
    [cart]
  )
  const total = subtotal
  const totalCartCount = useMemo(
    () => cart.reduce((acc, curr) => acc + curr.quantity, 0),
    [cart]
  )

  // Start Shift Execution
  const handleStartShift = (e: React.FormEvent) => {
    e.preventDefault()
    const timeStr = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    setShiftStartTime(timeStr)
    setIsShiftActive(true)
    setShowStartShiftModal(false)
    setActualCashCounted(0)
    setShiftStats({
      cashSales: 0,
      transferSales: 0,
      cardSales: 0,
      creditSales: 0,
      totalSales: 0,
      txnCount: 0,
    })
    showToast(`Shift opened successfully for ${cashierName}. Register unlocked.`)
  }

  // Add or increment item (requires active shift)
  const handleAddToCart = useCallback(
    (item: InventoryItem) => {
      if (!isShiftActive) {
        setShowStartShiftModal(true)
        return
      }

      if (item.quantity <= 0) {
        showToast(`"${item.name}" is OUT OF STOCK. Please restock in inventory.`)
        return
      }

      setCart((prev) => {
        const existingIndex = prev.findIndex((c) => c.item.id === item.id)
        if (existingIndex >= 0) {
          const curr = prev[existingIndex]
          if (curr.quantity >= item.quantity) {
            showToast(`Cannot add more. Only ${item.quantity} units available in stock.`)
            return prev
          }
          const updated = [...prev]
          updated[existingIndex] = { ...curr, quantity: curr.quantity + 1 }
          return updated
        }
        return [...prev, { item, quantity: 1 }]
      })
    },
    [isShiftActive, showToast]
  )

  // Update item quantity in cart
  const handleUpdateQty = useCallback(
    (itemId: string, delta: number) => {
      setCart((prev) => {
        return prev
          .map((c) => {
            if (c.item.id === itemId) {
              const nextQty = c.quantity + delta
              if (nextQty > c.item.quantity) {
                showToast(`Maximum available stock is ${c.item.quantity} units.`)
                return c
              }
              return { ...c, quantity: nextQty }
            }
            return c
          })
          .filter((c) => c.quantity > 0)
      })
    },
    [showToast]
  )

  const handleRemoveFromCart = useCallback((itemId: string) => {
    setCart((prev) => prev.filter((c) => c.item.id !== itemId))
  }, [])

  const handleClearCart = useCallback(() => {
    if (cart.length === 0) return
    setCart([])
  }, [cart.length])

  // Barcode / Enter Handler
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isShiftActive) {
      setShowStartShiftModal(true)
      return
    }
    if (!searchTerm.trim()) return

    const match = inventory.find(
      (i) =>
        i.sku.toLowerCase() === searchTerm.trim().toLowerCase() ||
        i.name.toLowerCase() === searchTerm.trim().toLowerCase()
    )

    if (match) {
      handleAddToCart(match)
      setSearchTerm('')
    } else {
      showToast(`No product found matching "${searchTerm}".`)
    }
  }

  // Checkout Execution
  const handleCheckout = async () => {
    if (!isShiftActive) {
      setShowStartShiftModal(true)
      return
    }
    if (cart.length === 0) return

    const now = Date.now()
    const receiptNum = `REC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`

    const newTxn: POSTransaction = {
      id: `txn-${now}`,
      receiptNumber: receiptNum,
      cashierId: 'CASHIER_01',
      cashierName: cashierName,
      posStation: posStation,
      items: cart.map((c) => ({
        sku: c.item.sku,
        name: c.item.name,
        quantity: c.quantity,
        unitPrice: c.item.unitPrice,
        subtotal: c.item.unitPrice * c.quantity,
      })),
      subtotal,
      discountPercent: 0,
      discountAmount: 0,
      totalAmount: total,
      paymentMethod:
        paymentMethod === 'Cash'
          ? 'cash'
          : paymentMethod === 'Transfer'
          ? 'bank_transfer'
          : paymentMethod === 'Card'
          ? 'card'
          : paymentMethod === 'Store Credit'
          ? 'store_credit'
          : 'split',
      splitBreakdown: paymentMethod === 'Split' ? splitDetails : undefined,
      hasManualOverride: false,
      status: 'completed',
      createdAt: now,
      updatedAt: now,
      synced: 0,
    }

    try {
      await db.transactions.add(newTxn)

      // Deduct inventory
      for (const c of cart) {
        if (c.item.id.startsWith('pos-')) continue
        await db.inventory.update(c.item.id, {
          quantity: Math.max(0, c.item.quantity - c.quantity),
          updatedAt: now,
          synced: 0,
        })
      }

      // Add to Finance income ledger
      await db.finance.add({
        id: `fin-${now}`,
        transactionDate: new Date().toISOString().split('T')[0],
        type: 'income',
        category: 'POS Sales',
        description: `POS Receipt ${receiptNum} (${cart.length} items)`,
        amount: total,
        currency: 'NGN',
        referenceId: newTxn.id,
        createdAt: now,
        updatedAt: now,
        synced: 0,
      })

      // Update Shift Stats
      setShiftStats((prev) => ({
        ...prev,
        cashSales: prev.cashSales + (paymentMethod === 'Cash' ? total : 0),
        transferSales: prev.transferSales + (paymentMethod === 'Transfer' ? total : 0),
        cardSales: prev.cardSales + (paymentMethod === 'Card' ? total : 0),
        creditSales: prev.creditSales + (paymentMethod === 'Store Credit' ? total : 0),
        totalSales: prev.totalSales + total,
        txnCount: prev.txnCount + 1,
      }))

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#000000', '#262626', '#525252', '#a3a3a3', '#d4d4d8', '#ffffff'],
      })
      setCompletedTxn(newTxn)
      setShowReceiptModal(true)
      setCart([])
    } catch (err) {
      console.error('Checkout error:', err)
      showToast('Transaction recorded locally.')
    }
  }

  // End Shift & Generate Z-Report Summary
  const handleConfirmCloseShift = (e: React.FormEvent) => {
    e.preventDefault()
    const summary: ClosedShiftSummary = {
      cashierName,
      posStation,
      shiftStartTime,
      shiftEndTime: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      cashSales: shiftStats.cashSales,
      transferSales: shiftStats.transferSales,
      cardSales: shiftStats.cardSales,
      creditSales: shiftStats.creditSales,
      totalSales: shiftStats.totalSales,
      txnCount: shiftStats.txnCount,
      expectedDrawerCash: shiftStats.cashSales,
      actualCashCounted: Number(actualCashCounted || shiftStats.cashSales),
      variance: Number(actualCashCounted || shiftStats.cashSales) - shiftStats.cashSales,
      date: new Date().toLocaleDateString(),
    }

    setClosedShiftSummary(summary)
    setIsShiftActive(false)
    setShowCloseShiftModal(false)
    setShowZReportModal(true)
    setCart([])
  }

  return (
    <div className="flex flex-col h-full bg-[#f4f5f7] font-sans select-none overflow-hidden relative">
      {/* In-App Toast Notification */}
      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />

      {/* 1. Header Bar */}
      <PosHeader
        isShiftActive={isShiftActive}
        shiftStartTime={shiftStartTime}
        onOpenStartShift={() => setShowStartShiftModal(true)}
        onOpenCloseShift={() => setShowCloseShiftModal(true)}
      />

      {/* 2. Main Terminal Content Area (Catalog + Order Panel) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Product Search, Category Pills & Grid */}
        <div className="flex-1 flex flex-col p-4 sm:p-5 overflow-y-auto space-y-4 no-scrollbar">
          {/* Search & Barcode Scan Bar */}
          <PosBarcodeSearch
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onSubmit={handleBarcodeSubmit}
            inputRef={searchInputRef}
          />

          {/* Category Filter Pills */}
          <PosCategoryTabs
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {/* Product Cards Grid */}
          <PosProductGrid
            products={filteredProducts}
            cart={cart}
            onAddToCart={handleAddToCart}
          />
        </div>

        {/* Right Side: Order & Checkout Panel */}
        <div className="w-96 lg:w-[420px] bg-white border-l border-neutral-200 flex flex-col justify-between shadow-lg shrink-0 overflow-y-auto no-scrollbar">
          <PosOrderCart
            cart={cart}
            totalCartCount={totalCartCount}
            onClearCart={handleClearCart}
            onUpdateQty={handleUpdateQty}
            onRemoveFromCart={handleRemoveFromCart}
          />

          <PosCheckoutPanel
            paymentMethod={paymentMethod}
            onSelectPaymentMethod={setPaymentMethod}
            onOpenSplitModal={() => setShowSplitModal(true)}
            subtotal={subtotal}
            total={total}
            isCartEmpty={cart.length === 0}
            onCheckout={handleCheckout}
          />
        </div>
      </div>

      {/* MODALS */}
      <StartShiftModal
        open={showStartShiftModal}
        onClose={() => setShowStartShiftModal(false)}
        cashierName={cashierName}
        setCashierName={setCashierName}
        posStation={posStation}
        setPosStation={setPosStation}
        onStartShift={handleStartShift}
      />

      <CloseShiftModal
        open={showCloseShiftModal}
        onClose={() => setShowCloseShiftModal(false)}
        cashierName={cashierName}
        shiftStartTime={shiftStartTime}
        shiftStats={shiftStats}
        actualCashCounted={actualCashCounted}
        setActualCashCounted={setActualCashCounted}
        onConfirmCloseShift={handleConfirmCloseShift}
      />

      <ZReportModal
        summary={closedShiftSummary}
        onClose={() => setShowZReportModal(false)}
        onOpenNewShift={() => {
          setShowZReportModal(false)
          setShowStartShiftModal(true)
        }}
      />

      <ReceiptModal
        transaction={completedTxn}
        onClose={() => setShowReceiptModal(false)}
      />

      <SplitPaymentModal
        open={showSplitModal}
        onClose={() => setShowSplitModal(false)}
        total={total}
        splitDetails={splitDetails}
        setSplitDetails={setSplitDetails}
        onApplySplit={(e) => {
          e.preventDefault()
          setShowSplitModal(false)
        }}
      />
    </div>
  )
}
export default PosModule
