import { create } from "zustand"
import type { User, UserProfile } from "@/types"
import { loadUserByUsername, saveUser, loadUserById } from "@/utils/database"

const SESSION_KEY = "assetpulse_session_user_id"

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + "assetpulse_salt_2024")
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

function generateUserId(): string {
  return "u_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

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
    const sessionUserId = localStorage.getItem(SESSION_KEY)
    if (!sessionUserId) {
      set({ currentUser: null, loading: false, initialized: true })
      return
    }
    try {
      const user = await loadUserById(sessionUserId)
      if (user) {
        const profile: UserProfile = { id: user.id, username: user.username, createdAt: user.createdAt }
        set({ currentUser: profile, loading: false, initialized: true })
      } else {
        localStorage.removeItem(SESSION_KEY)
        set({ currentUser: null, loading: false, initialized: true })
      }
    } catch {
      localStorage.removeItem(SESSION_KEY)
      set({ currentUser: null, loading: false, initialized: true })
    }
  },

  register: async (username, password) => {
    const existing = await loadUserByUsername(username)
    if (existing) {
      throw new Error("用户名已存在")
    }
    const passwordHash = await hashPassword(password)
    const user: User = {
      id: generateUserId(),
      username,
      passwordHash,
      createdAt: new Date().toISOString(),
    }
    await saveUser(user)
    const profile: UserProfile = { id: user.id, username: user.username, createdAt: user.createdAt }
    localStorage.setItem(SESSION_KEY, user.id)
    set({ currentUser: profile })
    return profile
  },

  login: async (username, password) => {
    const user = await loadUserByUsername(username)
    if (!user) {
      throw new Error("用户名或密码错误")
    }
    const passwordHash = await hashPassword(password)
    if (user.passwordHash !== passwordHash) {
      throw new Error("用户名或密码错误")
    }
    const profile: UserProfile = { id: user.id, username: user.username, createdAt: user.createdAt }
    localStorage.setItem(SESSION_KEY, user.id)
    set({ currentUser: profile })
    return profile
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY)
    set({ currentUser: null })
  },
}))
