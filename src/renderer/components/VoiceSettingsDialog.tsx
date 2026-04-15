import { useState } from 'react'
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

interface VoiceSettingsDialogProps {
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

export function VoiceSettingsDialog({ open, onClose }: VoiceSettingsDialogProps) {
  const [tabValue, setTabValue] = useState(0)
  const { preset, baseUrl, timeout, model, setPreset, setBaseUrl, setTimeout, setModel } = useConfigStore()
  const [localBaseUrl, setLocalBaseUrl] = useState(baseUrl)
  const [localChatBaseUrl, setLocalChatBaseUrl] = useState(baseUrl)
  const [chatModel, setChatModel] = useState('llama3')
  
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
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Model Provider</DialogTitle>
      <DialogContent>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="语音转文字" />
          <Tab label="Chat 对话" />
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
              placeholder="http://localhost:11434"
              helperText="OpenAI 兼容接口的 base URL"
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
                默认端口: Ollama (11434)、LM Studio (1234)、oMLX (8080)
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
              placeholder="http://localhost:11434"
              helperText="OpenAI 兼容接口的 base URL"
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={onClose} variant="contained">
          保存
        </Button>
      </DialogActions>
    </Dialog>
  )
}
