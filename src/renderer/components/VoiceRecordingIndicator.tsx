import { Box, Typography } from '@mui/material'
import { useVoiceStore } from '../stores/voiceStore'

export function VoiceRecordingIndicator() {
  const { recording, error } = useVoiceStore()
  
  const isRecording = recording?.state === 'recording'
  const isTranscribing = recording?.state === 'transcribing'
  const hasError = recording?.state === 'error' || error
  
  if (!isRecording && !isTranscribing && !hasError) {
    return null
  }
  
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        bgcolor: hasError ? 'error.main' : isRecording ? 'primary.main' : 'info.main',
        color: 'white',
        px: 3,
        py: 1.5,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        boxShadow: 3,
        zIndex: 1000
      }}
    >
      {isRecording && (
        <>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: 'white',
              animation: 'pulse 1s infinite'
            }}
          />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Recording... Release Alt to transcribe
          </Typography>
        </>
      )}
      {isTranscribing && (
        <>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: 'white',
              animation: 'pulse 1s infinite'
            }}
          />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Transcribing...
          </Typography>
        </>
      )}
      {hasError && (
        <>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {error?.message || 'Error occurred'}
          </Typography>
        </>
      )}
    </Box>
  )
}
