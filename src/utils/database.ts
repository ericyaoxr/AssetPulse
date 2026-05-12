import { openDB, type IDBPDatabase } from "idb"
import type { Asset, DeletedAsset, User } from "@/types"

const DB_NAME = "assetpulse_db"
const DB_VERSION = 4

let dbInstance: IDBPDatabase | null = null
let dbClosed = false

async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance && !dbClosed) return dbInstance

  dbClosed = false

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion === 0) {
        db.createObjectStore("users", { keyPath: "id" })
          .createIndex("username", "username", { unique: true })

        const assetStore = db.createObjectStore("assets", { keyPath: "id" })
        assetStore.createIndex("userId", "userId", { unique: false })
        assetStore.createIndex("status", "status", { unique: false })
        assetStore.createIndex("category", "category", { unique: false })
        assetStore.createIndex("purchaseDate", "purchaseDate", { unique: false })

        const trashStore = db.createObjectStore("trash", { keyPath: "asset.id" })
        trashStore.createIndex("userId", "userId", { unique: false })

        const catStore = db.createObjectStore("categories", { keyPath: "id", autoIncrement: true })
        catStore.createIndex("userId", "userId", { unique: false })
        catStore.createIndex("userId_name", ["userId", "name"], { unique: true })

        const locStore = db.createObjectStore("locations", { keyPath: "id", autoIncrement: true })
        locStore.createIndex("userId", "userId", { unique: false })
        locStore.createIndex("userId_name", ["userId", "name"], { unique: true })
        return
      }

      if (oldVersion < 4) {
        if (!db.objectStoreNames.contains("users")) {
          db.createObjectStore("users", { keyPath: "id" })
            .createIndex("username", "username", { unique: true })
        }

        if (!db.objectStoreNames.contains("assets")) {
          const assetStore = db.createObjectStore("assets", { keyPath: "id" })
          assetStore.createIndex("userId", "userId", { unique: false })
          assetStore.createIndex("status", "status", { unique: false })
          assetStore.createIndex("category", "category", { unique: false })
          assetStore.createIndex("purchaseDate", "purchaseDate", { unique: false })
        }

        if (!db.objectStoreNames.contains("trash")) {
          const trashStore = db.createObjectStore("trash", { keyPath: "asset.id" })
          trashStore.createIndex("userId", "userId", { unique: false })
        }

        if (!db.objectStoreNames.contains("categories")) {
          const catStore = db.createObjectStore("categories", { keyPath: "id", autoIncrement: true })
          catStore.createIndex("userId", "userId", { unique: false })
          catStore.createIndex("userId_name", ["userId", "name"], { unique: true })
        }

        if (!db.objectStoreNames.contains("locations")) {
          const locStore = db.createObjectStore("locations", { keyPath: "id", autoIncrement: true })
          locStore.createIndex("userId", "userId", { unique: false })
          locStore.createIndex("userId_name", ["userId", "name"], { unique: true })
        }

        if (db.objectStoreNames.contains("meta")) {
          db.deleteObjectStore("meta")
        }
        if (db.objectStoreNames.contains("images")) {
          db.deleteObjectStore("images")
        }
      }
    },
    blocked() {
      console.warn("IndexedDB upgrade blocked by another tab")
    },
    blocking() {
      if (dbInstance) {
        dbInstance.close()
        dbInstance = null
        dbClosed = true
      }
    },
    terminated() {
      dbInstance = null
      dbClosed = true
    },
  })

  return dbInstance
}

export async function requestPersistentStorage(): Promise<boolean> {
  if ("storage" in navigator && "persist" in navigator.storage) {
    try {
      return await navigator.storage.persist()
    } catch {
      return false
    }
  }
  return false
}

export function resetDBInstance(): void {
  if (dbInstance) {
    dbInstance.close()
  }
  dbInstance = null
  dbClosed = true
}

export async function saveUser(user: User): Promise<void> {
  const db = await getDB()
  await db.put("users", user)
}

export async function loadUserByUsername(username: string): Promise<User | null> {
  const db = await getDB()
  return (await db.getFromIndex("users", "username", username)) ?? null
}

export async function loadUserById(id: string): Promise<User | null> {
  const db = await getDB()
  return (await db.get("users", id)) ?? null
}

export async function loadAssetsByUser(userId: string): Promise<Asset[]> {
  const db = await getDB()
  return db.getAllFromIndex("assets", "userId", userId)
}

export async function addAssetToDB(asset: Asset): Promise<void> {
  const db = await getDB()
  await db.put("assets", asset)
}

export async function updateAssetInDB(asset: Asset): Promise<void> {
  const db = await getDB()
  await db.put("assets", asset)
}

export async function deleteAssetFromDB(id: string): Promise<void> {
  const db = await getDB()
  await db.delete("assets", id)
}

export async function safeReplaceAllAssets(assets: Asset[], userId: string): Promise<void> {
  const db = await getDB()
  const existing = await db.getAllFromIndex("assets", "userId", userId)
  const existingIds = new Set(existing.map((a: Asset) => a.id))
  const newIds = new Set(assets.map((a) => a.id))

  const tx = db.transaction("assets", "readwrite")
  const store = tx.objectStore("assets")

  for (const asset of assets) {
    await store.put(asset)
  }

  for (const oldId of existingIds) {
    if (!newIds.has(oldId)) {
      await store.delete(oldId)
    }
  }

  await tx.done
}

export async function loadTrashByUser(userId: string): Promise<DeletedAsset[]> {
  const db = await getDB()
  return db.getAllFromIndex("trash", "userId", userId)
}

export async function saveAllTrash(items: DeletedAsset[], userId: string): Promise<void> {
  const db = await getDB()
  const existing = await db.getAllFromIndex("trash", "userId", userId)
  const existingIds = new Set(existing.map((t: DeletedAsset) => t.asset.id))
  const newIds = new Set(items.map((t) => t.asset.id))

  const tx = db.transaction("trash", "readwrite")
  const store = tx.objectStore("trash")

  for (const item of items) {
    await store.put(item)
  }

  for (const oldId of existingIds) {
    if (!newIds.has(oldId)) {
      await store.delete(oldId)
    }
  }

  await tx.done
}

export async function addTrashItem(item: DeletedAsset): Promise<void> {
  const db = await getDB()
  await db.put("trash", item)
}

export async function removeTrashItem(id: string): Promise<void> {
  const db = await getDB()
  await db.delete("trash", id)
}

export async function clearTrashInDB(userId: string): Promise<void> {
  const db = await getDB()
  const existing = await db.getAllFromIndex("trash", "userId", userId)
  const tx = db.transaction("trash", "readwrite")
  const store = tx.objectStore("trash")
  for (const item of existing) {
    await store.delete((item as DeletedAsset).asset.id)
  }
  await tx.done
}

export async function loadCategoriesByUser(userId: string): Promise<string[]> {
  const db = await getDB()
  const items = await db.getAllFromIndex("categories", "userId", userId)
  return items.map((i: { name: string }) => i.name)
}

export async function saveAllCategories(names: string[], userId: string): Promise<void> {
  const db = await getDB()
  const existing = await db.getAllFromIndex("categories", "userId", userId)
  const tx = db.transaction("categories", "readwrite")
  const store = tx.objectStore("categories")
  for (const item of existing) {
    await store.delete((item as { id: number }).id)
  }
  for (const name of names) {
    await store.put({ name, userId })
  }
  await tx.done
}

export async function loadLocationsByUser(userId: string): Promise<string[]> {
  const db = await getDB()
  const items = await db.getAllFromIndex("locations", "userId", userId)
  return items.map((i: { name: string }) => i.name)
}

export async function saveAllLocations(names: string[], userId: string): Promise<void> {
  const db = await getDB()
  const existing = await db.getAllFromIndex("locations", "userId", userId)
  const tx = db.transaction("locations", "readwrite")
  const store = tx.objectStore("locations")
  for (const item of existing) {
    await store.delete((item as { id: number }).id)
  }
  for (const name of names) {
    await store.put({ name, userId })
  }
  await tx.done
}
