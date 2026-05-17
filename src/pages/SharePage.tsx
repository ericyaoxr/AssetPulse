import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Users, Plus, MoreVertical } from "lucide-react"
import { useShareStore } from "@/store/useShareStore"
import { useAuthStore } from "@/store/useAuthStore"

export default function SharePage() {
  const navigate = useNavigate()
  const { currentUser } = useAuthStore()
  const { createGroup, getGroupsByUser } = useShareStore()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")

  const userGroups = currentUser ? getGroupsByUser(currentUser.id) : []

  const handleCreateGroup = () => {
    if (!newGroupName.trim() || !currentUser) return
    createGroup(newGroupName.trim(), currentUser.id, currentUser.username)
    setNewGroupName("")
    setShowCreateModal(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">小组/家庭共享</h1>
          <p className="mt-1 text-sm text-content-tertiary">与家人或朋友共享资产管理</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          <Plus className="h-4 w-4" />
          创建小组
        </button>
      </div>

      {/* 小组列表 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {userGroups.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-content-faint">
            <Users className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg">还没有小组</p>
            <p className="mt-1 text-sm">创建一个小组开始与他人共享资产</p>
          </div>
        ) : (
          userGroups.map((group) => {
            const memberCount = group.members.length
            const isOwner = currentUser && group.ownerId === currentUser.id
            
            return (
              <div
                key={group.id}
                className="rounded-xl border border-edge bg-surface backdrop-blur-md p-4 transition-all hover:bg-white/5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-content-primary">{group.name}</h3>
                    <p className="text-xs text-content-muted">
                      {memberCount} 位成员 · {isOwner ? "你是群主" : "成员"}
                    </p>
                  </div>
                  <div className="relative">
                    <button className="p-1 rounded text-content-muted hover:text-content-primary">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex -space-x-2 mb-4">
                  {group.members.slice(0, 5).map((member) => (
                    <div
                      key={member.userId}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-xs font-medium text-accent border-2 border-surface"
                      title={member.username}
                    >
                      {member.username.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {memberCount > 5 && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-content-muted border-2 border-surface">
                      +{memberCount - 5}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/share/${group.id}`)}
                    className="flex-1 rounded-lg border border-edge px-3 py-2 text-sm text-content-secondary transition-colors hover:bg-white/5"
                  >
                    查看详情
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 创建小组模态框 */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm modal-overlay-enter">
          <div className="w-full max-w-md rounded-2xl border border-edge bg-ink p-6 shadow-2xl modal-content-enter">
            <h3 className="text-lg font-semibold text-content-primary mb-4">创建新小组</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-content-secondary mb-1">小组名称</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="例如：我的家庭、同事共享"
                  className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-content-primary outline-none focus:border-accent/30"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-lg border border-edge px-4 py-2.5 text-sm font-medium text-content-secondary transition-colors hover:bg-surface"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={!newGroupName.trim()}
                  className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
