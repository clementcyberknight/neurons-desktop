import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/localDb'
import type { InventoryItem } from '@/types/database'
import { DataTable, type DataTableColumn, type DataTableAction } from '@/components/ui/DataTable'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import {
  Plus,
  AlertCircle,
  Package,
  Upload,
  X,
  Image as ImageIcon,
  Trash2,
  Store,
  Search,
  Pencil,
  PackagePlus,
  AlertTriangle,
} from 'lucide-react'

interface Props {
  searchQuery?: string
  onAskAI?: (prompt: string) => void
}

const DEFAULT_SUPPLIERS = [
  'Emzor Pharmaceuticals Ltd',
  'Fidson Healthcare Plc',
  'May & Baker Nigeria',
  'Unilever Nigeria Plc',
  'Nestlé Nigeria',
  'Chi Limited',
  'Dangote Consumer Goods',
  'Innoson Industrial Supplies',
  'Direct Overseas Distributor',
]

const DEFAULT_CATEGORIES = [
  'Pharmaceuticals & OTC',
  'FMCG & Groceries',
  'Medical Supplies & PPE',
  'Consumer Electronics',
  'Beverages & Drinks',
  'Personal Care & Cosmetics',
  'Packaging & Raw Materials',
]

const DEFAULT_UNITS = [
  'Packs',
  'Boxes',
  'Bottles',
  'Units / Pcs',
  'Cartons',
  'Rolls',
  'Kilograms (kg)',
  'Litres (L)',
  'Gallons',
  'Sacks',
]

const DEFAULT_SALES_CHANNELS = [
  'Main Warehouse - Central Floor',
  'Retail Store Branch - Ikeja',
  'Retail Store Branch - Lekki',
  'Regional Depot - Abuja',
  'Wholesale Distribution Hub',
  'Direct POS Terminal 1',
]

export const InventoryModule: React.FC<Props> = ({ searchQuery: externalSearchQuery = '' }) => {
  const [localSearch, setLocalSearch] = useState(externalSearchQuery)
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'Finished Good' | 'Raw Material'>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL')

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Modals & State
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [restockingItem, setRestockingItem] = useState<InventoryItem | null>(null)
  const [restockQty, setRestockQty] = useState<number>(50)
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setCurrentPage(1)
  }, [localSearch, externalSearchQuery, typeFilter, categoryFilter, statusFilter, pageSize])

  // Paginated and Filtered Query (Optimized for 100k scale)
  const { inventory, totalCount, totalPages, lowStockCount } = useLiveQuery(async () => {
    const query = (localSearch || externalSearchQuery).trim().toLowerCase()

    // 1. Calculate lowStockCount via single-pass cursor streaming
    let countLow = 0
    await db.inventory.each((i) => {
      if (i.quantity <= i.minThreshold) countLow++
    })

    // 2. Query with indexed offset & limit
    let filteredCount = 0
    let paginatedSlice: InventoryItem[] = []

    if (typeFilter === 'ALL' && categoryFilter === 'ALL' && statusFilter === 'ALL' && !query) {
      const collection = db.inventory.orderBy('updatedAt').reverse()
      filteredCount = await collection.count()
      paginatedSlice = await collection.offset((currentPage - 1) * pageSize).limit(pageSize).toArray()
    } else if (typeFilter !== 'ALL' && categoryFilter === 'ALL' && statusFilter === 'ALL' && !query) {
      const collection = db.inventory.where('type').equals(typeFilter).reverse()
      filteredCount = await collection.count()
      paginatedSlice = await collection.offset((currentPage - 1) * pageSize).limit(pageSize).toArray()
    } else {
      const matches: InventoryItem[] = []
      const collection = typeFilter !== 'ALL'
        ? db.inventory.where('type').equals(typeFilter).reverse()
        : db.inventory.orderBy('updatedAt').reverse()

      await collection.each((i) => {
        if (categoryFilter !== 'ALL' && !i.category.toLowerCase().includes(categoryFilter.toLowerCase())) {
          return
        }
        if (statusFilter === 'LOW_STOCK' && !(i.quantity > 0 && i.quantity <= i.minThreshold)) {
          return
        }
        if (statusFilter === 'OUT_OF_STOCK' && i.quantity !== 0) {
          return
        }
        if (statusFilter === 'IN_STOCK' && !(i.quantity > i.minThreshold)) {
          return
        }
        if (query) {
          const matchesQuery =
            i.name.toLowerCase().includes(query) ||
            i.sku.toLowerCase().includes(query) ||
            Boolean(i.brand && i.brand.toLowerCase().includes(query)) ||
            Boolean(i.supplier && i.supplier.toLowerCase().includes(query)) ||
            Boolean(i.category && i.category.toLowerCase().includes(query)) ||
            Boolean(i.salesChannel && i.salesChannel.toLowerCase().includes(query))
          if (!matchesQuery) return
        }
        matches.push(i)
      })

      filteredCount = matches.length
      const start = (currentPage - 1) * pageSize
      paginatedSlice = matches.slice(start, start + pageSize)
    }

    const pages = Math.max(1, Math.ceil(filteredCount / pageSize))

    return {
      inventory: paginatedSlice,
      totalCount: filteredCount,
      totalPages: pages,
      lowStockCount: countLow,
    }
  }, [localSearch, externalSearchQuery, typeFilter, categoryFilter, statusFilter, currentPage, pageSize]) || {
    inventory: [],
    totalCount: 0,
    totalPages: 1,
    lowStockCount: 0,
  }

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    image: '',
    brand: '',
    supplier: '',
    category: 'Pharmaceuticals & OTC',
    unit: 'Packs',
    quantity: 0,
    type: 'Finished Good' as 'Finished Good' | 'Raw Material',
    salesChannel: 'Main Warehouse - Central Floor',
    costPrice: 0,
    unitPrice: 0,
    minThreshold: 20,
    expiryDate: '',
  })

  // Handle image upload and base64 encoding
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Please choose an image under 2MB for fast local offline loading.')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, image: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, image: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Open Edit Modal with populated product data
  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItemId(item.id)
    setFormData({
      name: item.name,
      image: item.image || '',
      brand: item.brand || '',
      supplier: item.supplier || '',
      category: item.category || 'Pharmaceuticals & OTC',
      unit: item.unit || 'Packs',
      quantity: item.quantity,
      type: item.type || 'Finished Good',
      salesChannel: item.salesChannel || 'Main Warehouse - Central Floor',
      costPrice: item.costPrice || 0,
      unitPrice: item.unitPrice || 0,
      minThreshold: item.minThreshold || 20,
      expiryDate: item.expiryDate || '',
    })
    setShowAddModal(true)
  }

  const handleOpenCreate = () => {
    setEditingItemId(null)
    setFormData({
      name: '',
      image: '',
      brand: '',
      supplier: '',
      category: 'Pharmaceuticals & OTC',
      unit: 'Packs',
      quantity: 0,
      type: 'Finished Good',
      salesChannel: 'Main Warehouse - Central Floor',
      costPrice: 0,
      unitPrice: 0,
      minThreshold: 20,
      expiryDate: '',
    })
    setShowAddModal(true)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || formData.unitPrice === undefined || formData.unitPrice === null) {
      alert('Please fill in product name and selling price.')
      return
    }

    const now = Date.now()

    if (editingItemId) {
      // Update existing item
      await db.inventory.update(editingItemId, {
        name: formData.name.trim(),
        image: formData.image || undefined,
        brand: formData.brand.trim() || undefined,
        supplier: formData.supplier.trim() || undefined,
        category: formData.category,
        unit: formData.unit,
        quantity: Number(formData.quantity) || 0,
        type: formData.type,
        salesChannel: formData.type === 'Finished Good' ? formData.salesChannel : undefined,
        costPrice: Number(formData.costPrice) || 0,
        unitPrice: Number(formData.unitPrice) || 0,
        minThreshold: Number(formData.minThreshold) || 20,
        expiryDate: formData.expiryDate || undefined,
        updatedAt: now,
        synced: 0,
      })
    } else {
      // Create new item
      const prefix = formData.category.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'PRD')
      const randomCode = Math.floor(100 + Math.random() * 900)
      const sku = `${prefix}-${formData.name.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'ITM')}-${randomCode}`

      const newItem: InventoryItem = {
        id: `inv-${now}`,
        sku,
        name: formData.name.trim(),
        image: formData.image || undefined,
        brand: formData.brand.trim() || undefined,
        supplier: formData.supplier.trim() || undefined,
        category: formData.category,
        unit: formData.unit,
        quantity: Number(formData.quantity) || 0,
        type: formData.type,
        salesChannel: formData.type === 'Finished Good' ? formData.salesChannel : undefined,
        costPrice: Number(formData.costPrice) || 0,
        unitPrice: Number(formData.unitPrice) || 0,
        minThreshold: Number(formData.minThreshold) || 20,
        expiryDate: formData.expiryDate || undefined,
        zone: 'Zone A',
        lastRestocked: now,
        createdAt: now,
        updatedAt: now,
        synced: 0,
      }

      await db.inventory.add(newItem)
    }

    setShowAddModal(false)
    setEditingItemId(null)
  }

  // Handle restock execution
  const handleExecuteRestock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restockingItem || restockQty <= 0) return

    await db.inventory.update(restockingItem.id, {
      quantity: restockingItem.quantity + Number(restockQty),
      lastRestocked: Date.now(),
      updatedAt: Date.now(),
      synced: 0,
    })

    setRestockingItem(null)
    setRestockQty(50)
  }

  // Handle delete execution
  const handleExecuteDelete = async () => {
    if (!deletingItem) return
    await db.inventory.delete(deletingItem.id)
    setDeletingItem(null)
  }

  // ─── DataTable Column Definitions ────────────────────────────────
  const inventoryColumns: DataTableColumn<InventoryItem>[] = useMemo(() => [
    {
      key: 'product',
      header: 'Product',
      render: (item) => (
        <div className="flex items-center gap-3">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="h-10 w-10 rounded-lg object-cover border border-neutral-200 shrink-0"
            />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-400 shrink-0">
              <Package className="h-5 w-5" />
            </div>
          )}
          <div>
            <div className="font-semibold text-neutral-900 leading-tight">{item.name}</div>
            <div className="font-mono text-[10px] text-neutral-400 mt-0.5">{item.sku}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'brandSupplier',
      header: 'Brand / Supplier',
      render: (item) => (
        <div>
          <div className="text-neutral-800 font-medium">{item.brand || '—'}</div>
          <div className="text-[11px] text-neutral-500 truncate max-w-[140px]">{item.supplier || 'Unassigned'}</div>
        </div>
      ),
    },
    {
      key: 'categoryType',
      header: 'Category & Type',
      render: (item) => (
        <div>
          <div className="text-neutral-800">{item.category}</div>
          <span
            className={`inline-block mt-0.5 rounded px-1.5 py-0.2 text-[10px] font-semibold uppercase font-mono border ${
              item.type === 'Raw Material'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}
          >
            {item.type || 'Finished Good'}
          </span>
        </div>
      ),
    },
    {
      key: 'stockUnits',
      header: 'Stock Units',
      render: (item) => {
        const isLow = item.quantity <= item.minThreshold
        const isOut = item.quantity === 0
        return (
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`font-mono font-bold ${isOut ? 'text-red-700' : isLow ? 'text-red-600' : 'text-neutral-900'}`}>
                {item.quantity.toLocaleString()}
              </span>
              <span className="text-[11px] text-neutral-500 font-medium">{item.unit}</span>
            </div>
            {isOut ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-red-700">
                <AlertCircle className="h-3 w-3" /> Out of Stock
              </span>
            ) : isLow ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-red-600">
                <AlertCircle className="h-3 w-3" /> Low Stock
              </span>
            ) : null}
          </div>
        )
      },
    },
    {
      key: 'costPrice',
      header: 'Cost Price (₦)',
      render: (item) => (
        <span className="font-mono text-neutral-600">
          ₦{Number(item.costPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'sellingPrice',
      header: 'Selling Price (₦)',
      render: (item) => (
        <span className="font-mono font-bold text-neutral-900">
          ₦{Number(item.unitPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'salesChannel',
      header: 'Sales Channel',
      render: (item) => (
        <span className="text-[11px] text-neutral-600">
          {item.salesChannel ? (
            <span className="flex items-center gap-1">
              <Store className="h-3 w-3 text-neutral-400 shrink-0" />
              <span className="truncate max-w-[130px]">{item.salesChannel}</span>
            </span>
          ) : (
            <span className="text-neutral-400">N/A</span>
          )}
        </span>
      ),
    },
    {
      key: 'expiryDate',
      header: 'Expiry Date',
      render: (item) => (
        <span className="font-mono text-[11px] text-neutral-500">
          {item.expiryDate || '—'}
        </span>
      ),
    },
  ], [])

  const inventoryActions: DataTableAction<InventoryItem>[] = useMemo(() => [
    {
      label: 'Edit Product',
      icon: <Pencil className="h-3.5 w-3.5" />,
      onClick: (item) => handleOpenEdit(item),
    },
    {
      label: 'Restock',
      icon: <PackagePlus className="h-3.5 w-3.5" />,
      onClick: (item) => {
        setRestockingItem(item)
        setRestockQty(50)
      },
    },
    {
      label: 'Delete',
      icon: <Trash2 className="h-3.5 w-3.5" />,
      onClick: (item) => setDeletingItem(item),
      variant: 'danger' as const,
      separator: true,
    },
  ], [])

  return (
    <div className="p-6 h-full flex flex-col justify-between overflow-y-auto space-y-4 bg-[#fafafa] font-sans select-none no-scrollbar">
      {/* 1. Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-neutral-900 tracking-tight">Inventory Catalog</h3>
          <p className="text-xs text-neutral-500">Live warehouse stock tracking across finished goods, raw materials, and sales channels</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-black hover:bg-neutral-800 text-white px-3.5 py-1.5 text-xs font-medium transition-all shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Stock Item</span>
        </button>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="rounded-xl border border-neutral-200 bg-white p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search products by name, SKU, brand, supplier..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50/50 text-xs text-neutral-800 placeholder-neutral-400 focus:bg-white focus:outline-none focus:border-neutral-900 transition-all"
            />
            {localSearch && (
              <button
                onClick={() => setLocalSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Product Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'ALL' | 'Finished Good' | 'Raw Material')}
              className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="Finished Good">Finished Goods</option>
              <option value="Raw Material">Raw Materials</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none cursor-pointer max-w-[160px]"
            >
              <option value="ALL">All Categories</option>
              {DEFAULT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Stock Health Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK')}
              className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Stock Status</option>
              <option value="IN_STOCK">In Stock (Healthy)</option>
              <option value="LOW_STOCK">Low Stock Alert ({lowStockCount})</option>
              <option value="OUT_OF_STOCK">Out of Stock (0 Units)</option>
            </select>
          </div>
        </div>

        {/* Active Filter Pills */}
        {(typeFilter !== 'ALL' || categoryFilter !== 'ALL' || statusFilter !== 'ALL' || localSearch) && (
          <div className="flex items-center gap-2 pt-1 border-t border-neutral-100 text-[11px] text-neutral-500 font-mono flex-wrap">
            <span>Active filters:</span>
            {localSearch && (
              <span className="inline-flex items-center gap-1 rounded bg-neutral-100 px-2 py-0.5 text-neutral-800 font-sans">
                Search: "{localSearch}"
                <X className="h-3 w-3 cursor-pointer hover:text-red-600" onClick={() => setLocalSearch('')} />
              </span>
            )}
            {typeFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 rounded bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 font-sans">
                Type: {typeFilter}
                <X className="h-3 w-3 cursor-pointer hover:text-red-600" onClick={() => setTypeFilter('ALL')} />
              </span>
            )}
            {categoryFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 rounded bg-neutral-100 text-neutral-800 border border-neutral-200 px-2 py-0.5 font-sans">
                Category: {categoryFilter}
                <X className="h-3 w-3 cursor-pointer hover:text-red-600" onClick={() => setCategoryFilter('ALL')} />
              </span>
            )}
            {statusFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 rounded bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 font-sans">
                Status: {statusFilter.replace('_', ' ')}
                <X className="h-3 w-3 cursor-pointer hover:text-red-600" onClick={() => setStatusFilter('ALL')} />
              </span>
            )}
            <button
              onClick={() => {
                setLocalSearch('')
                setTypeFilter('ALL')
                setCategoryFilter('ALL')
                setStatusFilter('ALL')
              }}
              className="text-red-600 hover:underline font-sans text-xs ml-auto cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* 3. Inventory Stock Table */}
      <DataTable<InventoryItem>
        columns={inventoryColumns}
        data={inventory}
        getItemId={(item) => item.id}
        actions={inventoryActions}
        emptyIcon={<Package className="h-8 w-8" />}
        emptyTitle="No inventory products found"
        emptyDescription={
          localSearch || typeFilter !== 'ALL' || categoryFilter !== 'ALL' || statusFilter !== 'ALL'
            ? 'Try clearing your search or filter options.'
            : 'Click "Add Stock Item" above to add your first product.'
        }
        pagination={{
          currentPage,
          pageSize,
          totalCount,
          onPageChange: setCurrentPage,
          onPageSizeChange: setPageSize,
          label: 'products',
        }}
      />

      {/* 5. Add / Edit Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 text-neutral-900 my-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-neutral-200 pb-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">
                  {editingItemId ? 'Edit Product' : 'Add New Product'}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {editingItemId
                    ? 'Update the product specifications, pricing, stock levels, or images.'
                    : 'Enter the product details to add it to the warehouse inventory.'}
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              {/* NAME */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  NAME <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Product name"
                  className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:bg-white focus:border-neutral-800 focus:outline-none transition-all"
                />
              </div>

              {/* PRODUCT IMAGE Upload */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  PRODUCT IMAGE
                </label>
                <div className="flex items-center gap-3">
                  {formData.image ? (
                    <div className="relative h-16 w-16 rounded-xl border border-neutral-200 overflow-hidden shrink-0 group">
                      <img src={formData.image} alt="Preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Remove Image"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="h-16 w-16 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 hover:bg-neutral-100 flex flex-col items-center justify-center text-neutral-400 cursor-pointer transition-colors shrink-0"
                    >
                      <ImageIcon className="h-5 w-5" />
                      <span className="text-[9px] mt-0.5 font-medium">Upload</span>
                    </div>
                  )}

                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-2xs cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5 text-neutral-500" />
                      <span>{formData.image ? 'Change File' : 'Choose File'}</span>
                    </button>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      {formData.image ? 'Image selected for offline storage' : 'No file chosen (PNG, JPG up to 2MB)'}
                    </p>
                  </div>
                </div>
              </div>

              {/* BRAND & SUPPLIER */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    BRAND
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Enter brand"
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:bg-white focus:border-neutral-800 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    SUPPLIER
                  </label>
                  <input
                    type="text"
                    list="suppliers-list"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="Enter supplier name or select from a list"
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:bg-white focus:border-neutral-800 focus:outline-none transition-all"
                  />
                  <datalist id="suppliers-list">
                    {DEFAULT_SUPPLIERS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* CATEGORY & UNIT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    CATEGORY
                  </label>
                  <input
                    type="text"
                    list="category-list"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Select or type category..."
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:bg-white focus:border-neutral-800 focus:outline-none transition-all"
                  />
                  <datalist id="category-list">
                    {DEFAULT_CATEGORIES.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    UNIT
                  </label>
                  <input
                    type="text"
                    list="unit-list"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="Select or type unit..."
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:bg-white focus:border-neutral-800 focus:outline-none transition-all"
                  />
                  <datalist id="unit-list">
                    {DEFAULT_UNITS.map((u) => (
                      <option key={u} value={u} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* UNITS (Stock) & TYPE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    UNITS (STOCK COUNT)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs text-neutral-900 font-mono focus:bg-white focus:border-neutral-800 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    TYPE
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'Finished Good' | 'Raw Material' })}
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs text-neutral-900 focus:bg-white focus:border-neutral-800 focus:outline-none transition-all cursor-pointer font-medium"
                  >
                    <option value="Finished Good">Finished Good</option>
                    <option value="Raw Material">Raw Material</option>
                  </select>
                </div>
              </div>

              {/* SALES CHANNEL (Conditional) */}
              {formData.type === 'Finished Good' && (
                <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200/80 space-y-1">
                  <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider">
                    SALES CHANNEL / BRANCH LOCATION
                  </label>
                  <p className="text-[11px] text-blue-700">
                    Specify the branch or retail channel where this finished product will be sold.
                  </p>
                  <input
                    type="text"
                    list="channel-list"
                    value={formData.salesChannel}
                    onChange={(e) => setFormData({ ...formData, salesChannel: e.target.value })}
                    placeholder="Select or type branch / warehouse name..."
                    className="w-full rounded-lg bg-white border border-blue-300 px-3 py-2 text-xs text-neutral-900 focus:border-blue-600 focus:outline-none mt-1"
                  />
                  <datalist id="channel-list">
                    {DEFAULT_SALES_CHANNELS.map((ch) => (
                      <option key={ch} value={ch} />
                    ))}
                  </datalist>
                </div>
              )}

              {/* COST PER UNIT & SELLING PRICE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    COST PER UNIT (₦)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs text-neutral-900 font-mono focus:bg-white focus:border-neutral-800 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    SELLING PRICE (₦) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs text-neutral-900 font-mono font-bold focus:bg-white focus:border-neutral-800 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* THRESHOLD & EXPIRY DATE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    THRESHOLD (LOW STOCK ALERT)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minThreshold}
                    onChange={(e) => setFormData({ ...formData, minThreshold: Number(e.target.value) })}
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs text-neutral-900 font-mono focus:bg-white focus:border-neutral-800 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    EXPIRY DATE
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs text-neutral-900 focus:bg-white focus:border-neutral-800 focus:outline-none transition-all font-mono"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-black hover:bg-neutral-800 px-5 py-2 text-xs font-bold text-white shadow-xs transition-all cursor-pointer"
                >
                  {editingItemId ? 'UPDATE PRODUCT' : 'SAVE PRODUCT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Restock Inventory Modal */}
      {restockingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 text-neutral-900 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-start justify-between border-b border-neutral-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
                  <PackagePlus className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">Restock Product</h3>
                  <p className="text-xs text-neutral-500 font-mono">{restockingItem.name}</p>
                </div>
              </div>
              <button
                onClick={() => setRestockingItem(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteRestock} className="space-y-4 text-xs">
              <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-3 flex justify-between items-center text-xs">
                <div>
                  <span className="text-neutral-500 block">Current In-Stock</span>
                  <strong className="text-sm font-mono text-neutral-900">{restockingItem.quantity} {restockingItem.unit}</strong>
                </div>
                <div className="text-right">
                  <span className="text-neutral-500 block">New Total After Restock</span>
                  <strong className="text-sm font-mono text-emerald-600">
                    {restockingItem.quantity + Number(restockQty || 0)} {restockingItem.unit}
                  </strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Quantity to Add ({restockingItem.unit})
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(Number(e.target.value))}
                  className="w-full rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2 text-sm text-neutral-900 font-mono font-bold focus:bg-white focus:border-neutral-800 focus:outline-none transition-all"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-2">
                {[10, 25, 50, 100, 250].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRestockQty(preset)}
                    className="flex-1 py-1 rounded-lg border border-neutral-200 text-xs font-semibold hover:bg-neutral-100 transition-colors"
                  >
                    +{preset}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setRestockingItem(null)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-black hover:bg-neutral-800 px-5 py-2 text-xs font-bold text-white shadow-xs"
                >
                  CONFIRM RESTOCK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Delete Confirmation Dialog */}
      <ConfirmDeleteModal
        open={!!deletingItem}
        title="Delete Product Entry?"
        description={
          deletingItem ? (
            <p>
              Are you sure you want to remove <strong className="text-neutral-900">"{deletingItem.name}"</strong> (SKU: {deletingItem.sku}) from warehouse inventory records?
            </p>
          ) : null
        }
        confirmLabel="Yes, Delete Product"
        onConfirm={handleExecuteDelete}
        onCancel={() => setDeletingItem(null)}
      />
    </div>
  )
}
