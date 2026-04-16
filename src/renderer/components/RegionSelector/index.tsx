import React, { useState, useEffect, useRef } from 'react'
import { Box, Button, Typography } from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'

interface RegionSelectorProps {
  onCapture: (region: { x: number; y: number; width: number; height: number }) => void
  onClose: () => void
}

interface SelectionBox {
  startX: number
  startY: number
  endX: number
  endY: number
}

export function RegionSelector({ onCapture, onClose }: RegionSelectorProps) {
  const [selection, setSelection] = useState<SelectionBox | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [imageData, setImageData] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const captureFullScreen = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            mandatory: {
              chromeMediaSource: 'screen',
              minWidth: 1920,
              maxWidth: 3840,
              minHeight: 1080,
              maxHeight: 2160
            }
          } as any
        })
        
        const video = document.createElement('video')
        video.srcObject = stream
        await video.play()
        
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(video, 0, 0)
        
        stream.getTracks().forEach(track => track.stop())
        
        setImageData(canvas.toDataURL('image/png'))
      } catch (error) {
        console.error('Failed to capture screen:', error)
      }
    }
    
    captureFullScreen()
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    
    setIsSelecting(true)
    setSelection({
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      endX: e.clientX - rect.left,
      endY: e.clientY - rect.top
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !selection || !containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    setSelection({
      ...selection,
      endX: e.clientX - rect.left,
      endY: e.clientY - rect.top
    })
  }

  const handleMouseUp = () => {
    setIsSelecting(false)
  }

  const handleConfirm = () => {
    if (!selection || !imageData || !containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const scaleX = (containerRef.current.querySelector('img') as HTMLImageElement)?.naturalWidth || selection.endX
    const scaleY = (containerRef.current.querySelector('img') as HTMLImageElement)?.naturalHeight || selection.endY
    
    const x = Math.min(selection.startX, selection.endX)
    const y = Math.min(selection.startY, selection.endY)
    const width = Math.abs(selection.endX - selection.startX)
    const height = Math.abs(selection.endY - selection.startY)
    
    const scaledX = Math.round((x / rect.width) * scaleX)
    const scaledY = Math.round((y / rect.height) * scaleY)
    const scaledWidth = Math.round((width / rect.width) * scaleX)
    const scaledHeight = Math.round((height / rect.height) * scaleY)
    
    onCapture({ x: scaledX, y: scaledY, width: scaledWidth, height: scaledHeight })
  }

  if (!imageData) {
    return (
      <Box sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <Typography color="white">正在获取屏幕...</Typography>
      </Box>
    )
  }

  const selectionStyle = selection ? {
    left: Math.min(selection.startX, selection.endX),
    top: Math.min(selection.startY, selection.endY),
    width: Math.abs(selection.endX - selection.startX),
    height: Math.abs(selection.endY - selection.startY)
  } : null

  return (
    <Box sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      bgcolor: 'rgba(0,0,0,0.3)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Box sx={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 10000
      }}>
        <Button 
          variant="contained" 
          onClick={onClose}
          startIcon={<CloseIcon />}
          sx={{ bgcolor: 'grey.800', '&:hover': { bgcolor: 'grey.700' } }}
        >
          取消
        </Button>
      </Box>
      
      <Box
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        sx={{
          flex: 1,
          cursor: 'crosshair',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <img 
          src={imageData} 
          alt="screen capture" 
          style={{ 
            maxWidth: '100%', 
            maxHeight: '100%',
            pointerEvents: 'none',
            userSelect: 'none'
          }} 
        />
        
        {selectionStyle && selectionStyle.width > 0 && selectionStyle.height > 0 && (
          <Box sx={{
            position: 'absolute',
            ...selectionStyle,
            border: '2px dashed #00ff00',
            bgcolor: 'rgba(0,255,0,0.1)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            p: 1
          }}>
            <Button 
              size="small" 
              variant="contained" 
              onClick={(e) => {
                e.stopPropagation()
                handleConfirm()
              }}
              sx={{ bgcolor: '#00ff00', color: 'black', '&:hover': { bgcolor: '#00cc00' } }}
            >
              确认截取
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  )
}