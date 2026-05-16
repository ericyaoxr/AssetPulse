import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Search, SlidersHorizontal, Plus } from "lucide-react"
import { useAssetStore } from "@/store/useAssetStore"
import AssetCard from "@/components/assets/AssetCard"
import type { AssetStatus, SortField, SortOrder } from "@/types"

const statusOptions: { value: AssetStatus | "all"; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "active", label: "使用中" },
  { value: "recycled", label: "已回收" },
  { value: "scrapped", label: "已报废" },
]

const sortOptions: { value: SortField; label: string }[] = [
  { value: "dailyCost", label: "日均成本" },
  { value: "purchaseDate", label: "购买日期" },
  { value: "purchasePrice", label: "购买价格" },
  { value: "name", label: "名称" },
]

const selectClass =
  "rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-content-primary outline-none focus:border-accent/30 shrink-0"

export default function AssetList() {
  const navigate = useNavigate()
  const assets = useAssetStore((s) => s.assets)
  const categories = useAssetStore((s) => s.categories)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>()

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearch(value)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => setDebouncedSearch(value), 300)
  }, [])

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    }
  }, [])
  const [statusFilter, setStatusFilter] = useState<AssetStatus | "all">("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortField, setSortField] = useState<SortField>("dailyCost")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

  const filtered = useMemo(() => {
    let result = [...assets]

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter((a) => a.name.toLowerCase().includes(q))
    }

    if (statusFilter !== "all") {
      result = result.filter((a) => a.status === statusFilter)
    }

    if (categoryFilter !== "all") {
      result = result.filter((a) => a.category === categoryFilter)
    }

    result.sort((a, b) => {
      let cmp = 0
      if (sortField === "name") {
        cmp = a.name.localeCompare(b.name)
      } else if (sortField === "purchaseDate") {
        cmp = a.purchaseDate.localeCompare(b.purchaseDate)
      } else {
        cmp = (a[sortField] as number) - (b[sortField] as number)
      }
      return sortOrder === "asc" ? cmp : -cmp
    })

    return result
  }, [assets, debouncedSearch, statusFilter, categoryFilter, sortField, sortOrder])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">资产列表</h1>
          <p className="mt-1 text-sm text-content-tertiary">共 {assets.length} 件资产</p>
        </div>
        <button
          onClick={() => navigate("/assets/new")}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          <Plus className="h-4 w-4" />
          添加资产
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-faint" />
          <input
            type="text"
            placeholder="搜索资产名称..."
            value={search}
            onChange={handleSearchChange}
            className="w-full rounded-lg border border-edge bg-surface py-2.5 pl-10 pr-4 text-sm text-content-primary outline-none placeholder:text-content-faint focus:border-accent/30"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <SlidersHorizontal className="h-4 w-4 text-content-faint shrink-0" />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AssetStatus | "all")}
            className={selectClass}
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value} className="bg-ink">
                {o.label}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={selectClass}
          >
            <option value="all" className="bg-ink">全部分类</option>
            {categories.map((c) => (
              <option key={c} value={c} className="bg-ink">{c}</option>
            ))}
          </select>

          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className={selectClass}
          >
            {sortOptions.map((o) => (
              <option key={o.value} value={o.value} className="bg-ink">
                {o.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-content-secondary transition-colors hover:bg-white/10 shrink-0"
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-content-faint">
          {assets.length > 0 ? (
            <>
              <p className="text-lg">未找到匹配的资产</p>
              <p className="mt-1 text-sm">尝试调整搜索条件或筛选器</p>
            </>
          ) : (
            <>
              <p className="text-lg">暂无资产</p>
              <p className="mt-1 text-sm">点击右上角添加你的第一件资产</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      )}
    </div>
  )
}
