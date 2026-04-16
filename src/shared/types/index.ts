export * from './voice'
export * from './transcription'
export * from './errors'
export * from './chat'
export * from './media'

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
  openFileDialog: () => Promise<{ canceled: boolean; filePaths: string[] }>
  readFile: (filePath: string) => Promise<ArrayBuffer>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}