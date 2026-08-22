import React from 'react'

interface FullNameSlideProps {
  fullName: string
  setFullName: (val: string) => void
}

export const FullNameSlide: React.FC<FullNameSlideProps> = ({ fullName, setFullName }) => {
  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
      <div>
        <h3 className="text-xl font-extrabold text-black tracking-tight">
          What is your full name?
        </h3>
        <p className="text-xs text-neutral-500 mt-1">
          This will appear on cashier logs, POS transactions, and executive audits.
        </p>
      </div>

      <div>
        <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">
          Your Full Name
        </label>
        <input
          type="text"
          autoFocus
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Akhimien Clement"
          className="w-full px-5 py-3.5 rounded-full border border-neutral-300 bg-white text-sm font-medium text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
        />
      </div>
    </div>
  )
}
