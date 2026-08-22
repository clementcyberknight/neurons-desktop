import React from 'react'

interface PosCategoryTabsProps {
  categories: string[]
  selectedCategory: string
  onSelectCategory: (cat: string) => void
}

export const PosCategoryTabs: React.FC<PosCategoryTabsProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onSelectCategory(cat)}
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
  )
}
