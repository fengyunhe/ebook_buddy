# Data Model: 完善AI助手设置界面

## TranscriptionsConfig

```typescript
interface TranscriptionConfig {
  preset: EndpointPreset
  baseUrl: string
  timeout: number
  model: string
  apiKey?: string
}

type EndpointPreset = 'omlx' | 'ollama' | 'lmstudio' | 'custom'
```

## Relationships

- **ConfigStore** → 管理TranscriptionConfig状态
- **VoiceSettingsDialog** → 读取/写入ConfigStore
- **transcriptionService** → 读取TranscriptionConfig用于API调用

## Validation Rules

| Field | Rule |
|-------|------|
| baseUrl | 必须为有效URL格式 |
| baseUrl | 用户需确保URL包含完整路径（如/v1），系统不做修改 |
| timeout | 1000-60000ms |
| apiKey | 密码输入框，不存储明文 |

## State Transitions

1. User 输入 baseUrl（含/v1）→ 直接存储，不做修改
2. User 输入 apiKey → 加密存储
3. User 清空 apiKey → 清除存储的密钥