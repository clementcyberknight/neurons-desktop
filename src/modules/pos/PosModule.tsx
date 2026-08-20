import React, { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/localDb'
import type { POSTransaction, InventoryItem } from '@/types/database'
import {
  CreditCard,
  Trash2,
  AlertTriangle,
  ShoppingBag,
} from 'lucide-react'
import confetti from 'canvas-confetti'

interface Props {
  onAskAI?: (prompt: string) => void
}

export const PosModule: React.FC<Props> = () => {
  const inventory = useLiveQuery(() => db.inventory.toArray()) || []
  const transactions = useLiveQuery(() => db.transactions.reverse().toArray()) || []

  // Current Cart State
  const [cart, setCart] = useState<{ item: InventoryItem; quantity: number }[]>([])
  const [discountPercent, setDiscountPercent] = useState(0)
  const [overrideReason, setOverrideReason] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<POSTransaction['paymentMethod']>('card')
  const [cashierId] = useState('POS_04')

  const subtotal = cart.reduce((acc, curr) => acc + curr.item.unitPrice * curr.quantity, 0)
  const discountAmount = Math.round(subtotal * (discountPercent / 100))
  const total = subtotal - discountAmount

  const handleAddToCart = (item: InventoryItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id)
      if (existing) {
        return prev.map((c) =>
          c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      }
      return [...prev, { item, quantity: 1 }]
    })
  }

  const handleRemoveFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.item.id !== itemId))
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return

    const now = Date.now()
    const isOverride = discountPercent > 15
    const receiptNum = `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`

    const newTxn: POSTransaction = {
      id: `txn-${now}`,
      receiptNumber: receiptNum,
      cashierId,
      cashierName: cashierId === 'POS_04' ? 'Cashier ID #104' : 'Cashier ID #101',
      posStation: 'POS Station 1',
      items: cart.map((c) => ({
        sku: c.item.sku,
        name: c.item.name,
        quantity: c.quantity,
        unitPrice: c.item.unitPrice,
        subtotal: c.item.unitPrice * c.quantity,
      })),
      subtotal,
      discountPercent,
      discountAmount,
      totalAmount: total,
      paymentMethod,
      hasManualOverride: isOverride,
      overrideReason: isOverride ? overrideReason || 'Manual High Discount Override' : undefined,
      status: isOverride ? 'flagged' : 'completed',
      createdAt: now,
      updatedAt: now,
      synced: 0,
    }

    await db.transactions.add(newTxn)

    // Deduct stock in inventory
    for (const c of cart) {
      await db.inventory.update(c.item.id, {
        quantity: Math.max(0, c.item.quantity - c.quantity),
        updatedAt: now,
        synced: 0,
      })
    }

    // Also add to Finance income
    await db.finance.add({
      id: `fin-${now}`,
      transactionDate: new Date().toISOString().split('T')[0],
      type: 'income',
      category: 'POS Sales',
      description: `POS Receipt ${receiptNum} (${newTxn.items.length} items)`,
      amount: total,
      currency: 'NGN',
      referenceId: newTxn.id,
      createdAt: now,
      updatedAt: now,
      synced: 0,
    })

    if (!isOverride) {
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.8 } })
    }

    setCart([])
    setDiscountPercent(0)
    setOverrideReason('')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 h-full overflow-hidden bg-white">
      {/* Left 7 Cols: Catalog & Cart Terminal */}
      <div className="lg:col-span-7 border-r border-neutral-200 p-6 flex flex-col justify-between overflow-y-auto bg-[#fafafa]">
        <div>
          {/* Quick Product Grid */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 font-mono flex items-center gap-1.5">
              <ShoppingBag className="h-4 w-4 text-neutral-800" /> Fast SKU Catalog
            </h3>
            <span className="text-xs text-neutral-500">{inventory.length} active items</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6">
            {inventory.slice(0, 6).map((item) => (
              <button
                key={item.id}
                onClick={() => handleAddToCart(item)}
                className="group flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-3 text-left hover:border-neutral-400 transition-all shadow-2xs cursor-pointer"
              >
                <div>
                  <span className="text-[10px] font-mono text-neutral-500 uppercase">{item.zone}</span>
                  <h4 className="text-xs font-semibold text-neutral-900 line-clamp-2 mt-0.5">
                    {item.name}
                  </h4>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-neutral-900">
                    ₦{item.unitPrice.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">
                    Stock: {item.quantity}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Active Cart */}
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 font-mono mb-3 flex items-center justify-between">
              <span>Checkout Register Cart</span>
              <span className="text-neutral-700">{cart.length} items</span>
            </h3>

            {cart.length === 0 ? (
              <div className="py-8 text-center text-neutral-400 text-xs">
                Cart is empty. Click SKU catalog items above to add.
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 max-h-48 overflow-y-auto mb-4">
                {cart.map(({ item, quantity }) => (
                  <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                    <div className="truncate max-w-[200px]">
                      <p className="font-medium text-neutral-900 truncate">{item.name}</p>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        ₦{item.unitPrice.toLocaleString()} × {quantity}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold text-neutral-900">
                        ₦{(item.unitPrice * quantity).toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleRemoveFromCart(item.id)}
                        className="text-neutral-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Calculations & Discounts */}
            <div className="space-y-2 border-t border-neutral-200 pt-3 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span className="font-mono">₦{subtotal.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-600">Discount Override (%):</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="w-16 rounded bg-neutral-50 border border-neutral-300 px-2 py-1 text-right font-mono text-neutral-900 text-xs focus:outline-none"
                  />
                  {discountPercent > 15 && (
                    <span className="text-[10px] font-bold text-red-600 flex items-center gap-0.5">
                      <AlertTriangle className="h-3 w-3" /> Flagged
                    </span>
                  )}
                </div>
              </div>

              {discountPercent > 15 && (
                <input
                  type="text"
                  placeholder="Override authorization reason..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full rounded bg-neutral-50 border border-neutral-300 px-2.5 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none"
                />
              )}

              <div className="flex justify-between text-sm font-bold text-neutral-900 pt-2 border-t border-neutral-200">
                <span>Total Due</span>
                <span className="font-mono">₦{total.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="mt-4 w-full rounded-xl bg-black hover:bg-neutral-800 disabled:opacity-40 text-white font-semibold py-2.5 text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CreditCard className="h-4 w-4" />
              <span>Complete Sale (₦{total.toLocaleString()})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right 5 Cols: Audit Log & Security Anomalies */}
      <div className="lg:col-span-5 p-6 flex flex-col justify-between overflow-y-auto bg-white">
        <div>
          {/* Recent Transaction Ledger */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 font-mono">
              Live Transaction Ledger ({transactions.length})
            </h3>
          </div>

          <div className="space-y-2">
            {transactions.slice(0, 8).map((txn) => (
              <div
                key={txn.id}
                className={`rounded-xl border p-3 text-xs transition-all ${
                  txn.status === 'flagged'
                    ? 'border-neutral-300 bg-neutral-50 text-neutral-900'
                    : 'border-neutral-200 bg-white text-neutral-800 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between font-mono">
                  <span className="font-semibold text-neutral-900">{txn.receiptNumber}</span>
                  <span className="font-bold text-neutral-900">₦{txn.totalAmount.toLocaleString()}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-neutral-500">
                  <span>{txn.cashierName} • {txn.paymentMethod}</span>
                  <span>{new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {txn.hasManualOverride && (
                  <div className="mt-2 rounded bg-neutral-100 px-2 py-1 text-[10px] text-neutral-700 border border-neutral-200 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-neutral-700 shrink-0" />
                    <span className="truncate">Override ({txn.discountPercent}%): {txn.overrideReason}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
