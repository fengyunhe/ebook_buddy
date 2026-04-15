export type VoiceRecordingState = 'idle' | 'recording' | 'transcribing' | 'error'

export interface VoiceRecording {
  id: string
  audioBlob: Blob | null
  duration: number
  timestamp: number
  format: string
  state: VoiceRecordingState
  errorMessage?: string
}

export interface VoiceRecordingOptions {
  minimumDuration?: number
  maximumDuration?: number
  audioFormat?: string
}

export const DEFAULT_VOICE_RECORDING_OPTIONS: VoiceRecordingOptions = {
  minimumDuration: 500,
  audioFormat: 'audio/webm'
}
