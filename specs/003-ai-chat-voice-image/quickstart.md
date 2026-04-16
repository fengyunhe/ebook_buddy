# Quickstart: AI助手语音聊天与图片支持

## 概述

本功能实现与AI endpoint的集成，支持：
- 语音转文字识别
- 文字对话
- 图片识别(截图/本地文件)

## 前置条件

- 已配置AI endpoint地址
- TypeScript 5.3 + Electron 28项目环境

## 使用方式

### 语音识别

```typescript
import { transcribeAudio } from '@/services/voice';

const audioBlob = /* 录音得到的Blob */;
const text = await transcribeAudio(audioBlob);
```

### 文字对话

```typescript
import { sendChatMessage } from '@/services/chat';

const reply = await sendChatMessage('你好，请帮我分析这张图片');
```

### 图片识别

```typescript
import { sendChatMessage } from '@/services/chat';
import { captureScreen, selectImageFile } from '@/services/media';

// 截图
const screenshot = await captureScreen();
const reply = await sendChatMessage('请分析这张图', [screenshot]);

// 本地图片
const imageFile = await selectImageFile();
const reply = await sendChatMessage('请分析', [imageFile]);
```

## 配置

endpoint地址从现有配置中读取，无需额外配置。

## 测试

```bash
pnpm run test
```