import { create } from 'zustand'
import type { VoiceRecording, VoiceRecordingState } from '../../shared/types/voice'
import type { TranscriptionConfig, TranscriptionResult } from '../../shared/types/transcription'
import type { VoiceInputError } from '../../shared/types/errors'
import { DEFAULT_TRANSCRIPTION_CONFIG } from '../../shared/types/transcription'
import { v4 as uuidv4 } from 'uuid'

interface VoiceState {
  recording: VoiceRecording | null
  config: TranscriptionConfig
  transcriptionResult: TranscriptionResult | null
  error: VoiceInputError | null
  isSupported: boolean
  
  startRecording: () => void
  stopRecording: (audioBlob: Blob) => void
  setRecordingState: (state: VoiceRecordingState) => void
  setTranscriptionResult: (result: TranscriptionResult) => void
  setError: (error: VoiceInputError | null) => void
  setConfig: (config: Partial<TranscriptionConfig>) => void
  reset: () => void
  checkSupport: () => boolean
}

export const useVoiceStore = create<VoiceState>((set, get) => ({
  recording: null,
  config: DEFAULT_TRANSCRIPTION_CONFIG,
  transcriptionResult: null,
  error: null,
  isSupported: false,
  
  checkSupport: () => {
    const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    set({ isSupported: supported })
    return supported
  },
  
  startRecording: () => {
    const now = Date.now()
    set({
      recording: {
        id: uuidv4(),
        audioBlob: null,
        duration: 0,
        timestamp: now,
        format: 'audio/webm',
        state: 'recording'
      },
      error: null,
      transcriptionResult: null
    })
  },
  
  stopRecording: (audioBlob: Blob) => {
    const state = get()
    if (!state.recording) return
    
    const duration = Date.now() - state.recording.timestamp
    
    set({
      recording: {
        ...state.recording,
        audioBlob,
        duration,
        state: 'transcribing'
      }
    })
  },
  
  setRecordingState: (recordingState: VoiceRecordingState) => {
    const state = get()
    if (!state.recording) return
    
    set({
      recording: {
        ...state.recording,
        state: recordingState
      }
    })
  },
  
  setTranscriptionResult: (result: TranscriptionResult) => {
    const state = get()
    set({
      transcriptionResult: result,
      recording: state.recording ? {
        ...state.recording,
        state: result.success ? 'idle' : 'error'
      } : null
    })
  },
  
  setError: (error: VoiceInputError | null) => {
    const state = get()
    set({
      error,
      recording: state.recording ? {
        ...state.recording,
        state: error ? 'error' : 'idle'
      } : null
    })
  },
  
  setConfig: (config: Partial<TranscriptionConfig>) => {
    set((state) => ({
      config: {
        ...state.config,
        ...config
      }
    }))
  },
  
  reset: () => {
    set({
      recording: null,
      transcriptionResult: null,
      error: null
    })
  }
}))
