import React from 'react'

export const AuthHeader: React.FC = () => {
  return (
    <header
      className="px-8 py-4 flex items-center justify-between border-b border-neutral-200 bg-white shadow-2xs pr-[144px] shrink-0 select-none"
      style={{ WebkitAppRegion: 'drag' }}
    >
      <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' }}>
        <div className="h-8 w-8 rounded-xl bg-black text-white flex items-center justify-center font-extrabold text-sm shadow-xs">
          N
        </div>
        <div>
          <h1 className="text-sm font-extrabold text-black uppercase tracking-wider">
            Neurons OS
          </h1>
          <p className="text-[10px] text-neutral-400 font-mono leading-tight">
            Offline Business Engine
          </p>
        </div>
      </div>
    </header>
  )
}
