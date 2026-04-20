# Quickstart: Research Assistant — Knowledge Vault

**Feature**: 006-research-assistant  
**Date**: 2026-04-20

---

## Prerequisites

1. **Qdrant** running on `localhost:6333`
   ```bash
   docker run -p 6333:6333 qdrant/qdrant
   ```
2. **Optional**: Umi-OCR running on `localhost:16656` (auto-detected, falls back to Tesseract.js)
3. **LLM API** configured in app settings (optional, falls back to local embedding)

## Setup

```bash
# Install new dependencies
pnpm add tesseract.js qdrant-client idb @xenova/transformers

# Run typecheck
pnpm run typecheck

# Run tests
pnpm run test:run
```

## Architecture Overview

```
PDF 加载
  │
  ├─→ 检测文字层 (pdfjs getTextContent)
  │     ├─ 有文字 → extractText() → TextBlock[]
  │     └─ 无文字 → extractViaOcr() → TextBlock[] + FigureBlock[]
  │
  ├─→ 检测缓存 (IndexedDB)
  │     ├─ 有缓存 → 跳过分析
  │     └─ 无缓存 → 分析
  │
  └─→ 对每个 Block:
        ├─ embedText(text) → textVector
        ├─ embedFigure(caption + desc) → textVector
        └─ embedFigure(image) → imageVector (可选)
  │
  └─→ 写入 Qdrant (upsertEntries)
  │
  └─→ knowledgeStore 更新状态
  │
  └─→ KnowledgePanel 显示结果
```

## Key Files

| File | Purpose |
|------|---------|
| `src/renderer/services/pdfAnalyzer.ts` | PDF 内容分析引擎 |
| `src/renderer/services/pdfCache.ts` | IndexedDB 缓存 |
| `src/renderer/services/embeddingService.ts` | Embedding 生成 |
| `src/renderer/services/qdrantService.ts` | Qdrant 客户端封装 |
| `src/renderer/stores/knowledgeStore.ts` | 知识状态管理 |
| `src/renderer/components/KnowledgePanel/index.tsx` | 知识面板 UI |
| `src/renderer/components/AnalysisProgress/index.tsx` | 进度指示器 |

## Testing

### Unit Tests
```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test pdfAnalyzer
```

### Integration Test
```bash
# Knowledge flow test (requires Qdrant running)
pnpm test knowledge-flow
```

## Configuration

No new config needed. The feature reuses existing:
- LLM API config (baseUrl, apiKey, model)
- Qdrant URL (hardcoded: `http://localhost:6333`)
- OCR language (default: eng + chi_sim, configurable in settings)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Qdrant 连接失败 | 检查 `docker run -p 6333:6333 qdrant/qdrant` 是否运行 |
| OCR 速度慢 | 安装 Umi-OCR，自动检测并优先使用 |
| Embedding 失败 | 检查 LLM API 配置，自动降级到 transformers.js |
| 缓存不生效 | 检查 IndexedDB 权限，清除缓存: `localStorage.clear()` |
