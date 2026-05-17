import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Warranty, Claim, WarrantyFormData, ClaimFormData } from "@/types"

interface WarrantyStore {
  warranties: Warranty[]
  claims: Claim[]
  
  // 保修操作
  addWarranty: (assetId: string, data: WarrantyFormData) => Warranty
  updateWarranty: (id: string, data: Partial<WarrantyFormData>) => void
  deleteWarranty: (id: string) => void
  getWarrantiesByAsset: (assetId: string) => Warranty[]
  getActiveWarranties: () => Warranty[]
  getExpiringWarranties: (days: number) => Warranty[]
  
  // 索赔操作
  addClaim: (warrantyId: string, assetId: string, data: ClaimFormData) => Claim
  updateClaim: (id: string, data: Partial<ClaimFormData>) => void
  deleteClaim: (id: string) => void
  getClaimsByWarranty: (warrantyId: string) => Claim[]
  getClaimsByAsset: (assetId: string) => Claim[]
  
  // 统计
  getTotalWarrantyCost: () => number
  getTotalClaimedAmount: () => number
}

export const useWarrantyStore = create<WarrantyStore>()(
  persist(
    (set, get) => ({
      warranties: [],
      claims: [],

      addWarranty: (assetId, data) => {
        const now = new Date().toISOString()
        const warranty: Warranty = {
          id: `warranty_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          assetId,
          ...data,
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({
          warranties: [...state.warranties, warranty],
        }))
        return warranty
      },

      updateWarranty: (id, data) => {
        set((state) => ({
          warranties: state.warranties.map((w) =>
            w.id === id ? { ...w, ...data, updatedAt: new Date().toISOString() } : w
          ),
        }))
      },

      deleteWarranty: (id) => {
        set((state) => ({
          warranties: state.warranties.filter((w) => w.id !== id),
        }))
      },

      getWarrantiesByAsset: (assetId) => {
        return get().warranties.filter((w) => w.assetId === assetId)
      },

      getActiveWarranties: () => {
        const now = new Date()
        return get().warranties.filter((w) => new Date(w.endDate) > now)
      },

      getExpiringWarranties: (days) => {
        const now = new Date()
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + days)
        return get().warranties.filter((w) => {
          const endDate = new Date(w.endDate)
          return endDate > now && endDate <= futureDate
        })
      },

      addClaim: (warrantyId, assetId, data) => {
        const now = new Date().toISOString()
        const claim: Claim = {
          id: `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          warrantyId,
          assetId,
          ...data,
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({
          claims: [...state.claims, claim],
        }))
        return claim
      },

      updateClaim: (id, data) => {
        set((state) => ({
          claims: state.claims.map((c) =>
            c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c
          ),
        }))
      },

      deleteClaim: (id) => {
        set((state) => ({
          claims: state.claims.filter((c) => c.id !== id),
        }))
      },

      getClaimsByWarranty: (warrantyId) => {
        return get().claims.filter((c) => c.warrantyId === warrantyId)
      },

      getClaimsByAsset: (assetId) => {
        return get().claims.filter((c) => c.assetId === assetId)
      },

      getTotalWarrantyCost: () => {
        return get().warranties.reduce((sum, w) => sum + w.cost, 0)
      },

      getTotalClaimedAmount: () => {
        return get().claims.filter((c) => c.status === "completed" || c.status === "approved")
          .reduce((sum, c) => sum + c.amount, 0)
      },
    }),
    {
      name: "assetpulse-warranty-storage",
    }
  )
)
