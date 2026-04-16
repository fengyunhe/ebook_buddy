import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TranscriptionConfig, EndpointPreset } from '../../shared/types/transcription'
import { DEFAULT_TRANSCRIPTION_CONFIG, DEFAULT_ENDPOINT_PRESETS } from '../../shared/types/transcription'

interface ConfigState extends TranscriptionConfig {
  setPreset: (preset: EndpointPreset) => void
  setBaseUrl: (url: string) => void
  setTimeout: (timeout: number) => void
  setModel: (model: string) => void
  setApiKey: (apiKey: string) => void
  clearApiKey: () => void
  chatModel: string
  setChatModel: (model: string) => void
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      ...DEFAULT_TRANSCRIPTION_CONFIG,
      
      setPreset: (preset: EndpointPreset) => {
        const baseUrl = preset === 'custom' 
          ? '' 
          : DEFAULT_ENDPOINT_PRESETS[preset as keyof typeof DEFAULT_ENDPOINT_PRESETS]
        set({ preset, baseUrl })
      },
      
      setBaseUrl: (url: string) => {
        set({ preset: 'custom', baseUrl: url })
      },
      
      setTimeout: (timeout: number) => {
        set({ timeout })
      },

      setModel: (model: string) => {
        set({ model })
      },

      setApiKey: (apiKey: string) => {
        set({ apiKey })
      },

      clearApiKey: () => {
        set({ apiKey: undefined })
      },

      chatModel: 'llama3',
      setChatModel: (chatModel: string) => {
        set({ chatModel })
      }
    }),
    {
      name: 'ebook-buddy-voice-config'
    }
  )
)
