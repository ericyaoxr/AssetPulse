import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAssetStore } from "@/store/useAssetStore"
import { AssetForm } from "@/components/assets/AssetForm"
import type { AssetFormData } from "@/types"
import { Camera } from "lucide-react"

export default function AssetNew() {
  const navigate = useNavigate()
  const addAsset = useAssetStore((s) => s.addAsset)
  const requestAIValuation = useAssetStore((s) => s.requestAIValuation)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(form: AssetFormData) {
    setSubmitting(true)
    try {
      const asset = await addAsset(form)
      requestAIValuation(asset)
      navigate("/assets")
    } catch {
      setSubmitting(false)
    }
  }

  async function handleBatchSubmit(forms: AssetFormData[]) {
    setSubmitting(true)
    try {
      for (const form of forms) {
        const asset = await addAsset(form)
        requestAIValuation(asset)
      }
      navigate("/assets")
    } catch {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-content-primary">添加资产</h1>
        <p className="mt-1 text-sm text-content-tertiary">记录一件新的物品</p>
      </div>

      <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-6">
        <div className="mb-4 flex items-center gap-3 rounded-lg bg-accent/10 p-3">
          <Camera className="h-5 w-5 text-accent" />
          <div>
            <p className="text-sm font-medium text-content-primary">拍照识别，一步搞定</p>
            <p className="text-xs text-content-muted">上传物品照片，AI 自动识别名称和价格</p>
          </div>
        </div>

        <AssetForm
          onSubmit={handleSubmit}
          onBatchSubmit={handleBatchSubmit}
          onCancel={() => navigate("/assets")}
          submitting={submitting}
        />
      </div>

      <div className="text-center text-xs text-content-faint">
        <p>提交后 AI 会在后台自动估算残值，无需等待</p>
      </div>
    </div>
  )
}
