import * as XLSX from "xlsx"
import type { Asset } from "@/types"

const COLUMN_HEADERS: Record<string, string> = {
  name: "物品名称",
  status: "状态",
  category: "分类",
  location: "存放位置",
  purchaseDate: "购买日期",
  purchasePrice: "购买价格",
  endDate: "结束日期",
  recycleAmount: "回收金额",
  targetDailyCost: "目标日均成本",
  effectiveDays: "有效天数",
  dailyCost: "日均成本",
  rating: "评分",
  note: "备注",
}

const STATUS_MAP: Record<string, string> = {
  active: "使用中",
  recycled: "已回收",
  scrapped: "已报废",
}

const STATUS_REVERSE_MAP: Record<string, string> = {
  "使用中": "active",
  "已回收": "recycled",
  "已报废": "scrapped",
}

const EXPORT_COLUMNS = [
  "name", "status", "category", "location", "purchaseDate", "purchasePrice",
  "endDate", "recycleAmount", "targetDailyCost", "effectiveDays", "dailyCost",
  "rating", "note",
]

function assetToRow(asset: Asset): Record<string, string | number> {
  const row: Record<string, string | number> = {}
  for (const col of EXPORT_COLUMNS) {
    const header = COLUMN_HEADERS[col]
    const value = asset[col as keyof Asset]
    if (col === "status") {
      row[header] = STATUS_MAP[value as string] || (value as string)
    } else if (value === null || value === undefined) {
      row[header] = ""
    } else if (typeof value === "string" || typeof value === "number") {
      row[header] = value
    } else {
      row[header] = String(value)
    }
  }
  return row
}

function rowToAsset(row: Record<string, string | number>): Partial<Asset> {
  const reverseHeaders: Record<string, string> = {}
  for (const [key, val] of Object.entries(COLUMN_HEADERS)) {
    reverseHeaders[val] = key
  }

  const asset: Record<string, unknown> = {}
  for (const [header, value] of Object.entries(row)) {
    const key = reverseHeaders[header]
    if (!key) continue
    if (key === "status") {
      asset[key] = STATUS_REVERSE_MAP[String(value)] || "active"
    } else if (key === "purchasePrice" || key === "recycleAmount" || key === "targetDailyCost" || key === "dailyCost" || key === "rating") {
      const num = Number(value)
      asset[key] = isNaN(num) || value === "" ? null : num
    } else if (key === "effectiveDays") {
      const num = Number(value)
      asset[key] = isNaN(num) ? 0 : num
    } else {
      asset[key] = value === "" ? null : value
    }
  }
  return asset as Partial<Asset>
}

export type ExportFormat = "json" | "xlsx" | "csv"

export function exportAssets(assets: Asset[], format: ExportFormat): void {
  const dateStr = new Date().toISOString().slice(0, 10)

  if (format === "json") {
    const json = JSON.stringify(assets, null, 2)
    downloadBlob(new Blob([json], { type: "application/json" }), `assetpulse_backup_${dateStr}.json`)
    return
  }

  const rows = assets.map(assetToRow)
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "资产")

  const colWidths = EXPORT_COLUMNS.map((col) => {
    const header = COLUMN_HEADERS[col]
    const maxLen = Math.max(
      header.length * 2,
      ...rows.map((r) => String(r[header] || "").length)
    )
    return { wch: Math.min(maxLen + 2, 30) }
  })
  ws["!cols"] = colWidths

  if (format === "xlsx") {
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    downloadBlob(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `assetpulse_backup_${dateStr}.xlsx`)
  } else {
    const csv = XLSX.write(wb, { bookType: "csv", type: "string" })
    const bom = "\uFEFF"
    downloadBlob(new Blob([bom + csv], { type: "text/csv;charset=utf-8" }), `assetpulse_backup_${dateStr}.csv`)
  }
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function importAssetsFromFile<T>(file: File): Promise<T[]> {
  const ext = file.name.split(".").pop()?.toLowerCase()
  if (ext === "json") {
    return importAssetsFromJson<T>(file)
  }
  if (ext === "xlsx" || ext === "xls") {
    return importAssetsFromExcel<T>(file)
  }
  if (ext === "csv") {
    return importAssetsFromCsv<T>(file)
  }
  return Promise.reject(new Error("不支持的文件格式，请使用 JSON/XLSX/CSV 文件"))
}

function importAssetsFromJson<T>(file: File): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as T[]
        resolve(Array.isArray(data) ? data : [])
      } catch {
        reject(new Error("无效的 JSON 文件"))
      }
    }
    reader.onerror = () => reject(new Error("读取文件失败"))
    reader.readAsText(file)
  })
}

function importAssetsFromExcel<T>(file: File): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: "array" })
        const wsName = wb.SheetNames[0]
        const ws = wb.Sheets[wsName]
        const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(ws)
        const assets = rows.map(rowToAsset).filter((a) => a.name) as T[]
        resolve(assets)
      } catch {
        reject(new Error("无效的 Excel 文件"))
      }
    }
    reader.onerror = () => reject(new Error("读取文件失败"))
    reader.readAsArrayBuffer(file)
  })
}

function importAssetsFromCsv<T>(file: File): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const wb = XLSX.read(text, { type: "string" })
        const wsName = wb.SheetNames[0]
        const ws = wb.Sheets[wsName]
        const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(ws)
        const assets = rows.map(rowToAsset).filter((a) => a.name) as T[]
        resolve(assets)
      } catch {
        reject(new Error("无效的 CSV 文件"))
      }
    }
    reader.onerror = () => reject(new Error("读取文件失败"))
    reader.readAsText(file)
  })
}

export function imageFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error("Failed to read image"))
    reader.readAsDataURL(file)
  })
}
