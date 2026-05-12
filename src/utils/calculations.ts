import { differenceInDays } from "date-fns"
import type { Asset, AssetFormData, AssetStatus } from "@/types"

export function calculateEffectiveDays(
  purchaseDate: string,
  endDate: string | null,
  status: AssetStatus
): number {
  if (!purchaseDate) return 0
  const start = new Date(purchaseDate)
  const end =
    status !== "active" && endDate ? new Date(endDate) : new Date()
  const days = differenceInDays(end, start)
  return Math.max(0, days)
}

export function calculateDailyCost(
  purchasePrice: number,
  recycleAmount: number | null,
  effectiveDays: number
): number {
  if (effectiveDays === 0) return 0
  const recycle = recycleAmount && recycleAmount > 0 ? recycleAmount : 0
  return (purchasePrice - recycle) / effectiveDays
}

export function computeAssetFromForm(form: AssetFormData): {
  effectiveDays: number
  dailyCost: number
} {
  const effectiveDays = calculateEffectiveDays(
    form.purchaseDate,
    form.endDate || null,
    form.status
  )
  const dailyCost = calculateDailyCost(
    form.purchasePrice,
    form.recycleAmount || null,
    effectiveDays
  )
  return { effectiveDays, dailyCost }
}

export function recalculateAsset(asset: Asset): Asset {
  const effectiveDays = calculateEffectiveDays(
    asset.purchaseDate,
    asset.endDate,
    asset.status
  )
  const dailyCost = calculateDailyCost(
    asset.purchasePrice,
    asset.recycleAmount,
    effectiveDays
  )
  return { ...asset, effectiveDays, dailyCost }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}
