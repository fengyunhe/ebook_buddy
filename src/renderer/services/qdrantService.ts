import type { QdrantSearchResult } from '../../shared/types/knowledge'
import { useConfigStore } from '../stores/configStore'

const QDRANT_URL = 'http://localhost:6333'
const COLLECTION_NAME = 'ebook_buddy_pdf_knowledge'
const IMAGE_VECTOR_SIZE = 512

function getTextVectorSize(): number {
  return useConfigStore.getState().embeddingDimension || 1024
}

const electronAPI = (window as any).electronAPI

async function qdrantFetch(path: string, body?: unknown, method?: string): Promise<unknown> {
  if (!electronAPI?.apiFetch) {
    return { result: null }
  }
  
  const httpMethod = method || (body ? 'PUT' : 'GET')
  
  try {
    const response = await electronAPI.apiFetch({
      url: `${QDRANT_URL}${path}`,
      method: httpMethod,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    })
    
    if (!response?.ok) {
      return { status: response?.status, error: response?.data }
    }
    
    const responseData = response?.data
    return responseData ? JSON.parse(responseData) : {}
  } catch {
    return { result: null }
  }
}

class InMemorySearchFallback {
  private blocks: Array<{ payload: Record<string, unknown>; vector?: number[] }> = []

  setBlocks(blocks: Array<{ payload: Record<string, unknown>; vector?: number[] }>): void {
    this.blocks = blocks
  }

  search(
    pdfId: string,
    query: string,
    _queryVector: number[],
    _options: { topK?: number; vectorName?: string }
  ): QdrantSearchResult[] {
    const filtered = this.blocks.filter(b => (b.payload.pdf_id as string) === pdfId)
    const queryLower = query.toLowerCase()
    const scored = filtered.map(b => ({
      pointId: Date.now() + Math.random(),
      payload: b.payload,
      score: b.payload.text?.toString().toLowerCase().includes(queryLower) ? 0.8 : 0.1,
      vector: b.vector || [],
      vectorName: 'text'
    }))
    return scored.sort((a, b) => b.score - a.score).slice(0, _options.topK || 5)
  }
}

export class QdrantService {
  private fallback = new InMemorySearchFallback()
  private collectionReady = false

  constructor() {
  }

  async ensureCollection(): Promise<void> {
    if (this.collectionReady) return

    try {
      const result = await qdrantFetch('/collections') as { result?: { collections?: { name: string }[] } }
      
      const collections = result?.result?.collections || []
      const exists = collections.some((c: { name: string }) => c.name === COLLECTION_NAME)

      if (!exists) {
        const textSize = getTextVectorSize()
        console.log('[Qdrant] Creating collection, text vec size:', textSize, 'image vec size:', IMAGE_VECTOR_SIZE)
        const createBody = {
          vectors: {
            text: { size: textSize, distance: 'Cosine' },
            image: { size: IMAGE_VECTOR_SIZE, distance: 'Cosine' }
          }
        }
        
        await qdrantFetch(`/collections/${COLLECTION_NAME}`, createBody)
        
        await qdrantFetch(`/collections/${COLLECTION_NAME}/index`, {
          field_name: 'pdf_id',
          field_schema: 'keyword'
        })
        await qdrantFetch(`/collections/${COLLECTION_NAME}/index`, {
          field_name: 'page_number',
          field_schema: 'integer'
        })
        await qdrantFetch(`/collections/${COLLECTION_NAME}/index`, {
          field_name: 'block_type',
          field_schema: 'keyword'
        })
      }
      this.collectionReady = true
    } catch (err) {
      console.warn('Failed to ensure Qdrant collection:', err)
      this.collectionReady = false
    }
  }

  async upsertEntries(
    pdfId: string,
    entries: Array<{
      pointId: number | string
      payload: Record<string, unknown>
      vector: { text: number[]; image?: number[] }
    }>
  ): Promise<void> {
    if (!this.collectionReady) {
      const fallbackEntries = entries.map(e => ({
        payload: e.payload,
        vector: e.vector.text
      }))
      this.fallback.setBlocks(fallbackEntries)
      return
    }

    try {
      const sampleVec = entries[0]?.vector?.text
    console.log('[Qdrant] Sample vector dim:', sampleVec?.length || 'unknown')

    const points = entries.map(e => ({
        id: Number(e.pointId),
        vectors: { text: e.vector.text },
        payload: e.payload
      }))
      
      console.log('[Qdrant] Upsert body points[0]:', JSON.stringify(points[0]).slice(0, 300))
      await qdrantFetch(`/collections/${COLLECTION_NAME}/points`, { points }, 'PUT')
    } catch (err) {
      console.error('Qdrant upsert failed:', err)
    }
  }

  async search(
    pdfId: string,
    query: string,
    queryVector: number[],
    options: {
      currentPage?: number
      topK?: number
      pageContextPages?: number
      vectorName?: string
    } = {}
  ): Promise<QdrantSearchResult[]> {
    if (!this.collectionReady) {
      return this.fallback.search(pdfId, query, queryVector, options)
    }

    const topK = options.topK || 5
    const vectorName = options.vectorName || 'text'

    try {
      const searchBody = {
        vector: queryVector,
        limit: topK,
        params: { exact: true },
        with_payload: true
      }

      console.log('[Qdrant] Search body:', JSON.stringify(searchBody).slice(0, 300))
      console.log('[Qdrant] Search vector dim:', queryVector.length)

      const result = await qdrantFetch(
        `/collections/${COLLECTION_NAME}/points/search`,
        searchBody,
        'POST'
      ) as { result?: { id: number; score: number; payload: Record<string, unknown>; vector?: number[] }[] }

      console.log('[Qdrant] Search result:', JSON.stringify(result).slice(0, 500))

      return (result?.result || []).map(r => ({
        pointId: r.id,
        score: r.score,
        payload: r.payload,
        vector: r.vector || [],
        vectorName
      }))
    } catch (err) {
      console.error('Qdrant search failed:', err)
      return this.fallback.search(pdfId, query, queryVector, options)
    }
  }

  async deletePdfEntries(pdfId: string): Promise<void> {
    if (!this.collectionReady) return

    try {
      await qdrantFetch(`/collections/${COLLECTION_NAME}/points/delete`, {
        filter: {
          must: [
            { key: 'pdf_id', match: { value: pdfId } }
          ]
        }
      }, 'POST')
    } catch (err) {
      console.error('Qdrant delete failed:', err)
    }
  }

  getFallback(): InMemorySearchFallback {
    return this.fallback
  }
}
