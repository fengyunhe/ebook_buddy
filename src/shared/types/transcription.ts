export type EndpointPreset = 'omlx' | 'ollama' | 'lmstudio' | 'custom'

export interface TranscriptionConfig {
  preset: EndpointPreset
  baseUrl: string
  timeout: number
  model: string
  apiKey?: string
}

export interface TranscriptionResult {
  text: string
  success: boolean
  error?: string
}

export const DEFAULT_ENDPOINT_PRESETS: Record<Exclude<EndpointPreset, 'custom'>, string> = {
  omlx: 'http://localhost:8000/v1',
  ollama: 'http://localhost:11434/v1',
  lmstudio: 'http://localhost:1234/v1'
}

export const DEFAULT_TRANSCRIPTION_CONFIG: TranscriptionConfig = {
  preset: 'ollama',
  baseUrl: DEFAULT_ENDPOINT_PRESETS.ollama,
  timeout: 15000,
  model: 'whisper-1'
}

export function getTranscriptionEndpoint(preset: EndpointPreset, baseUrl: string): string {
  return `${baseUrl}/audio/transcriptions`
}
