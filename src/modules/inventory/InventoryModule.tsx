import React, { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/localDb'
import type { InventoryItem } from '@/types/database'
import {
  Package,
  Plus,
  BarChart3,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowUpDown,
  Search,
} from 'lucide-react'

interface Props {
  searchQuery: string
  onAskAI: (prompt: string) => void
}

export const InventoryModule: React.FC<Props> = ({ searchQuery, onAskAI }) => {
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
    <div className="p-6 h-full flex flex-col justify-between overflow-y-auto space-y-6">
      {/* Top Banner & Zone Distribution Cards */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Warehouse Zone Capacity</h3>
            <p className="text-xs text-slate-400">Total units logged: {totalStock.toLocaleString()} across 4 operational zones</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                onAskAI(
                  'Generate a chart showing the distribution of pallet SKU types across our warehouse zones: Zone A has 400 pallets, Zone B has 350 pallets, Zone C has 150 pallets, and Zone D has 100 pallets.'
                )
              }
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600 hover:text-white px-3 py-1.5 text-xs font-medium transition-all shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>AI Zone Distribution Chart</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-medium transition-all shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Stock Item</span>
            </button>
          </div>
        </div>

        {/* 4 Warehouse Zones Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {(['Zone A', 'Zone B', 'Zone C', 'Zone D'] as const).map((z, idx) => {
            const qty = zoneStats[z]
            const pct = Math.round((qty / totalStock) * 100)
            const colorClass = [
              'text-emerald-400 border-emerald-500/20 bg-emerald-950/10',
              'text-blue-400 border-blue-500/20 bg-blue-950/10',
              'text-amber-400 border-amber-500/20 bg-amber-950/10',
              'text-purple-400 border-purple-500/20 bg-purple-950/10',
            ][idx]
            return (
              <div key={z} className={`rounded-xl border p-3.5 ${colorClass}`}>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>{z}</span>
                  <span className="font-mono text-[11px]">{pct}% cap</span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xl font-bold font-mono text-white">{qty.toLocaleString()}</span>
                  <span className="text-[11px] opacity-75">units</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Inventory Stock Table */}
      <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 flex flex-col justify-between overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="pb-3 font-semibold">SKU / Code</th>
                <th className="pb-3 font-semibold">Item Name</th>
                <th className="pb-3 font-semibold">Zone</th>
                <th className="pb-3 font-semibold">Stock Qty</th>
                <th className="pb-3 font-semibold">Unit Price</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {inventory.map((item) => {
                const isLow = item.quantity <= item.minThreshold
                return (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 font-mono text-slate-400 font-semibold">{item.sku}</td>
                    <td className="py-2.5 font-medium text-slate-200">{item.name}</td>
                    <td className="py-2.5 font-mono">
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
                        {item.zone}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono font-bold text-white">
                      {item.quantity.toLocaleString()} {item.unit}
                    </td>
                    <td className="py-2.5 font-mono text-emerald-400">₦{item.unitPrice.toLocaleString()}</td>
                    <td className="py-2.5">
                      {isLow ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <AlertCircle className="h-3 w-3" /> Low Stock
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => handleQuickRestock(item)}
                        className="rounded bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[11px] font-medium text-slate-200 transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-4">Add Inventory Item</h3>
            <form onSubmit={handleAddItem} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400">SKU Code</label>
                <input
                  type="text"
                  required
                  value={newItem.sku}
                  onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                  placeholder="e.g. MED-VIT-C100"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 p-2 text-white mt-1"
                />
              </div>
              <div>
                <label className="text-slate-400">Product Name</label>
                <input
                  type="text"
                  required
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="e.g. Vitamin C 1000mg Effervescent"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 p-2 text-white mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400">Warehouse Zone</label>
                  <select
                    value={newItem.zone}
                    onChange={(e) => setNewItem({ ...newItem, zone: e.target.value as any })}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 p-2 text-white mt-1"
                  >
                    <option value="Zone A">Zone A (Pharma)</option>
                    <option value="Zone B">Zone B (Supplies)</option>
                    <option value="Zone C">Zone C (Chemicals)</option>
                    <option value="Zone D">Zone D (Quarantine)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400">Quantity</label>
                  <input
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 p-2 text-white mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400">Selling Price (₦)</label>
                  <input
                    type="number"
                    value={newItem.unitPrice}
                    onChange={(e) => setNewItem({ ...newItem, unitPrice: Number(e.target.value) })}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 p-2 text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Cost Price (₦)</label>
                  <input
                    type="number"
                    value={newItem.costPrice}
                    onChange={(e) => setNewItem({ ...newItem, costPrice: Number(e.target.value) })}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 p-2 text-white mt-1"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg px-3 py-1.5 text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-1.5 text-white font-medium shadow-sm"
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
