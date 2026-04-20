import type { ChatConfig, ChatResult, ChatMessage } from '../../shared/types/chat'
import { getChatEndpoint, DEFAULT_CHAT_CONFIG } from '../../shared/types/chat'
import '../../shared/types'
import { QdrantService } from './qdrantService'
import { embedText } from './embeddingService'
import { useKnowledgeStore } from '../stores/knowledgeStore'
import { useConfigStore } from '../stores/configStore'
import type { KnowledgeBlock } from '../../shared/types/knowledge'

const electronAPI = (window as any).electronAPI

async function apiFetch(options: { url: string; method: string; headers?: Record<string, string>; body?: string }) {
  if (electronAPI?.apiFetch) {
    return electronAPI.apiFetch(options)
  }
  // Browser: use regular fetch (for local dev server with CORS)
  const response = await fetch(options.url, {
    method: options.method,
    headers: options.headers,
    body: options.body
  })
  const data = await response.text()
  return { ok: response.ok, status: response.status, data }
}

export interface Citation {
  pageNumber: number
  text: string
}

export async function sendChatMessage(
  content: string,
  config: ChatConfig = DEFAULT_CHAT_CONFIG,
  history: ChatMessage[] = [],
  contextOptions?: ContextOptions
): Promise<ChatResult & { citations?: Citation[] }> {
  try {
    const endpoint = getChatEndpoint(config.baseUrl)
    
    let messages: ChatMessage[] = [...history]
    let citations: Citation[] = []

    if (contextOptions?.pdfId && contextOptions?.currentPage && contextOptions.injectPageContext !== false) {
      const { system, contextBlocks } = buildContextualPrompt(
        content,
        contextOptions.currentPage,
        contextOptions.pdfId,
        contextOptions.pageContextPages || 2
      )
      messages = [
        { role: 'system', content: system },
        ...history,
        { role: 'user', content }
      ]
      citations = contextBlocks.map(b => ({ pageNumber: b.pageNumber, text: b.text.slice(0, 100) }))
    } else {
      messages = [...history, { role: 'user', content }]
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`
    }

    const response = await apiFetch({
      url: endpoint,
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens
      })
    })

    if (!response.ok) {
      return {
        content: '',
        success: false,
        error: `API error: ${response.status} - ${response.data}`
      }
    }

    const data = JSON.parse(response.data)
    
    const assistantContent = data.choices?.[0]?.message?.content || ''
    
    return {
      content: assistantContent,
      success: true,
      usage: data.usage,
      citations
    }
  } catch (error) {
    if (error instanceof Error) {
      return {
        content: '',
        success: false,
        error: error.message,
        citations: []
      }
    }
    return {
      content: '',
      success: false,
      error: 'Unknown error occurred',
      citations: []
    }
  }
}

export interface ContextOptions {
  currentPage?: number
  pdfId?: string
  pdfPath?: string
  pageContextPages?: number
  injectPageContext?: boolean
}

function buildContextualPrompt(
  query: string,
  currentPage: number,
  pdfId: string,
  pageContextPages: number = 2
): { system: string; contextBlocks: KnowledgeBlock[] } {
  const store = useKnowledgeStore.getState()
  const blocks = store.blocks
  const currentPageBlocks = blocks.filter(b => b.pdfId === pdfId && b.pageNumber === currentPage)
  const pageRange: number[] = []
  for (let i = -pageContextPages; i <= pageContextPages; i++) {
    const p = currentPage + i
    if (p > 0) pageRange.push(p)
  }
  const contextBlocks = blocks.filter(b => 
    b.pdfId === pdfId && pageRange.includes(b.pageNumber) && b.status === 'analyzed'
  )
  
  const contextText = contextBlocks
    .slice(0, 10)
    .map(b => `[Page ${b.pageNumber}] ${b.text.slice(0, 200)}${b.text.length > 200 ? '...' : ''}`)
    .join('\n\n')
  
  const system = contextText 
    ? `You are answering questions about a PDF document. The user is currently viewing page ${currentPage}. Use the following context from the PDF to answer questions. Cite the page number when referencing specific content.\n\n${contextText}`
    : `You are answering questions about a PDF document. The user is currently viewing page ${currentPage}.`

  return { system, contextBlocks }
}

export async function searchPdfContent(
  pdfId: string,
  query: string,
  options: { topK?: number; currentPage?: number } = {}
): Promise<KnowledgeBlock[]> {
  const store = useKnowledgeStore.getState()
  const blocks = store.blocks
  
  console.log('[Search] pdfId:', pdfId, 'blocks:', blocks.length)
  
  if (!query.trim()) {
    return blocks.slice(0, options.topK || 5)
  }

  const { embeddingBaseUrl, embeddingModel, embeddingApiKey } = useConfigStore.getState()
  const config = {
    baseUrl: embeddingBaseUrl || ((window as any).electronAPI?.apiFetch ? 'http://localhost:11434/v1' : ''),
    model: embeddingModel || 'nomic-embed-text',
    apiKey: embeddingApiKey || ''
  }
  
  const embedding = await embedText(query, config)
  console.log('[Search] embedding:', embedding ? 'yes' : 'no')
  
  if (!embedding) {
    const queryLower = query.toLowerCase()
    const filtered = blocks
      .filter(b => b.text.toLowerCase().includes(queryLower))
      .slice(0, options.topK || 5)
    console.log('[Search] fallback filtered:', filtered.length)
    return filtered
  }

  // Note: Qdrant Docker needs volume mount for persistence
  const queryLower = query.toLowerCase()
  const filtered = blocks
    .filter(b => b.text.toLowerCase().includes(queryLower))
    .slice(0, options.topK || 5)
  
  // Uncomment below when Qdrant is working
  // const qdrantService = new QdrantService()
  // const results = await qdrantService.search(pdfId, query, embedding.vector, {
  //   currentPage: options.currentPage,
  //   topK: options.topK || 5,
  //   pageContextPages: 2
  // })
  // return blocks.filter((_, i) => resultBlockIds.has(i)).slice(0, options.topK || 5)
  
  return filtered
}

export async function sendChatMessageWithImage(
  content: string,
  imageBase64: string | string[],
  config: ChatConfig = DEFAULT_CHAT_CONFIG,
  history: ChatMessage[] = [],
  contextOptions?: ContextOptions
): Promise<ChatResult> {
  try {
    const endpoint = getChatEndpoint(config.baseUrl)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`
    }

    const images = Array.isArray(imageBase64) ? imageBase64 : [imageBase64]
    
    const messageContent: Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }> = [
      { type: 'text', text: content || 'Please analyze these images' }
    ]
    
    for (const img of images) {
      let mimeType = 'image/png'
      if (img.startsWith('/9j/')) mimeType = 'image/jpeg'
      else if (img.startsWith('iVBOR')) mimeType = 'image/png'
      else if (img.startsWith('R0lGO')) mimeType = 'image/gif'
      else if (img.startsWith('UklGR')) mimeType = 'image/webp'
      
      messageContent.push({
        type: 'image_url',
        image_url: { url: `data:${mimeType};base64,${img}` }
      })
    }

    const response = await apiFetch({
      url: endpoint,
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model,
        messages: [
          ...history,
          {
            role: 'user',
            content: messageContent
          }
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens
      })
    })

    if (!response.ok) {
      return {
        content: '',
        success: false,
        error: `API error: ${response.status} - ${response.data}`
      }
    }

    const data = JSON.parse(response.data)
    
    return {
      content: data.choices?.[0]?.message?.content || '',
      success: true,
      usage: data.usage
    }
  } catch (error) {
    if (error instanceof Error) {
      return {
        content: '',
        success: false,
        error: error.message
      }
    }
    return {
      content: '',
      success: false,
      error: 'Unknown error occurred'
    }
  }
}