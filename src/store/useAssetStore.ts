import { create } from "zustand"
import type { Asset, AssetFormData, DeletedAsset } from "@/types"
import { DEFAULT_CATEGORIES } from "@/types"
import { calculateEffectiveDays, calculateDailyCost, recalculateAsset } from "@/utils/calculations"
import { exportAssets, importAssetsFromFile } from "@/utils/storage"
import type { ExportFormat } from "@/utils/storage"
import { api } from "@/utils/api"

interface AssetStore {
  assets: Asset[]
  trash: DeletedAsset[]
  categories: string[]
  locations: string[]
  initialized: boolean
  loading: boolean
  initialize: (userId: string) => Promise<void>
  resetStore: () => void
  addAsset: (form: AssetFormData) => Promise<void>
  updateAsset: (id: string, form: AssetFormData) => Promise<void>
  deleteAsset: (id: string) => Promise<void>
  restoreAsset: (id: string) => Promise<void>
  permanentDelete: (id: string) => Promise<void>
  clearTrash: () => Promise<void>
  updateStatus: (id: string, status: Asset["status"], endDate: string | null, recycleAmount: number | null) => Promise<void>
  updateAssetAIValuation: (id: string, valuation: import("@/types").AIValuationResult) => Promise<void>
  recalculateAll: () => Promise<void>
  exportData: (format: ExportFormat) => void
  importData: (file: File) => Promise<void>
  addCategory: (name: string) => Promise<void>
  removeCategory: (name: string) => Promise<void>
  addLocation: (name: string) => Promise<void>
  removeLocation: (name: string) => Promise<void>
}

let initPromise: Promise<void> | null = null

export function resetInitPromise(): void {
  initPromise = null
}

export const useAssetStore = create<AssetStore>((set, get) => ({
  assets: [],
  trash: [],
  categories: [...DEFAULT_CATEGORIES],
  locations: [],
  initialized: false,
  loading: true,

  resetStore: () => {
    initPromise = null
    set({ assets: [], trash: [], categories: [...DEFAULT_CATEGORIES], locations: [], initialized: false, loading: true })
  },

  initialize: async (_userId: string) => {
    void _userId
    if (get().initialized) return
    if (initPromise) return initPromise

    initPromise = (async () => {
      set({ loading: true })
      try {
        const [assets, categories, locations, trash] = await Promise.all([
          api.assets.list(),
          api.categories.list(),
          api.locations.list(),
          api.trash.list(),
        ])

        const recalculated = assets.map(recalculateAsset)
        const cats = categories.length > 0 ? categories : [...DEFAULT_CATEGORIES]

        const now = new Date()
        const validTrash = trash.filter((t) => {
          const deletedDate = new Date(t.deletedAt)
          const diffDays = (now.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24)
          return diffDays < 30
        })

        set({ assets: recalculated, trash: validTrash, categories: cats, locations, initialized: true, loading: false })
      } catch (e) {
        console.error("Failed to initialize store:", e)
        set({ initialized: true, loading: false })
      }
    })()

    return initPromise
  },

  addAsset: async (form) => {
    const effectiveDays = calculateEffectiveDays(form.purchaseDate, form.endDate || null, form.status)
    const dailyCost = calculateDailyCost(form.purchasePrice, form.recycleAmount || null, effectiveDays)
    const now = new Date().toISOString()

    const asset = await api.assets.create({
      name: form.name,
      status: form.status,
      category: form.category,
      location: form.location,
      imageUrl: form.imageUrl,
      purchaseDate: form.purchaseDate,
      purchasePrice: form.purchasePrice,
      endDate: form.endDate || null,
      recycleAmount: form.recycleAmount || null,
      targetDailyCost: form.targetDailyCost || null,
      effectiveDays,
      dailyCost,
      rating: form.rating || null,
      note: form.note,
      aiValuation: null,
      createdAt: now,
      updatedAt: now,
    })

    set({ assets: [...get().assets, recalculateAsset(asset)] })
  },

  updateAsset: async (id, form) => {
    const oldAsset = get().assets.find((a) => a.id === id)
    if (!oldAsset) return

    const effectiveDays = calculateEffectiveDays(form.purchaseDate, form.endDate || null, form.status)
    const dailyCost = calculateDailyCost(form.purchasePrice, form.recycleAmount || null, effectiveDays)

    const updated = await api.assets.update(id, {
      name: form.name,
      status: form.status,
      category: form.category,
      location: form.location,
      imageUrl: form.imageUrl ?? oldAsset.imageUrl,
      purchaseDate: form.purchaseDate,
      purchasePrice: form.purchasePrice,
      endDate: form.endDate || null,
      recycleAmount: form.recycleAmount || null,
      targetDailyCost: form.targetDailyCost || null,
      effectiveDays,
      dailyCost,
      rating: form.rating || null,
      note: form.note,
      updatedAt: new Date().toISOString(),
    })

    set({ assets: get().assets.map((a) => (a.id === id ? recalculateAsset(updated) : a)) })
  },

  deleteAsset: async (id) => {
    await api.assets.delete(id)
    const asset = get().assets.find((a) => a.id === id)
    if (!asset) return
    const trashItem: DeletedAsset = { asset, deletedAt: new Date().toISOString(), userId: asset.userId }
    set({ assets: get().assets.filter((a) => a.id !== id), trash: [...get().trash, trashItem] })
  },

  restoreAsset: async (id) => {
    await api.trash.restore(id)
    const trashItem = get().trash.find((t) => t.asset.id === id)
    if (!trashItem) return
    const assets = [...get().assets, recalculateAsset(trashItem.asset)]
    const trash = get().trash.filter((t) => t.asset.id !== id)
    set({ assets, trash })
  },

  permanentDelete: async (id) => {
    await api.trash.delete(id)
    set({ trash: get().trash.filter((t) => t.asset.id !== id) })
  },

  clearTrash: async () => {
    await api.trash.clear()
    set({ trash: [] })
  },

  updateStatus: async (id, status, endDate, recycleAmount) => {
    const oldAsset = get().assets.find((a) => a.id === id)
    if (!oldAsset) return

    const updated = await api.assets.update(id, {
      status,
      endDate,
      recycleAmount,
      updatedAt: new Date().toISOString(),
    })

    set({ assets: get().assets.map((a) => (a.id === id ? recalculateAsset(updated) : a)) })
  },

  updateAssetAIValuation: async (id, valuation) => {
    const oldAsset = get().assets.find((a) => a.id === id)
    if (!oldAsset) return

    const updated = await api.assets.update(id, {
      aiValuation: valuation,
      updatedAt: new Date().toISOString(),
    })

    set({ assets: get().assets.map((a) => (a.id === id ? recalculateAsset(updated) : a)) })
  },

  recalculateAll: async () => {
    const assets = get().assets.map(recalculateAsset)
    set({ assets })
  },

  exportData: (format) => {
    exportAssets(get().assets, format)
  },

  importData: async (file) => {
    const imported = await importAssetsFromFile<Partial<Asset>>(file)
    const now = new Date().toISOString()
    const completeAssets: Asset[] = imported
      .filter((a) => a.name)
      .map((partial) => {
        const asset: Asset = {
          id: partial.id || "",
          userId: partial.userId || "",
          name: partial.name || "",
          status: partial.status || "active",
          category: partial.category || "",
          location: partial.location || "",
          imageUrl: partial.imageUrl || null,
          purchaseDate: partial.purchaseDate || "",
          purchasePrice: partial.purchasePrice || 0,
          endDate: partial.endDate || null,
          recycleAmount: partial.recycleAmount || null,
          targetDailyCost: partial.targetDailyCost || null,
          effectiveDays: partial.effectiveDays || 0,
          dailyCost: partial.dailyCost || 0,
          rating: partial.rating || null,
          note: partial.note || "",
          aiValuation: partial.aiValuation || null,
          createdAt: partial.createdAt || now,
          updatedAt: partial.updatedAt || now,
        }
        return recalculateAsset(asset)
      })

    for (const asset of completeAssets) {
      await api.assets.create(asset)
    }
    set({ assets: [...get().assets, ...completeAssets] })
  },

  addCategory: async (name) => {
    await api.categories.add(name)
    set({ categories: [...get().categories, name] })
  },

  removeCategory: async (name) => {
    await api.categories.remove(name)
    set({ categories: get().categories.filter((c) => c !== name) })
  },

  addLocation: async (name) => {
    await api.locations.add(name)
    set({ locations: [...get().locations, name] })
  },

  removeLocation: async (name) => {
    await api.locations.remove(name)
    set({ locations: get().locations.filter((l) => l !== name) })
  },
}))
