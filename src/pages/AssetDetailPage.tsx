import { useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { useAssetStore } from "@/store/useAssetStore"
import { AssetDetail } from "@/components/assets/AssetDetail"
import { ShareCard } from "@/components/share/ShareCard"
import { AssetShareTemplate } from "@/components/share/AssetShareTemplate"

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const assets = useAssetStore((s) => s.assets)

  const asset = useMemo(() => assets.find((a) => a.id === id), [assets, id])

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-content-faint">
        <p className="text-lg">资产未找到</p>
        <button
          onClick={() => navigate("/assets")}
          className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm text-white hover:bg-accent-hover"
        >
          返回列表
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/assets")}
          className="flex items-center gap-1.5 text-sm text-content-tertiary transition-colors hover:text-content-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          返回列表
        </button>
        <ShareCard title={`我的${asset.name}`} filename={`assetpulse-${asset.name}.png`}>
          <AssetShareTemplate asset={asset} />
        </ShareCard>
      </div>

      <AssetDetail asset={asset} />
    </div>
  )
}
