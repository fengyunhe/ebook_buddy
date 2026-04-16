import React, { useState, useRef, useEffect } from 'react'
import { useChatStore } from '../../stores/chatStore'
import { useVoiceStore } from '../../stores/voiceStore'
import { useConfigStore } from '../../stores/configStore'
import { sendChatMessage } from '../../services/chatService'
import { MarkdownRenderer } from '../MarkdownRenderer'
import { VoiceSettingsDialog } from '../VoiceSettingsDialog'
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  IconButton
} from '@mui/material'
import { Send as SendIcon, Settings as SettingsIcon } from '@mui/icons-material'

export function ChatPanel() {
  const { messages, isLoading, addMessage, setLoading } = useChatStore()
  const { transcriptionResult, error, reset: resetVoice } = useVoiceStore()
  const { baseUrl, model, timeout } = useConfigStore()
  const [input, setInput] = useState('')
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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')

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
      
      const result = await sendChatMessage(
        userMessage,
        { baseUrl, model, timeout, temperature: 0.7, maxTokens: 2048 },
        history
      )

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
          placeholder="输入消息..."
          disabled={isLoading}
          size="small"
        />
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          sx={{ minWidth: 80 }}
        >
          {isLoading ? <CircularProgress size={20} /> : <SendIcon />}
        </Button>
      </Box>
    </Box>
  )
}