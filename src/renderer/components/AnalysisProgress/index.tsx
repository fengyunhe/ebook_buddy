import React from 'react'
import { Box, Typography, LinearProgress, IconButton } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useKnowledgeStore } from '../../stores/knowledgeStore'

interface AnalysisProgressProps {
  visible?: boolean
  onCancel?: () => void
}

export function AnalysisProgress({ visible = true, onCancel }: AnalysisProgressProps) {
  const { analysisProgress, cancelAnalysis } = useKnowledgeStore()
  const isRunning = analysisProgress.status === 'analyzing'
  const show = visible && isRunning

  const progress = analysisProgress.totalBlocks > 0
    ? (analysisProgress.currentBlock / analysisProgress.totalBlocks) * 100
    : 0

  const formatTime = (ms: number | null): string => {
    if (!ms || ms <= 0) return 'calculating...'
    const seconds = Math.ceil(ms / 1000)
    if (seconds < 60) return `${seconds}s remaining`
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}m ${secs}s remaining`
  }

  if (!show) return null

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        width: 320,
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 3,
        p: 2,
        zIndex: 1000
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {analysisProgress.status === 'analyzing' ? 'Analyzing PDF...' : 'Analysis Complete'}
        </Typography>
        <Box>
          {onCancel && (
            <IconButton size="small" onClick={cancelAnalysis} sx={{ mr: 0.5 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>

      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{ mb: 1, borderRadius: 1, height: 6 }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          {Math.round(progress)}% complete
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {analysisProgress.currentBlock} / {analysisProgress.totalBlocks} pages
        </Typography>
      </Box>

      {analysisProgress.estimatedRemainingMs && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          ~{formatTime(analysisProgress.estimatedRemainingMs)}
        </Typography>
      )}

      {analysisProgress.errorMessage && (
        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
          {analysisProgress.errorMessage}
        </Typography>
      )}
    </Box>
  )
}
