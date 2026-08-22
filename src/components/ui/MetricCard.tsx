import React from 'react'

export interface MetricCardProps {
  label: string
  value: React.ReactNode
  valueColor?: string
  subtext?: React.ReactNode
  watermarkIcon?: React.ReactNode
  topRightIcon?: React.ReactNode
  accentLeftBorder?: string
  className?: string
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  valueColor = 'text-neutral-900',
  subtext,
  watermarkIcon,
  topRightIcon,
  accentLeftBorder,
  className = '',
}) => {
  const borderLeftStyle = accentLeftBorder ? `border-l-4 ${accentLeftBorder}` : ''

  return (
    <div
      className={`rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs relative overflow-hidden flex flex-col justify-between ${borderLeftStyle} ${className}`}
    >
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase font-mono block">
            {label}
          </span>
          {topRightIcon && (
            <div className="text-neutral-500">{topRightIcon}</div>
          )}
        </div>

        <div className={`mt-2 text-2xl sm:text-3xl font-black font-mono ${valueColor}`}>
          {value}
        </div>

        {subtext && (
          <div className="text-[11px] text-neutral-400 mt-1 block font-mono">
            {subtext}
          </div>
        )}
      </div>

      {watermarkIcon && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          {watermarkIcon}
        </div>
      )}
    </div>
  )
}
