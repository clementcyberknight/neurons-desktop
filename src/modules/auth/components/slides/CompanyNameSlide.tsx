import React from 'react'

interface CompanyNameSlideProps {
  companyName: string
  setCompanyName: (val: string) => void
}

export const CompanyNameSlide: React.FC<CompanyNameSlideProps> = ({ companyName, setCompanyName }) => {
  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
      <div>
        <h3 className="text-xl font-extrabold text-black tracking-tight">
          What is your company or business name?
        </h3>
        <p className="text-xs text-neutral-500 mt-1">
          Your organization name printed on receipts, customer invoices, and financial reports.
        </p>
      </div>

      <div>
        <label className="block text-xs font-bold text-neutral-700 uppercase mb-1.5">
          Company / Organization Name
        </label>
        <input
          type="text"
          autoFocus
          required
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="e.g. BAU Paints & Chemical Manufacturing Ltd."
          className="w-full px-5 py-3.5 rounded-full border border-neutral-300 bg-white text-sm font-medium text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
        />
      </div>
    </div>
  )
}
