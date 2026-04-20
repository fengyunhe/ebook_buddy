import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type {
  KnowledgeBlock,
  KnowledgeIndex,
  AnalysisProgress,
  KnowledgeStoreState
} from '../../shared/types/knowledge'
import { getCachedAnalysis, saveCachedAnalysis, deleteCachedAnalysis } from '../services/pdfCache'
import { createOcrEngine, destroyOcrEngine } from '../services/ocrEngine'
import { embedText, embedImage, describeFigure } from '../services/embeddingService'
import { QdrantService } from '../services/qdrantService'
import type { ChatConfig } from '../../shared/types/chat'
import * as pdfjsLib from 'pdfjs-dist'

function hash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

function estimateTokens(text: string): number {
  return Math.ceil(text.replace(/\s/g, '').length / 4)
}

function createEmptyProgress(): AnalysisProgress {
  return {
    pdfId: null,
    status: 'idle',
    currentBlock: 0,
    totalBlocks: 0,
    estimatedRemainingMs: null,
    errorMessage: null,
    cancelled: false,
    cancelRequested: false
  }
}

export const useKnowledgeStore = create<KnowledgeStoreState>((set, get) => ({
  currentPdfId: null,
  currentFilePath: null,
  currentIndex: null,
  currentPage: 1,
  totalPages: 0,
  analysisProgress: createEmptyProgress(),
  blocks: [],

  setPdfInfo: (filePath, totalPages) => {
    const pdfId = hash(filePath)
    set({
      currentPdfId: pdfId,
      currentFilePath: filePath,
      totalPages,
      currentPage: 1,
      currentIndex: {
        pdfId,
        pdfPath: filePath,
        totalPages,
        blockCount: 0,
        status: 'empty',
        progress: { current: 0, total: 0 },
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      analysisProgress: {
        ...createEmptyProgress(),
        pdfId
      },
      blocks: []
    })
  },

  setCurrentPage: (page: number) => {
    set({ currentPage: page })
  },

  goToPage: (page: number) => {
    set({ currentPage: page })
  },

  startAnalysis: async () => {
    const { currentFilePath, currentIndex } = get()
    if (!currentFilePath || !currentIndex) return

    const pdfId = currentIndex.pdfId
    const progress = {
      ...createEmptyProgress(),
      pdfId,
      status: 'analyzing',
      cancelRequested: false,
      cancelled: false
    }

    set({ analysisProgress: progress })

    // Check cache first
    const cached = await getCachedAnalysis(currentFilePath)
    if (cached && cached.fileHash === hash(currentFilePath)) {
      const cachedBlocks: KnowledgeBlock[] = cached.blocks.map(b => ({
        ...b,
        textVector: undefined,
        imageVector: undefined
      }))
      set({
        blocks: cachedBlocks,
        currentIndex: {
          ...currentIndex,
          blockCount: cachedBlocks.length,
          status: 'complete',
          updatedAt: Date.now()
        },
        analysisProgress: { ...progress, status: 'completed', totalBlocks: cachedBlocks.length }
      })
      return
    }

    // Need to analyze
    set({
      analysisProgress: { ...progress, status: 'analyzing', totalBlocks: 0 }
    })

    // Get PDF doc from PDFViewer — we need the pdfDoc reference
    // This will be wired up via a callback in PDFViewer
    // For now, we return a promise that the caller resolves
    set({
      analysisProgress: { ...progress, status: 'analyzing', totalBlocks: 0, errorMessage: null }
    })
  },

  cancelAnalysis: () => {
    const { analysisProgress } = get()
    set({
      analysisProgress: { ...analysisProgress, cancelRequested: true, status: 'cancelled' }
    })
  },

  clearKnowledge: () => {
    const { currentPdfId, currentFilePath } = get()
    if (currentPdfId) {
      const qdrantService = new QdrantService()
      qdrantService.deleteByPdfId(currentPdfId)
    }
    if (currentFilePath) {
      deleteCachedAnalysis(currentFilePath)
    }
    set({
      blocks: [],
      currentIndex: null,
      currentPdfId: null,
      currentFilePath: null,
      analysisProgress: createEmptyProgress()
    })
  },

  getBlocksByPage: (pageNumber) => get().blocks.filter(b => b.pageNumber === pageNumber),

  getAllBlocks: () => get().blocks,

  syncFromQdrant: async (pdfId) => {
    const qdrantService = new QdrantService()
    const stats = await qdrantService.getStats(pdfId)
    // In a real implementation, we'd scroll all points and reconstruct blocks
    // For now, just update stats
    const { currentIndex } = get()
    if (currentIndex) {
      set({
        currentIndex: { ...currentIndex, blockCount: stats.totalBlocks }
      })
    }
  },

  // Internal: called by analysis pipeline to update progress
  _updateAnalysisProgress: (updates: Partial<AnalysisProgress>) => {
    set(state => ({
      analysisProgress: { ...state.analysisProgress, ...updates }
    }))
  },

  // Internal: called by analysis pipeline to add blocks
  _addBlocks: (newBlocks: KnowledgeBlock[]) => {
    set(state => {
      const existingIds = new Set(state.blocks.map(b => b.id))
      const uniqueNewBlocks = newBlocks.filter(b => !existingIds.has(b.id))
      return {
        blocks: [...state.blocks, ...uniqueNewBlocks]
      }
    })
  },

  // Internal: clear all blocks
  _clearBlocks: () => {
    set({ blocks: [] })
  },

  // Internal: called to mark analysis complete
  _markAnalysisComplete: (totalBlocks: number) => {
    set(state => ({
      analysisProgress: {
        ...state.analysisProgress,
        status: 'completed',
        totalBlocks,
        currentBlock: totalBlocks
      },
      currentIndex: state.currentIndex
        ? {
            ...state.currentIndex,
            blockCount: totalBlocks,
            status: 'complete',
            updatedAt: Date.now()
          }
        : null
    }))
  },

  // Generate figure description on-demand
  describeFigure: async (blockId: string, imageBase64: string, config: ChatConfig) => {
    const result = await describeFigure(imageBase64, config)
    if (!result) return null

    set(state => ({
      blocks: state.blocks.map(b => 
        b.id === blockId 
          ? { ...b, description: result.description, caption: result.caption }
          : b
      )
    }))

    return result
  }
}))
