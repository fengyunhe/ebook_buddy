export interface PageImage {
  id: string
  pageNumber: number
  imageData: string
  timestamp: number
  bookId: string
}

export interface AddImageResult {
  success: boolean
  error?: 'duplicate' | 'limit_exceeded' | 'no_book_open' | 'capture_failed'
  message?: string
}