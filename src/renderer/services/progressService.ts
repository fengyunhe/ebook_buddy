import { v4 as uuidv4 } from 'uuid'

const STORAGE_KEY = 'ebook-buddy-progress'

interface ReadingProgress {
  filePath: string
  currentPage: number
  zoomLevel: number
  lastOpenedAt: number
}

export function saveProgress(filePath: string, currentPage: number, zoomLevel: number): void {
  try {
    const data = loadAllProgress()
    data[filePath] = {
      filePath,
      currentPage,
      zoomLevel,
      lastOpenedAt: Date.now()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (err) {
    console.error('Failed to save progress:', err)
  }
}

export function loadProgress(filePath: string): ReadingProgress | null {
  try {
    const data = loadAllProgress()
    return data[filePath] || null
  } catch (err) {
    console.error('Failed to load progress:', err)
    return null
  }
}

function loadAllProgress(): Record<string, ReadingProgress> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function getLastOpened(): ReadingProgress | null {
  try {
    const data = loadAllProgress()
    const entries = Object.values(data)
    if (entries.length === 0) return null
    
    return entries.sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)[0]
  } catch {
    return null
  }
}