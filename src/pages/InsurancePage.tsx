import { useState } from "react"
import {
  ShieldAlert, Plus, Trash2, Edit2, CheckCircle,
  DollarSign, FileText, AlertCircle
} from "lucide-react"
import { useWarrantyStore } from "@/store/useWarrantyStore"
import { useAssetStore } from "@/store/useAssetStore"
import type { Warranty, Claim } from "@/types"

function WarrantyCard({ warranty, onEdit, onDelete, onAddClaim }: {
  warranty: Warranty
  onEdit: () => void
  onDelete: () => void
  onAddClaim: () => void
}) {
  const assets = useAssetStore((s) => s.assets)
  const asset = assets.find((a) => a.id === warranty.assetId)
  const now = new Date()
  const endDate = new Date(warranty.endDate)
  const isExpired = endDate < now
  const isExpiringSoon = endDate > now && endDate < new Date(now.setDate(now.getDate() + 30))

  return (
    <div className={`rounded-xl border p-4 transition-all ${
      isExpired ? "border-red-500/30 bg-red-500/5" :
      isExpiringSoon ? "border-yellow-500/30 bg-yellow-500/5" :
      "border-edge bg-surface"
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-content-primary">{warranty.provider}</h4>
          <p className="text-sm text-content-secondary">{warranty.policyNumber}</p>
          {asset && (
            <p className="text-xs text-content-muted mt-1">关联资产: {asset.name}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            isExpired ? "bg-red-500/20 text-red-400" :
            isExpiringSoon ? "bg-yellow-500/20 text-yellow-400" :
            "bg-green-500/20 text-green-400"
          }`}>
            {isExpired ? "已过期" : isExpiringSoon ? "即将过期" : "有效"}
          </span>
          <button
            onClick={onEdit}
            className="p-1.5 rounded text-content-muted hover:text-content-secondary hover:bg-white/5"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div>
          <p className="text-content-muted">有效期</p>
          <p className="text-content-primary">{warranty.startDate} - {warranty.endDate}</p>
        </div>
        <div>
          <p className="text-content-muted">保费</p>
          <p className="text-content-primary">¥{warranty.cost.toFixed(0)}</p>
        </div>
        {warranty.deductible > 0 && (
          <div>
            <p className="text-content-muted">免赔额</p>
            <p className="text-content-primary">¥{warranty.deductible.toFixed(0)}</p>
          </div>
        )}
      </div>

      {warranty.notes && (
        <div className="mb-4">
          <p className="text-xs text-content-muted mb-1">备注</p>
          <p className="text-sm text-content-secondary">{warranty.notes}</p>
        </div>
      )}

      <button
        onClick={onAddClaim}
        className="w-full flex items-center justify-center gap-2 rounded-lg border border-edge px-3 py-2 text-sm text-content-secondary hover:bg-white/5 transition-colors"
      >
        <Plus className="h-4 w-4" />
        添加索赔记录
      </button>
    </div>
  )
}

function ClaimCard({ claim, onEdit, onDelete }: { claim: Claim; onEdit: () => void; onDelete: () => void }) {
  const assets = useAssetStore((s) => s.assets)
  const asset = assets.find((a) => a.id === claim.assetId)

  const statusColors = {
    pending: "bg-yellow-500/20 text-yellow-400",
    approved: "bg-blue-500/20 text-blue-400",
    rejected: "bg-red-500/20 text-red-400",
    completed: "bg-green-500/20 text-green-400",
  }

  const statusLabels = {
    pending: "待处理",
    approved: "已批准",
    rejected: "已拒绝",
    completed: "已完成",
  }

  return (
    <div className="rounded-xl border border-edge bg-surface p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-content-primary">{claim.claimNumber}</h4>
          {asset && (
            <p className="text-sm text-content-muted mt-1">资产: {asset.name}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[claim.status]}`}>
            {statusLabels[claim.status]}
          </span>
          <button
            onClick={onEdit}
            className="p-1.5 rounded text-content-muted hover:text-content-secondary hover:bg-white/5"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div>
          <p className="text-content-muted">索赔日期</p>
          <p className="text-content-primary">{claim.date}</p>
        </div>
        <div>
          <p className="text-content-muted">索赔金额</p>
          <p className="text-content-primary">¥{claim.amount.toFixed(0)}</p>
        </div>
      </div>

      {claim.description && (
        <div className="mb-3">
          <p className="text-xs text-content-muted mb-1">描述</p>
          <p className="text-sm text-content-secondary">{claim.description}</p>
        </div>
      )}

      {claim.result && (
        <div>
          <p className="text-xs text-content-muted mb-1">结果</p>
          <p className="text-sm text-content-secondary">{claim.result}</p>
        </div>
      )}
    </div>
  )
}

function WarrantyForm({
  mode = "create",
  assetId,
  existing,
  onSubmit,
  onCancel
}: {
  mode?: "create" | "edit"
  assetId?: string
  existing?: Warranty
  onSubmit: (data: {
    assetId: string
    provider: string
    policyNumber: string
    startDate: string
    endDate: string
    coverage: string
    deductible: number
    cost: number
    notes: string
  }) => void
  onCancel: () => void
}) {
  const assets = useAssetStore((s) => s.assets)
  const [formData, setFormData] = useState(() => ({
    assetId: existing?.assetId || assetId || "",
    provider: existing?.provider || "",
    policyNumber: existing?.policyNumber || "",
    startDate: existing?.startDate || new Date().toISOString().split("T")[0],
    endDate: existing?.endDate || "",
    coverage: existing?.coverage || "",
    deductible: existing?.deductible.toString() || "0",
    cost: existing?.cost.toString() || "0",
    notes: existing?.notes || "",
  }))

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-content-secondary mb-1">关联资产</label>
        <select
          value={formData.assetId}
          onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
          className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-content-primary outline-none focus:border-accent/30"
        >
          <option value="">选择资产</option>
          {assets.map((asset) => (
            <option key={asset.id} value={asset.id}>{asset.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-content-secondary mb-1">保险公司</label>
          <input
            type="text"
            value={formData.provider}
            onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
            placeholder="例如：平安保险"
            className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-content-primary outline-none focus:border-accent/30"
          />
        </div>
        <div>
          <label className="block text-sm text-content-secondary mb-1">保单号</label>
          <input
            type="text"
            value={formData.policyNumber}
            onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
            placeholder="保单编号"
            className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-content-primary outline-none focus:border-accent/30"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-content-secondary mb-1">开始日期</label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-content-primary outline-none focus:border-accent/30"
          />
        </div>
        <div>
          <label className="block text-sm text-content-secondary mb-1">结束日期</label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-content-primary outline-none focus:border-accent/30"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-content-secondary mb-1">保费（元）</label>
          <input
            type="number"
            value={formData.cost}
            onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
            placeholder="0"
            className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-content-primary outline-none focus:border-accent/30"
          />
        </div>
        <div>
          <label className="block text-sm text-content-secondary mb-1">免赔额（元）</label>
          <input
            type="number"
            value={formData.deductible}
            onChange={(e) => setFormData({ ...formData, deductible: e.target.value })}
            placeholder="0"
            className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-content-primary outline-none focus:border-accent/30"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-content-secondary mb-1">保障范围</label>
        <textarea
          value={formData.coverage}
          onChange={(e) => setFormData({ ...formData, coverage: e.target.value })}
          placeholder="描述保险的保障范围..."
          rows={3}
          className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-content-primary outline-none focus:border-accent/30 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm text-content-secondary mb-1">备注</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="其他相关信息..."
          rows={2}
          className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-content-primary outline-none focus:border-accent/30 resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 rounded-lg border border-edge px-4 py-2.5 text-sm font-medium text-content-secondary transition-colors hover:bg-surface"
        >
          取消
        </button>
        <button
          onClick={() => onSubmit({
            ...formData,
            deductible: parseFloat(formData.deductible) || 0,
            cost: parseFloat(formData.cost) || 0,
          })}
          className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          {mode === "create" ? "添加" : "更新"}
        </button>
      </div>
    </div>
  )
}

function ClaimForm({
  mode = "create",
  existing,
  onSubmit,
  onCancel
}: {
  mode?: "create" | "edit"
  existing?: Claim
  onSubmit: (data: {
    claimNumber: string
    date: string
    amount: number
    description: string
    status: "pending" | "approved" | "rejected" | "completed"
    result: string
  }) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState(() => ({
    claimNumber: existing?.claimNumber || `CLM-${Date.now()}`,
    date: existing?.date || new Date().toISOString().split("T")[0],
    amount: existing?.amount.toString() || "0",
    description: existing?.description || "",
    status: existing?.status || "pending",
    result: existing?.result || "",
  }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-content-secondary mb-1">索赔编号</label>
          <input
            type="text"
            value={formData.claimNumber}
            onChange={(e) => setFormData({ ...formData, claimNumber: e.target.value })}
            className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-content-primary outline-none focus:border-accent/30"
          />
        </div>
        <div>
          <label className="block text-sm text-content-secondary mb-1">索赔日期</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-content-primary outline-none focus:border-accent/30"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-content-secondary mb-1">索赔金额（元）</label>
        <input
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          placeholder="0"
          className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-content-primary outline-none focus:border-accent/30"
        />
      </div>

      <div>
        <label className="block text-sm text-content-secondary mb-1">状态</label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as "pending" | "approved" | "rejected" | "completed" })}
          className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-content-primary outline-none focus:border-accent/30"
        >
          <option value="pending">待处理</option>
          <option value="approved">已批准</option>
          <option value="rejected">已拒绝</option>
          <option value="completed">已完成</option>
        </select>
      </div>

      <div>
        <label className="block text-sm text-content-secondary mb-1">描述</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="详细描述索赔情况..."
          rows={3}
          className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-content-primary outline-none focus:border-accent/30 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm text-content-secondary mb-1">结果</label>
        <textarea
          value={formData.result}
          onChange={(e) => setFormData({ ...formData, result: e.target.value })}
          placeholder="索赔处理结果..."
          rows={2}
          className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-content-primary outline-none focus:border-accent/30 resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 rounded-lg border border-edge px-4 py-2.5 text-sm font-medium text-content-secondary transition-colors hover:bg-surface"
        >
          取消
        </button>
        <button
          onClick={() => onSubmit({
            ...formData,
            amount: parseFloat(formData.amount) || 0,
          })}
          className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          {mode === "create" ? "添加" : "更新"}
        </button>
      </div>
    </div>
  )
}

export default function InsurancePage() {
  const {
    warranties,
    claims,
    addWarranty,
    updateWarranty,
    deleteWarranty,
    addClaim,
    updateClaim,
    deleteClaim,
    getTotalWarrantyCost,
    getTotalClaimedAmount,
    getActiveWarranties,
    getExpiringWarranties,
  } = useWarrantyStore()

  const [activeTab, setActiveTab] = useState<"warranties" | "claims">("warranties")
  const [showAddWarranty, setShowAddWarranty] = useState(false)
  const [showAddClaim, setShowAddClaim] = useState(false)
  const [editingWarranty, setEditingWarranty] = useState<Warranty | null>(null)
  const [editingClaim, setEditingClaim] = useState<Claim | null>(null)
  const [selectedWarrantyForClaim, setSelectedWarrantyForClaim] = useState<string | null>(null)

  const activeWarranties = getActiveWarranties()
  const expiringWarranties = getExpiringWarranties(30)
  const totalCost = getTotalWarrantyCost()
  const totalClaimed = getTotalClaimedAmount()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">保险与保修</h1>
          <p className="mt-1 text-sm text-content-tertiary">管理资产的保险和索赔记录</p>
        </div>
        <div className="flex gap-2">
          {activeTab === "warranties" && (
            <button
              onClick={() => setShowAddWarranty(true)}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              <Plus className="h-4 w-4" />
              添加保修
            </button>
          )}
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-edge bg-surface p-4">
          <div className="flex items-center gap-2 text-sm text-content-muted mb-2">
            <ShieldAlert className="h-4 w-4" />
            有效保修
          </div>
          <p className="text-2xl font-bold text-content-primary">{activeWarranties.length}</p>
        </div>
        <div className="rounded-xl border border-edge bg-surface p-4">
          <div className="flex items-center gap-2 text-sm text-content-muted mb-2">
            <AlertCircle className="h-4 w-4" />
            即将过期
          </div>
          <p className="text-2xl font-bold text-yellow-400">{expiringWarranties.length}</p>
        </div>
        <div className="rounded-xl border border-edge bg-surface p-4">
          <div className="flex items-center gap-2 text-sm text-content-muted mb-2">
            <DollarSign className="h-4 w-4" />
            总保费
          </div>
          <p className="text-2xl font-bold text-content-primary">¥{totalCost.toFixed(0)}</p>
        </div>
        <div className="rounded-xl border border-edge bg-surface p-4">
          <div className="flex items-center gap-2 text-sm text-content-muted mb-2">
            <CheckCircle className="h-4 w-4" />
            已赔付
          </div>
          <p className="text-2xl font-bold text-green-400">¥{totalClaimed.toFixed(0)}</p>
        </div>
      </div>

      {/* 标签页切换 */}
      <div className="flex gap-2 border-b border-edge">
        <button
          onClick={() => setActiveTab("warranties")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "warranties"
              ? "text-accent border-b-2 border-accent"
              : "text-content-muted hover:text-content-secondary"
          }`}
        >
          保修记录
        </button>
        <button
          onClick={() => setActiveTab("claims")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "claims"
              ? "text-accent border-b-2 border-accent"
              : "text-content-muted hover:text-content-secondary"
          }`}
        >
          索赔记录
        </button>
      </div>

      {/* 保修列表 */}
      {activeTab === "warranties" && (
        <div className="space-y-4">
          {warranties.length === 0 ? (
            <div className="text-center py-12 text-content-muted">
              <ShieldAlert className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>还没有保修记录</p>
              <p className="text-sm mt-1">点击上方按钮添加第一条保修</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {warranties.map((warranty) => (
                <WarrantyCard
                  key={warranty.id}
                  warranty={warranty}
                  onEdit={() => setEditingWarranty(warranty)}
                  onDelete={() => deleteWarranty(warranty.id)}
                  onAddClaim={() => {
                    setSelectedWarrantyForClaim(warranty.id)
                    setShowAddClaim(true)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 索赔列表 */}
      {activeTab === "claims" && (
        <div className="space-y-4">
          {claims.length === 0 ? (
            <div className="text-center py-12 text-content-muted">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>还没有索赔记录</p>
              <p className="text-sm mt-1">从保修记录中添加索赔</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {claims.map((claim) => (
                <ClaimCard
                  key={claim.id}
                  claim={claim}
                  onEdit={() => setEditingClaim(claim)}
                  onDelete={() => deleteClaim(claim.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 添加保修模态框 */}
      {showAddWarranty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-edge bg-ink p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-content-primary mb-4">添加保修记录</h3>
            <WarrantyForm
              mode="create"
              onSubmit={(data) => {
                addWarranty(data.assetId, data)
                setShowAddWarranty(false)
              }}
              onCancel={() => setShowAddWarranty(false)}
            />
          </div>
        </div>
      )}

      {/* 编辑保修模态框 */}
      {editingWarranty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-edge bg-ink p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-content-primary mb-4">编辑保修记录</h3>
            <WarrantyForm
              mode="edit"
              existing={editingWarranty}
              onSubmit={(data) => {
                updateWarranty(editingWarranty.id, data)
                setEditingWarranty(null)
              }}
              onCancel={() => setEditingWarranty(null)}
            />
          </div>
        </div>
      )}

      {/* 添加索赔模态框 */}
      {showAddClaim && selectedWarrantyForClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-edge bg-ink p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-content-primary mb-4">添加索赔记录</h3>
            <ClaimForm
              mode="create"
              onSubmit={(data) => {
                const warranty = warranties.find((w) => w.id === selectedWarrantyForClaim)
                if (warranty) {
                  addClaim(selectedWarrantyForClaim, warranty.assetId, data)
                }
                setShowAddClaim(false)
                setSelectedWarrantyForClaim(null)
              }}
              onCancel={() => {
                setShowAddClaim(false)
                setSelectedWarrantyForClaim(null)
              }}
            />
          </div>
        </div>
      )}

      {/* 编辑索赔模态框 */}
      {editingClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-edge bg-ink p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-content-primary mb-4">编辑索赔记录</h3>
            <ClaimForm
              mode="edit"
              existing={editingClaim}
              onSubmit={(data) => {
                updateClaim(editingClaim.id, data)
                setEditingClaim(null)
              }}
              onCancel={() => setEditingClaim(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
