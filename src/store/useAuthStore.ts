import { create } from "zustand"
import type { UserProfile } from "@/types"
import { api, setToken, clearToken, getToken } from "@/utils/api"

interface AuthStore {
  currentUser: UserProfile | null
  loading: boolean
  initialized: boolean
  initialize: () => Promise<void>
  register: (username: string, password: string, inviteCode?: string) => Promise<UserProfile>
  login: (username: string, password: string) => Promise<UserProfile>
  logout: () => void
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>
  refreshUser: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  currentUser: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    const token = getToken()
    if (!token) { set({ currentUser: null, loading: false, initialized: true }); return }
    try {
      const user = await api.auth.me()
      set({ currentUser: user, loading: false, initialized: true })
    } catch { clearToken(); set({ currentUser: null, loading: false, initialized: true }) }
  },

  register: async (username, password, inviteCode) => {
    const res = await api.auth.register(username, password, inviteCode)
    setToken(res.token)
    set({ currentUser: res.user })
    return res.user
  },

  login: async (username, password) => {
    const res = await api.auth.login(username, password)
    setToken(res.token)
    set({ currentUser: res.user })
    return res.user
  },

  logout: () => { clearToken(); set({ currentUser: null }) },

  changePassword: async (oldPassword, newPassword) => { await api.auth.changePassword(oldPassword, newPassword) },

  refreshUser: async () => {
    const user = await api.auth.me()
    set({ currentUser: user })
  },
}))
