import { app, BrowserWindow, ipcMain, dialog, desktopCapturer } from 'electron'
import { join } from 'path'
import { readFile } from 'fs/promises'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  app.quit()
})

ipcMain.handle('dialog:openFile', async (_event, options?: { filters?: { name: string; extensions: string[] }[]; properties?: Array<'openFile' | 'openDirectory' | 'multiSelections'> }) => {
  const result = await dialog.showOpenDialog({
    properties: options?.properties || ['openFile'],
    filters: options?.filters || [{ name: 'All Files', extensions: ['*'] }]
  })
  return result
})

ipcMain.handle('file:read', async (_event, filePath: string) => {
  const buffer = await readFile(filePath)
  return buffer.buffer
})

ipcMain.handle('desktop:getSources', async () => {
  const sources = await desktopCapturer.getSources({
    types: ['screen', 'window'],
    thumbnailSize: { width: 320, height: 180 }
  })
  return sources.map(source => ({
    id: source.id,
    name: source.name,
    thumbnail: source.thumbnail.toDataURL()
  }))
})

ipcMain.handle('desktop:captureRegion', async (_event, sourceId: string, region: { x: number; y: number; width: number; height: number }) => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen', 'window'],
      thumbnailSize: { width: 1920, height: 1080 }
    })
    
    const source = sources.find(s => s.id === sourceId)
    if (!source) {
      throw new Error('Source not found')
    }

    const thumbnail = source.thumbnail
    const cropImage = thumbnail.crop(region)
    const dataUrl = cropImage.toDataURL()
    
    return { success: true, data: dataUrl.split(',')[1], mimeType: 'image/png' }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to capture region' }
  }
})