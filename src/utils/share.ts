import html2canvas from "html2canvas-pro"

export async function captureElement(
  element: HTMLElement,
  options?: {
    scale?: number
    backgroundColor?: string
  }
): Promise<string> {
  const canvas = await html2canvas(element, {
    scale: options?.scale ?? 2,
    backgroundColor: options?.backgroundColor ?? null,
    useCORS: true,
    allowTaint: true,
    logging: false,
  })
  return canvas.toDataURL("image/png", 0.95)
}

export async function downloadImage(dataUrl: string, filename: string) {
  const link = document.createElement("a")
  link.download = filename
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export async function shareImage(dataUrl: string, title: string) {
  try {
    const response = await fetch(dataUrl)
    const blob = await response.blob()
    const file = new File([blob], "assetpulse-share.png", { type: "image/png" })

    if (navigator.share && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title,
        files: [file],
      })
      return true
    }
  } catch {
    // Web Share API not available or user cancelled
  }
  return false
}

export async function copyImageToClipboard(dataUrl: string): Promise<boolean> {
  try {
    const response = await fetch(dataUrl)
    const blob = await response.blob()
    await navigator.clipboard.write([
      new ClipboardItem({ "image/png": blob }),
    ])
    return true
  } catch {
    return false
  }
}
