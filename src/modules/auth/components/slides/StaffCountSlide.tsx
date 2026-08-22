import React from 'react'
import type { StaffCountBracket } from '@/types/database'
import { Users } from 'lucide-react'

interface StaffCountSlideProps {
  staffCount: StaffCountBracket
  setStaffCount: (val: StaffCountBracket) => void
}

const OPTIONS: { id: StaffCountBracket; label: string; desc: string }[] = [
  { id: '1-5', label: '1 – 5 Employees', desc: 'Micro retail / Sole enterprise' },
  { id: '6-20', label: '6 – 20 Employees', desc: 'Growing branch or warehouse' },
  { id: '21-50', label: '21 – 50 Employees', desc: 'Medium business depot' },
  { id: '50+', label: '50+ Employees', desc: 'Large production factory' },
]

export const StaffCountSlide: React.FC<StaffCountSlideProps> = ({ staffCount, setStaffCount }) => {
  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
      <div>
        <h3 className="text-xl font-extrabold text-black tracking-tight">
          How many staff members work in your company?
        </h3>
        <p className="text-xs text-neutral-500 mt-1">
          Helps calibrate shift rota scheduling, payroll entries, and role permissions.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setStaffCount(opt.id)}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              staffCount === opt.id
                ? 'border-black bg-black text-white shadow-md'
                : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400'
            }`}
          >
            <Users className="h-5 w-5 mb-2" />
            <h4 className="text-xs font-bold">{opt.label}</h4>
            <p className={`text-[11px] mt-0.5 ${staffCount === opt.id ? 'text-neutral-300' : 'text-neutral-500'}`}>
              {opt.desc}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
