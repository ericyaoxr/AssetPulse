import { create } from "zustand"
import type { UserProfile } from "@/types"
import { api, setToken, clearToken, getToken } from "@/utils/api"

interface AuthStore {
  currentUser: UserProfile | null
  loading: boolean
  initialized: boolean
  initialize: () => Promise<void>
  register: (username: string, password: string) => Promise<UserProfile>
  login: (username: string, password: string) => Promise<UserProfile>
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  currentUser: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    const token = getToken()
    if (!token) {
      set({ currentUser: null, loading: false, initialized: true })
      return
    }
    try {
      const assets = await api.assets.list()
      const userId = assets.length > 0 ? assets[0].userId : ""
      const username = localStorage.getItem("assetpulse_username") || ""
      if (userId && username) {
        set({
          currentUser: { id: userId, username, createdAt: "" },
          loading: false,
          initialized: true,
        })
      } else {
        clearToken()
        set({ currentUser: null, loading: false, initialized: true })
      }
    } catch {
      clearToken()
      set({ currentUser: null, loading: false, initialized: true })
    }
  },

  register: async (username, password) => {
    const res = await api.auth.register(username, password)
    setToken(res.token)
    localStorage.setItem("assetpulse_username", res.user.username)
    const profile: UserProfile = { id: res.user.id, username: res.user.username, createdAt: res.user.createdAt }
    set({ currentUser: profile })
    return profile
  },

  login: async (username, password) => {
    const res = await api.auth.login(username, password)
    setToken(res.token)
    localStorage.setItem("assetpulse_username", res.user.username)
    const profile: UserProfile = { id: res.user.id, username: res.user.username, createdAt: res.user.createdAt }
    set({ currentUser: profile })
    return profile
  },

  logout: () => {
    clearToken()
    localStorage.removeItem("assetpulse_username")
    set({ currentUser: null })
  },
}))
