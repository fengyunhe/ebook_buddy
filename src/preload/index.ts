import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialog: (options?: { filters?: { name: string; extensions: string[] }[]; properties?: string[] }) => 
    ipcRenderer.invoke('dialog:openFile', options),
  readFile: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
  getDesktopSources: () => ipcRenderer.invoke('desktop:getSources')
})