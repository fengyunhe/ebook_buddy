import type { ChatConfig, ChatResult, ChatMessage } from '../../shared/types/chat'
import { getChatEndpoint, DEFAULT_CHAT_CONFIG } from '../../shared/types/chat'
import '../../shared/types'

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

export async function sendChatMessage(
  content: string,
  config: ChatConfig = DEFAULT_CHAT_CONFIG,
  history: ChatMessage[] = []
): Promise<ChatResult> {
  try {
    const endpoint = getChatEndpoint(config.baseUrl)
    
    const messages: ChatMessage[] = [
      ...history,
      { role: 'user', content }
    ]

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

export async function sendChatMessageWithImage(
  content: string,
  imageBase64: string | string[],
  config: ChatConfig = DEFAULT_CHAT_CONFIG,
  history: ChatMessage[] = []
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