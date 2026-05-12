import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAssetStore } from "@/store/useAssetStore"
import { AssetForm } from "@/components/assets/AssetForm"
import type { AssetFormData } from "@/types"

export default function AssetNew() {
  const navigate = useNavigate()
  const addAsset = useAssetStore((s) => s.addAsset)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(form: AssetFormData) {
    setSubmitting(true)
    try {
      await addAsset(form)
      navigate("/assets")
    } catch {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">添加资产</h1>
        <p className="mt-1 text-sm text-white/50">记录一件新的物品</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
        <AssetForm
          onSubmit={handleSubmit}
          onCancel={() => navigate("/assets")}
          submitting={submitting}
        />
      </div>
    </div>
  )
}
