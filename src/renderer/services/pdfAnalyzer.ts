import * as pdfjsLib from 'pdfjs-dist'
import type { KnowledgeBlock, BoundingBox } from '../../shared/types/knowledge'
import { createOcrEngine, destroyOcrEngine, TesseractOcrEngine } from './ocrEngine'

const PARALLEL_OCR_COUNT = 2

const CHUNK_MAX_TOKENS = 500
const CHUNK_MIN_TOKENS = 10

function estimateTokens(text: string): number {
  return Math.ceil(text.replace(/\s/g, '').length / 4)
}

export async function hasTextLayer(pdfDoc: pdfjsLib.PDFDocumentProxy): Promise<boolean> {
  try {
    const page = await pdfDoc.getPage(1)
    const textContent = await page.getTextContent()
    const hasText = textContent.items.some(
      (item: any) => item.str && item.str.trim().length > 0
    )
    page.cleanup()
    return hasText
  } catch {
    return false
  }
}

export async function extractText(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  onProgress?: (page: number) => void
): Promise<KnowledgeBlock[]> {
  const blocks: KnowledgeBlock[] = []
  const pdfId = 'pdf_' + hash(pdfDoc._pdfInfo?.DocumentInfoID || 'unknown')

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum)
    const textContent = await page.getTextContent()
    const viewport = page.getViewport({ scale: 1 })

    // Group text items into paragraphs by vertical proximity
    const items = textContent.items
      .filter((item: any) => item.str && item.str.trim().length > 0)
      .map((item: any) => ({
        text: item.str,
        x: item.transform[4] || 0,
        y: viewport.height - item.transform[5],
        width: item.width || 0,
        height: item.height || 0
      }))

    if (items.length === 0) {
      page.cleanup()
      onProgress?.(pageNum)
      continue
    }

    // Group by paragraph (lines with similar y position)
    const paragraphs: string[] = []
    let currentParagraph = ''
    let lastY = -1

    for (const item of items) {
      if (lastY === -1 || Math.abs(item.y - lastY) < 5) {
        currentParagraph += item.text + ' '
      } else {
        if (currentParagraph.trim()) {
          paragraphs.push(currentParagraph.trim())
        }
        currentParagraph = item.text + ' '
      }
      lastY = item.y
    }
    if (currentParagraph.trim()) {
      paragraphs.push(currentParagraph.trim())
    }

    // Split paragraphs into chunks
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i]
      const tokenCount = estimateTokens(paragraph)
      blocks.push({
        id: `kb_${pdfId}_${pageNum}_${i}`,
        pdfId,
        pdfPath: '',
        pageNumber: pageNum,
        type: 'text',
        text: paragraph,
        wordCount: paragraph.split(/\s+/).length,
        tokenEstimate: tokenCount,
        status: 'pending'
      })
    }

    page.cleanup()
    onProgress?.(pageNum)
  }

  return blocks
}

export interface ExtractOcrOptions {
  gpuEnabled?: boolean
}

let lastReportedProgress = 0

async function processPageOcr(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNum: number,
  ocrEngine: TesseractOcrEngine,
  pdfId: string,
  onProgress?: (page: number, total: number) => void
): Promise<{ blocks: KnowledgeBlock[]; figures: KnowledgeBlock[] }> {
  const textBlocks: KnowledgeBlock[] = []
  const figureBlocks: KnowledgeBlock[] = []
  
  const page = await pdfDoc.getPage(pageNum)
  const viewport = page.getViewport({ scale: 1.5 })

  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    page.cleanup()
    return { blocks: [], figures: [] }
  }

  await page.render({ canvasContext: ctx, viewport }).promise
  page.cleanup()

  const ocrResult = await ocrEngine.recognize(canvas)

  if (ocrResult.text.trim()) {
    const paragraphs = ocrResult.text.split(/\n\s*\n/).filter(p => p.trim().length > 0)
    for (const paragraph of paragraphs) {
      const tokenCount = estimateTokens(paragraph)
      if (tokenCount >= CHUNK_MIN_TOKENS) {
        textBlocks.push({
          id: `kb_${pdfId}_${pageNum}_${textBlocks.length}`,
          pdfId,
          pdfPath: '',
          pageNumber: pageNum,
          type: 'text',
          text: paragraph.trim(),
          wordCount: paragraph.trim().split(/\s+/).length,
          tokenEstimate: tokenCount,
          status: 'pending'
        })
      }
    }

    const figures = detectFiguresFromOcr(ocrResult, viewport)
    figureBlocks.push(...figures)
  }

  lastReportedProgress++
  if (lastReportedProgress % PARALLEL_OCR_COUNT === 0 || lastReportedProgress === pdfDoc.numPages) {
    onProgress?.(lastReportedProgress, pdfDoc.numPages)
  }
  return { blocks: textBlocks, figures: figureBlocks }
}

export async function extractViaOcr(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  onProgress?: (page: number, total: number) => void,
  options?: ExtractOcrOptions
): Promise<{ blocks: KnowledgeBlock[]; figures: KnowledgeBlock[] }> {
  const pdfId = 'pdf_' + hash(pdfDoc._pdfInfo?.DocumentInfoID || 'unknown')
  const totalPages = pdfDoc.numPages
  lastReportedProgress = 0
  
  const engines: TesseractOcrEngine[] = []
  for (let i = 0; i < PARALLEL_OCR_COUNT; i++) {
    const engine = await createOcrEngine(options?.gpuEnabled) as TesseractOcrEngine
    engines.push(engine)
  }

  const pageChunks: number[][] = []
  for (let i = 0; i < totalPages; i++) {
    const chunkIndex = i % PARALLEL_OCR_COUNT
    if (!pageChunks[chunkIndex]) pageChunks[chunkIndex] = []
    pageChunks[chunkIndex].push(i + 1)
  }

  const results = await Promise.all(
    pageChunks.map((pages, i) => 
      Promise.all(
        pages.map(pageNum => 
          processPageOcr(pdfDoc, pageNum, engines[i], pdfId, onProgress)
        )
      )
    )
  )

  const textBlocks: KnowledgeBlock[] = []
  const figureBlocks: KnowledgeBlock[] = []
  for (const batchResult of results) {
    for (const result of batchResult) {
      textBlocks.push(...result.blocks)
      figureBlocks.push(...result.figures)
    }
  }

  for (const engine of engines) {
    await engine.terminate()
  }
  
  return { blocks: textBlocks, figures: figureBlocks }
}

function detectFiguresFromOcr(
  ocrResult: { boundingBoxes: BoundingBox[] },
  viewport: { width: number; height: number }
): KnowledgeBlock[] {
  const figures: KnowledgeBlock[] = []
  const boxes = ocrResult.boundingBoxes
  if (boxes.length === 0) return figures

  // Grid-based text coverage analysis
  const gridSize = 10
  const cellWidth = viewport.width / gridSize
  const cellHeight = viewport.height / gridSize
  const coverage = Array(gridSize).fill(null).map(() => Array(gridSize).fill(0))

  for (const box of boxes) {
    const col = Math.min(gridSize - 1, Math.floor(box.x / cellWidth))
    const row = Math.min(gridSize - 1, Math.floor(box.y / cellHeight))
    if (col >= 0 && row >= 0) {
      coverage[row][col] += box.width * box.height
    }
  }

  // Find low-coverage cells (potential figure regions)
  const totalArea = cellWidth * cellHeight
  const candidateCells: { row: number; col: number }[] = []

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (coverage[r][c] / totalArea < 0.1) {
        candidateCells.push({ row: r, col: c })
      }
    }
  }

  // Merge adjacent low-coverage cells into figure regions
  const merged = mergeAdjacentCells(candidateCells, gridSize)

  for (const region of merged) {
    const x = region.col * cellWidth
    const y = region.row * cellHeight
    const w = region.spanCol * cellWidth
    const h = region.spanRow * cellHeight

    if (w > 50 && h > 50) {
      figures.push({
        id: `kb_fig_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        pdfId: '',
        pdfPath: '',
        pageNumber: 0,
        type: 'figure',
        text: '',
        caption: '',
        description: '',
        boundingBox: { x, y, width: w, height: h },
        wordCount: 0,
        tokenEstimate: 0,
        status: 'pending'
      })
    }
  }

  return figures
}

function mergeAdjacentCells(
  cells: { row: number; col: number }[],
  gridSize: number
): { row: number; spanRow: number; col: number; spanCol: number }[] {
  if (cells.length === 0) return []

  const visited = new Set(cells.map(c => `${c.row},${c.col}`))
  const result: { row: number; spanRow: number; col: number; spanCol: number }[] = []

  for (const cell of cells) {
    const key = `${cell.row},${cell.col}`
    if (!visited.has(key)) continue

    // BFS to find connected component
    const queue = [cell]
    visited.delete(key)
    let minRow = cell.row, maxRow = cell.row
    let minCol = cell.col, maxCol = cell.col

    while (queue.length > 0) {
      const current = queue.shift()!
      minRow = Math.min(minRow, current.row)
      maxRow = Math.max(maxRow, current.row)
      minCol = Math.min(minCol, current.col)
      maxCol = Math.max(maxCol, current.col)

      const neighbors = [
        { row: current.row - 1, col: current.col },
        { row: current.row + 1, col: current.col },
        { row: current.row, col: current.col - 1 },
        { row: current.row, col: current.col + 1 }
      ]

      for (const n of neighbors) {
        if (n.row >= 0 && n.row < gridSize && n.col >= 0 && n.col < gridSize) {
          const nKey = `${n.row},${n.col}`
          if (visited.has(nKey)) {
            visited.delete(nKey)
            queue.push(n)
          }
        }
      }
    }

    result.push({
      row: minRow,
      spanRow: maxRow - minRow + 1,
      col: minCol,
      spanCol: maxCol - minCol + 1
    })
  }

  return result
}

function hash(str: string): string {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h).toString(36)
}
