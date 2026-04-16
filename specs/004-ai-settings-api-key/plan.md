# Implementation Plan: 完善AI助手设置界面

**Branch**: `004-ai-settings-api-key` | **Date**: 2026-04-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-ai-settings-api-key/spec.md`

## Summary

完善AI助手设置界面，包含：1) API密钥安全配置（密码输入框），2) oMLX默认端口8000修正，3) Base URL自动管理/v1后缀。所有配置存储在本地，使用安全存储机制。

## Technical Context

**Language/Version**: TypeScript 5.3
**Primary Dependencies**: Electron 28, React 18, Zustand, @mui/material, electron-store
**Storage**: Electron safeStorage (加密) + 浏览器localStorage (fallback)
**Testing**: Vitest + Testing Library
**Target Platform**: Desktop (Electron 28)
**Project Type**: desktop-app
**Performance Goals**: N/A
**Constraints**: 离线优先，本地存储
**Scale/Scope**: 单用户本地配置

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| TDD Required | ✅ | 测试驱动实现 |
| Spec-Driven | ✅ | 已有完整spec |
| TypeScript | ✅ | 项目使用TS 5.3 |
| CI/CD自动化 | ✅ | typecheck + test |

## Project Structure

### Documentation (this feature)

```text
specs/004-ai-settings-api-key/
├── plan.md              # This file
├── research.md          # Phase 0 (N/A - 无需研究)
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1 (N/A)
├── contracts/          # Phase 1 (N/A - 内部配置)
└── tasks.md            # Phase 2
```

### Source Code (repository root)

```text
src/
├── shared/types/
│   └── transcription.ts      # 修改：添加apiKey字段，端口修正
├── renderer/stores/
│   └── configStore.ts      # 修改：添加apiKey状态管理
├── renderer/components/
│   └── VoiceSettingsDialog.tsx  # 修改：添加API密钥输入
├── renderer/services/
│   └── transcriptionService.ts  # 修改：添加安全存储，认证header
└── main/
    └── index.ts           # 修改：IPC安全存储接口

tests/
├── unit/
│   └── transcriptionService.test.ts  # 新增
└── integration/
    └── configStore.test.ts   # 新增
```

**Structure Decision**: 修改现有文件，无需新增目录结构

## Phase 0: Research

无需Research - 所有技术栈已在项目中已知。

## Phase 1: Design

### Data Model Changes

**文件**: `src/shared/types/transcription.ts`

```typescript
// 修改现有类型
interface TranscriptionConfig {
  preset: EndpointPreset
  baseUrl: string      // 用户输入完整URL（含/v1），系统直接使用
  timeout: number
  model: string
  apiKey?: string     // 新增：可选的API密钥
}

// 端口修正
DEFAULT_ENDPOINT_PRESETS = {
  omlx: 'http://localhost:8000/v1',  // 添加/v1后缀
  ollama: 'http://localhost:11434/v1',
  lmstudio: 'http://localhost:1234/v1'
}
```

### Interface Contracts

**transcriptionService** (修改现有):
```typescript
// 直接拼接，不自动添加/v1
const endpoint = `${config.baseUrl}/audio/transcriptions`
```

**文件**: `src/renderer/stores/configStore.ts`

```typescript
// 新增状态和方法
interface ConfigState extends TranscriptionConfig {
  // 现有方法...
  setApiKey: (apiKey: string) => void
  clearApiKey: () => void
}
```

### Interface Contracts

**VoiceSettingsDialog props**:
```typescript
interface VoiceSettingsDialogProps {
  open: boolean
  onClose: () => void
}
```

**transcriptionService** (修改现有):
```typescript
async function transcribeAudio(
  audioBlob: Blob,
  config: TranscriptionConfig
): Promise<TranscriptionResult>
```

### Implementation Notes

1. **安全存储**: 使用`electron-store`配合`safeStorage`加密存储API密钥
2. **密码输入框**: MUI `TextField type="password"`
3. **Base URL处理**: 用户输入完整URL（含/v1），系统直接使用，不做修改
4. **认证Header**: `{ Authorization: \`Bearer ${config.apiKey}\` }`

---

## Complexity Tracking

| Area | Complexity | Notes |
|------|------------|-------|
| 安全存储 | Medium | 需要IPC调用主进程safeStorage |
| URL处理 | Low | 字符串操作 |
| 修改现有组件 | Low | 增量修改 |