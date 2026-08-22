import React from 'react'
import type { TransactionVolumeBracket } from '@/types/database'
import { CreditCard } from 'lucide-react'

interface MonthlyVolumeSlideProps {
  monthlyVolume: TransactionVolumeBracket
  setMonthlyVolume: (val: TransactionVolumeBracket) => void
}

const OPTIONS: { id: TransactionVolumeBracket; label: string; desc: string }[] = [
  { id: 'under_500', label: '< 500 Orders / mo', desc: 'Light daily cashier sales' },
  { id: '500_2500', label: '500 – 2,500 Orders / mo', desc: 'Moderate store checkout' },
  { id: '2500_10000', label: '2,500 – 10,000 Orders / mo', desc: 'Fast-paced wholesale depot' },
  { id: 'over_10000', label: '10,000+ Orders / mo', desc: 'High-throughput enterprise' },
]

export const MonthlyVolumeSlide: React.FC<MonthlyVolumeSlideProps> = ({
  monthlyVolume,
  setMonthlyVolume,
}) => {
  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
      <div>
        <h3 className="text-xl font-extrabold text-black tracking-tight">
          Monthly Transaction Volume
        </h3>
        <p className="text-xs text-neutral-500 mt-1">
          Optimizes Dexie compound indexes for high-speed offline indexing (100,000+ records).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setMonthlyVolume(opt.id)}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              monthlyVolume === opt.id
                ? 'border-black bg-black text-white shadow-md'
                : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400'
            }`}
          >
            <CreditCard className="h-5 w-5 mb-2" />
            <h4 className="text-xs font-bold">{opt.label}</h4>
            <p className={`text-[11px] mt-0.5 ${monthlyVolume === opt.id ? 'text-neutral-300' : 'text-neutral-500'}`}>
              {opt.desc}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
