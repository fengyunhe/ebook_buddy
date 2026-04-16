export type VoiceInputErrorType = 
  | 'MICROPHONE_NOT_AVAILABLE'
  | 'PERMISSION_DENIED'
  | 'RECORDING_TOO_SHORT'
  | 'TRANSCRIPTION_TIMEOUT'
  | 'TRANSCRIPTION_FAILED'
  | 'INVALID_ENDPOINT'
  | 'NETWORK_ERROR'
  | 'NO_AUDIO_DATA'

export interface VoiceInputError {
  type: VoiceInputErrorType
  message: string
  timestamp: number
}

export function createVoiceInputError(
  type: VoiceInputErrorType,
  message: string
): VoiceInputError {
  return {
    type,
    message,
    timestamp: Date.now()
  }
}

export function getErrorMessage(error: VoiceInputError): string {
  switch (error.type) {
    case 'MICROPHONE_NOT_AVAILABLE':
      return 'No microphone found. Please connect a microphone and try again.'
    case 'PERMISSION_DENIED':
      return 'Microphone permission denied. Please enable microphone access in your system settings.'
    case 'RECORDING_TOO_SHORT':
      return 'Recording too short. Please hold Alt key longer.'
    case 'TRANSCRIPTION_TIMEOUT':
      return 'Transcription timed out. Please try again.'
    case 'TRANSCRIPTION_FAILED':
      return 'Transcription failed. Please check your endpoint configuration.'
    case 'INVALID_ENDPOINT':
      return 'Invalid endpoint URL. Please check your settings.'
    case 'NETWORK_ERROR':
      return 'Network error. Please check your connection and endpoint.'
    case 'NO_AUDIO_DATA':
      return 'No audio data recorded. Please try again.'
    default:
      return error.message
  }
}
