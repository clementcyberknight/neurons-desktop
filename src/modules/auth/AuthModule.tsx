import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import type {
  StaffCountBracket,
  TransactionVolumeBracket,
  MonthlyRevenueBracket,
  AIModelMode,
} from '@/types/database'
import { aiModelDownloader } from '@/services/aiModelDownloader'
import { AuthHeader } from './components/AuthHeader'
import { AuthFooter } from './components/AuthFooter'
import { EmailStep } from './components/EmailStep'
import { OtpStep } from './components/OtpStep'
import { OnboardingSlideshow } from './components/OnboardingSlideshow'

type AuthStep = 'EMAIL' | 'OTP' | 'ONBOARDING'

export const AuthModule: React.FC = () => {
  const { sendOtp, verifyOtp, saveOnboardingProfile } = useAuth()

  // Primary Auth Flow State
  const [authStep, setAuthStep] = useState<AuthStep>('EMAIL')
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', ''])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState<number>(0)

  // Onboarding Slideshow State (6 Slides)
  const [slideIndex, setSlideIndex] = useState<number>(0)
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [staffCount, setStaffCount] = useState<StaffCountBracket>('1-5')
  const [monthlyVolume, setMonthlyVolume] = useState<TransactionVolumeBracket>('500_2500')
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenueBracket>('1m_5m')
  const [aiMode, setAiMode] = useState<AIModelMode>('local_800mb')

  // Real Hugging Face AI Model Download State
  const [isDownloadingModel, setIsDownloadingModel] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [downloadSpeed, setDownloadSpeed] = useState(0)
  const [loadedMB, setLoadedMB] = useState(0)
  const [totalMB, setTotalMB] = useState(697.8)
  const [etaSeconds, setEtaSeconds] = useState(0)
  const [isModelDownloaded, setIsModelDownloaded] = useState(false)

  // Check if model already downloaded in Cache Storage or Dexie
  useEffect(() => {
    aiModelDownloader.isModelDownloaded().then((isReady) => {
      if (isReady) {
        setIsModelDownloaded(true)
        setDownloadProgress(100)
      }
    })
  }, [])

  // Resend OTP Countdown timer with cleanup
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  // Handle Send OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!email.trim()) {
      setErrorMessage('Please enter your business email.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await sendOtp(email)
      if (res.success) {
        setAuthStep('OTP')
        setResendCooldown(45)
      } else {
        setErrorMessage(res.message)
      }
    } catch {
      setErrorMessage('Failed to send verification code. Please check your network.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Verify OTP
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setErrorMessage(null)
    const code = otpValues.join('')

    if (code.length < 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await verifyOtp(email, code)
      if (res.success) {
        if (res.isNewUser) {
          setAuthStep('ONBOARDING')
          setSlideIndex(0)
        }
      } else {
        setErrorMessage(res.message || 'Invalid verification code. Please try again.')
      }
    } catch {
      setErrorMessage('Verification failed. Please retry.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Trigger Real Hugging Face AI Model Download
  const handleStartLocalDownload = async () => {
    if (isDownloadingModel || isModelDownloaded) return
    setIsDownloadingModel(true)
    setErrorMessage(null)
    setDownloadProgress(0)

    try {
      const completed = await aiModelDownloader.downloadModel((progress) => {
        setDownloadProgress(progress.percent)
        setDownloadSpeed(progress.speedMBps)
        setLoadedMB(progress.loadedMB)
        setTotalMB(progress.totalMB)
        setEtaSeconds(progress.etaSeconds)
      })

      if (completed) {
        setIsModelDownloaded(true)
        setDownloadProgress(100)
      }
    } catch (downloadErr) {
      const msg = downloadErr instanceof Error ? downloadErr.message : 'Model download failed'
      setErrorMessage(`Hugging Face model download failed: ${msg}. You can retry or switch to Cloud API.`)
    } finally {
      setIsDownloadingModel(false)
    }
  }

  // Handle Onboarding Completion
  const handleCompleteOnboarding = async () => {
    setErrorMessage(null)
    if (!fullName.trim() || !companyName.trim()) {
      setErrorMessage('Please ensure your Name and Company Name are filled.')
      return
    }
    if (aiMode === 'local_800mb' && !isModelDownloaded) {
      setErrorMessage('Please download the Local AI Model before launching the workspace.')
      return
    }

    setIsSubmitting(true)
    try {
      const success = await saveOnboardingProfile({
        email,
        fullName,
        companyName,
        staffCount,
        monthlyTransactionVolume: monthlyVolume,
        monthlyRevenue,
        aiModelMode: aiMode,
      })

      if (!success) {
        setErrorMessage('Could not initialize workspace. Please try again.')
      }
    } catch {
      setErrorMessage('An unexpected error occurred during setup.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Next Slide in Onboarding
  const handleNextSlide = () => {
    setErrorMessage(null)
    if (slideIndex === 0 && !fullName.trim()) {
      setErrorMessage('Please enter your full name.')
      return
    }
    if (slideIndex === 1 && !companyName.trim()) {
      setErrorMessage('Please enter your business or company name.')
      return
    }
    if (slideIndex === 5 && aiMode === 'local_800mb' && !isModelDownloaded) {
      setErrorMessage('Please complete downloading the Local AI Model before launching the workspace.')
      return
    }

    if (slideIndex < 5) {
      setSlideIndex((prev) => prev + 1)
    } else {
      handleCompleteOnboarding()
    }
  }

  const handlePrevSlide = () => {
    if (slideIndex > 0) {
      setSlideIndex((prev) => prev - 1)
    }
  }

  return (
    <div className="min-h-screen w-screen bg-[#fafafa] flex flex-col justify-between text-neutral-900 font-sans select-none antialiased">
      {/* Top Header */}
      <AuthHeader />

      {/* Main Content Area on Bare Canvas */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        {/* Stage 1: Email Form */}
        {authStep === 'EMAIL' && (
          <EmailStep
            email={email}
            setEmail={setEmail}
            authMode={authMode}
            setAuthMode={setAuthMode}
            isSubmitting={isSubmitting}
            errorMessage={errorMessage}
            setErrorMessage={setErrorMessage}
            onSubmit={handleRequestOtp}
          />
        )}

        {/* Stage 2: OTP Verification */}
        {authStep === 'OTP' && (
          <OtpStep
            email={email}
            otpValues={otpValues}
            setOtpValues={setOtpValues}
            isSubmitting={isSubmitting}
            errorMessage={errorMessage}
            resendCooldown={resendCooldown}
            onVerify={handleVerifyOtp}
            onRequestResend={handleRequestOtp}
            onChangeEmail={() => setAuthStep('EMAIL')}
          />
        )}

        {/* Stage 3: Onboarding Questionnaire Slideshow */}
        {authStep === 'ONBOARDING' && (
          <OnboardingSlideshow
            slideIndex={slideIndex}
            setSlideIndex={setSlideIndex}
            fullName={fullName}
            setFullName={setFullName}
            companyName={companyName}
            setCompanyName={setCompanyName}
            staffCount={staffCount}
            setStaffCount={setStaffCount}
            monthlyVolume={monthlyVolume}
            setMonthlyVolume={setMonthlyVolume}
            monthlyRevenue={monthlyRevenue}
            setMonthlyRevenue={setMonthlyRevenue}
            aiMode={aiMode}
            setAiMode={setAiMode}
            isDownloadingModel={isDownloadingModel}
            downloadProgress={downloadProgress}
            downloadSpeed={downloadSpeed}
            loadedMB={loadedMB}
            totalMB={totalMB}
            etaSeconds={etaSeconds}
            isModelDownloaded={isModelDownloaded}
            onStartLocalDownload={handleStartLocalDownload}
            isSubmitting={isSubmitting}
            errorMessage={errorMessage}
            onNextSlide={handleNextSlide}
            onPrevSlide={handlePrevSlide}
            onCompleteOnboarding={handleCompleteOnboarding}
          />
        )}
      </main>

      {/* Bottom Footer */}
      <AuthFooter />
    </div>
  )
}
export default AuthModule
