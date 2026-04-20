import { openDB, type IDBPDatabase } from 'idb'
import type { CachedAnalysis } from '../../shared/types/knowledge'

const DB_NAME = 'ebook-buddy-knowledge'
const DB_VERSION = 1
const STORE_NAME = 'analyses'

let db: IDBPDatabase | null = null

async function getDb(): Promise<IDBPDatabase> {
  if (!db) {
    db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'pdfPath' })
        }
      }
    })
  }
  return db
}

export async function getCachedAnalysis(pdfPath: string): Promise<CachedAnalysis | null> {
  try {
    const dbConn = await getDb()
    return await dbConn.get(STORE_NAME, pdfPath)
  } catch {
    return null
  }
}

export async function saveCachedAnalysis(cache: CachedAnalysis): Promise<void> {
  const dbConn = await getDb()
  await dbConn.put(STORE_NAME, cache)
}

export async function deleteCachedAnalysis(pdfPath: string): Promise<void> {
  try {
    const dbConn = await getDb()
    await dbConn.delete(STORE_NAME, pdfPath)
  } catch {
    // Ignore errors — cache is optional
  }
}

export async function clearAllCache(): Promise<void> {
  try {
    const dbConn = await getDb()
    await dbConn.clear(STORE_NAME)
  } catch {
    // Ignore errors
  }
}

export async function getDbVersion(): Promise<number> {
  const dbConn = await getDb()
  return dbConn.version
}
