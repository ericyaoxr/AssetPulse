import { localApi } from "./localApi"

const API_BASE = "/api"

let _backendAvailable: boolean | null = null

export function isDemoMode(): boolean {
  return _backendAvailable === false
}

export function resetBackendCheck(): void {
  _backendAvailable = null
}

async function checkBackend(): Promise<boolean> {
  if (_backendAvailable !== null) return _backendAvailable
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: "HEAD",
      signal: AbortSignal.timeout(3000),
    })
    _backendAvailable = res.status !== 502 && res.status !== 503
  } catch {
    _backendAvailable = false
  }
  return _backendAvailable
}

export function getToken(): string | null {
  return localStorage.getItem("assetpulse_token")
}

export function setToken(token: string): void {
  localStorage.setItem("assetpulse_token", token)
}

export function clearToken(): void {
  localStorage.removeItem("assetpulse_token")
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (_backendAvailable === null) await checkBackend()
  if (_backendAvailable === false) return localProxy<T>(path, options) as T

  const token = getToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60000)
  const isAIRequest = path.startsWith("/ai/")

  try {
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers, signal: controller.signal })
    if (res.status === 401) { clearToken(); throw new Error("登录已过期，请重新登录") }
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      throw new Error(data?.error || `请求失败 (${res.status})`)
    }
    return res.json()
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new Error(isAIRequest ? "AI 请求超时，请稍后重试" : "请求超时，请稍后重试")
    }
    throw e
  } finally {
    clearTimeout(timeout)
  }
}

function localProxy<T>(path: string, options: RequestInit = {}): T {
  const method = options.method || "GET"
  const body = options.body ? JSON.parse(options.body as string) : undefined
  const la = localApi as Record<string, Record<string, (...args: unknown[]) => Promise<unknown>>>

  if (path.startsWith("/auth/")) {
    const action = path.replace("/auth/", "")
    if (action === "register" && method === "POST") return la.auth.register(body.username, body.password) as T
    if (action === "login" && method === "POST") return la.auth.login(body.username, body.password) as T
    if (action === "me") return la.auth.me() as T
    if (action === "invites") return la.auth.invites() as T
    if (action === "password" && method === "PUT") return la.auth.changePassword() as T
  }
  if (path.startsWith("/assets")) {
    const rest = path.replace("/assets", "").replace(/^\//, "")
    if (!rest && method === "GET") return la.assets.list() as T
    if (!rest && method === "POST") return la.assets.create(body) as T
    if (rest && method === "PUT") return la.assets.update(rest, body) as T
    if (rest && method === "DELETE") return la.assets.delete(rest) as T
  }
  if (path.startsWith("/trash")) {
    const rest = path.replace("/trash", "").replace(/^\//, "")
    if (!rest && method === "GET") return la.trash.list() as T
    if (!rest && method === "DELETE") return la.trash.clear() as T
    if (rest.startsWith("restore/")) return la.trash.restore(rest.replace("restore/", "")) as T
    if (rest && method === "DELETE") return la.trash.delete(rest) as T
  }
  if (path.startsWith("/categories")) {
    const rest = path.replace("/categories", "").replace(/^\//, "")
    if (!rest && method === "GET") return la.categories.list() as T
    if (!rest && method === "PUT") return la.categories.saveAll(body.names) as T
    if (!rest && method === "POST") return la.categories.add(body.name) as T
    if (rest && method === "DELETE") return la.categories.remove(decodeURIComponent(rest)) as T
  }
  if (path.startsWith("/locations")) {
    const rest = path.replace("/locations", "").replace(/^\//, "")
    if (!rest && method === "GET") return la.locations.list() as T
    if (!rest && method === "PUT") return la.locations.saveAll(body.names) as T
    if (!rest && method === "POST") return la.locations.add(body.name) as T
    if (rest && method === "DELETE") return la.locations.remove(decodeURIComponent(rest)) as T
  }
  if (path.startsWith("/backup/")) {
    const action = path.replace("/backup/", "")
    if (action === "export") return la.backup.export() as T
    if (action === "import") return la.backup.import(body) as T
  }
  if (path.startsWith("/settings/")) {
    const key = decodeURIComponent(path.replace("/settings/", ""))
    if (method === "GET") return la.settings.get(key) as T
    if (method === "PUT") return la.settings.set(key, body.value) as T
    if (method === "DELETE") return la.settings.remove(key) as T
  }
  if (path.startsWith("/ai/")) {
    const action = path.replace("/ai/", "")
    if (action === "recognize") return la.ai.recognize() as T
    if (action === "valuate") return la.ai.valuate() as T
    if (action === "health-check") return Promise.resolve({
      overallScore: 75,
      summary: "Demo 模式：您的资产状况良好，建议继续保持。",
      recommendations: [
        { id: crypto.randomUUID(), type: "keep", priority: "medium", title: "保持现状", description: "继续维护现有资产", reason: "当前资产组合合理" }
      ],
      futureExpensePrediction: { next30Days: 1000, next90Days: 3000, next1Year: 12000, breakdown: [] }
    }) as T
    if (action === "recommendations") return Promise.resolve({
      nextBuys: [],
      betterOptions: []
    }) as T
  }

  return Promise.reject(new Error("Demo 模式不支持此操作")) as T
}

export interface ImageRecognitionItem {
  name: string
  category: string
  estimatedPrice: number
  brand: string
  description: string
  purchaseDate: string
}

export interface ImageRecognitionResult {
  items: ImageRecognitionItem[]
}

export interface InviteRecord {
  createdAt: string
  inviteeUsername: string
}

export const api = {
  auth: {
    register: (username: string, password: string, inviteCode?: string) =>
      request<{ token: string; user: import("@/types").UserProfile }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, password, inviteCode }),
      }),
    login: (username: string, password: string) =>
      request<{ token: string; user: import("@/types").UserProfile }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }),
    me: () => request<import("@/types").UserProfile>("/auth/me"),
    invites: () => request<InviteRecord[]>("/auth/invites"),
    changePassword: (oldPassword: string, newPassword: string) =>
      request<{ ok: boolean }>("/auth/password", {
        method: "PUT",
        body: JSON.stringify({ oldPassword, newPassword }),
      }),
  },
  assets: {
    list: () => request<import("@/types").Asset[]>("/assets"),
    create: (asset: Partial<import("@/types").Asset>) =>
      request<import("@/types").Asset>("/assets", {
        method: "POST",
        body: JSON.stringify(asset),
      }),
    update: (id: string, asset: Partial<import("@/types").Asset>) =>
      request<import("@/types").Asset>(`/assets/${id}`, {
        method: "PUT",
        body: JSON.stringify(asset),
      }),
    delete: (id: string) => request<{ ok: boolean }>(`/assets/${id}`, { method: "DELETE" }),
  },
  trash: {
    list: () => request<import("@/types").DeletedAsset[]>("/trash"),
    restore: (id: string) => request<{ ok: boolean }>(`/trash/restore/${id}`, { method: "POST" }),
    delete: (id: string) => request<{ ok: boolean }>(`/trash/${id}`, { method: "DELETE" }),
    clear: () => request<{ ok: boolean }>("/trash", { method: "DELETE" }),
  },
  categories: {
    list: () => request<string[]>("/categories"),
    saveAll: (names: string[]) =>
      request<{ ok: boolean }>("/categories", {
        method: "PUT",
        body: JSON.stringify({ names }),
      }),
    add: (name: string) =>
      request<{ ok: boolean }>("/categories", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    remove: (name: string) => request<{ ok: boolean }>(`/categories/${encodeURIComponent(name)}`, { method: "DELETE" }),
  },
  locations: {
    list: () => request<string[]>("/locations"),
    saveAll: (names: string[]) =>
      request<{ ok: boolean }>("/locations", {
        method: "PUT",
        body: JSON.stringify({ names }),
      }),
    add: (name: string) =>
      request<{ ok: boolean }>("/locations", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    remove: (name: string) => request<{ ok: boolean }>(`/locations/${encodeURIComponent(name)}`, { method: "DELETE" }),
  },
  backup: {
    export: () => request<Record<string, unknown>>("/backup/export"),
    import: (data: Record<string, unknown>) =>
      request<{ ok: boolean; imported: { assets: number; trash: number } }>("/backup/import", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  settings: {
    list: () => request<Record<string, string>>("/settings"),
    get: (key: string) => request<{ key: string; value: string } | null>(`/settings/${encodeURIComponent(key)}`),
    set: (key: string, value: string) =>
      request<{ ok: boolean }>(`/settings/${encodeURIComponent(key)}`, {
        method: "PUT",
        body: JSON.stringify({ value }),
      }),
    remove: (key: string) =>
      request<{ ok: boolean }>(`/settings/${encodeURIComponent(key)}`, { method: "DELETE" }),
  },
  ai: {
    recognize: (image: string) =>
      request<ImageRecognitionResult>("/ai/recognize", {
        method: "POST",
        body: JSON.stringify({ image }),
      }),
    valuate: (asset: Partial<import("@/types").Asset>) =>
      request<import("@/types").AIValuationResult>("/ai/valuate", {
        method: "POST",
        body: JSON.stringify({ asset }),
      }),
    healthCheck: (assets: import("@/types").Asset[]) =>
      request<import("@/types").HealthCheckResult>("/ai/health-check", {
        method: "POST",
        body: JSON.stringify({ assets }),
      }),
    recommendations: (assets: import("@/types").Asset[]) =>
      request<import("@/types").RecommendationsResult>("/ai/recommendations", {
        method: "POST",
        body: JSON.stringify({ assets }),
      }),
  },
}
