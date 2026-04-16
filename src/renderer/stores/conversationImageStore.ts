import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export interface PageImage {
  id: string
  pageNumber: number
  imageData: string
  timestamp: number
  bookId: string
}

export interface ConversationImageState {
  images: PageImage[]
  maxLimit: number
  addedPageNumbers: Set<number>
  addImage: (pageNumber: number, imageData: string, bookId: string) => { success: boolean; error?: 'duplicate' | 'limit_exceeded' | 'no_book_open' | 'capture_failed'; message?: string }
  removeImage: (id: string) => void
  clearImages: () => void
  hasPage: (pageNumber: number) => boolean
  isAtLimit: () => boolean
  getNextPageNumber: (currentPage: number) => number | null
}

export const useConversationImageStore = create<ConversationImageState>((set, get) => ({
  images: [],
  maxLimit: 10,
  addedPageNumbers: new Set<number>(),

  addImage: (pageNumber, imageData, bookId) => {
    const state = get()
    
    if (!bookId) {
      return { success: false, error: 'no_book_open', message: 'Please open a book first' }
    }
    
    if (state.addedPageNumbers.has(pageNumber)) {
      return { success: false, error: 'duplicate', message: `Page ${pageNumber} has already been added` }
    }
    
    if (state.images.length >= state.maxLimit) {
      return { success: false, error: 'limit_exceeded', message: `Maximum ${state.maxLimit} images per conversation` }
    }

    const newImage: PageImage = {
      id: uuidv4(),
      pageNumber,
      imageData,
      timestamp: Date.now(),
      bookId
    }

    set((state) => ({
      images: [...state.images, newImage],
      addedPageNumbers: new Set([...state.addedPageNumbers, pageNumber])
    }))

    return { success: true }
  },

  removeImage: (id) => set((state) => {
    const imageToRemove = state.images.find(img => img.id === id)
    const newPageNumbers = new Set(state.addedPageNumbers)
    if (imageToRemove) {
      newPageNumbers.delete(imageToRemove.pageNumber)
    }
    return {
      images: state.images.filter(img => img.id !== id),
      addedPageNumbers: newPageNumbers
    }
  }),

  clearImages: () => set({ images: [], addedPageNumbers: new Set() }),

  hasPage: (pageNumber) => get().addedPageNumbers.has(pageNumber),

  isAtLimit: () => get().images.length >= get().maxLimit,

  getNextPageNumber: (currentPage) => {
    const state = get()
    if (!state.addedPageNumbers.has(currentPage) && state.images.length < state.maxLimit) {
      return currentPage
    }
    return null
  }
}))