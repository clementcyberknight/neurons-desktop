import React from 'react'
import { ArrowLeft, ArrowRight, Sparkles, RefreshCw, Zap } from 'lucide-react'
import type {
  StaffCountBracket,
  TransactionVolumeBracket,
  MonthlyRevenueBracket,
  AIModelMode,
} from '@/types/database'
import { FullNameSlide } from './slides/FullNameSlide'
import { CompanyNameSlide } from './slides/CompanyNameSlide'
import { StaffCountSlide } from './slides/StaffCountSlide'
import { MonthlyVolumeSlide } from './slides/MonthlyVolumeSlide'
import { MonthlyRevenueSlide } from './slides/MonthlyRevenueSlide'
import { AiEngineSlide } from './slides/AiEngineSlide'

interface OnboardingSlideshowProps {
  slideIndex: number
  setSlideIndex: React.Dispatch<React.SetStateAction<number>>
  fullName: string
  setFullName: (val: string) => void
  companyName: string
  setCompanyName: (val: string) => void
  staffCount: StaffCountBracket
  setStaffCount: (val: StaffCountBracket) => void
  monthlyVolume: TransactionVolumeBracket
  setMonthlyVolume: (val: TransactionVolumeBracket) => void
  monthlyRevenue: MonthlyRevenueBracket
  setMonthlyRevenue: (val: MonthlyRevenueBracket) => void
  aiMode: AIModelMode
  setAiMode: (val: AIModelMode) => void
  isDownloadingModel: boolean
  downloadProgress: number
  isModelDownloaded: boolean
  onStartLocalDownload: () => void
  isSubmitting: boolean
  errorMessage: string | null
  onNextSlide: () => void
  onPrevSlide: () => void
  onCompleteOnboarding: () => void
}

export const OnboardingSlideshow: React.FC<OnboardingSlideshowProps> = ({
  slideIndex,
  fullName,
  setFullName,
  companyName,
  setCompanyName,
  staffCount,
  setStaffCount,
  monthlyVolume,
  setMonthlyVolume,
  monthlyRevenue,
  setMonthlyRevenue,
  aiMode,
  setAiMode,
  isDownloadingModel,
  downloadProgress,
  isModelDownloaded,
  onStartLocalDownload,
  isSubmitting,
  errorMessage,
  onNextSlide,
  onPrevSlide,
  onCompleteOnboarding,
}) => {
  return (
    <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
      {/* Top Slide Progress Dots & Step Count */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4 mb-6">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === slideIndex
                  ? 'w-8 bg-black'
                  : idx < slideIndex
                  ? 'w-3 bg-neutral-800'
                  : 'w-3 bg-neutral-200'
              }`}
            />
          ))}
        </div>

        <span className="text-[11px] font-mono font-bold text-neutral-400 uppercase">
          Step {slideIndex + 1} of 6
        </span>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-neutral-100 border border-neutral-300 text-neutral-800 text-xs font-medium">
          {errorMessage}
        </div>
      )}

      {/* Render Current Slide Subcomponent */}
      {slideIndex === 0 && (
        <FullNameSlide fullName={fullName} setFullName={setFullName} />
      )}
      {slideIndex === 1 && (
        <CompanyNameSlide companyName={companyName} setCompanyName={setCompanyName} />
      )}
      {slideIndex === 2 && (
        <StaffCountSlide staffCount={staffCount} setStaffCount={setStaffCount} />
      )}
      {slideIndex === 3 && (
        <MonthlyVolumeSlide monthlyVolume={monthlyVolume} setMonthlyVolume={setMonthlyVolume} />
      )}
      {slideIndex === 4 && (
        <MonthlyRevenueSlide monthlyRevenue={monthlyRevenue} setMonthlyRevenue={setMonthlyRevenue} />
      )}
      {slideIndex === 5 && (
        <AiEngineSlide
          aiMode={aiMode}
          setAiMode={setAiMode}
          isDownloadingModel={isDownloadingModel}
          downloadProgress={downloadProgress}
          isModelDownloaded={isModelDownloaded}
          onStartDownload={onStartLocalDownload}
        />
      )}

      {/* Bottom Slideshow Navigation Actions */}
      <div className="flex items-center justify-between border-t border-neutral-200 pt-6 mt-6">
        {slideIndex > 0 ? (
          <button
            type="button"
            onClick={onPrevSlide}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold text-neutral-600 hover:bg-neutral-200/60 hover:text-black cursor-pointer transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
        ) : (
          <div />
        )}

        {/* Bottom Action Button */}
        {slideIndex === 5 ? (
          aiMode === 'local_800mb' && !isModelDownloaded ? (
            <button
              type="button"
              onClick={onStartLocalDownload}
              disabled={isDownloadingModel}
              className="flex items-center gap-2 px-7 py-3 rounded-full bg-black hover:bg-neutral-800 disabled:opacity-75 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              {isDownloadingModel ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Downloading Model ({downloadProgress}%)...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  <span>Download AI Model to Launch</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onCompleteOnboarding}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-7 py-3 rounded-full bg-black hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>Launch Workspace</span>
                  <Sparkles className="h-4 w-4" />
                </>
              )}
            </button>
          )
        ) : (
          <button
            type="button"
            onClick={onNextSlide}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-7 py-3 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
