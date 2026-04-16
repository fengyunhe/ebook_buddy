import * as pdfjs from 'pdfjs-dist'

export interface CapturePageOptions {
  pageNumber: number
  scale?: number
}

export interface CapturePageResult {
  success: boolean
  imageData?: string
  error?: string
}

let pdfDocument: pdfjs.PDFDocumentProxy | null = null

export async function setPdfDocument(doc: pdfjs.PDFDocumentProxy): Promise<void> {
  pdfDocument = doc
}

export async function capturePage(options: CapturePageOptions): Promise<CapturePageResult> {
  const { pageNumber, scale = 1.5 } = options

  if (!pdfDocument) {
    return { success: false, error: 'No PDF document loaded' }
  }

  try {
    const page = await pdfDocument.getPage(pageNumber)
    const viewport = page.getViewport({ scale })

    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return { success: false, error: 'Failed to get canvas context' }
    }

    await page.render({
      canvasContext: ctx,
      viewport
    }).promise

    const imageData = canvas.toDataURL('image/png')
    page.cleanup()

    return { success: true, imageData }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export function getCurrentPageNumber(): number {
  return 1
}