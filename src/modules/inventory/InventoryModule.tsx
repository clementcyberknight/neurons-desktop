import React, { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/localDb'
import type { InventoryItem } from '@/types/database'
import {
  Plus,
  AlertCircle,
} from 'lucide-react'

interface Props {
  searchQuery?: string
  onAskAI?: (prompt: string) => void
}

export const InventoryModule: React.FC<Props> = ({ searchQuery = '' }) => {
  const inventory = useLiveQuery(async () => {
    let items = await db.inventory.toArray()
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.sku.toLowerCase().includes(q) ||
          i.zone.toLowerCase().includes(q)
      )
    }
    return items
  }, [searchQuery]) || []

  // Zone statistics calculation
  const zoneStats = {
    'Zone A': inventory.filter((i) => i.zone === 'Zone A').reduce((a, b) => a + b.quantity, 0),
    'Zone B': inventory.filter((i) => i.zone === 'Zone B').reduce((a, b) => a + b.quantity, 0),
    'Zone C': inventory.filter((i) => i.zone === 'Zone C').reduce((a, b) => a + b.quantity, 0),
    'Zone D': inventory.filter((i) => i.zone === 'Zone D').reduce((a, b) => a + b.quantity, 0),
  }
  const totalStock = Object.values(zoneStats).reduce((a, b) => a + b, 0) || 1

  const [showAddModal, setShowAddModal] = useState(false)
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: '',
    sku: '',
    category: 'pharmaceuticals',
    zone: 'Zone A',
    quantity: 100,
    minThreshold: 20,
    unitPrice: 2000,
    costPrice: 1500,
    unit: 'packs',
  })

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItem.name || !newItem.sku) return

    const now = Date.now()
    await db.inventory.add({
      id: `inv-${now}`,
      sku: newItem.sku!,
      name: newItem.name!,
      category: newItem.category as any,
      zone: newItem.zone as any,
      quantity: Number(newItem.quantity),
      minThreshold: Number(newItem.minThreshold),
      unitPrice: Number(newItem.unitPrice),
      costPrice: Number(newItem.costPrice),
      unit: newItem.unit || 'units',
      lastRestocked: now,
      createdAt: now,
      updatedAt: now,
      synced: 0,
    })
    setShowAddModal(false)
  }

  const handleQuickRestock = async (item: InventoryItem) => {
    await db.inventory.update(item.id, {
      quantity: item.quantity + 50,
      lastRestocked: Date.now(),
      updatedAt: Date.now(),
      synced: 0,
    })
  }

  return (
    <div className="p-6 h-full flex flex-col justify-between overflow-y-auto space-y-6 bg-[#fafafa]">
      {/* Top Banner & Zone Distribution Cards */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-neutral-900 tracking-tight">Warehouse Zone Capacity</h3>
            <p className="text-xs text-neutral-500">Total units logged: {totalStock.toLocaleString()} across 4 operational zones</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-black hover:bg-neutral-800 text-white px-3.5 py-1.5 text-xs font-medium transition-all shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Stock Item</span>
            </button>
          </div>
        </div>

        {/* 4 Warehouse Zones Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {(['Zone A', 'Zone B', 'Zone C', 'Zone D'] as const).map((z) => {
            const qty = zoneStats[z]
            const pct = Math.round((qty / totalStock) * 100)
            return (
              <div key={z} className="rounded-xl border border-neutral-200 bg-white p-3.5 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-600">
                  <span>{z}</span>
                  <span className="font-mono text-[11px] text-neutral-400">{pct}% cap</span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xl font-bold font-mono text-neutral-900">{qty.toLocaleString()}</span>
                  <span className="text-[11px] text-neutral-500">units</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Inventory Stock Table */}
      <div className="flex-1 rounded-xl border border-neutral-200 bg-white p-4 flex flex-col justify-between overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500 font-mono">
                <th className="pb-3 font-semibold">SKU / Code</th>
                <th className="pb-3 font-semibold">Item Name</th>
                <th className="pb-3 font-semibold">Zone</th>
                <th className="pb-3 font-semibold">Stock Qty</th>
                <th className="pb-3 font-semibold">Unit Price</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {inventory.map((item) => {
                const isLow = item.quantity <= item.minThreshold
                return (
                  <tr key={item.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-2.5 font-mono text-neutral-600 font-semibold">{item.sku}</td>
                    <td className="py-2.5 font-medium text-neutral-900">{item.name}</td>
                    <td className="py-2.5 font-mono">
                      <span className="rounded bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 text-[10px] text-neutral-700">
                        {item.zone}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono font-bold text-neutral-900">
                      {item.quantity.toLocaleString()} {item.unit}
                    </td>
                    <td className="py-2.5 font-mono text-neutral-900">₦{item.unitPrice.toLocaleString()}</td>
                    <td className="py-2.5">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-900 bg-neutral-100 border border-neutral-300 px-2 py-0.5 rounded-full">
                          <AlertCircle className="h-3 w-3" /> Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex text-[10px] font-bold text-neutral-700 bg-neutral-50 border border-neutral-200 px-2 py-0.5 rounded-full">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => handleQuickRestock(item)}
                        className="rounded border border-neutral-300 bg-white hover:bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-800 transition-colors shadow-2xs"
                      >
                        +50 Restock
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <h3 className="text-sm font-bold text-neutral-900 mb-4">Add Inventory Item</h3>
            <form onSubmit={handleAddItem} className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-600">SKU Code</label>
                <input
                  type="text"
                  required
                  value={newItem.sku}
                  onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                  placeholder="e.g. MED-VIT-C100"
                  className="w-full rounded-lg bg-neutral-50 border border-neutral-300 p-2 text-neutral-900 mt-1 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-neutral-600">Product Name</label>
                <input
                  type="text"
                  required
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="e.g. Vitamin C 1000mg Effervescent"
                  className="w-full rounded-lg bg-neutral-50 border border-neutral-300 p-2 text-neutral-900 mt-1 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-neutral-600">Warehouse Zone</label>
                  <select
                    value={newItem.zone}
                    onChange={(e) => setNewItem({ ...newItem, zone: e.target.value as any })}
                    className="w-full rounded-lg bg-neutral-50 border border-neutral-300 p-2 text-neutral-900 mt-1 focus:outline-none"
                  >
                    <option value="Zone A">Zone A (Pharma)</option>
                    <option value="Zone B">Zone B (Supplies)</option>
                    <option value="Zone C">Zone C (Chemicals)</option>
                    <option value="Zone D">Zone D (Quarantine)</option>
                  </select>
                </div>
                <div>
                  <label className="text-neutral-600">Quantity</label>
                  <input
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                    className="w-full rounded-lg bg-neutral-50 border border-neutral-300 p-2 text-neutral-900 mt-1 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-neutral-600">Selling Price (₦)</label>
                  <input
                    type="number"
                    value={newItem.unitPrice}
                    onChange={(e) => setNewItem({ ...newItem, unitPrice: Number(e.target.value) })}
                    className="w-full rounded-lg bg-neutral-50 border border-neutral-300 p-2 text-neutral-900 mt-1 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-neutral-600">Cost Price (₦)</label>
                  <input
                    type="number"
                    value={newItem.costPrice}
                    onChange={(e) => setNewItem({ ...newItem, costPrice: Number(e.target.value) })}
                    className="w-full rounded-lg bg-neutral-50 border border-neutral-300 p-2 text-neutral-900 mt-1 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-200 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg px-3 py-1.5 text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-black hover:bg-neutral-800 px-4 py-1.5 text-white font-medium shadow-xs"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
