import { useRef, useState, useCallback } from "react"
import { Share2, Download, Copy, X, Loader2, Check } from "lucide-react"
import { captureElement, downloadImage, shareImage, copyImageToClipboard } from "@/utils/share"
import { useTheme } from "@/contexts/ThemeContext"

interface ShareCardProps {
  children: React.ReactNode
  title: string
  filename: string
}

export function ShareCard({ children, title, filename }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [imageData, setImageData] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const { theme } = useTheme()

  const handleGenerate = useCallback(async () => {
    if (!cardRef.current) return
    setGenerating(true)
    setOpen(true)
    try {
      await new Promise((r) => setTimeout(r, 100))
      const dataUrl = await captureElement(cardRef.current, {
        scale: 2,
        backgroundColor: theme === "apple" ? "#f2f2f7" : "#0D1B1E",
      })
      setImageData(dataUrl)
    } catch {
      setImageData(null)
    } finally {
      setGenerating(false)
    }
  }, [theme])

  const handleDownload = useCallback(async () => {
    if (!imageData) return
    await downloadImage(imageData, filename)
  }, [imageData, filename])

  const handleShare = useCallback(async () => {
    if (!imageData) return
    const shared = await shareImage(imageData, title)
    if (!shared) {
      await handleDownload()
    }
  }, [imageData, title, handleDownload])

  const handleCopy = useCallback(async () => {
    if (!imageData) return
    const ok = await copyImageToClipboard(imageData)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [imageData])

  const handleClose = useCallback(() => {
    setOpen(false)
    setImageData(null)
    setCopied(false)
  }, [])

  return (
    <>
      <button
        onClick={handleGenerate}
        className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 px-3 py-2 text-xs font-medium text-white transition-all hover:shadow-lg hover:shadow-purple-500/25 hover:scale-105 active:scale-95"
      >
        <Share2 className="h-3.5 w-3.5" />
        分享
      </button>

      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <div ref={cardRef}>{children}</div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm modal-overlay-enter" onClick={handleClose}>
          <div className="modal-content-enter max-h-[90vh] overflow-y-auto mx-4" onClick={(e) => e.stopPropagation()}>
            {generating ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-ink border border-edge p-12">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
                <p className="text-sm text-content-secondary">正在生成分享卡片...</p>
              </div>
            ) : imageData ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img src={imageData} alt="分享卡片" className="max-w-[90vw] max-h-[60vh] object-contain" />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-xl bg-surface border border-edge px-4 py-2.5 text-sm text-content-primary hover:bg-surface-hover transition-colors"
                  >
                    {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
                    {copied ? "已复制" : "复制图片"}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 rounded-xl bg-surface border border-edge px-4 py-2.5 text-sm text-content-primary hover:bg-surface-hover transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    保存图片
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 px-4 py-2.5 text-sm font-medium text-white hover:shadow-lg hover:shadow-purple-500/25 transition-all"
                  >
                    <Share2 className="h-4 w-4" />
                    分享
                  </button>
                </div>
              </div>
            ) : null}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
