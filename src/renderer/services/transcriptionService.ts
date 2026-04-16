import type { TranscriptionConfig, TranscriptionResult, EndpointPreset } from '../../shared/types/transcription'
import { getTranscriptionEndpoint, DEFAULT_ENDPOINT_PRESETS } from '../../shared/types/transcription'
import { type VoiceInputError } from '../../shared/types/errors'

export async function transcribeAudio(
  audioBlob: Blob,
  config: TranscriptionConfig
): Promise<TranscriptionResult> {
  try {
    const endpoint = getTranscriptionEndpoint(config.preset, config.baseUrl)
    
    console.log('[Transcription] Audio blob size:', audioBlob.size)
    console.log('[Transcription] Audio blob type:', audioBlob.type)
    console.log('[Transcription] Model:', config.model)
    console.log('[Transcription] Endpoint:', endpoint)
    
    const formData = new FormData()
    formData.append('file', audioBlob, 'recording.webm')
    formData.append('model', config.model)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), config.timeout)

    const headers: HeadersInit = {}
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
      headers
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      return {
        text: '',
        success: false,
        error: `API error: ${response.status} - ${errorText}`
      }
    }

    const data = await response.json()
    
    return {
      text: data.text || '',
      success: true
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          text: '',
          success: false,
          error: 'Transcription timed out'
        }
      }
      return {
        text: '',
        success: false,
        error: error.message
      }
    }
    return {
      text: '',
      success: false,
      error: 'Unknown error occurred'
    }
  }
}

export function getEndpointUrl(preset: EndpointPreset): string {
  if (preset === 'custom') {
    return ''
  }
  return DEFAULT_ENDPOINT_PRESETS[preset]
}

export function validateEndpointUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}
