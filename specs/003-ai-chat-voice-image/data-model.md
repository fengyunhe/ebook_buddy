# Data Model: AI助手语音聊天与图片支持

## Entities

### Message
对话消息实体

| Field | Type | Description |
|-------|------|-------------|
| id | string | 消息唯一ID |
| type | 'text' \| 'image' \| 'audio' | 消息类型 |
| content | string | 消息内容(文字)或base64(图片/音频) |
| timestamp | number | 创建时间戳 |
| role | 'user' \| 'assistant' | 发送者角色 |

### UserSession
用户会话状态

| Field | Type | Description |
|-------|------|-------------|
| id | string | 会话ID |
| messages | Message[] | 消息历史 |
| endpoint | string | 配置的endpoint地址 |
| createdAt | number | 创建时间 |

### MediaAttachment
媒体附件

| Field | Type | Description |
|-------|------|-------------|
| id | string | 附件ID |
| type | 'image' \| 'audio' | 媒体类型 |
| data | string | base64数据或URL |
| mimeType | string | MIME类型 |
| size | number | 文件大小(字节) |
| name | string | 文件名(可选) |

## Relationships

```
UserSession 1 -- * Message
UserSession 1 -- * MediaAttachment
```

## API请求/响应格式

### 语音识别请求
```typescript
interface TranscriptionRequest {
  file: File | Blob;
  model: string;
}
```

### 语音识别响应
```typescript
interface TranscriptionResponse {
  text: string;
}
```

### 聊天请求
```typescript
interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    image_url?: { url: string };
  }>;
  model: string;
}
```

### 聊天响应
```typescript
interface ChatResponse {
  choices: Array<{
    message: {
      role: 'assistant';
      content: string;
    };
  }>;
}