# Research: AI助手语音聊天与图片支持

## Decisions Made

### Decision 1: 语音识别实现方式
**Chosen**: 发送给endpoint服务端处理  
**Rationale**: 用户已配置endpoint地址，服务端完成语音识别，客户端仅需发送音频数据  
**Alternatives considered**: 本地端处理（需要额外SDK）

### Decision 2: 截图实现方式
**Chosen**: 使用应用或浏览器自带能力实现  
**Rationale**: Electron/浏览器提供截图API，无需额外集成  
**Alternatives considered**: 第三方截图库

### Decision 3: OpenAI兼容接口规范
**Chosen**: 所有请求和响应遵循OpenAI兼容接口规范  
**Rationale**: 用户明确要求，需支持audio转写、chat completion、vision等接口  
**Alternatives considered**: 自有API格式

### Decision 4: 图片大小限制
**Chosen**: 5MB限制  
**Rationale**: 用户选择5MB，适合大多数图片且不影响传输  
**Alternatives considered**: 10MB/20MB/无限制

## API接口研究

### 语音识别 (Audio Transcription)
- 使用OpenAI Audio API格式
- 请求: multipart/form-data发送音频文件
- 响应: text字段返回识别文字

### 文字对话 (Chat Completion)
- 使用OpenAI Chat API格式
- 请求: messages数组，content字段
- 响应: choices[].message.content

### 图片识别 (Vision)
- 使用OpenAI Vision API格式
- 请求: messages中包含image_url或base64
- 响应: choices[].message.content

## 技术注意事项

- 音频格式需转换为服务端支持的格式(如mp3, wav, webm)
- 图片格式支持PNG, JPG等常见格式
- 响应超时设置为10秒
- 错误处理需区分网络错误和服务端错误