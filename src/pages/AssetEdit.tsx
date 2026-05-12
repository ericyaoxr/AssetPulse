import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useAssetStore } from "@/store/useAssetStore"
import { AssetForm } from "@/components/assets/AssetForm"
import type { AssetFormData } from "@/types"

export default function AssetEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { assets, updateAsset } = useAssetStore()
  const [submitting, setSubmitting] = useState(false)

  const asset = assets.find((a) => a.id === id)

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white/30">
        <p className="text-lg">资产未找到</p>
        <button
          onClick={() => navigate("/assets")}
          className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-500"
        >
          返回列表
        </button>
      </div>
    )
  }

  async function handleSubmit(form: AssetFormData) {
    setSubmitting(true)
    try {
      await updateAsset(asset.id, form)
      navigate(`/assets/${asset.id}`)
    } catch {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">编辑资产</h1>
        <p className="mt-1 text-sm text-white/50">修改「{asset.name}」的信息</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
        <AssetForm
          initialData={asset}
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/assets/${asset.id}`)}
          submitting={submitting}
        />
      </div>
    </div>
  )
}
