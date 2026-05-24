import type { Asset, DeletedAsset } from "@/types"
import { DEFAULT_CATEGORIES } from "@/types"
import { getToken, setToken } from "./api"

const DEMO_USER_ID = "demo-user-001"
const DEMO_INVITE_CODE = "DEMO123"
const LS_ASSETS = "assetpulse_demo_assets"
const LS_TRASH = "assetpulse_demo_trash"
const LS_CATEGORIES = "assetpulse_demo_categories"
const LS_LOCATIONS = "assetpulse_demo_locations"
const LS_SETTINGS = "assetpulse_demo_settings"

function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

function lsSet(key: string, value: unknown): void { localStorage.setItem(key, JSON.stringify(value)) }

function uid(): string { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8) }

export const localApi = {
  auth: {
    register: (username: string, _password: string, _inviteCode?: string) => {
      const token = "demo-token-" + uid()
      setToken(token)
      return Promise.resolve({
        token,
        user: {
          id: DEMO_USER_ID,
          username,
          createdAt: new Date().toISOString(),
          inviteCode: DEMO_INVITE_CODE,
          aiUsage: { remaining: 999, totalUsed: 0 },
          inviteCount: 0,
        },
      })
    },
    login: (username: string, _password: string) => {
      const token = "demo-token-" + uid()
      setToken(token)
      return Promise.resolve({
        token,
        user: {
          id: DEMO_USER_ID,
          username,
          createdAt: new Date().toISOString(),
          inviteCode: DEMO_INVITE_CODE,
          aiUsage: { remaining: 999, totalUsed: 0 },
          inviteCount: 0,
        },
      })
    },
    me: () => {
      const token = getToken()
      if (!token) return Promise.reject(new Error("未登录"))
      return Promise.resolve({
        id: DEMO_USER_ID,
        username: "Demo用户",
        createdAt: new Date().toISOString(),
        inviteCode: DEMO_INVITE_CODE,
        aiUsage: { remaining: 999, totalUsed: 0 },
        inviteCount: 0,
      })
    },
    invites: () => Promise.resolve([]),
    changePassword: () => Promise.resolve({ ok: true }),
  },
  assets: {
    list: () => Promise.resolve(lsGet<Asset[]>(LS_ASSETS, [])),
    create: (partial: Partial<Asset>) => {
      const assets = lsGet<Asset[]>(LS_ASSETS, [])
      const now = new Date().toISOString()
      const asset: Asset = {
        id: uid(), userId: DEMO_USER_ID, name: partial.name || "",
        model: partial.model || "",
        status: partial.status || "active", category: partial.category || "",
        location: partial.location || "", imageUrl: partial.imageUrl || null,
        tags: partial.tags || [], purchaseDate: partial.purchaseDate || "",
        purchasePrice: partial.purchasePrice || 0, endDate: partial.endDate || null,
        recycleAmount: partial.recycleAmount ?? null, targetDailyCost: partial.targetDailyCost ?? null,
        effectiveDays: partial.effectiveDays || 0, dailyCost: partial.dailyCost || 0,
        rating: partial.rating || null, note: partial.note || "",
        aiValuation: partial.aiValuation || null, createdAt: partial.createdAt || now,
        updatedAt: partial.updatedAt || now,
      }
      assets.push(asset); lsSet(LS_ASSETS, assets); return Promise.resolve(asset)
    },
    update: (id: string, partial: Partial<Asset>) => {
      const assets = lsGet<Asset[]>(LS_ASSETS, []); const idx = assets.findIndex((a) => a.id === id)
      if (idx === -1) return Promise.reject(new Error("资产不存在"))
      assets[idx] = { ...assets[idx], ...partial, id, userId: assets[idx].userId }
      lsSet(LS_ASSETS, assets); return Promise.resolve(assets[idx])
    },
    delete: (id: string) => {
      const assets = lsGet<Asset[]>(LS_ASSETS, []); lsSet(LS_ASSETS, assets.filter((a) => a.id !== id))
      return Promise.resolve({ ok: true })
    },
  },
  trash: {
    list: () => Promise.resolve(lsGet<DeletedAsset[]>(LS_TRASH, [])),
    restore: (id: string) => {
      const trash = lsGet<DeletedAsset[]>(LS_TRASH, []); const assets = lsGet<Asset[]>(LS_ASSETS, [])
      const item = trash.find((t) => t.asset.id === id)
      if (item) { assets.push(item.asset); lsSet(LS_ASSETS, assets); lsSet(LS_TRASH, trash.filter((t) => t.asset.id !== id)) }
      return Promise.resolve({ ok: true })
    },
    delete: (id: string) => { const trash = lsGet<DeletedAsset[]>(LS_TRASH, []); lsSet(LS_TRASH, trash.filter((t) => t.asset.id !== id)); return Promise.resolve({ ok: true }) },
    clear: () => { lsSet(LS_TRASH, []); return Promise.resolve({ ok: true }) },
  },
  categories: {
    list: () => Promise.resolve(lsGet<string[]>(LS_CATEGORIES, [...DEFAULT_CATEGORIES])),
    saveAll: (names: string[]) => { lsSet(LS_CATEGORIES, names); return Promise.resolve({ ok: true }) },
    add: (name: string) => { const cats = lsGet<string[]>(LS_CATEGORIES, [...DEFAULT_CATEGORIES]); if (!cats.includes(name)) cats.push(name); lsSet(LS_CATEGORIES, cats); return Promise.resolve({ ok: true }) },
    remove: (name: string) => { const cats = lsGet<string[]>(LS_CATEGORIES, [...DEFAULT_CATEGORIES]); lsSet(LS_CATEGORIES, cats.filter((c) => c !== name)); return Promise.resolve({ ok: true }) },
  },
  locations: {
    list: () => Promise.resolve(lsGet<string[]>(LS_LOCATIONS, [])),
    saveAll: (names: string[]) => { lsSet(LS_LOCATIONS, names); return Promise.resolve({ ok: true }) },
    add: (name: string) => { const locs = lsGet<string[]>(LS_LOCATIONS, []); if (!locs.includes(name)) locs.push(name); lsSet(LS_LOCATIONS, locs); return Promise.resolve({ ok: true }) },
    remove: (name: string) => { const locs = lsGet<string[]>(LS_LOCATIONS, []); lsSet(LS_LOCATIONS, locs.filter((l) => l !== name)); return Promise.resolve({ ok: true }) },
  },
  backup: {
    export: () => { const assets = lsGet<Asset[]>(LS_ASSETS, []); const trash = lsGet<DeletedAsset[]>(LS_TRASH, []); return Promise.resolve({ assets, trash, exportedAt: new Date().toISOString() }) },
    import: (data: Record<string, unknown>) => { const assets = (data.assets as Asset[]) || []; const trash = (data.trash as DeletedAsset[]) || []; lsSet(LS_ASSETS, assets); lsSet(LS_TRASH, trash); return Promise.resolve({ ok: true, imported: { assets: assets.length, trash: trash.length } }) },
  },
  settings: {
    list: () => Promise.resolve(lsGet<Record<string, string>>(LS_SETTINGS, {})),
    get: (key: string) => { const settings = lsGet<Record<string, string>>(LS_SETTINGS, {}); const value = settings[key]; return Promise.resolve(value != null ? { key, value } : null) },
    set: (key: string, value: string) => { const settings = lsGet<Record<string, string>>(LS_SETTINGS, {}); settings[key] = value; lsSet(LS_SETTINGS, settings); return Promise.resolve({ ok: true }) },
    remove: (key: string) => { const settings = lsGet<Record<string, string>>(LS_SETTINGS, {}); delete settings[key]; lsSet(LS_SETTINGS, settings); return Promise.resolve({ ok: true }) },
  },
  ai: {
    recognize: () => Promise.reject(new Error("AI 识别需要后端支持")),
    valuate: () => Promise.reject(new Error("AI 估值需要后端支持")),
  },
}
