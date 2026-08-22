import React, { useRef } from 'react'
import { FormModal } from '@/components/ui/FormModal'
import {
  DEFAULT_CATEGORIES,
  DEFAULT_SUPPLIERS,
  DEFAULT_UNITS,
  DEFAULT_SALES_CHANNELS,
} from './InventoryFilters'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

export interface ProductFormData {
  name: string
  image: string
  brand: string
  supplier: string
  category: string
  unit: string
  quantity: number
  type: 'Finished Good' | 'Raw Material'
  salesChannel: string
  costPrice: number
  unitPrice: number
  minThreshold: number
  expiryDate: string
}

interface ProductFormModalProps {
  open: boolean
  onClose: () => void
  isEditing: boolean
  formData: ProductFormData
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>
  onSubmit: (e: React.FormEvent) => void
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  open,
  onClose,
  isEditing,
  formData,
  setFormData,
  onSubmit,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  return (
    <FormModal
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      maxWidth="2xl"
      title={isEditing ? 'Edit Product' : 'Add New Product'}
      subtitle={
        isEditing
          ? 'Update the product specifications, pricing, stock levels, or images.'
          : 'Enter the product details to add it to the warehouse inventory.'
      }
      submitLabel={isEditing ? 'UPDATE PRODUCT' : 'SAVE PRODUCT'}
    >
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
              {formData.image
                ? 'Image selected for offline storage'
                : 'No file chosen (PNG, JPG up to 2MB)'}
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
            onChange={(e) =>
              setFormData({
                ...formData,
                type: e.target.value as 'Finished Good' | 'Raw Material',
              })
            }
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
    </FormModal>
  )
}
