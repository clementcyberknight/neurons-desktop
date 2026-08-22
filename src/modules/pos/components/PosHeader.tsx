import React from 'react'
import { Zap, Lock, Unlock } from 'lucide-react'

interface PosHeaderProps {
  isShiftActive: boolean
  shiftStartTime: string
  onOpenStartShift: () => void
  onOpenCloseShift: () => void
}

export const PosHeader: React.FC<PosHeaderProps> = ({
  isShiftActive,
  shiftStartTime,
  onOpenStartShift,
  onOpenCloseShift,
}) => {
  return (
    <header className="bg-white border-b border-neutral-200 px-6 py-3.5 flex items-center justify-between shadow-2xs shrink-0">
      {/* Left Title */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-black flex items-center justify-center text-white shadow-xs">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="h-5 w-5"
          >
            <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19 9l-5 5-4-4-3 3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-sm sm:text-base font-extrabold text-black uppercase tracking-wide">
          WHOLESALE & PRODUCTION POS TERMINAL
        </h1>
      </div>

      {/* Right Shift & System Status Meta */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* System Status */}
        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono block">
            SYSTEM STATUS
          </span>
          <span className="text-xs font-bold text-black flex items-center justify-end gap-1">
            <Zap className="h-3.5 w-3.5 fill-black text-black" />
            <span>Online Mode</span>
          </span>
        </div>

        {/* Shift Status Indicator */}
        {isShiftActive ? (
          <div className="text-right hidden sm:block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-black font-mono block">
              SHIFT ACTIVE
            </span>
            <span className="text-xs font-semibold text-neutral-800">
              Opened: {shiftStartTime}
            </span>
          </div>
        ) : (
          <div className="text-right hidden sm:block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono block">
              REGISTER LOCKED
            </span>
            <span className="text-xs font-semibold text-neutral-500">Shift Inactive</span>
          </div>
        )}

        {/* Shift Action Button */}
        {isShiftActive ? (
          <button
            type="button"
            onClick={onOpenCloseShift}
            className="flex items-center gap-1.5 rounded-xl border border-black bg-white hover:bg-neutral-100 text-black px-3.5 py-1.5 text-xs font-bold transition-colors shadow-2xs cursor-pointer"
          >
            <Lock className="h-3.5 w-3.5 text-black" />
            <span>Close Shift</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenStartShift}
            className="flex items-center gap-1.5 rounded-xl bg-black hover:bg-neutral-800 text-white px-3.5 py-1.5 text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <Unlock className="h-3.5 w-3.5" />
            <span>Start Shift</span>
          </button>
        )}
      </div>
    </header>
  )
}
