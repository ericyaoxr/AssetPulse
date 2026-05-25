import { useState, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Users, Plus, Share2, Trash2, Eye, Edit3 } from "lucide-react"
import { useShareStore } from "@/store/useShareStore"
import { useAssetStore } from "@/store/useAssetStore"
import { useAuthStore } from "@/store/useAuthStore"
import AssetCard from "@/components/assets/AssetCard"

export default function ShareGroupDetail() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const { currentUser } = useAuthStore()
  const { assets } = useAssetStore()
  const {
    getGroup,
    getSharedAssetsByGroup,
    shareAsset,
    unshareAsset,
    addMember,
    removeMember,
    updateMemberRole
  } = useShareStore()

  const group = groupId ? getGroup(groupId) : undefined
  const sharedAssets = useMemo(() => groupId ? getSharedAssetsByGroup(groupId) : [], [groupId, getSharedAssetsByGroup])
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [showShareAssetModal, setShowShareAssetModal] = useState(false)
  const [newMemberName, setNewMemberName] = useState("")
  const [selectedPermission, setSelectedPermission] = useState<"view" | "edit">("view")
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null)

  // 获取已共享的资产详情（在条件判断之前定义）
  const sharedAssetsWithDetails = useMemo(() => {
    return sharedAssets.map(sa => ({
      ...sa,
      asset: assets.find(a => a.id === sa.assetId)
    })).filter(sa => sa.asset)
  }, [sharedAssets, assets])

  // 获取可共享的资产（自己的且还未共享到该小组的）（在条件判断之前定义）
  const shareableAssets = useMemo(() => {
    if (!currentUser) return []
    const sharedAssetIds = new Set(sharedAssets.map(sa => sa.assetId))
    return assets.filter(a => a.userId === currentUser.id && !sharedAssetIds.has(a.id))
  }, [assets, sharedAssets, currentUser])

  if (!group || !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-content-faint">
        <p className="text-lg">小组不存在</p>
        <button
          onClick={() => navigate("/share")}
          className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm text-white hover:bg-accent-hover"
        >
          返回共享页面
        </button>
      </div>
    )
  }

  const isOwner = group.ownerId === currentUser.id

  const handleAddMember = () => {
    if (!newMemberName.trim()) return
    const tempUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    addMember(group.id, tempUserId, newMemberName.trim(), "viewer")
    setNewMemberName("")
    setShowAddMemberModal(false)
  }

  const handleShareAsset = () => {
    if (!selectedAssetId) return
    shareAsset(group.id, selectedAssetId, currentUser.id, selectedPermission)
    setSelectedAssetId(null)
    setShowShareAssetModal(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/share")}
          className="flex items-center gap-1.5 text-sm text-content-tertiary transition-colors hover:text-content-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">{group.name}</h1>
          <p className="mt-1 text-sm text-content-tertiary">{group.members.length} 位成员</p>
        </div>
        {isOwner && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowShareAssetModal(true)}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              <Share2 className="h-4 w-4" />
              共享资产
            </button>
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="flex items-center gap-2 rounded-lg border border-edge px-4 py-2.5 text-sm font-medium text-content-secondary transition-colors hover:bg-white/5"
            >
              <Plus className="h-4 w-4" />
              添加成员
            </button>
          </div>
        )}
      </div>

      {/* 成员列表 */}
      <div className="rounded-xl border border-edge bg-surface backdrop-blur-md p-4">
        <h3 className="text-sm font-medium text-content-secondary mb-4 flex items-center gap-2">
          <Users className="h-4 w-4" />
          小组成员
        </h3>
        <div className="space-y-3">
          {group.members.map((member) => (
            <div key={member.userId} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-sm font-medium text-accent">
                  {member.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-content-primary">{member.username}</p>
                  <p className="text-xs text-content-muted">
                    {member.role === "owner" ? "群主" : member.role === "editor" ? "编辑者" : "查看者"}
                  </p>
                </div>
              </div>
              {isOwner && member.userId !== currentUser.id && (
                <div className="flex items-center gap-2">
                  <select
                    value={member.role}
                    onChange={(e) => updateMemberRole(group.id, member.userId, e.target.value as "owner" | "editor" | "viewer")}
                    className="rounded-lg border border-edge bg-surface px-2 py-1 text-xs text-content-primary outline-none"
                  >
                    <option value="viewer">查看者</option>
                    <option value="editor">编辑者</option>
                  </select>
                  <button
                    onClick={() => removeMember(group.id, member.userId)}
                    className="p-1 rounded text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 共享资产列表 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-content-secondary">共享资产</h3>
          <span className="text-xs text-content-muted">{sharedAssetsWithDetails.length} 项</span>
        </div>
        {sharedAssetsWithDetails.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-content-faint rounded-xl border border-dashed border-edge">
            <Share2 className="h-10 w-10 mb-3 opacity-50" />
            <p className="text-sm">还没有共享的资产</p>
            {isOwner && (
              <button
                onClick={() => setShowShareAssetModal(true)}
                className="mt-3 text-sm text-accent hover:text-emerald-300"
              >
                开始共享
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sharedAssetsWithDetails.map(({ asset, ...sharedAsset }) => {
              if (!asset) return null
              const isSharedByMe = sharedAsset.sharedBy === currentUser.id
              return (
                <div key={sharedAsset.id} className="relative">
                  <AssetCard asset={asset} />
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 text-xs text-white">
                    {sharedAsset.permission === "view" ? <Eye className="h-3 w-3" /> : <Edit3 className="h-3 w-3" />}
                    {sharedAsset.permission === "view" ? "查看" : "编辑"}
                  </div>
                  {isSharedByMe && isOwner && (
                    <button
                      onClick={() => unshareAsset(group.id, asset.id)}
                      className="absolute bottom-2 right-2 p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 添加成员模态框 */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm modal-overlay-enter">
          <div className="w-full max-w-md rounded-2xl border border-edge bg-ink p-6 shadow-2xl modal-content-enter">
            <h3 className="text-lg font-semibold text-content-primary mb-4">添加成员</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-content-secondary mb-1">成员名称</label>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="输入成员名称"
                  className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-content-primary outline-none focus:border-accent/30"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddMemberModal(false)}
                  className="flex-1 rounded-lg border border-edge px-4 py-2.5 text-sm font-medium text-content-secondary transition-colors hover:bg-surface"
                >
                  取消
                </button>
                <button
                  onClick={handleAddMember}
                  disabled={!newMemberName.trim()}
                  className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 共享资产模态框 */}
      {showShareAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm modal-overlay-enter">
          <div className="w-full max-w-lg rounded-2xl border border-edge bg-ink p-6 shadow-2xl modal-content-enter max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-content-primary mb-4">选择要共享的资产</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-content-secondary mb-2">权限设置</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedPermission("view")}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      selectedPermission === "view"
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-edge bg-surface text-content-secondary hover:bg-white/5"
                    }`}
                  >
                    <Eye className="h-4 w-4 inline mr-1" />
                    仅查看
                  </button>
                  <button
                    onClick={() => setSelectedPermission("edit")}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      selectedPermission === "edit"
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-edge bg-surface text-content-secondary hover:bg-white/5"
                    }`}
                  >
                    <Edit3 className="h-4 w-4 inline mr-1" />
                    可编辑
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {shareableAssets.length === 0 ? (
                  <p className="text-center text-content-muted py-4">没有可共享的资产</p>
                ) : (
                  shareableAssets.map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => setSelectedAssetId(asset.id)}
                      className={`w-full p-3 rounded-lg border text-left transition-colors ${
                        selectedAssetId === asset.id
                          ? "border-accent bg-accent/10"
                          : "border-edge bg-surface hover:bg-white/5"
                      }`}
                    >
                      <p className="font-medium text-content-primary">{asset.name}</p>
                      {asset.model && (
                        <p className="text-xs text-content-muted">{asset.model}</p>
                      )}
                      <p className="text-xs text-content-muted">{asset.category}</p>
                    </button>
                  ))
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowShareAssetModal(false)}
                  className="flex-1 rounded-lg border border-edge px-4 py-2.5 text-sm font-medium text-content-secondary transition-colors hover:bg-surface"
                >
                  取消
                </button>
                <button
                  onClick={handleShareAsset}
                  disabled={!selectedAssetId}
                  className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                >
                  共享
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
