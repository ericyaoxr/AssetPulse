import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { SharedGroup, SharedAsset } from "@/types"

interface ShareStore {
  groups: SharedGroup[]
  sharedAssets: SharedAsset[]
  // 分组操作
  createGroup: (name: string, ownerId: string, ownerName: string) => SharedGroup
  deleteGroup: (groupId: string) => void
  updateGroup: (groupId: string, name: string) => void
  // 成员操作
  addMember: (groupId: string, userId: string, username: string, role: "owner" | "editor" | "viewer") => void
  removeMember: (groupId: string, userId: string) => void
  updateMemberRole: (groupId: string, userId: string, role: "owner" | "editor" | "viewer") => void
  // 资产共享操作
  shareAsset: (groupId: string, assetId: string, sharedBy: string, permission: "view" | "edit") => void
  unshareAsset: (groupId: string, assetId: string) => void
  // 获取数据
  getGroup: (groupId: string) => SharedGroup | undefined
  getGroupsByUser: (userId: string) => SharedGroup[]
  getSharedAssetsByGroup: (groupId: string) => SharedAsset[]
  getSharedAssetsByUser: (userId: string) => SharedAsset[]
}

export const useShareStore = create<ShareStore>()(
  persist(
    (set, get) => ({
      groups: [],
      sharedAssets: [],

      createGroup: (name: string, ownerId: string, ownerName: string) => {
        const now = new Date().toISOString()
        const group: SharedGroup = {
          id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name,
          ownerId,
          members: [{
            userId: ownerId,
            username: ownerName,
            role: "owner",
            joinedAt: now
          }],
          createdAt: now,
          updatedAt: now
        }
        set((state) => ({
          groups: [...state.groups, group]
        }))
        return group
      },

      deleteGroup: (groupId: string) => {
        set((state) => ({
          groups: state.groups.filter(g => g.id !== groupId),
          sharedAssets: state.sharedAssets.filter(sa => sa.groupId !== groupId)
        }))
      },

      updateGroup: (groupId: string, name: string) => {
        set((state) => ({
          groups: state.groups.map(g =>
            g.id === groupId
              ? { ...g, name, updatedAt: new Date().toISOString() }
              : g
          )
        }))
      },

      addMember: (groupId: string, userId: string, username: string, role: "owner" | "editor" | "viewer") => {
        set((state) => ({
          groups: state.groups.map(g => {
            if (g.id !== groupId) return g
            const existingMember = g.members.find(m => m.userId === userId)
            if (existingMember) return g
            return {
              ...g,
              members: [...g.members, {
                userId,
                username,
                role,
                joinedAt: new Date().toISOString()
              }],
              updatedAt: new Date().toISOString()
            }
          })
        }))
      },

      removeMember: (groupId: string, userId: string) => {
        set((state) => ({
          groups: state.groups.map(g => {
            if (g.id !== groupId) return g
            if (g.ownerId === userId) return g // 不能移除群主
            return {
              ...g,
              members: g.members.filter(m => m.userId !== userId),
              updatedAt: new Date().toISOString()
            }
          })
        }))
      },

      updateMemberRole: (groupId: string, userId: string, role: "owner" | "editor" | "viewer") => {
        set((state) => ({
          groups: state.groups.map(g => {
            if (g.id !== groupId) return g
            return {
              ...g,
              members: g.members.map(m =>
                m.userId === userId ? { ...m, role } : m
              ),
              updatedAt: new Date().toISOString()
            }
          })
        }))
      },

      shareAsset: (groupId: string, assetId: string, sharedBy: string, permission: "view" | "edit") => {
        const existing = get().sharedAssets.find(
          sa => sa.groupId === groupId && sa.assetId === assetId
        )
        if (existing) {
          set((state) => ({
            sharedAssets: state.sharedAssets.map(sa =>
              sa.id === existing.id ? { ...sa, permission } : sa
            )
          }))
        } else {
          const sharedAsset: SharedAsset = {
            id: `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            groupId,
            assetId,
            sharedBy,
            sharedAt: new Date().toISOString(),
            permission
          }
          set((state) => ({
            sharedAssets: [...state.sharedAssets, sharedAsset]
          }))
        }
      },

      unshareAsset: (groupId: string, assetId: string) => {
        set((state) => ({
          sharedAssets: state.sharedAssets.filter(
            sa => !(sa.groupId === groupId && sa.assetId === assetId)
          )
        }))
      },

      getGroup: (groupId: string) => {
        return get().groups.find(g => g.id === groupId)
      },

      getGroupsByUser: (userId: string) => {
        return get().groups.filter(g =>
          g.members.some(m => m.userId === userId)
        )
      },

      getSharedAssetsByGroup: (groupId: string) => {
        return get().sharedAssets.filter(sa => sa.groupId === groupId)
      },

      getSharedAssetsByUser: (userId: string) => {
        const userGroups = get().getGroupsByUser(userId)
        const userGroupIds = userGroups.map(g => g.id)
        return get().sharedAssets.filter(sa => userGroupIds.includes(sa.groupId))
      }
    }),
    {
      name: "assetpulse-share-storage"
    }
  )
)
