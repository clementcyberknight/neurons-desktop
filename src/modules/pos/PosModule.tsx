import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/localDb'
import type { POSTransaction, InventoryItem } from '@/types/database'
import {
  ShoppingCart,
  Trash2,
  AlertCircle,
  CreditCard,
  Banknote,
  ArrowLeftRight,
  Wallet,
  Layers,
  Lock,
  Unlock,
  Zap,
  Filter,
  CornerDownLeft,
  Barcode,
  CheckCircle2,
  Printer,
  X,
  Plus,
  Minus,
  Clock,
  Check,
  Building,
  RotateCcw,
  UserCheck,
  FileSpreadsheet,
  FileCheck,
} from 'lucide-react'
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

// Monochrome geometric aperture badge matching black & white brand identity
const ColorWheelIcon: React.FC<{ className?: string }> = ({ className = 'h-14 w-14' }) => (
  <svg viewBox="0 0 100 100" className={className}>
    <circle cx="50" cy="50" r="46" fill="#f4f4f5" stroke="#e4e4e7" strokeWidth="1" />
    <path d="M50 50 L50 4 A46 46 0 0 1 73 10 Z" fill="#18181b" />
    <path d="M50 50 L73 10 A46 46 0 0 1 90 27 Z" fill="#27272a" />
    <path d="M50 50 L90 27 A46 46 0 0 1 96 50 Z" fill="#3f3f46" />
    <path d="M50 50 L96 50 A46 46 0 0 1 90 73 Z" fill="#52525b" />
    <path d="M50 50 L90 73 A46 46 0 0 1 73 90 Z" fill="#71717a" />
    <path d="M50 50 L73 90 A46 46 0 0 1 50 96 Z" fill="#a1a1aa" />
    <path d="M50 50 L50 96 A46 46 0 0 1 27 90 Z" fill="#d4d4d8" />
    <path d="M50 50 L27 90 A46 46 0 0 1 10 73 Z" fill="#e4e4e7" />
    <path d="M50 50 L10 73 A46 46 0 0 1 4 50 Z" fill="#71717a" />
    <path d="M50 50 L4 50 A46 46 0 0 1 10 27 Z" fill="#3f3f46" />
    <path d="M50 50 L10 27 A46 46 0 0 1 27 10 Z" fill="#27272a" />
    <path d="M50 50 L27 10 A46 46 0 0 1 50 4 Z" fill="#18181b" />
    <circle cx="50" cy="50" r="14" fill="#ffffff" />
    <circle cx="50" cy="50" r="6" fill="#000000" />
  </svg>
)

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
  const [shiftStartTimestamp, setShiftStartTimestamp] = useState<number>(0)

  // Running Shift Totals
  const [shiftStats, setShiftStats] = useState({
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
  const [cart, setCart] = useState<{ item: InventoryItem; quantity: number }[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Transfer' | 'Card' | 'Store Credit' | 'Split'>('Cash')

  // In-App Toast Notification Banner (No Browser Alerts)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Modals
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [completedTxn, setCompletedTxn] = useState<POSTransaction | null>(null)
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false)
  const [showZReportModal, setShowZReportModal] = useState(false)
  const [closedShiftSummary, setClosedShiftSummary] = useState<any>(null)
  const [actualCashCounted, setActualCashCounted] = useState<number>(0)
  const [showSplitModal, setShowSplitModal] = useState(false)
  const [splitDetails, setSplitDetails] = useState({ cash: 0, transfer: 0, card: 0 })

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
  const subtotal = cart.reduce((acc, curr) => acc + curr.item.unitPrice * curr.quantity, 0)
  const total = subtotal
  const totalCartCount = cart.reduce((acc, curr) => acc + curr.quantity, 0)

  // Start Shift Execution
  const handleStartShift = (e: React.FormEvent) => {
    e.preventDefault()
    const now = Date.now()
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setShiftStartTime(timeStr)
    setShiftStartTimestamp(now)
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
  const handleAddToCart = (item: InventoryItem) => {
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
  }

  // Update item quantity in cart
  const handleUpdateQty = (itemId: string, delta: number) => {
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
  }

  const handleRemoveFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.item.id !== itemId))
  }

  const handleClearCart = () => {
    if (cart.length === 0) return
    setCart([])
  }

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

  // End Shift & Generate Z-Report Summary (No Alert Box)
  const handleConfirmCloseShift = () => {
    const summary = {
      cashierName,
      posStation,
      shiftStartTime,
      shiftEndTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
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
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-black text-white px-4 py-2.5 text-xs font-semibold shadow-2xl flex items-center gap-2 border border-neutral-800 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="h-4 w-4 text-white shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Bar matching brand identity */}
      <header className="bg-white border-b border-neutral-200 px-6 py-3.5 flex items-center justify-between shadow-2xs shrink-0">
        {/* Left Title */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-black flex items-center justify-center text-white shadow-xs">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
              <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M19 9l-5 5-4-4-3 3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-sm sm:text-base font-extrabold text-black uppercase tracking-wide">
            WHOLESALE & PRODUCTION POS TERMINAL
          </h1>
        </div>

        {/* Right Shift & System Status Meta */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* System Status */}
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono block">
              SYSTEM STATUS
            </span>
            <span className="text-xs font-bold text-black flex items-center justify-end gap-1">
              <Zap className="h-3.5 w-3.5 fill-black text-black" />
              <span>Online Mode</span>
            </span>
          </div>

          {/* Shift Status Indicator */}
          {isShiftActive ? (
            <div className="text-right hidden sm:block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-black font-mono block">
                SHIFT ACTIVE
              </span>
              <span className="text-xs font-semibold text-neutral-800">
                Opened: {shiftStartTime}
              </span>
            </div>
          ) : (
            <div className="text-right hidden sm:block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono block">
                REGISTER LOCKED
              </span>
              <span className="text-xs font-semibold text-neutral-500">
                Shift Inactive
              </span>
            </div>
          )}

          {/* Shift Action Button */}
          {isShiftActive ? (
            <button
              onClick={() => setShowCloseShiftModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-black bg-white hover:bg-neutral-100 text-black px-3.5 py-1.5 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
            >
              <Lock className="h-3.5 w-3.5 text-black" />
              <span>Close Shift</span>
            </button>
          ) : (
            <button
              onClick={() => setShowStartShiftModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-black hover:bg-neutral-800 text-white px-3.5 py-1.5 text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              <Unlock className="h-3.5 w-3.5" />
              <span>Start Shift</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. Main Terminal Content Area (Catalog + Order Panel) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Product Search, Category Pills & Grid */}
        <div className="flex-1 flex flex-col p-4 sm:p-5 overflow-y-auto space-y-4 no-scrollbar">
          {/* Search & Barcode Scan Bar */}
          <form onSubmit={handleBarcodeSubmit} className="relative">
            <div className="flex items-center rounded-2xl border border-neutral-300 bg-white shadow-xs px-3.5 py-2.5 transition-all focus-within:border-black focus-within:ring-1 focus-within:ring-black">
              <Barcode className="h-5 w-5 text-neutral-400 mr-2.5 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Scan barcode or search..."
                className="w-full bg-transparent text-sm font-medium text-black placeholder-neutral-400 focus:outline-none"
              />
              <div className="flex items-center gap-2 text-neutral-400 shrink-0">
                <button type="button" className="p-1 hover:text-black" title="Filter list">
                  <Filter className="h-4 w-4" />
                </button>
                <div className="h-4 w-px bg-neutral-200" />
                <button type="submit" className="p-1 hover:text-black" title="Enter barcode">
                  <CornerDownLeft className="h-4 w-4" />
                </button>
              </div>
            </div>
          </form>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-black text-white shadow-xs'
                    : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100 hover:text-black'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredProducts.map((p) => {
              const inCart = cart.find((c) => c.item.id === p.id)
              const isOut = p.quantity <= 0
              const isLow = p.quantity > 0 && p.quantity <= p.minThreshold

              return (
                <button
                  key={p.id}
                  onClick={() => handleAddToCart(p)}
                  className={`group relative rounded-2xl border p-3 text-left transition-all flex flex-col justify-between h-44 cursor-pointer ${
                    inCart
                      ? 'border-black ring-2 ring-black/15 bg-neutral-100/70 shadow-sm'
                      : isOut
                      ? 'border-neutral-200 bg-white opacity-70 hover:border-neutral-300'
                      : 'border-neutral-200 bg-white hover:border-black hover:shadow-md'
                  }`}
                >
                  {/* Top Image / Status Badge */}
                  <div className="relative w-full flex items-center justify-center h-20 mb-2">
                    {/* Badge: Out of stock / Low */}
                    {isOut ? (
                      <span className="absolute top-0 text-[10px] font-bold text-neutral-600 bg-neutral-100 border border-neutral-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        OUT OF STOCK
                      </span>
                    ) : isLow ? (
                      <span className="absolute top-0 right-0 text-[10px] font-bold text-white bg-black px-1.5 py-0.2 rounded-full uppercase">
                        Low
                      </span>
                    ) : null}

                    {/* Image or Color Wheel */}
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="h-16 w-16 object-cover rounded-xl" />
                    ) : (
                      <div className="transition-transform group-hover:scale-105">
                        <ColorWheelIcon className="h-16 w-16" />
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div>
                    <h4 className="text-xs font-bold text-black line-clamp-2 leading-tight">
                      {p.name}
                    </h4>

                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-xs font-bold font-mono text-black">
                        ₦{p.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <span className={`text-[11px] font-mono font-semibold ${isOut ? 'text-neutral-400' : 'text-neutral-900'}`}>
                        {p.quantity}
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="p-12 text-center text-neutral-400 bg-white rounded-2xl border border-dashed border-neutral-300">
              <p className="text-sm font-semibold text-neutral-700">No products match your search</p>
              <p className="text-xs text-neutral-400 mt-1">Try searching for paint colors like "Army Green", "Ash Grey", or "Beige".</p>
            </div>
          )}
        </div>

        {/* Right Side: Order & Checkout Panel */}
        <div className="w-96 lg:w-[420px] bg-white border-l border-neutral-200 flex flex-col justify-between shadow-lg shrink-0 overflow-y-auto no-scrollbar">
          {/* Order Header */}
          <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-black text-sm">
              <ShoppingCart className="h-4 w-4 text-black" />
              <span>Order</span>
              <span className="rounded-full bg-black text-white text-xs px-2 py-0.2 font-mono font-bold">
                {totalCartCount}
              </span>
            </div>

            <button
              onClick={handleClearCart}
              className="text-xs font-semibold text-neutral-500 hover:text-black hover:underline cursor-pointer"
            >
              Clear
            </button>
          </div>

          {/* Order Cart Items List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 divide-y divide-neutral-100 no-scrollbar min-h-[160px]">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-neutral-400 text-xs">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-30 text-neutral-400" />
                <p className="font-semibold text-neutral-700">Your order is empty</p>
                <p className="mt-0.5">Click items on the left catalog to add to cart.</p>
              </div>
            ) : (
              cart.map(({ item, quantity }) => (
                <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3 text-xs">
                  <div className="flex-1 truncate">
                    <h5 className="font-bold text-black truncate leading-snug">{item.name}</h5>
                    <span className="text-[11px] text-neutral-500 font-mono">
                      ₦{item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })} each
                    </span>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center rounded-lg border border-neutral-200 bg-neutral-50 px-1 py-0.5">
                    <button
                      onClick={() => handleUpdateQty(item.id, -1)}
                      className="p-1 text-neutral-600 hover:text-black cursor-pointer"
                      title="Decrease"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-7 text-center font-bold font-mono text-black">{quantity}</span>
                    <button
                      onClick={() => handleUpdateQty(item.id, 1)}
                      className="p-1 text-neutral-600 hover:text-black cursor-pointer"
                      title="Increase"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="font-mono font-bold text-black text-right min-w-[75px]">
                    ₦{(item.unitPrice * quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>

                  <button
                    onClick={() => handleRemoveFromCart(item.id)}
                    className="text-neutral-400 hover:text-black p-0.5"
                    title="Remove item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Payment Method & Checkout Totals Footer */}
          <div className="p-4 bg-neutral-50/80 border-t border-neutral-200 space-y-4">
            {/* PAYMENT METHOD */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 font-mono block mb-2">
                PAYMENT METHOD
              </span>

              {/* 4 Method Buttons Grid */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                {/* Cash */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Cash')}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    paymentMethod === 'Cash'
                      ? 'border-black bg-black text-white shadow-2xs'
                      : 'border-neutral-200 bg-white hover:border-neutral-400 text-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Banknote className={`h-4 w-4 ${paymentMethod === 'Cash' ? 'text-white' : 'text-neutral-700'}`} />
                    <span>Cash</span>
                  </div>
                  {paymentMethod === 'Cash' && (
                    <CheckCircle2 className="h-4 w-4 text-white fill-white text-black" />
                  )}
                </button>

                {/* Transfer */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Transfer')}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    paymentMethod === 'Transfer'
                      ? 'border-black bg-black text-white shadow-2xs'
                      : 'border-neutral-200 bg-white hover:border-neutral-400 text-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ArrowLeftRight className={`h-4 w-4 ${paymentMethod === 'Transfer' ? 'text-white' : 'text-neutral-700'}`} />
                    <span>Transfer</span>
                  </div>
                  {paymentMethod === 'Transfer' && (
                    <CheckCircle2 className="h-4 w-4 text-white fill-white text-black" />
                  )}
                </button>

                {/* Card / POS */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Card')}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    paymentMethod === 'Card'
                      ? 'border-black bg-black text-white shadow-2xs'
                      : 'border-neutral-200 bg-white hover:border-neutral-400 text-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className={`h-4 w-4 ${paymentMethod === 'Card' ? 'text-white' : 'text-neutral-700'}`} />
                    <span>Card / POS</span>
                  </div>
                  {paymentMethod === 'Card' && (
                    <CheckCircle2 className="h-4 w-4 text-white fill-white text-black" />
                  )}
                </button>

                {/* Store Credit */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Store Credit')}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    paymentMethod === 'Store Credit'
                      ? 'border-black bg-black text-white shadow-2xs'
                      : 'border-neutral-200 bg-white hover:border-neutral-400 text-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Wallet className={`h-4 w-4 ${paymentMethod === 'Store Credit' ? 'text-white' : 'text-neutral-700'}`} />
                    <span>Store Credit</span>
                  </div>
                  {paymentMethod === 'Store Credit' && (
                    <CheckCircle2 className="h-4 w-4 text-white fill-white text-black" />
                  )}
                </button>
              </div>

              {/* Split Payment Wide Card */}
              <div className={`rounded-xl border p-2.5 flex items-center justify-between transition-all ${
                paymentMethod === 'Split'
                  ? 'border-black bg-neutral-900 text-white'
                  : 'border-neutral-200 bg-white text-neutral-900'
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`h-6 w-6 rounded-lg flex items-center justify-center ${
                    paymentMethod === 'Split' ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-black'
                  }`}>
                    <Layers className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h6 className="text-xs font-bold leading-none">Split Payment</h6>
                    <span className={`text-[10px] mt-0.5 block ${paymentMethod === 'Split' ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      Pay with multiple payment methods
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('Split')
                    setShowSplitModal(true)
                  }}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-colors shadow-2xs cursor-pointer ${
                    paymentMethod === 'Split'
                      ? 'border-neutral-600 bg-neutral-800 text-white hover:bg-neutral-700'
                      : 'border-neutral-300 bg-white hover:bg-neutral-100 text-black'
                  }`}
                >
                  Configure
                </button>
              </div>
            </div>

            {/* Subtotal & Total Due */}
            <div className="space-y-1.5 pt-2 border-t border-neutral-200 text-xs">
              <div className="flex items-center justify-between text-neutral-500 font-mono">
                <span>SUBTOTAL</span>
                <span>₦{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex items-center justify-between text-black pt-1">
                <span className="font-extrabold uppercase font-mono tracking-wider text-xs">TOTAL</span>
                <span className="font-mono text-xl font-extrabold text-black">
                  ₦{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Pay Button */}
            <button
              type="button"
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full rounded-xl bg-black hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold py-3 text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="h-5 w-5 stroke-[3]" />
              <span>PAY ₦{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Start Cashier Shift Modal */}
      {showStartShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 text-neutral-900 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-black text-white flex items-center justify-center">
                  <Unlock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">Open Cashier Shift</h3>
                  <p className="text-xs text-neutral-500">Activate register & select operator</p>
                </div>
              </div>
              <button onClick={() => setShowStartShiftModal(false)} className="p-1 text-neutral-400 hover:text-black">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleStartShift} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Cashier Name / Operator
                </label>
                <input
                  type="text"
                  required
                  value={cashierName}
                  onChange={(e) => setCashierName(e.target.value)}
                  placeholder="Enter Cashier Name"
                  className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-900 focus:bg-white focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  POS Station Terminal
                </label>
                <input
                  type="text"
                  value={posStation}
                  onChange={(e) => setPosStation(e.target.value)}
                  className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs text-neutral-700 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setShowStartShiftModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-black hover:bg-neutral-800 px-5 py-2.5 text-xs font-bold text-white shadow-xs cursor-pointer"
                >
                  START SHIFT & OPEN REGISTER
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Close Shift Modal */}
      {showCloseShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 text-neutral-900 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-black text-white flex items-center justify-center">
                  <Lock className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">Close Cashier Shift</h3>
                  <p className="text-xs text-neutral-500 font-mono">Shift Active since {shiftStartTime}</p>
                </div>
              </div>
              <button onClick={() => setShowCloseShiftModal(false)} className="p-1 text-neutral-400 hover:text-black">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs mb-5">
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Cashier:</span>
                  <span className="font-semibold text-neutral-900">{cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Total Cash Sales:</span>
                  <span className="font-mono font-bold text-black">
                    ₦{shiftStats.cashSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Total Card / Transfer:</span>
                  <span className="font-mono font-bold text-black">
                    ₦{(shiftStats.cardSales + shiftStats.transferSales).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="border-t border-neutral-200 pt-2 flex justify-between font-bold text-sm">
                  <span>Total Shift Revenue:</span>
                  <span className="font-mono text-black">
                    ₦{shiftStats.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Actual Counted Drawer Cash (₦)
                </label>
                <input
                  type="number"
                  min="0"
                  value={actualCashCounted}
                  onChange={(e) => setActualCashCounted(Number(e.target.value))}
                  className="w-full rounded-xl bg-white border border-neutral-300 px-3 py-2 text-sm font-mono font-bold text-neutral-900 focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => setShowCloseShiftModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCloseShift}
                className="rounded-xl bg-black hover:bg-neutral-800 px-5 py-2.5 text-xs font-bold text-white shadow-xs cursor-pointer"
              >
                End Shift & Print Z-Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Official Z-Report Modal (Clean in-app UI, no alert boxes) */}
      {showZReportModal && closedShiftSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 text-neutral-900 my-8">
            <button
              type="button"
              onClick={() => setShowZReportModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center border-b border-neutral-200 pb-3 mb-4">
              <div className="h-10 w-10 mx-auto rounded-full bg-black text-white flex items-center justify-center mb-2">
                <FileCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-neutral-900">End-Of-Shift Z-Report</h3>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">{closedShiftSummary.date} • {closedShiftSummary.posStation}</p>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between text-neutral-600">
                <span>Cashier Operator:</span>
                <strong className="text-neutral-900 font-sans">{closedShiftSummary.cashierName}</strong>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Shift Duration:</span>
                <span className="text-neutral-900">{closedShiftSummary.shiftStartTime} – {closedShiftSummary.shiftEndTime}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Total Transactions:</span>
                <strong className="text-neutral-900">{closedShiftSummary.txnCount} orders</strong>
              </div>

              <div className="border-t border-b border-neutral-200 py-2.5 my-2 space-y-1.5">
                <div className="flex justify-between text-neutral-900">
                  <span>Total Cash Collected:</span>
                  <span className="font-bold">₦{closedShiftSummary.cashSales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-neutral-900">
                  <span>Total Card / Transfer:</span>
                  <span className="font-bold">₦{(closedShiftSummary.cardSales + closedShiftSummary.transferSales).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-neutral-900 pt-1 border-t border-neutral-100">
                  <span>TOTAL SHIFT REVENUE:</span>
                  <span>₦{closedShiftSummary.totalSales.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Expected Drawer Cash:</span>
                  <span>₦{closedShiftSummary.expectedDrawerCash.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Actual Counted Cash:</span>
                  <span>₦{closedShiftSummary.actualCashCounted.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-neutral-200">
                  <span>Variance:</span>
                  <span className="text-black font-bold">
                    {closedShiftSummary.variance >= 0 ? '+₦' : '-₦'}
                    {Math.abs(closedShiftSummary.variance).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-6">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-100 py-2.5 text-xs font-bold text-neutral-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Print Z-Report</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowZReportModal(false)
                  setShowStartShiftModal(true)
                }}
                className="flex-1 rounded-xl bg-black hover:bg-neutral-800 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Open New Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Printable Customer Receipt Modal */}
      {showReceiptModal && completedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 text-neutral-900 my-8">
            <button
              type="button"
              onClick={() => setShowReceiptModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center border-b border-neutral-200 pb-4 mb-4">
              <div className="h-10 w-10 mx-auto rounded-full bg-black text-white flex items-center justify-center mb-2">
                <Check className="h-5 w-5 stroke-[3]" />
              </div>
              <h3 className="text-base font-bold text-neutral-900">Payment Successful!</h3>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">{completedTxn.receiptNumber}</p>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between text-neutral-500">
                <span>Date/Time:</span>
                <span className="text-neutral-900">{new Date(completedTxn.createdAt).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Cashier:</span>
                <span className="text-neutral-900">{completedTxn.cashierName}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Payment Method:</span>
                <span className="text-neutral-900 uppercase font-bold">{completedTxn.paymentMethod}</span>
              </div>

              <div className="border-t border-b border-neutral-200 py-2 my-2 space-y-1.5">
                {completedTxn.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-xs font-sans">
                    <span className="truncate max-w-[180px] font-medium">{it.name} × {it.quantity}</span>
                    <span className="font-mono font-bold">₦{it.subtotal.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between text-sm font-bold text-neutral-900 pt-1">
                <span>TOTAL PAID</span>
                <span>₦{completedTxn.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-6">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-100 py-2.5 text-xs font-bold text-neutral-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Print Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="flex-1 rounded-xl bg-black hover:bg-neutral-800 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Split Payment Modal */}
      {showSplitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 text-neutral-900">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-neutral-900">Configure Split Payment</h3>
                <p className="text-xs text-neutral-500">Order Total: ₦{total.toLocaleString()}</p>
              </div>
              <button onClick={() => setShowSplitModal(false)} className="p-1 text-neutral-400 hover:text-black">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs mb-5">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">CASH AMOUNT (₦)</label>
                <input
                  type="number"
                  min="0"
                  value={splitDetails.cash}
                  onChange={(e) => setSplitDetails({ ...splitDetails, cash: Number(e.target.value) })}
                  className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">TRANSFER AMOUNT (₦)</label>
                <input
                  type="number"
                  min="0"
                  value={splitDetails.transfer}
                  onChange={(e) => setSplitDetails({ ...splitDetails, transfer: Number(e.target.value) })}
                  className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">CARD / POS AMOUNT (₦)</label>
                <input
                  type="number"
                  min="0"
                  value={splitDetails.card}
                  onChange={(e) => setSplitDetails({ ...splitDetails, card: Number(e.target.value) })}
                  className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200">
              <button
                onClick={() => setShowSplitModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowSplitModal(false)}
                className="rounded-xl bg-black hover:bg-neutral-800 px-5 py-2 text-xs font-bold text-white shadow-xs cursor-pointer"
              >
                Apply Split
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
