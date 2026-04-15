import React, { useState } from 'react'
import { useChatStore } from '../../stores/chatStore'
import { MarkdownRenderer } from '../MarkdownRenderer'
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress
} from '@mui/material'
import { Send as SendIcon } from '@mui/icons-material'

export function ChatPanel() {
  const { messages, isLoading, addMessage } = useChatStore()
  const [input, setInput] = useState('')

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')

    addMessage({
      role: 'user',
      content: userMessage,
      contentType: 'text'
    })

    addMessage({
      role: 'assistant',
      content: '这是一个模拟的AI回复。在实际实现中，这里将连接到AI服务API。\n\n您可以在这里测试Markdown渲染：\n\n- **粗体文本**\n- *斜体文本*\n- `代码`\n\n数学公式: $E = mc^2$\n\n$$\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$\n\n```javascript\nconsole.log("Hello World");\n```',
      contentType: 'markdown'
    })
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
          borderColor: 'divider'
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          AI 助手
        </Typography>
      </Box>
      
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