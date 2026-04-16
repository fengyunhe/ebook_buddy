export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  imageUrl?: string
}

export interface ChatRequest {
  messages: ChatMessage[]
  model: string
  temperature?: number
  maxTokens?: number
}

export interface ChatResponse {
  choices: Array<{
    message: {
      role: 'assistant'
      content: string
    }
    finishReason: string
  }>
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface ChatResult {
  content: string
  success: boolean
  error?: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface ChatConfig {
  baseUrl: string
  model: string
  timeout: number
  temperature: number
  maxTokens: number
  apiKey?: string
}

export const DEFAULT_CHAT_CONFIG: ChatConfig = {
  baseUrl: 'http://localhost:11434/v1',
  model: 'gpt-4-vision-preview',
  timeout: 30000,
  temperature: 0.7,
  maxTokens: 2048
}

export function getChatEndpoint(baseUrl: string): string {
  return `${baseUrl}/chat/completions`
}