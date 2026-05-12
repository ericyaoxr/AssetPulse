import { create } from "zustand"
import type { Asset, AssetFormData, DeletedAsset } from "@/types"
import { DEFAULT_CATEGORIES } from "@/types"
import { calculateEffectiveDays, calculateDailyCost, generateId, recalculateAsset } from "@/utils/calculations"
import { exportAssets, importAssetsFromFile } from "@/utils/storage"
import type { ExportFormat } from "@/utils/storage"
import {
  loadAssetsByUser,
  safeReplaceAllAssets,
  addAssetToDB,
  updateAssetInDB,
  deleteAssetFromDB,
  loadTrashByUser,
  saveAllTrash,
  addTrashItem,
  removeTrashItem,
  clearTrashInDB,
  loadCategoriesByUser,
  saveAllCategories,
  loadLocationsByUser,
  saveAllLocations,
  requestPersistentStorage,
} from "@/utils/database"
import { useAuthStore } from "@/store/useAuthStore"

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

function getUserId(): string {
  return useAuthStore.getState().currentUser?.id ?? ""
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

  initialize: async (userId: string) => {
    if (get().initialized) return
    if (initPromise) return initPromise

    initPromise = (async () => {
      set({ loading: true })

      try {
        await requestPersistentStorage()
      } catch { /* non-fatal */ }

      try {
        const assets = (await loadAssetsByUser(userId)).map(recalculateAsset)

        const savedCategories = await loadCategoriesByUser(userId)
        const savedLocations = await loadLocationsByUser(userId)
        const categories = savedCategories.length > 0 ? savedCategories : [...DEFAULT_CATEGORIES]

        const trash = await loadTrashByUser(userId)
        const now = new Date()
        const validTrash = trash.filter((t) => {
          const deletedDate = new Date(t.deletedAt)
          const diffDays = (now.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24)
          return diffDays < 30
        })
        await saveAllTrash(validTrash, userId)

        set({ assets, trash: validTrash, categories, locations: savedLocations, initialized: true, loading: false })
      } catch (e) {
        console.error("Failed to initialize store:", e)
        set({ initialized: true, loading: false })
      }
    })()

    return initPromise
  },

  addAsset: async (form) => {
    const userId = getUserId()
    const now = new Date().toISOString()
    const effectiveDays = calculateEffectiveDays(form.purchaseDate, form.endDate || null, form.status)
    const dailyCost = calculateDailyCost(form.purchasePrice, form.recycleAmount || null, effectiveDays)

    const asset: Asset = {
      id: generateId(),
      userId,
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
    }

    await addAssetToDB(asset)
    const assets = [...get().assets, asset]
    set({ assets })
  },

  updateAsset: async (id, form) => {
    const updatedAsset = get().assets.find((a) => a.id === id)
    if (!updatedAsset) return

    const effectiveDays = calculateEffectiveDays(form.purchaseDate, form.endDate || null, form.status)
    const dailyCost = calculateDailyCost(form.purchasePrice, form.recycleAmount || null, effectiveDays)
    const newAsset: Asset = {
      ...updatedAsset,
      name: form.name,
      status: form.status,
      category: form.category,
      location: form.location,
      imageUrl: form.imageUrl ?? updatedAsset.imageUrl,
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
    }

    await updateAssetInDB(newAsset)
    const assets = get().assets.map((a) => (a.id === id ? newAsset : a))
    set({ assets })
  },

  deleteAsset: async (id) => {
    const userId = getUserId()
    const asset = get().assets.find((a) => a.id === id)
    if (!asset) return
    const trashItem: DeletedAsset = { asset, deletedAt: new Date().toISOString(), userId }
    await addTrashItem(trashItem)
    await deleteAssetFromDB(id)
    const trash = [...get().trash, trashItem]
    const assets = get().assets.filter((a) => a.id !== id)
    set({ assets, trash })
  },

  restoreAsset: async (id) => {
    const trashItem = get().trash.find((t) => t.asset.id === id)
    if (!trashItem) return
    await addAssetToDB(trashItem.asset)
    await removeTrashItem(id)
    const assets = [...get().assets, trashItem.asset]
    const trash = get().trash.filter((t) => t.asset.id !== id)
    set({ assets, trash })
  },

  permanentDelete: async (id) => {
    await removeTrashItem(id)
    const trash = get().trash.filter((t) => t.asset.id !== id)
    set({ trash })
  },

  clearTrash: async () => {
    const userId = getUserId()
    await clearTrashInDB(userId)
    set({ trash: [] })
  },

  updateStatus: async (id, status, endDate, recycleAmount) => {
    const oldAsset = get().assets.find((a) => a.id === id)
    if (!oldAsset) return
    const newAsset = recalculateAsset({
      ...oldAsset,
      status,
      endDate,
      recycleAmount,
      updatedAt: new Date().toISOString(),
    })
    await updateAssetInDB(newAsset)
    const assets = get().assets.map((a) => (a.id === id ? newAsset : a))
    set({ assets })
  },

  updateAssetAIValuation: async (id, valuation) => {
    const oldAsset = get().assets.find((a) => a.id === id)
    if (!oldAsset) return
    const newAsset: Asset = {
      ...oldAsset,
      aiValuation: valuation,
      updatedAt: new Date().toISOString(),
    }
    await updateAssetInDB(newAsset)
    const assets = get().assets.map((a) => (a.id === id ? newAsset : a))
    set({ assets })
  },

  recalculateAll: async () => {
    const userId = getUserId()
    const assets = get().assets.map(recalculateAsset)
    await safeReplaceAllAssets(assets, userId)
    set({ assets })
  },

  exportData: (format) => {
    exportAssets(get().assets, format)
  },

  importData: async (file) => {
    const userId = getUserId()
    const imported = await importAssetsFromFile<Partial<Asset>>(file)
    const now = new Date().toISOString()
    const completeAssets: Asset[] = imported
      .filter((a) => a.name)
      .map((partial) => {
        const asset: Asset = {
          id: partial.id || generateId(),
          userId,
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
      await addAssetToDB(asset)
    }
    const assets = [...get().assets, ...completeAssets]
    set({ assets })
  },

  addCategory: async (name) => {
    const userId = getUserId()
    const categories = [...get().categories, name]
    await saveAllCategories(categories, userId)
    set({ categories })
  },

  removeCategory: async (name) => {
    const userId = getUserId()
    const categories = get().categories.filter((c) => c !== name)
    await saveAllCategories(categories, userId)
    set({ categories })
  },

  addLocation: async (name) => {
    const userId = getUserId()
    const locations = [...get().locations, name]
    await saveAllLocations(locations, userId)
    set({ locations })
  },

  removeLocation: async (name) => {
    const userId = getUserId()
    const locations = get().locations.filter((l) => l !== name)
    await saveAllLocations(locations, userId)
    set({ locations })
  },
}))
