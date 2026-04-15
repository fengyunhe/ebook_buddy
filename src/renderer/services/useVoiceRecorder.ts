import { useEffect, useRef, useCallback } from 'react'
import { useVoiceStore } from '../stores/voiceStore'
import { useConfigStore } from '../stores/configStore'
import { transcribeAudio } from './transcriptionService'
import { createVoiceInputError } from '../../shared/types/errors'
import { DEFAULT_VOICE_RECORDING_OPTIONS } from '../../shared/types/voice'

interface UseVoiceRecorderOptions {
  minimumDuration?: number
  onTranscriptionComplete?: (text: string) => void
}

export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}) {
  const minimumDuration = (options.minimumDuration ?? DEFAULT_VOICE_RECORDING_OPTIONS.minimumDuration) as number
  const onTranscriptionComplete = options.onTranscriptionComplete
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const isRecordingRef = useRef(false)
  const startTimestampRef = useRef<number>(0)
  
  const {
    startRecording,
    stopRecording,
    setRecordingState,
    setTranscriptionResult,
    setError,
    reset,
    checkSupport,
    recording,
    error
  } = useVoiceStore()
  
  const config = useConfigStore()
  
  const startCapture = useCallback(async () => {
    if (isRecordingRef.current) return
    
    const supported = checkSupport()
    if (!supported) {
      setError(createVoiceInputError(
        'MICROPHONE_NOT_AVAILABLE',
        'MediaRecorder is not supported in this browser'
      ))
      return
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      })
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      isRecordingRef.current = true
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const duration = Date.now() - startTimestampRef.current
        
        if (duration < minimumDuration) {
          reset()
          setError(createVoiceInputError(
            'RECORDING_TOO_SHORT',
            'Recording too short. Please hold Alt key longer.'
          ))
          return
        }
        
        stopRecording(audioBlob)
        
        const result = await transcribeAudio(audioBlob, config)
        setTranscriptionResult(result)
        
        if (result.success && result.text) {
          onTranscriptionComplete?.(result.text)
        } else if (!result.success) {
          setError(createVoiceInputError(
            'TRANSCRIPTION_FAILED',
            result.error || 'Transcription failed'
          ))
        }
      }
      
      mediaRecorder.start(100)
      startTimestampRef.current = Date.now()
      startRecording()
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError(createVoiceInputError(
            'PERMISSION_DENIED',
            'Microphone permission denied'
          ))
        } else {
          setError(createVoiceInputError(
            'MICROPHONE_NOT_AVAILABLE',
            err.message
          ))
        }
      }
    }
  }, [checkSupport, config, minimumDuration, onTranscriptionComplete, reset, setError, startRecording, stopRecording, setTranscriptionResult])
  
  const stopCapture = useCallback(() => {
    if (!isRecordingRef.current || !mediaRecorderRef.current) return
    
    mediaRecorderRef.current.stop()
    isRecordingRef.current = false
    setRecordingState('transcribing')
  }, [setRecordingState])
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Alt' && !event.repeat) {
        event.preventDefault()
        startCapture()
      }
    }
    
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Alt') {
        event.preventDefault()
        stopCapture()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [startCapture, stopCapture])
  
  return {
    recording,
    error,
    isRecording: recording?.state === 'recording',
    isTranscribing: recording?.state === 'transcribing',
    startCapture,
    stopCapture,
    reset
  }
}
