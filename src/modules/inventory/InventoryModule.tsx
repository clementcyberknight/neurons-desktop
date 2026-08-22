import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/localDb'
import type { InventoryItem } from '@/types/database'
import { DataTable, type DataTableColumn, type DataTableAction } from '@/components/ui/DataTable'
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal'
import { InventoryHeader } from './components/InventoryHeader'
import {
  InventoryFilters,
  type ProductTypeFilter,
  type StockStatusFilter,
} from './components/InventoryFilters'
import { ProductFormModal, type ProductFormData } from './components/ProductFormModal'
import { RestockModal } from './components/RestockModal'
import { AlertCircle, Package, Store, Pencil, PackagePlus, Trash2 } from 'lucide-react'

interface Props {
  searchQuery?: string
  onAskAI?: (prompt: string) => void
}

const INITIAL_FORM_DATA: ProductFormData = {
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
}

export const InventoryModule: React.FC<Props> = ({ searchQuery: externalSearchQuery = '' }) => {
  const [localSearch, setLocalSearch] = useState(externalSearchQuery)
  const [typeFilter, setTypeFilter] = useState<ProductTypeFilter>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<StockStatusFilter>('ALL')

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Modals & Selection State
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [restockingItem, setRestockingItem] = useState<InventoryItem | null>(null)
  const [restockQty, setRestockQty] = useState<number>(50)
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null)

  // Form State
  const [formData, setFormData] = useState<ProductFormData>(INITIAL_FORM_DATA)

  useEffect(() => {
    setCurrentPage(1)
  }, [localSearch, externalSearchQuery, typeFilter, categoryFilter, statusFilter, pageSize])

  // Scalable 100k+ Live Query (Streaming cursor calculation + indexed offset/limit)
  const { inventory, totalCount, lowStockCount } = useLiveQuery(async () => {
    const query = (localSearch || externalSearchQuery).trim().toLowerCase()

    // 1. Calculate lowStockCount via single-pass cursor streaming (AGENTS.md §5.2)
    let countLow = 0
    await db.inventory.each((i) => {
      if (i.quantity <= i.minThreshold) countLow++
    })

    // 2. Query with indexed offset & limit (AGENTS.md §5.1)
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
      const collection =
        typeFilter !== 'ALL'
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

    return {
      inventory: paginatedSlice,
      totalCount: filteredCount,
      lowStockCount: countLow,
    }
  }, [localSearch, externalSearchQuery, typeFilter, categoryFilter, statusFilter, currentPage, pageSize]) || {
    inventory: [],
    totalCount: 0,
    lowStockCount: 0,
  }

  // Open Edit Modal with populated product data
  const handleOpenEdit = useCallback((item: InventoryItem) => {
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
  }, [])

  const handleOpenCreate = useCallback(() => {
    setEditingItemId(null)
    setFormData(INITIAL_FORM_DATA)
    setShowAddModal(true)
  }, [])

  const handleResetFilters = useCallback(() => {
    setLocalSearch('')
    setTypeFilter('ALL')
    setCategoryFilter('ALL')
    setStatusFilter('ALL')
  }, [])

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
  const inventoryColumns: DataTableColumn<InventoryItem>[] = useMemo(
    () => [
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
            <div className="text-[11px] text-neutral-500 truncate max-w-[140px]">
              {item.supplier || 'Unassigned'}
            </div>
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
                <span
                  className={`font-mono font-bold ${
                    isOut ? 'text-red-700' : isLow ? 'text-red-600' : 'text-neutral-900'
                  }`}
                >
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
          <span className="font-mono text-[11px] text-neutral-500">{item.expiryDate || '—'}</span>
        ),
      },
    ],
    []
  )

  const inventoryActions: DataTableAction<InventoryItem>[] = useMemo(
    () => [
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
    ],
    [handleOpenEdit]
  )

  return (
    <div className="p-6 h-full flex flex-col justify-between overflow-y-auto space-y-4 bg-[#fafafa] font-sans select-none no-scrollbar">
      {/* 1. Top Action Bar */}
      <InventoryHeader onOpenCreate={handleOpenCreate} />

      {/* 2. Search & Filter Bar */}
      <InventoryFilters
        searchQuery={localSearch}
        onSearchChange={setLocalSearch}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        lowStockCount={lowStockCount}
        onResetFilters={handleResetFilters}
      />

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

      {/* 4. Add / Edit Product Modal */}
      <ProductFormModal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          setEditingItemId(null)
        }}
        isEditing={Boolean(editingItemId)}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleFormSubmit}
      />

      {/* 5. Restock Product Modal */}
      <RestockModal
        item={restockingItem}
        restockQty={restockQty}
        setRestockQty={setRestockQty}
        onClose={() => setRestockingItem(null)}
        onSubmit={handleExecuteRestock}
      />

      {/* 6. Delete Confirmation Dialog */}
      <ConfirmDeleteModal
        open={!!deletingItem}
        title="Delete Product Entry?"
        description={
          deletingItem ? (
            <p>
              Are you sure you want to remove{' '}
              <strong className="text-neutral-900">"{deletingItem.name}"</strong> (SKU:{' '}
              {deletingItem.sku}) from warehouse inventory records?
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
export default InventoryModule
