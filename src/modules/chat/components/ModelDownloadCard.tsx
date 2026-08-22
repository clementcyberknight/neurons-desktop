import React, { useState, useEffect } from 'react'
import { Download, CheckCircle2, Cpu, HardDrive, Zap, Loader2 } from 'lucide-react'
import { aiModelDownloader, MODEL_METADATA, type DownloadProgress } from '@/services/aiModelDownloader'
import { localWllamaEngine } from '@/services/localWllamaEngine'

export const ModelDownloadCard: React.FC = () => {
  const [isDownloaded, setIsDownloaded] = useState<boolean>(false)
  const [downloading, setDownloading] = useState<boolean>(false)
  const [progress, setProgress] = useState<DownloadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const checkStatus = async () => {
      try {
        if (typeof window !== 'undefined' && window.electronAPI?.checkAIStatus) {
          const status = await window.electronAPI.checkAIStatus()
          if (status.exists && isMounted) {
            setIsDownloaded(true)
            return
          }
        }

        const downloaded = await aiModelDownloader.isModelDownloaded()
        if (isMounted) {
          setIsDownloaded(downloaded)
        }
      } catch (statusError) {
        console.warn('[ModelDownloadCard] Model status check error:', statusError)
        if (isMounted) {
          setIsDownloaded(false)
        }
      }
    }

    checkStatus()

    return () => {
      isMounted = false
    }
  }, [])

  const handleDownload = async () => {
    setDownloading(true)
    setError(null)

    try {
      // 1. Electron Native Stream Download directly to SSD disk
      if (typeof window !== 'undefined' && window.electronAPI?.downloadAIModel) {
        let cleanupProgress: (() => void) | null = null

        if (window.electronAPI.onAIDownloadProgress) {
          cleanupProgress = window.electronAPI.onAIDownloadProgress((p) => {
            setProgress(p)
          })
        }

        const res = await window.electronAPI.downloadAIModel()
        if (cleanupProgress) {
          cleanupProgress()
        }

        if (res.success) {
          setIsDownloaded(true)
          return
        }
        throw new Error('Native download did not complete successfully.')
      }

      // 2. Browser OPFS / CacheStorage Download
      const success = await aiModelDownloader.downloadModel((p) => {
        setProgress(p)
      })

      if (success) {
        setIsDownloaded(true)
        localWllamaEngine.init().catch((wllamaInitErr) => {
          console.warn('[ModelDownloadCard] Engine warmup notice:', wllamaInitErr)
        })
      } else {
        setError('Download was interrupted. Please try again.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[ModelDownloadCard] Download error:', msg)
      setError(msg || 'Failed to download AI model from Hugging Face.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-5 text-neutral-900 shadow-xs max-w-lg mt-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-neutral-900">
              Qwen 2.5 1.5B Instruct (GGUF)
            </h4>
            <p className="text-xs text-neutral-500">
              {MODEL_METADATA.architecture} · {MODEL_METADATA.totalSizeMB} MB
            </p>
          </div>
        </div>
        {isDownloaded && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800">
            <CheckCircle2 className="h-3 w-3" /> Ready Offline
          </span>
        )}
      </div>

      <p className="mt-3 text-xs text-neutral-600 leading-relaxed">
        Download this local AI model to run 100% offline on your device with zero cloud latency, native C++ hardware acceleration, and complete privacy.
      </p>

      {/* Feature Pills */}
      <div className="mt-3.5 flex flex-wrap gap-2 text-[11px] text-neutral-600">
        <span className="inline-flex items-center gap-1 rounded-md bg-white border border-neutral-200 px-2 py-1">
          <HardDrive className="h-3 w-3 text-neutral-500" /> Native SSD Storage
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-white border border-neutral-200 px-2 py-1">
          <Zap className="h-3 w-3 text-amber-500" /> C++ AVX2 Acceleration
        </span>
      </div>

      {/* Download Progress Bar */}
      {downloading && progress && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-xs font-medium text-neutral-700">
            <span>Downloading from Hugging Face...</span>
            <span>{progress.percent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
            <div
              className="h-full bg-neutral-900 transition-all duration-200 ease-out"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-neutral-500">
            <span>
              {progress.loadedMB.toFixed(1)} / {progress.totalMB.toFixed(1)} MB
            </span>
            <span>{progress.speedMBps.toFixed(1)} MB/s · {Math.ceil(progress.etaSeconds)}s remaining</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {/* Action Button */}
      <div className="mt-4">
        {isDownloaded ? (
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>Model weights are stored on this device. You can chat offline anytime!</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
          >
            {downloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Downloading Weights ({progress?.percent || 0}%)...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Download Model for Offline Use ({MODEL_METADATA.totalSizeMB} MB)</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
