import React, { useRef } from 'react'
import { ShieldCheck, RefreshCw } from 'lucide-react'

interface OtpStepProps {
  email: string
  otpValues: string[]
  setOtpValues: React.Dispatch<React.SetStateAction<string[]>>
  isSubmitting: boolean
  errorMessage: string | null
  testOtpCode: string | null
  resendCooldown: number
  onVerify: (e?: React.FormEvent) => void
  onRequestResend: (e: React.FormEvent) => void
  onChangeEmail: () => void
}

export const OtpStep: React.FC<OtpStepProps> = ({
  email,
  otpValues,
  setOtpValues,
  isSubmitting,
  errorMessage,
  testOtpCode,
  resendCooldown,
  onVerify,
  onRequestResend,
  onChangeEmail,
}) => {
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([])

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) {
      const digits = val.replace(/\D/g, '').slice(0, 6).split('')
      const next = [...otpValues]
      digits.forEach((d, i) => {
        if (i < 6) next[i] = d
      })
      setOtpValues(next)
      const lastIndex = Math.min(digits.length, 5)
      otpInputsRef.current[lastIndex]?.focus()
      return
    }

    const next = [...otpValues]
    next[index] = val.slice(-1)
    setOtpValues(next)

    if (val && index < 5) {
      otpInputsRef.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus()
    }
  }

  return (
    <div className="w-full max-w-[400px] animate-in fade-in zoom-in-95 duration-200">
      <div className="text-center mb-8">
        <div className="h-12 w-12 mx-auto rounded-2xl bg-black text-white flex items-center justify-center mb-4 shadow-sm">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">
          Enter Verification Code
        </h2>
        <p className="text-xs text-neutral-500 mt-2">
          We sent a 6-digit code to <strong className="text-neutral-900">{email}</strong>
        </p>
      </div>

      {testOtpCode && (
        <div className="mb-4 p-3 rounded-xl bg-neutral-100 border border-neutral-300 text-center">
          <span className="text-[11px] text-neutral-500 block">Dev / Test Auto Code:</span>
          <button
            type="button"
            onClick={() => {
              const digits = testOtpCode.split('')
              setOtpValues(digits)
            }}
            className="font-mono font-extrabold text-sm tracking-widest text-black underline mt-0.5 cursor-pointer"
          >
            {testOtpCode} (Click to Fill)
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-neutral-100 border border-neutral-300 text-neutral-800 text-xs font-medium">
          {errorMessage}
        </div>
      )}

      <form onSubmit={onVerify} className="space-y-6">
        {/* 6 Digit PIN Inputs */}
        <div className="flex justify-between gap-2">
          {otpValues.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                otpInputsRef.current[i] = el
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(i, e)}
              className="w-12 h-14 rounded-xl border border-neutral-300 bg-neutral-50 text-center text-lg font-bold font-mono text-black focus:bg-white focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || otpValues.join('').length < 6}
          className="w-full rounded-full bg-black hover:bg-neutral-800 disabled:opacity-40 py-3.5 text-sm font-bold text-white shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSubmitting ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <span>Verify Code & Continue</span>
          )}
        </button>

        <div className="flex items-center justify-between pt-2 text-xs font-semibold text-neutral-500">
          <button
            type="button"
            onClick={onChangeEmail}
            className="hover:text-black cursor-pointer"
          >
            Change Email
          </button>

          <button
            type="button"
            disabled={resendCooldown > 0}
            onClick={onRequestResend}
            className="hover:text-black disabled:text-neutral-300 disabled:cursor-not-allowed cursor-pointer"
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
          </button>
        </div>
      </form>
    </div>
  )
}
