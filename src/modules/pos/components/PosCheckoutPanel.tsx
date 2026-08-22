import React from 'react'
import {
  Banknote,
  ArrowLeftRight,
  CreditCard,
  Wallet,
  Layers,
  CheckCircle2,
  Check,
} from 'lucide-react'

export type PaymentMethod = 'Cash' | 'Transfer' | 'Card' | 'Store Credit' | 'Split'

interface PosCheckoutPanelProps {
  paymentMethod: PaymentMethod
  onSelectPaymentMethod: (method: PaymentMethod) => void
  onOpenSplitModal: () => void
  subtotal: number
  total: number
  isCartEmpty: boolean
  onCheckout: () => void
}

export const PosCheckoutPanel: React.FC<PosCheckoutPanelProps> = ({
  paymentMethod,
  onSelectPaymentMethod,
  onOpenSplitModal,
  subtotal,
  total,
  isCartEmpty,
  onCheckout,
}) => {
  return (
    <div className="p-4 bg-neutral-50/80 border-t border-neutral-200 space-y-4">
      {/* PAYMENT METHOD */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 font-mono block mb-2">
          PAYMENT METHOD
        </span>

        {/* 4 Method Buttons Grid */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {/* Cash */}
          <button
            type="button"
            onClick={() => onSelectPaymentMethod('Cash')}
            className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              paymentMethod === 'Cash'
                ? 'border-black bg-black text-white shadow-2xs'
                : 'border-neutral-200 bg-white hover:border-neutral-400 text-neutral-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Banknote
                className={`h-4 w-4 ${paymentMethod === 'Cash' ? 'text-white' : 'text-neutral-700'}`}
              />
              <span>Cash</span>
            </div>
            {paymentMethod === 'Cash' && (
              <CheckCircle2 className="h-4 w-4 text-white fill-white text-black" />
            )}
          </button>

          {/* Transfer */}
          <button
            type="button"
            onClick={() => onSelectPaymentMethod('Transfer')}
            className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              paymentMethod === 'Transfer'
                ? 'border-black bg-black text-white shadow-2xs'
                : 'border-neutral-200 bg-white hover:border-neutral-400 text-neutral-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <ArrowLeftRight
                className={`h-4 w-4 ${paymentMethod === 'Transfer' ? 'text-white' : 'text-neutral-700'}`}
              />
              <span>Transfer</span>
            </div>
            {paymentMethod === 'Transfer' && (
              <CheckCircle2 className="h-4 w-4 text-white fill-white text-black" />
            )}
          </button>

          {/* Card / POS */}
          <button
            type="button"
            onClick={() => onSelectPaymentMethod('Card')}
            className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              paymentMethod === 'Card'
                ? 'border-black bg-black text-white shadow-2xs'
                : 'border-neutral-200 bg-white hover:border-neutral-400 text-neutral-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <CreditCard
                className={`h-4 w-4 ${paymentMethod === 'Card' ? 'text-white' : 'text-neutral-700'}`}
              />
              <span>Card / POS</span>
            </div>
            {paymentMethod === 'Card' && (
              <CheckCircle2 className="h-4 w-4 text-white fill-white text-black" />
            )}
          </button>

          {/* Store Credit */}
          <button
            type="button"
            onClick={() => onSelectPaymentMethod('Store Credit')}
            className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              paymentMethod === 'Store Credit'
                ? 'border-black bg-black text-white shadow-2xs'
                : 'border-neutral-200 bg-white hover:border-neutral-400 text-neutral-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Wallet
                className={`h-4 w-4 ${
                  paymentMethod === 'Store Credit' ? 'text-white' : 'text-neutral-700'
                }`}
              />
              <span>Store Credit</span>
            </div>
            {paymentMethod === 'Store Credit' && (
              <CheckCircle2 className="h-4 w-4 text-white fill-white text-black" />
            )}
          </button>
        </div>

        {/* Split Payment Wide Card */}
        <div
          className={`rounded-xl border p-2.5 flex items-center justify-between transition-all ${
            paymentMethod === 'Split'
              ? 'border-black bg-neutral-900 text-white'
              : 'border-neutral-200 bg-white text-neutral-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`h-6 w-6 rounded-lg flex items-center justify-center ${
                paymentMethod === 'Split'
                  ? 'bg-neutral-800 text-white'
                  : 'bg-neutral-100 text-black'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
            </div>
            <div>
              <h6 className="text-xs font-bold leading-none">Split Payment</h6>
              <span
                className={`text-[10px] mt-0.5 block ${
                  paymentMethod === 'Split' ? 'text-neutral-400' : 'text-neutral-500'
                }`}
              >
                Pay with multiple payment methods
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onSelectPaymentMethod('Split')
              onOpenSplitModal()
            }}
            className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-colors shadow-2xs cursor-pointer ${
              paymentMethod === 'Split'
                ? 'border-neutral-600 bg-neutral-800 text-white hover:bg-neutral-700'
                : 'border-neutral-300 bg-white hover:bg-neutral-100 text-black'
            }`}
          >
            Configure
          </button>
        </div>
      </div>

      {/* Subtotal & Total Due */}
      <div className="space-y-1.5 pt-2 border-t border-neutral-200 text-xs">
        <div className="flex items-center justify-between text-neutral-500 font-mono">
          <span>SUBTOTAL</span>
          <span>₦{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>

        <div className="flex items-center justify-between text-black pt-1">
          <span className="font-extrabold uppercase font-mono tracking-wider text-xs">TOTAL</span>
          <span className="font-mono text-xl font-extrabold text-black">
            ₦{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Pay Button */}
      <button
        type="button"
        onClick={onCheckout}
        disabled={isCartEmpty}
        className="w-full rounded-xl bg-black hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold py-3 text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <Check className="h-5 w-5 stroke-[3]" />
        <span>PAY ₦{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      </button>
    </div>
  )
}
