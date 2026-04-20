import type { ChatConfig } from '../../shared/types/chat'
import type { EmbedResult } from '../../shared/types/knowledge'

async function tryLlmEmbedding(text: string, config: ChatConfig): Promise<EmbedResult | null> {
  if (!config.baseUrl) return null

  const electronAPI = (window as any).electronAPI
  if (!electronAPI?.apiFetch) return null

  let baseUrl = config.baseUrl.replace(/\/$/, '')
  if (!baseUrl.endsWith('/v1')) {
    baseUrl = baseUrl + '/v1'
  }
  const endpoint = baseUrl + '/embeddings'

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`
    }

    const response = await electronAPI.apiFetch({
      url: endpoint,
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model,
        input: text
      })
    })

    if (!response.ok) return null

    const data = JSON.parse(response.data)
    const vector = data?.data?.[0]?.embedding
    if (vector && Array.isArray(vector)) {
      return { vector, model: config.model }
    }
    return null
  } catch {
    return null
  }
}

let transformersInstance: any = null

export async function getDeviceType(): Promise<'cpu' | 'webgpu' | 'wasm'> {
  if (typeof navigator === 'undefined' || !navigator.gpu) {
    return 'cpu'
  }
  
  try {
    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) return 'cpu'
    
    const vendor = (adapter as any).vendor || ''
    const architecture = (adapter as any).architecture || ''
    const desc = (vendor + ' ' + architecture).toLowerCase()
    
    const isApple = desc.includes('apple') || desc.includes('m') || 
                   desc.includes('mac') || desc.includes('silicon') ||
                   desc.includes('armac') || desc.includes('apple m')
    
    if (isApple) {
      console.log('[Embed] Apple M-Series GPU detected, using WebGPU')
      return 'webgpu'
    }
    
    const isNvidia = desc.includes('nvidia') || desc.includes('geforce')
    const isAmd = desc.includes('amd') || desc.includes('radeon')
    const isIntel = desc.includes('intel') || desc.includes('iris')
    
    if (isNvidia || isAmd || isIntel) {
      console.log('[Embed] Desktop GPU detected')
      return 'webgpu'
    }
    
  } catch (e) {
    console.warn('[Embed] WebGPU detection failed:', e)
  }
  
  return 'cpu'
}

export async function getAvailableEmbedAccelerations(): Promise<{ name: string; device: string; recommended: boolean }[]> {
  const result: { name: string; device: string; recommended: boolean }[] = []
  const deviceType = await getDeviceType()
  
  if (deviceType === 'webgpu') {
    try {
      const adapter = await navigator.gpu!.requestAdapter()
      result.push({ 
        name: adapter?.description || 'WebGPU', 
        device: 'webgpu', 
        recommended: true 
      })
    } catch {
      result.push({ name: 'WebGPU', device: 'webgpu', recommended: true })
    }
  }
  
  result.push({ name: 'CPU (Fallback)', device: 'cpu', recommended: deviceType !== 'webgpu' })
  
  return result
}

async function getTransformersInstance(deviceType?: 'cpu' | 'webgpu'): Promise<any> {
  if (!transformersInstance) {
    const { pipeline } = await import('@xenova/transformers')
    const device = deviceType || await getDeviceType()
    transformersInstance = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', device)
  }
  return transformersInstance
}

async function tryTransformersEmbedding(text: string): Promise<EmbedResult | null> {
  try {
    const deviceType = await getDeviceType()
    const extractor = await getTransformersInstance(deviceType)
    const result = await extractor(text, {
      pooling: 'mean',
      normalize: true
    })
    const vector = Array.from(result.data as Float32Array)
    return { vector, model: 'all-MiniLM-L6-v2' }
  } catch {
    return null
  }
}

export async function embedText(text: string, config: ChatConfig): Promise<EmbedResult | null> {
  if (!text || text.trim().length === 0) return null

  const llmResult = await tryLlmEmbedding(text, config)
  if (llmResult) return llmResult

  return await tryTransformersEmbedding(text)
}

export async function embedImage(imageBase64: string, config: ChatConfig): Promise<EmbedResult | null> {
  const electronAPI = (window as any).electronAPI
  if (!electronAPI?.apiFetch) return null

  let baseUrl = config.baseUrl?.replace(/\/$/, '') || ''
  if (!baseUrl.endsWith('/v1') && baseUrl) {
    baseUrl = baseUrl + '/v1'
  }
  const endpoint = baseUrl + '/embeddings'
  if (!endpoint || endpoint === '/embeddings') return null

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`
    }

    const response = await electronAPI.apiFetch({
      url: endpoint,
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model,
        input: [{
          role: 'user',
          content: [
            { type: 'text', text: 'Describe this image for embedding' },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${imageBase64}` } }
          ]
        }]
      })
    })

    if (!response.ok) return null

    const data = JSON.parse(response.data)
    const vector = data?.data?.[0]?.embedding
    if (vector && Array.isArray(vector)) {
      return { vector, model: config.model }
    }
    return null
  } catch {
    return null
  }
}

export async function embedChunks(
  texts: string[],
  config: ChatConfig,
  onProgress?: (current: number, total: number) => void
): Promise<Map<number, EmbedResult>> {
  const deviceType = await getDeviceType()
  const results = new Map<number, EmbedResult>()

  for (let i = 0; i < texts.length; i++) {
    const result = await embedText(texts[i], config)
    if (result) {
      results.set(i, result)
    }
    onProgress?.(i + 1, texts.length)

    const throttleMs = deviceType === 'webgpu' ? 50 : 200
    await new Promise(resolve => setTimeout(resolve, throttleMs))
  }

  return results
}

export interface FigureDescriptionResult {
  caption: string
  description: string
}

export async function describeFigure(
  imageBase64: string,
  config: ChatConfig
): Promise<FigureDescriptionResult | null> {
  const electronAPI = (window as any).electronAPI
  if (!electronAPI?.apiFetch || !config.baseUrl) return null

  const endpoint = config.baseUrl.replace(/\/$/, '') + '/v1/chat/completions'

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`
    }

    const response = await electronAPI.apiFetch({
      url: endpoint,
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Describe this image in detail. What is shown? What are the key elements, labels, axes, or data points? Provide a concise description.' },
              { type: 'image_url', image_url: { url: `data:image/png;base64,${imageBase64}` } }
            ]
          }
        ],
        temperature: 0.7,
        max_tokens: 512
      })
    })

    if (!response.ok) return null

    const data = JSON.parse(response.data)
    const content = data.choices?.[0]?.message?.content

    if (content) {
      const lines = content.split('\n').filter(l => l.trim())
      return {
        caption: lines[0] || 'Image',
        description: content
      }
    }
    return null
  } catch {
    return null
  }
}
