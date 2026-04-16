import { contextBridge, ipcRenderer } from 'electron'

const electronAPI = {
  openFileDialog: (options?: { filters?: { name: string; extensions: string[] }[]; properties?: string[] }) => 
    ipcRenderer.invoke('dialog:openFile', options),
  readFile: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
  getDesktopSources: () => ipcRenderer.invoke('desktop:getSources'),
  captureRegion: (sourceId: string, region: { x: number; y: number; width: number; height: number }) => 
    ipcRenderer.invoke('desktop:captureRegion', sourceId, region),
  apiFetch: (options: { url: string; method: string; headers?: Record<string, string>; body?: string }) => 
    ipcRenderer.invoke('api:fetch', options),
  showContextMenu: () => ipcRenderer.invoke('context-menu:show'),
  capturePage: (pageNumber: number) => ipcRenderer.invoke('capture:page', pageNumber),
  onPageCaptureTrigger: (callback: () => void) => {
    ipcRenderer.on('page-capture:trigger', callback)
    return () => ipcRenderer.removeListener('page-capture:trigger', callback)
  },
  onPageCaptureMultiple: (callback: (count: number) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, count: number) => callback(count)
    ipcRenderer.on('page-capture:multiple', handler)
    return () => ipcRenderer.removeListener('page-capture:multiple', handler)
  },
  onGetMaxPages: (callback: () => void) => {
    ipcRenderer.on('page-capture:get-max-pages', callback)
    return () => ipcRenderer.removeListener('page-capture:get-max-pages', callback)
  },
  sendMaxPages: (count: number) => {
    ipcRenderer.send('page-capture:max-pages-reply', count)
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)