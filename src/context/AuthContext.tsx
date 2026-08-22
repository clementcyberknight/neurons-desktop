import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { db } from '@/db/localDb'
import { apiClient } from '@/services/apiClient'
import type {
  UserProfile,
  AppSettings,
  StaffCountBracket,
  TransactionVolumeBracket,
  MonthlyRevenueBracket,
  AIModelMode,
} from '@/types/database'

interface OnboardingInput {
  email: string
  fullName: string
  companyName: string
  staffCount: StaffCountBracket
  monthlyTransactionVolume: TransactionVolumeBracket
  monthlyRevenue: MonthlyRevenueBracket
  aiModelMode: AIModelMode
}

interface AuthContextType {
  user: UserProfile | null
  appSettings: AppSettings | null
  isLoading: boolean
  sendOtp: (email: string) => Promise<{ success: boolean; message: string }>
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean; isNewUser: boolean; message?: string }>
  saveOnboardingProfile: (data: OnboardingInput) => Promise<boolean>
  logout: () => Promise<void>
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const DEFAULT_ENDPOINT = 'https://neurons.savewithliquid.xyz'

const DEFAULT_SETTINGS: AppSettings = {
  id: 'global-settings',
  customBackendEndpoint: DEFAULT_ENDPOINT,
  aiModelMode: 'local_800mb',
  localModelDownloaded: false,
  theme: 'light',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  synced: 1,
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize user & settings from Dexie on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Load Settings
        let settings = await db.appSettings.get('global-settings')
        if (!settings) {
          await db.appSettings.add(DEFAULT_SETTINGS)
          settings = DEFAULT_SETTINGS
        } else if (
          !settings.customBackendEndpoint ||
          settings.customBackendEndpoint.includes('api.neurons.ai') ||
          settings.customBackendEndpoint.includes('localhost:4000') ||
          settings.customBackendEndpoint.includes('127.0.0.1')
        ) {
          settings = {
            ...settings,
            customBackendEndpoint: DEFAULT_ENDPOINT,
            updatedAt: Date.now(),
          }
          await db.appSettings.put(settings)
        }

        setAppSettings(settings)
        apiClient.setBaseUrl(settings.customBackendEndpoint || DEFAULT_ENDPOINT)

        // Initialize JWT Auth Tokens if present
        const savedAccessToken = localStorage.getItem('neurons_access_token')
        const savedRefreshToken = localStorage.getItem('neurons_refresh_token')
        if (savedAccessToken) {
          apiClient.setAuthTokens({
            accessToken: savedAccessToken,
            refreshToken: savedRefreshToken || undefined,
          })
        }

        // Load active User Profile
        const activeUserId = localStorage.getItem('neurons_active_user_id')
        if (activeUserId) {
          const profile = await db.userProfile.get(activeUserId)
          if (profile) {
            setUser(profile)
          }
        } else {
          // Check if any completed profile exists in local database
          const existing = await db.userProfile.filter((p) => p.onboardingCompleted).first()
          if (existing) {
            localStorage.setItem('neurons_active_user_id', existing.id)
            setUser(existing)
          }
        }
      } catch (err) {
        console.error('Error initializing AuthContext:', err)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  // Send OTP to email
  const sendOtp = useCallback(
    async (email: string): Promise<{ success: boolean; message: string }> => {
      const trimmedEmail = email.trim().toLowerCase()
      if (!trimmedEmail || !trimmedEmail.includes('@')) {
        return { success: false, message: 'Please enter a valid email address.' }
      }

      try {
        const backendRes = await apiClient.sendOtp(trimmedEmail)
        return {
          success: true,
          message: backendRes.message || `A 6-digit verification code has been sent to ${trimmedEmail}.`,
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send verification code. Please check your network.'
        return {
          success: false,
          message,
        }
      }
    },
    []
  )

  // Verify OTP
  const verifyOtp = useCallback(
    async (
      email: string,
      otp: string
    ): Promise<{ success: boolean; isNewUser: boolean; message?: string }> => {
      const trimmedEmail = email.trim().toLowerCase()
      const trimmedOtp = otp.trim()

      try {
        const backendRes = await apiClient.verifyOtp(trimmedEmail, trimmedOtp)
        if (backendRes.success) {
          if (backendRes.accessToken) {
            localStorage.setItem('neurons_access_token', backendRes.accessToken)
            if (backendRes.refreshToken) {
              localStorage.setItem('neurons_refresh_token', backendRes.refreshToken)
            }
            apiClient.setAuthTokens({
              accessToken: backendRes.accessToken,
              refreshToken: backendRes.refreshToken,
            })
          }

          if (!backendRes.isNewUser && backendRes.user) {
            const userProfile: UserProfile = {
              ...backendRes.user,
              synced: 1,
            }
            await db.userProfile.put(userProfile)
            setUser(userProfile)
            localStorage.setItem('neurons_active_user_id', userProfile.id)
            return { success: true, isNewUser: false }
          }
          return { success: true, isNewUser: true }
        }

        return {
          success: false,
          isNewUser: false,
          message: 'Invalid verification code. Please try again.',
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Verification failed. Please check your code.'
        return {
          success: false,
          isNewUser: false,
          message,
        }
      }
    },
    []
  )

  // Save Onboarding Profile & AI Model Configuration
  const saveOnboardingProfile = useCallback(
    async (data: OnboardingInput): Promise<boolean> => {
      const now = Date.now()
      const trimmedEmail = data.email.trim().toLowerCase()

      let createdProfile: UserProfile | null = null

      try {
        const backendRes = await apiClient.completeOnboarding({
          email: trimmedEmail,
          fullName: data.fullName.trim(),
          companyName: data.companyName.trim(),
          staffCount: data.staffCount,
          monthlyTransactionVolume: data.monthlyTransactionVolume,
          monthlyRevenue: data.monthlyRevenue,
          aiModelMode: data.aiModelMode,
        })

        if (backendRes.accessToken) {
          localStorage.setItem('neurons_access_token', backendRes.accessToken)
          if (backendRes.refreshToken) {
            localStorage.setItem('neurons_refresh_token', backendRes.refreshToken)
          }
          apiClient.setAuthTokens({
            accessToken: backendRes.accessToken,
            refreshToken: backendRes.refreshToken,
          })
        }

        if (backendRes.user) {
          createdProfile = {
            ...backendRes.user,
            synced: 1,
          }
        }
      } catch (backendErr) {
        console.warn('Backend onboarding endpoint unreachable, creating local offline profile:', backendErr)
      }

      if (!createdProfile) {
        const localOrgId = crypto.randomUUID()
        const localUserId = `user_${now}_${Math.floor(1000 + Math.random() * 9000)}`
        createdProfile = {
          id: localUserId,
          orgId: localOrgId,
          email: trimmedEmail,
          fullName: data.fullName.trim(),
          companyName: data.companyName.trim(),
          role: 'admin',
          staffCount: data.staffCount,
          monthlyTransactionVolume: data.monthlyTransactionVolume,
          monthlyRevenue: data.monthlyRevenue,
          aiModelMode: data.aiModelMode,
          onboardingCompleted: true,
          lastLoginAt: now,
          createdAt: now,
          updatedAt: now,
          synced: 0,
        }
      }

      try {
        await db.userProfile.put(createdProfile)

        const currentSettings = (await db.appSettings.get('global-settings')) || DEFAULT_SETTINGS
        const updatedSettings: AppSettings = {
          ...currentSettings,
          aiModelMode: data.aiModelMode,
          localModelDownloaded: data.aiModelMode === 'local_800mb',
          updatedAt: now,
        }
        await db.appSettings.put(updatedSettings)

        setUser(createdProfile)
        setAppSettings(updatedSettings)
        localStorage.setItem('neurons_active_user_id', createdProfile.id)
        return true
      } catch (err) {
        console.error('Error saving onboarding profile locally:', err)
        return false
      }
    },
    []
  )

  // Logout
  const logout = useCallback(async () => {
    localStorage.removeItem('neurons_active_user_id')
    localStorage.removeItem('neurons_access_token')
    localStorage.removeItem('neurons_refresh_token')
    apiClient.clearAuthTokens()
    setUser(null)
  }, [])

  // Update App Settings
  const updateSettings = useCallback(
    async (newSettings: Partial<AppSettings>) => {
      const now = Date.now()
      const current = appSettings || DEFAULT_SETTINGS
      const updated: AppSettings = {
        ...current,
        ...newSettings,
        updatedAt: now,
      }
      await db.appSettings.put(updated)
      setAppSettings(updated)
      if (updated.customBackendEndpoint) {
        apiClient.setBaseUrl(updated.customBackendEndpoint)
      }
    },
    [appSettings]
  )

  return (
    <AuthContext.Provider
      value={{
        user,
        appSettings,
        isLoading,
        sendOtp,
        verifyOtp,
        saveOnboardingProfile,
        logout,
        updateSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
