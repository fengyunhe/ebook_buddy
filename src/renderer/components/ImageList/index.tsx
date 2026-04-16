import React from 'react'
import { Box, Typography } from '@mui/material'
import { useConversationImageStore, PageImage } from '../../stores/conversationImageStore'

export function ImageList() {
  const images = useConversationImageStore((state) => state.images)

  if (images.length === 0) {
    return null
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 1 }}>
      {images.map((img) => (
        <Box
          key={img.id}
          sx={{
            width: 60,
            height: 80,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <img
            src={img.imageData}
            alt={`Page ${img.pageNumber}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              bgcolor: 'rgba(0,0,0,0.6)',
              color: 'white',
              textAlign: 'center',
              fontSize: 10
            }}
          >
            {img.pageNumber}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}