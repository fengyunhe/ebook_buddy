// Knowledge Block — unit of analyzed PDF content
export type BlockType = 'text' | 'figure' | 'table'

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface KnowledgeBlock {
  id: string
  pdfId: string
  pdfPath: string
  pageNumber: number
  type: BlockType
  text: string
  caption?: string
  description?: string
  boundingBox?: BoundingBox
  wordCount: number
  tokenEstimate: number
  textVector?: number[]
  imageVector?: number[]
  status: 'pending' | 'analyzed' | 'error'
  error?: string
}

// Knowledge Index — searchable representation for a single PDF
export interface KnowledgeIndex {
  pdfId: string
  pdfPath: string
  totalPages: number
  blockCount: number
  status: 'empty' | 'building' | 'complete' | 'error'
  progress: { current: number; total: number }
  createdAt: number
  updatedAt: number
}

// IndexedDB cache entry
export interface CachedAnalysis {
  pdfPath: string
  fileHash: string
  fileMtime: number
  totalPages: number
  blocks: Omit<KnowledgeBlock, 'textVector' | 'imageVector'>[]
  createdAt: number
  updatedAt: number
}

// Analysis progress tracking
export interface AnalysisProgress {
  pdfId: string | null
  status: 'idle' | 'analyzing' | 'completed' | 'error' | 'cancelled'
  currentBlock: number
  totalBlocks: number
  estimatedRemainingMs: number | null
  errorMessage: string | null
  cancelled: boolean
  cancelRequested: boolean
}

// OCR result from tesseract or Umi-OCR
export interface OcrResult {
  text: string
  boundingBoxes: BoundingBox[]
  confidence: number
}

// OCR engine interface
export interface OcrEngine {
  name: 'tesseract' | 'umi-ocr'
  recognize(image: HTMLCanvasElement | Blob, lang?: string[]): Promise<OcrResult>
  isAvailable(): Promise<boolean>
}

// Embedding result
export interface EmbedResult {
  vector: number[]
  model: string
}

// Qdrant search result
export interface QdrantSearchResult {
  pointId: number | string
  payload: Record<string, unknown>
  score: number
  vector: number[]
  vectorName?: string
}

// Knowledge store state
export interface KnowledgeStoreState {
  currentPdfId: string | null
  currentFilePath: string | null
  currentIndex: KnowledgeIndex | null
  currentPage: number
  totalPages: number
  analysisProgress: AnalysisProgress
  blocks: KnowledgeBlock[]

  setPdfInfo: (filePath: string, totalPages: number) => void
  setCurrentPage: (page: number) => void
  goToPage: (page: number) => void
  describeFigure: (blockId: string, imageBase64: string, config: ChatConfig) => Promise<{ caption: string; description: string } | null>
  startAnalysis: () => Promise<void>
  cancelAnalysis: () => void
  clearKnowledge: () => void
  getBlocksByPage: (pageNumber: number) => KnowledgeBlock[]
  getAllBlocks: () => KnowledgeBlock[]
  syncFromQdrant: (pdfId: string) => Promise<void>
}
