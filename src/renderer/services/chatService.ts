import type { ChatConfig, ChatResult, ChatMessage } from '../../shared/types/chat'
import { getChatEndpoint, DEFAULT_CHAT_CONFIG } from '../../shared/types/chat'

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

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout)

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      return {
        content: '',
        success: false,
        error: `API error: ${response.status} - ${errorText}`
      }
    }

    const data = await response.json()
    
    return {
      content: data.choices?.[0]?.message?.content || '',
      success: true,
      usage: data.usage
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          content: '',
          success: false,
          error: 'Request timed out'
        }
      }
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
  imageBase64: string,
  config: ChatConfig = DEFAULT_CHAT_CONFIG,
  history: ChatMessage[] = []
): Promise<ChatResult> {
  try {
    const endpoint = getChatEndpoint(config.baseUrl)
    
    const messages: ChatMessage[] = [
      ...history,
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: content
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`
            }
          }
        ] as unknown as string,
        imageUrl: `data:image/jpeg;base64,${imageBase64}`
      }
    ]

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout)

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.imageUrl 
            ? [{ type: 'text', text: m.content }, { type: 'image_url', image_url: { url: m.imageUrl } }]
            : m.content
        })),
        temperature: config.temperature,
        max_tokens: config.maxTokens
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      return {
        content: '',
        success: false,
        error: `API error: ${response.status} - ${errorText}`
      }
    }

    const data = await response.json()
    
    return {
      content: data.choices?.[0]?.message?.content || '',
      success: true,
      usage: data.usage
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          content: '',
          success: false,
          error: 'Request timed out'
        }
      }
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