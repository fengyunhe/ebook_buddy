export * from './voice'
export * from './transcription'
export * from './errors'
export * from './chat'
export * from './media'
export * from './pageImage'

export interface PDFDocument {
  filePath: string
  fileName: string
  currentPage: number
  totalPages: number
  zoomLevel: number
  readProgress: number
  lastOpenedAt: number
  lastReadPage: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  contentType: 'text' | 'markdown'
  timestamp: number
  status: 'sending' | 'sent' | 'error'
  errorMessage?: string
}

export interface ChatSession {
  id: string
  messages: ChatMessage[]
  pdfContext?: string
  createdAt: number
  updatedAt: number
  title: string
}

export interface UserPreferences {
  chatPanelWidth: number
  chatPanelCollapsed: boolean
  lastOpenedPDF: string | null
  pdfZoomLevel: number
  theme: 'light' | 'dark'
}

export interface ElectronAPI {
  openFileDialog: (options?: { filters?: { name: string; extensions: string[] }[]; properties?: string[] }) => Promise<{ canceled: boolean; filePaths: string[] }>
  readFile: (filePath: string) => Promise<ArrayBuffer>
  getDesktopSources: () => Promise<{ id: string; name: string; thumbnail: string }[]>
  captureRegion: (sourceId: string, region: { x: number; y: number; width: number; height: number }) => Promise<{ success: boolean; data?: string; mimeType?: string; error?: string }>
  apiFetch: (options: { url: string; method: string; headers?: Record<string, string>; body?: string }) => Promise<{ ok: boolean; status: number; data: string }>
  showContextMenu: () => Promise<void>
  capturePage: (pageNumber: number) => Promise<{ success: boolean; pageNumber: number }>
  onPageCaptureTrigger: (callback: () => void) => () => void
  onPageCaptureMultiple: (callback: (count: number) => void) => () => void
  onGetMaxPages: (callback: () => void) => () => void
  sendMaxPages: (count: number) => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}