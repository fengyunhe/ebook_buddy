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
  const streamRef = useRef<MediaStream | null>(null)
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
      console.log('[VoiceRecorder] 开始获取麦克风权限')
      
      // 首先尝试不带任何约束
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        console.log('[VoiceRecorder] 使用默认约束获取媒体流成功')
      } catch {
        console.log('[VoiceRecorder] 默认约束失败，尝试其他约束')
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          }
        })
        console.log('[VoiceRecorder] 使用简化约束获取媒体流成功')
      }
      
      console.log('[VoiceRecorder] 音频轨道设置:', stream.getAudioTracks()[0]?.getSettings())
      
      streamRef.current = stream
      
      // 检测所有支持的MIME类型
      const allTypes = [
        'audio/wav',
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/pcm',
        'audio/mp4',
        'audio/mpeg',
        'audio/ogg'
      ]
      
      console.log('[VoiceRecorder] 检测支持的音频格式:')
      const supportedTypes: string[] = []
      for (const type of allTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          console.log('[VoiceRecorder] 支持:', type)
          supportedTypes.push(type)
        } else {
          console.log('[VoiceRecorder] 不支持:', type)
        }
      }
      
      let mimeType = supportedTypes[0] || ''
      
      if (!mimeType) {
        console.error('[VoiceRecorder] 没有支持的音频格式')
        setError(createVoiceInputError(
          'MICROPHONE_NOT_AVAILABLE',
          'No supported audio format found'
        ))
        return
      }
      
      console.log('[VoiceRecorder] 选择使用:', mimeType)
      
      // 尝试设置音频比特率（如果支持）
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType,
        audioBitsPerSecond: 128000 // 128kbps
      })
      console.log('[VoiceRecorder] 创建MediaRecorder，使用MIME类型:', mimeType)
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      isRecordingRef.current = true
      
      mediaRecorder.ondataavailable = (event) => {
        console.log('[VoiceRecorder] 数据可用，大小:', event.data.size, '类型:', event.data.type)
        // 收集所有数据块
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
          const totalSize = audioChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0)
          console.log('[VoiceRecorder] 添加音频数据，当前累积:', totalSize)
        }
      }
      
      mediaRecorder.onstop = async () => {
        console.log('[VoiceRecorder] 录音停止')
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          console.log('[VoiceRecorder] 媒体流已停止')
          streamRef.current = null
        }
        
        console.log('[VoiceRecorder] ref中的音频块数量:', audioChunksRef.current.length)
        if (audioChunksRef.current.length > 0) {
          const totalSize = audioChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0)
          console.log('[VoiceRecorder] 所有音频块总大小:', totalSize)
          console.log('[VoiceRecorder] 第一个音频块类型:', audioChunksRef.current[0].type)
          console.log('[VoiceRecorder] 第一个音频块大小:', audioChunksRef.current[0].size)
        }
        
        const duration = Date.now() - startTimestampRef.current
        console.log('[VoiceRecorder] 录音时长:', duration, 'ms')
        
        if (duration < minimumDuration) {
          reset()
          setError(createVoiceInputError(
            'RECORDING_TOO_SHORT',
            'Recording too short. Please hold Alt key longer.'
          ))
          return
        }
        
        // 确保有音频数据
        if (audioChunksRef.current.length === 0) {
          console.error('[VoiceRecorder] 没有音频数据')
          setError(createVoiceInputError(
            'NO_AUDIO_DATA',
            'No audio data recorded'
          ))
          return
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        console.log('[VoiceRecorder] 音频blob大小:', audioBlob.size)
        
        // 先停止录音（更新状态）
        stopRecording(audioBlob)
        
        // 然后发送转写请求
        console.log('[VoiceRecorder] 准备发送转写请求')
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
      console.log('[VoiceRecorder] 开始录音，时间片设置为100ms')
      startTimestampRef.current = Date.now()
      startRecording()
    } catch (err) {
      console.error('[VoiceRecorder] Error starting recording:', err)
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
    
    console.log('[VoiceRecorder] 停止录音')
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