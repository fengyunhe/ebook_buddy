import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  Tabs,
  Tab
} from '@mui/material'
import { useConfigStore } from '../stores/configStore'
import { getEndpointUrl } from '../services/transcriptionService'
import type { EndpointPreset } from '../../shared/types/transcription'

interface SettingsDialogProps {
  open: boolean
  onClose: () => void
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  )
}

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const [tabValue, setTabValue] = useState(0)
  const { 
    preset, baseUrl, timeout, model, apiKey, chatModel, 
    setPreset, setBaseUrl, setTimeout, setModel, setApiKey, clearApiKey, setChatModel,
    embeddingBaseUrl, embeddingModel, embeddingDimension, embeddingApiKey,
    setEmbeddingBaseUrl, setEmbeddingModel, setEmbeddingDimension, setEmbeddingApiKey
  } = useConfigStore()
  
  const [localBaseUrl, setLocalBaseUrl] = useState(baseUrl)
  const [localChatBaseUrl, setLocalChatBaseUrl] = useState(baseUrl)
  const [localEmbeddingBaseUrl, setLocalEmbeddingBaseUrl] = useState(embeddingBaseUrl)
  const [localEmbeddingDimension, setLocalEmbeddingDimension] = useState(embeddingDimension || 1024)
  const [localApiKey, setLocalApiKey] = useState(apiKey || '')
  const [localEmbeddingApiKey, setLocalEmbeddingApiKey] = useState(embeddingApiKey || '')
  
  useEffect(() => {
    if (open) {
      setLocalBaseUrl(baseUrl)
      setLocalChatBaseUrl(baseUrl)
      setLocalEmbeddingBaseUrl(embeddingBaseUrl)
      setLocalEmbeddingDimension(embeddingDimension || 1024)
      setLocalApiKey(apiKey || '')
      setLocalEmbeddingApiKey(embeddingApiKey || '')
    }
  }, [open, baseUrl, apiKey, embeddingBaseUrl, embeddingApiKey, embeddingDimension])
  
  const presets: { value: EndpointPreset; label: string; defaultUrl: string }[] = [
    { value: 'ollama', label: 'Ollama', defaultUrl: getEndpointUrl('ollama') },
    { value: 'lmstudio', label: 'LM Studio', defaultUrl: getEndpointUrl('lmstudio') },
    { value: 'omlx', label: 'oMLX', defaultUrl: getEndpointUrl('omlx') },
    { value: 'custom', label: 'Custom', defaultUrl: '' }
  ]
  
  const handlePresetChange = (newPreset: EndpointPreset) => {
    setPreset(newPreset)
    if (newPreset !== 'custom') {
      const url = getEndpointUrl(newPreset)
      setLocalBaseUrl(url)
      setLocalChatBaseUrl(url)
    }
  }
  
  const handleBaseUrlChange = (url: string) => {
    setLocalBaseUrl(url)
    setBaseUrl(url)
  }

  const handleChatBaseUrlChange = (url: string) => {
    setLocalChatBaseUrl(url)
  }

  const handleSave = () => {
    if (localApiKey) {
      setApiKey(localApiKey)
    }
    if (localChatBaseUrl) {
      setBaseUrl(localChatBaseUrl)
    }
    if (chatModel) {
      setChatModel(chatModel)
    }
    if (localEmbeddingBaseUrl) {
      setEmbeddingBaseUrl(localEmbeddingBaseUrl)
    }
    if (localEmbeddingApiKey) {
      setEmbeddingApiKey(localEmbeddingApiKey)
    }
    setEmbeddingDimension(localEmbeddingDimension)
    if (embeddingModel) {
      setEmbeddingModel(embeddingModel)
    }
    onClose()
  }
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>模型设置</DialogTitle>
      <DialogContent>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="语音转文字" />
          <Tab label="Chat 对话" />
          <Tab label="Embedding" />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>服务预设</InputLabel>
              <Select
                value={preset}
                label="服务预设"
                onChange={(e) => handlePresetChange(e.target.value as EndpointPreset)}
              >
                {presets.map((p) => (
                  <MenuItem key={p.value} value={p.value}>
                    {p.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              label="Base URL"
              value={localBaseUrl}
              onChange={(e) => handleBaseUrlChange(e.target.value)}
              fullWidth
              placeholder="http://localhost:11434/v1"
              helperText="OpenAI 兼容接口的 base URL，需包含 /v1"
            />

            <TextField
              label="API 密钥"
              type="password"
              value={localApiKey}
              onChange={(e) => setLocalApiKey(e.target.value)}
              fullWidth
              placeholder="输入 API 密钥（可选）"
              helperText="用于需要认证的服务，留空则不添加认证"
            />

            <TextField
              label="模型名称"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              fullWidth
              placeholder="whisper-1"
              helperText="用于语音转文字的模型"
            />
            
            <TextField
              label="请求超时 (毫秒)"
              type="number"
              value={timeout}
              onChange={(e) => setTimeout(Number(e.target.value))}
              fullWidth
              slotProps={{ htmlInput: { min: 1000, max: 60000 } }}
              helperText="范围: 1000-60000 毫秒"
            />
            
            <Alert severity="info">
              <Typography variant="body2">
                <strong>提示:</strong> 使用语音输入前，请确保本地 AI 服务正在运行。
                <br />
                默认端口: Ollama (11434)、LM Studio (1234)、oMLX (8000)
              </Typography>
            </Alert>
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>服务预设</InputLabel>
              <Select
                value={preset}
                label="服务预设"
                onChange={(e) => handlePresetChange(e.target.value as EndpointPreset)}
              >
                {presets.map((p) => (
                  <MenuItem key={p.value} value={p.value}>
                    {p.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Base URL"
              value={localChatBaseUrl}
              onChange={(e) => handleChatBaseUrlChange(e.target.value)}
              fullWidth
              placeholder="http://localhost:11434/v1"
              helperText="OpenAI 兼容接口的 base URL，需包含 /v1"
            />

            <TextField
              label="API 密钥"
              type="password"
              value={localApiKey}
              onChange={(e) => setLocalApiKey(e.target.value)}
              fullWidth
              placeholder="输入 API 密钥（可选）"
              helperText="用于需要认证的服务，留空则不��加认证"
            />

            <TextField
              label="模型名称"
              value={chatModel}
              onChange={(e) => setChatModel(e.target.value)}
              fullWidth
              placeholder="llama3"
              helperText="用于 Chat 对话的模型"
            />
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <Alert severity="info">
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Embedding:</strong> 用于 PDF 内容分析和语义搜索。
                <br />
                默认使用ollama的 nomic-embed-text 模型。
              </Typography>
            </Alert>

            <TextField
              label="Base URL"
              value={localEmbeddingBaseUrl}
              onChange={(e) => setLocalEmbeddingBaseUrl(e.target.value)}
              fullWidth
              placeholder="http://localhost:11434/v1"
              helperText="Embedding 服务的 base URL，留空则使用默认"
            />

            <TextField
              label="API 密钥"
              type="password"
              value={localEmbeddingApiKey}
              onChange={(e) => setLocalEmbeddingApiKey(e.target.value)}
              fullWidth
              placeholder="输入 API 密钥（可选）"
              helperText="用于需要认证的服务，留空则不添加认证"
            />

            <TextField
              label="模型名称"
              value={embeddingModel}
              onChange={(e) => setEmbeddingModel(e.target.value)}
              fullWidth
              placeholder="nomic-embed-text"
              helperText="Embedding 模型名称"
            />
            <TextField
              label="向量维度"
              type="number"
              value={localEmbeddingDimension}
              onChange={(e) => setLocalEmbeddingDimension(Number(e.target.value))}
              fullWidth
              helperText="Embedding 向量维度 (如 nomic-embed-text 为 1024)"
            />
          </Box>
        </TabPanel>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={handleSave} variant="contained">
          保存
        </Button>
      </DialogActions>
    </Dialog>
  )
}