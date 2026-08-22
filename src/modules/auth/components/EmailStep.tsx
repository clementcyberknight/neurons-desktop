import React from 'react'
import { RefreshCw } from 'lucide-react'

interface EmailStepProps {
  email: string
  setEmail: (val: string) => void
  authMode: 'signin' | 'signup'
  setAuthMode: (mode: 'signin' | 'signup') => void
  isSubmitting: boolean
  errorMessage: string | null
  setErrorMessage: (msg: string | null) => void
  onSubmit: (e: React.FormEvent) => void
}

export const EmailStep: React.FC<EmailStepProps> = ({
  email,
  setEmail,
  authMode,
  setAuthMode,
  isSubmitting,
  errorMessage,
  setErrorMessage,
  onSubmit,
}) => {
  return (
    <div className="w-full max-w-[380px] animate-in fade-in zoom-in-95 duration-200">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-neutral-900 tracking-tight">
          {authMode === 'signup' ? 'Create an account' : 'Welcome back'}
        </h2>
      </div>

      {errorMessage && (
        <div className="mb-5 p-3 rounded-2xl bg-neutral-100 border border-neutral-300 text-neutral-800 text-xs font-medium text-left">
          {errorMessage}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full px-5 py-3.5 rounded-full border border-neutral-300 bg-white text-sm font-medium text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-black hover:bg-neutral-800 disabled:opacity-50 py-3.5 text-sm font-bold text-white shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSubmitting ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <span>Continue</span>
          )}
        </button>

        {/* Bottom Switch Link */}
        <div className="pt-4 text-center text-xs text-neutral-600">
          {authMode === 'signup' ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin')
                  setErrorMessage(null)
                }}
                className="font-bold text-black hover:underline cursor-pointer ml-1"
              >
                Login
              </button>
            </p>
          ) : (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup')
                  setErrorMessage(null)
                }}
                className="font-bold text-black hover:underline cursor-pointer ml-1"
              >
                Sign up
              </button>
            </p>
          )}
        </div>
      </form>
    </div>
  )
}
