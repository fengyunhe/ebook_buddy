# API Contracts

## External Interfaces

本功能暴露以下接口供UI层调用：

### 1. 语音识别服务

```typescript
interface VoiceService {
  transcribe(audioBlob: Blob): Promise<string>;
}
```

**Contract**: 
- Input: 音频Blob
- Output: 识别文字
- Errors: NetworkError, TranscriptionError, TimeoutError

### 2. 聊天服务

```typescript
interface ChatService {
  sendMessage(content: string, images?: MediaAttachment[]): Promise<string>;
}
```

**Contract**:
- Input: 文字内容，可选图片附件
- Output: AI回复内容
- Errors: NetworkError, ServiceError, TimeoutError

### 3. 媒体处理服务

```typescript
interface MediaService {
  captureScreen(): Promise<MediaAttachment>;
  selectImage(): Promise<MediaAttachment>;
  validateSize(attachment: MediaAttachment): boolean;
}
```

**Contract**:
- captureScreen: 无输入，返回截图附件
- selectImage: 无输入，返回选择的图片附件
- validateSize: 检查大小是否超限(5MB)

## Implementation Notes

- 所有服务需要配置好的endpoint地址
- 使用fetch发起请求
- 响应解析按OpenAI兼容格式