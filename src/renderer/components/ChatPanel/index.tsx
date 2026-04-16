import React, { useState, useRef, useEffect } from 'react'
import { useChatStore } from '../../stores/chatStore'
import { useVoiceStore } from '../../stores/voiceStore'
import { useConfigStore } from '../../stores/configStore'
import { sendChatMessage, sendChatMessageWithImage } from '../../services/chatService'
import { selectImageFile, processClipboardImage } from '../../services/mediaService'
import type { MediaAttachment } from '../../../shared/types/media'
import { MarkdownRenderer } from '../MarkdownRenderer'
import { VoiceSettingsDialog } from '../VoiceSettingsDialog'
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  IconButton,
  ImageList,
  ImageListItem
} from '@mui/material'
import { Send as SendIcon, Settings as SettingsIcon, Image as ImageIcon, Close as CloseIcon } from '@mui/icons-material'

export function ChatPanel() {
  const { messages, isLoading, addMessage, setLoading } = useChatStore()
  const { transcriptionResult, error, reset: resetVoice } = useVoiceStore()
  const { baseUrl, model, timeout } = useConfigStore()
  const [input, setInput] = useState('')
  const [attachments, setAttachments] = useState<MediaAttachment[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  
  useEffect(() => {
    if (transcriptionResult?.success && transcriptionResult.text) {
      setInput((prev) => prev + transcriptionResult.text)
      inputRef.current?.focus()
      resetVoice()
    }
  }, [transcriptionResult, resetVoice])
  
  useEffect(() => {
    if (error) {
      inputRef.current?.focus()
      resetVoice()
    }
  }, [error, resetVoice])

  const handlePaste = async (e: React.ClipboardEvent) => {
    const clipboardImage = await processClipboardImage()
    if (clipboardImage.success && clipboardImage.data) {
      e.preventDefault()
      setAttachments(prev => [...prev, clipboardImage.data!])
    }
  }

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setAttachments([])

    addMessage({
      role: 'user',
      content: userMessage,
      contentType: 'text',
      status: 'sent'
    })

    setLoading(true)
    
    try {
      const history = messages
        .filter(m => m.status === 'sent')
        .map(m => ({ role: m.role, content: m.content }))
      
      let result
      if (attachments.length > 0) {
        const imageBase64 = attachments[0].data
        result = await sendChatMessageWithImage(
          userMessage,
          imageBase64,
          { baseUrl, model, timeout, temperature: 0.7, maxTokens: 2048 },
          history
        )
      } else {
        result = await sendChatMessage(
          userMessage,
          { baseUrl, model, timeout, temperature: 0.7, maxTokens: 2048 },
          history
        )
      }

      if (result.success) {
        addMessage({
          role: 'assistant',
          content: result.content,
          contentType: 'markdown',
          status: 'sent'
        })
      } else {
        addMessage({
          role: 'assistant',
          content: `错误: ${result.error}`,
          contentType: 'text',
          status: 'error',
          errorMessage: result.error
        })
      }
    } catch (err) {
      addMessage({
        role: 'assistant',
        content: `请求失败: ${err instanceof Error ? err.message : '未知错误'}`,
        contentType: 'text',
        status: 'error',
        errorMessage: err instanceof Error ? err.message : '未知错误'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSelectImage = async () => {
    const result = await selectImageFile()
    if (result.success && result.data) {
      setAttachments(prev => [...prev, result.data!])
    }
  }

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id))
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          p: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          AI 助手
        </Typography>
        <IconButton size="small" onClick={() => setSettingsOpen(true)} title="语音设置">
          <SettingsIcon />
        </IconButton>
      </Box>
      
      <VoiceSettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5
        }}
      >
        {messages.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 1 }}>
            <Typography variant="h6" color="text.secondary">
              欢迎使用 Ebook Buddy
            </Typography>
            <Typography variant="body2" color="text.disabled">
              可以开始与AI助手对话了
            </Typography>
          </Box>
        ) : (
          messages.map((msg) => (
            <Paper
              key={msg.id}
              elevation={0}
              sx={{
                p: 1.25,
                maxWidth: '85%',
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                bgcolor: msg.role === 'user' ? 'primary.light' : 'grey.100',
                borderRadius: 2
              }}
            >
              <Box sx={{ fontSize: 14, lineHeight: 1.5, wordWrap: 'break-word' }}>
                {msg.contentType === 'markdown' ? (
                  <MarkdownRenderer content={msg.content} />
                ) : (
                  msg.content
                )}
              </Box>
            </Paper>
          ))
        )}
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: 1,
          p: 1.5,
          borderTop: 1,
          borderColor: 'divider'
        }}
      >
        <TextField
          inputRef={inputRef}
          fullWidth
          multiline
          maxRows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="输入消息... (Ctrl+V粘贴图片)"
          disabled={isLoading}
          size="small"
        />
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton 
            size="small" 
            onClick={handleSelectImage} 
            disabled={isLoading}
            title="选择图片"
          >
            <ImageIcon />
          </IconButton>
          <Button
            variant="contained"
            onClick={handleSend}
            disabled={(!input.trim() && attachments.length === 0) || isLoading}
            sx={{ minWidth: 80 }}
          >
            {isLoading ? <CircularProgress size={20} /> : <SendIcon />}
          </Button>
        </Box>
      </Box>
      {attachments.length > 0 && (
        <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
          <ImageList cols={4} gap={4} sx={{ m: 0 }}>
            {attachments.map((attachment) => (
              <ImageListItem key={attachment.id} sx={{ position: 'relative' }}>
                <img
                  src={`data:${attachment.mimeType};base64,${attachment.data}`}
                  alt={attachment.name || 'attachment'}
                  loading="lazy"
                  style={{ height: 60, objectFit: 'cover', borderRadius: 4 }}
                />
                <IconButton
                  size="small"
                  onClick={() => handleRemoveAttachment(attachment.id)}
                  sx={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    bgcolor: 'rgba(0,0,0,0.5)',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                    padding: 0.25
                  }}
                >
                  <CloseIcon fontSize="small" sx={{ color: 'white', fontSize: 14 }} />
                </IconButton>
              </ImageListItem>
            ))}
          </ImageList>
        </Box>
      )}
    </Box>
  )
}