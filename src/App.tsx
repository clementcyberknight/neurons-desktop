import React from 'react'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { AuthModule } from '@/modules/auth/AuthModule'
import { AppLayout } from '@/components/layout/AppLayout'

const AppRoot: React.FC = () => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-white flex flex-col items-center justify-center font-sans">
        <div className="h-10 w-10 rounded-2xl bg-black text-white flex items-center justify-center font-extrabold text-base shadow-lg animate-pulse mb-3">
          N
        </div>
        <p className="text-xs font-mono text-neutral-400">Loading Neurons Engine...</p>
      </div>
    )
  }

  if (!user || !user.onboardingCompleted) {
    return <AuthModule />
  }

  return <AppLayout />
}

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRoot />
    </AuthProvider>
  )
}

export default App
