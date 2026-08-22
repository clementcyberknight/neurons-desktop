import React from 'react'

export const ColorWheelIcon: React.FC<{ className?: string }> = ({ className = 'h-14 w-14' }) => (
  <svg viewBox="0 0 100 100" className={className}>
    <circle cx="50" cy="50" r="46" fill="#f4f4f5" stroke="#e4e4e7" strokeWidth="1" />
    <path d="M50 50 L50 4 A46 46 0 0 1 73 10 Z" fill="#18181b" />
    <path d="M50 50 L73 10 A46 46 0 0 1 90 27 Z" fill="#27272a" />
    <path d="M50 50 L90 27 A46 46 0 0 1 96 50 Z" fill="#3f3f46" />
    <path d="M50 50 L96 50 A46 46 0 0 1 90 73 Z" fill="#52525b" />
    <path d="M50 50 L90 73 A46 46 0 0 1 73 90 Z" fill="#71717a" />
    <path d="M50 50 L73 90 A46 46 0 0 1 50 96 Z" fill="#a1a1aa" />
    <path d="M50 50 L50 96 A46 46 0 0 1 27 90 Z" fill="#d4d4d8" />
    <path d="M50 50 L27 90 A46 46 0 0 1 10 73 Z" fill="#e4e4e7" />
    <path d="M50 50 L10 73 A46 46 0 0 1 4 50 Z" fill="#71717a" />
    <path d="M50 50 L4 50 A46 46 0 0 1 10 27 Z" fill="#3f3f46" />
    <path d="M50 50 L10 27 A46 46 0 0 1 27 10 Z" fill="#27272a" />
    <path d="M50 50 L27 10 A46 46 0 0 1 50 4 Z" fill="#18181b" />
    <circle cx="50" cy="50" r="14" fill="#ffffff" />
    <circle cx="50" cy="50" r="6" fill="#000000" />
  </svg>
)
