import React from 'react'
import type { AIModelMode } from '@/types/database'
import { HardDrive, Cloud, CheckCircle2, Zap } from 'lucide-react'

interface AiEngineSlideProps {
  aiMode: AIModelMode
  setAiMode: (val: AIModelMode) => void
  isDownloadingModel: boolean
  downloadProgress: number
  isModelDownloaded: boolean
  onStartDownload: () => void
}

export const AiEngineSlide: React.FC<AiEngineSlideProps> = ({
  aiMode,
  setAiMode,
  isDownloadingModel,
  downloadProgress,
  isModelDownloaded,
  onStartDownload,
}) => {
  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
      <div>
        <h3 className="text-xl font-extrabold text-black tracking-tight">
          Select AI Model Deployment Engine
        </h3>
        <p className="text-xs text-neutral-500 mt-1">
          Choose how Neurons AI Copilot processes your offline business intelligence.
        </p>
      </div>

      <div className="space-y-3">
        {/* Option A: Local AI Model */}
        <div
          onClick={() => setAiMode('local_800mb')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            aiMode === 'local_800mb'
              ? 'border-black bg-neutral-900 text-white shadow-lg'
              : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                  aiMode === 'local_800mb' ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-black'
                }`}
              >
                <HardDrive className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold">Download Local AI Model (~800MB)</h4>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                      aiMode === 'local_800mb' ? 'bg-white text-black' : 'bg-neutral-100 text-neutral-800'
                    }`}
                  >
                    Recommended
                  </span>
                </div>
                <p
                  className={`text-[11px] mt-0.5 ${
                    aiMode === 'local_800mb' ? 'text-neutral-300' : 'text-neutral-500'
                  }`}
                >
                  100% on-device inference. Zero data leaves your machine. Full offline autonomy.
                </p>
              </div>
            </div>

            {aiMode === 'local_800mb' && (
              <CheckCircle2 className="h-5 w-5 text-white fill-white text-black shrink-0" />
            )}
          </div>

          {/* Download Progress Bar if Local Selected */}
          {aiMode === 'local_800mb' && (
            <div className="mt-4 pt-3 border-t border-neutral-800">
              {isModelDownloaded ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>800MB Local Model weights ready & verified offline.</span>
                </div>
              ) : isDownloadingModel ? (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                    <span>Downloading GGUF Model weights...</span>
                    <span>{downloadProgress}% ({(824 * (downloadProgress / 100)).toFixed(0)} MB)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-300"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onStartDownload()
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-white hover:bg-neutral-200 text-black px-3 py-1.5 text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>Pre-Download Model Now (824 MB)</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Option B: Cloud Server API */}
        <div
          onClick={() => setAiMode('cloud_api')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            aiMode === 'cloud_api'
              ? 'border-black bg-neutral-900 text-white shadow-lg'
              : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                  aiMode === 'cloud_api' ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-black'
                }`}
              >
                <Cloud className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold">Cloud Server API (No Download Required)</h4>
                <p
                  className={`text-[11px] mt-0.5 ${
                    aiMode === 'cloud_api' ? 'text-neutral-300' : 'text-neutral-500'
                  }`}
                >
                  Model is served through API. Instant start with zero disk usage.
                </p>
              </div>
            </div>

            {aiMode === 'cloud_api' && (
              <CheckCircle2 className="h-5 w-5 text-white fill-white text-black shrink-0" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
