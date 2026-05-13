const API_BASE = "/api"

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
  const token = getToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (res.status === 401) {
    clearToken()
    throw new Error("登录已过期，请重新登录")
  }

  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.error || `请求失败 (${res.status})`)
  }

  return res.json()
}

export const api = {
  auth: {
    register: (username: string, password: string) =>
      request<{ token: string; user: { id: string; username: string; createdAt: string } }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }),
    login: (username: string, password: string) =>
      request<{ token: string; user: { id: string; username: string; createdAt: string } }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }),
    me: () =>
      request<{ id: string; username: string; createdAt: string }>("/auth/me"),
    changePassword: (oldPassword: string, newPassword: string) =>
      request<{ ok: boolean }>("/auth/password", {
        method: "PUT",
        body: JSON.stringify({ oldPassword, newPassword }),
      }),
  },
  assets: {
    list: () =>
      request<import("@/types").Asset[]>("/assets"),
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
    delete: (id: string) =>
      request<{ ok: boolean }>(`/assets/${id}`, { method: "DELETE" }),
  },
  trash: {
    list: () =>
      request<import("@/types").DeletedAsset[]>("/trash"),
    restore: (id: string) =>
      request<{ ok: boolean }>(`/trash/restore/${id}`, { method: "POST" }),
    delete: (id: string) =>
      request<{ ok: boolean }>(`/trash/${id}`, { method: "DELETE" }),
    clear: () =>
      request<{ ok: boolean }>("/trash", { method: "DELETE" }),
  },
  categories: {
    list: () =>
      request<string[]>("/categories"),
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
    remove: (name: string) =>
      request<{ ok: boolean }>(`/categories/${encodeURIComponent(name)}`, { method: "DELETE" }),
  },
  locations: {
    list: () =>
      request<string[]>("/locations"),
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
    remove: (name: string) =>
      request<{ ok: boolean }>(`/locations/${encodeURIComponent(name)}`, { method: "DELETE" }),
  },
  backup: {
    export: () =>
      request<Record<string, unknown>>("/backup/export"),
    import: (data: Record<string, unknown>) =>
      request<{ ok: boolean; imported: { assets: number; trash: number } }>("/backup/import", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  settings: {
    list: () =>
      request<Record<string, string>>("/settings"),
    get: (key: string) =>
      request<{ key: string; value: string } | null>(`/settings/${encodeURIComponent(key)}`),
    set: (key: string, value: string) =>
      request<{ ok: boolean }>(`/settings/${encodeURIComponent(key)}`, {
        method: "PUT",
        body: JSON.stringify({ value }),
      }),
    remove: (key: string) =>
      request<{ ok: boolean }>(`/settings/${encodeURIComponent(key)}`, { method: "DELETE" }),
  },
}
