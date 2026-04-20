# Implementation Plan: Research Assistant — Knowledge Vault

**Branch**: `006-research-assistant` | **Date**: 2026-04-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-research-assistant/spec.md`

## Summary

将 ebook-buddy 从"侧边栏 AI 聊天"转型为**被动研究助手**：PDF 加载后自动分析（文字层提取 + OCR）→ 按内容块（文本/插图/表格）分别 embedding → 写入 Qdrant → 对话时自动注入当前页 + 向量搜索相关片段作为上下文。核心设计决策：优先使用用户现有 LLM API 做 embedding，不支持则降级到 `@xenova/transformers`；OCR 优先 Tesseract.js，自动检测 Umi-OCR 本地服务；每个 PDF 独立索引。

## Technical Context

**Language/Version**: TypeScript 5.3 (existing)  
**Primary Dependencies**: pdfjs-dist (existing), tesseract.js (new), @xenova/transformers (fallback, new), qdrant-client (new), idb (new)  
**Storage**: IndexedDB (缓存), Qdrant (向量索引), localStorage (配置)  
**Testing**: Vitest + Testing Library (existing)  
**Target Platform**: macOS desktop (Electron 28)  
**Project Type**: Electron desktop app (renderer-process only, no main process changes needed for core logic)  
**Performance Goals**: 文字 PDF 300 页 ≤ 10 秒分析；扫描 PDF 100 页 ≤ 2 分钟；向量搜索 ≤ 500ms  
**Constraints**: Electron renderer 进程（无 Node.js 直接访问，通过 IPC）；离线可用；macOS 仅 v1  
**Scale/Scope**: 单 PDF 最大 1000 页；每页最多 ~50 个内容块；Qdrant 单实例 localhost

## Constitution Check

### Pre-Phase Gates
| Gate | Status | Notes |
|------|--------|-------|
| I. Test-First | ✅ Acknowledged | Tests to be written before implementation in Phase 2+ |
| II. Spec-Driven | ✅ Pass | spec.md complete with 5 user stories, 13 FRs, 5 success criteria |
| III. Incremental Delivery | ✅ Pass | 4 phases, each delivers independent value |
| IV. Automated Verification | ✅ Acknowledged | `pnpm run typecheck` + `pnpm run test:run` will be run before merge |
| V. Documentation as Code | ✅ Pass | artifacts in `specs/006-research-assistant/` |
| VI. Conventional Commits | ✅ Acknowledged | Will follow when user requests commits |
| VIII. Git Automation Prohibition | ✅ Pass | No auto-commit; all git actions user-initiated |

### Post-Phase 1 Re-evaluation
| Gate | Status | Notes |
|------|--------|-------|
| I. Test-First | ⚠️ Deferred | Tests written in implementation phase |
| II. Spec-Driven | ✅ Pass | Design matches spec requirements |
| III. Incremental Delivery | ✅ Pass | Phase 1 outputs enable Phase 2 implementation |

## Project Structure

### Documentation (this feature)

```text
specs/006-research-assistant/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (IPC contracts)
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
src/
├── main/
│   └── index.ts                    # Electron main (no changes needed)
├── preload/
│   └── index.ts                    # Preload (no changes needed)
├── renderer/
│   ├── services/
│   │   ├── pdfAnalyzer.ts          # NEW: PDF content analysis
│   │   ├── pdfCache.ts             # NEW: IndexedDB caching
│   │   ├── embeddingService.ts     # NEW: Text/image embedding
│   │   ├── qdrantService.ts        # NEW: Qdrant client wrapper
│   │   └── chatService.ts          # MODIFIED: Context injection
│   ├── stores/
│   │   ├── knowledgeStore.ts       # NEW: Knowledge state management
│   │   ├── chatStore.ts            # existing (no changes)
│   │   └── configStore.ts          # existing (no changes)
│   └── components/
│       ├── KnowledgePanel/          # NEW: Knowledge browsing UI
│       │   └── index.tsx
│       ├── AnalysisProgress/        # NEW: Analysis progress indicator
│       │   └── index.tsx
│       ├── PDFViewer/               # MODIFIED: Trigger analysis on load
│       │   └── index.tsx
│       └── ChatPanel/               # MODIFIED: Search bar + context
│           └── index.tsx
tests/
├── unit/
│   ├── pdfAnalyzer.test.ts
│   ├── pdfCache.test.ts
│   ├── embeddingService.test.ts
│   ├── qdrantService.test.ts
│   └── knowledgeStore.test.ts
└── integration/
    └── knowledge-flow.test.ts
```

### Source Code Rationale

- **All new code in renderer process**: PDF analysis, embedding, Qdrant interaction all run in the renderer. No main process changes needed because:
  - Tesseract.js works in Web Worker (renderer)
  - `@xenova/transformers` works in browser
  - `qdrant-client` uses HTTP (renderer can call localhost)
  - IndexedDB is browser-native
- **Existing services untouched**: `chatService.ts` modified only for context injection; `configStore.ts` and `chatStore.ts` remain unchanged

## Complexity Tracking

> No complexity violations requiring justification. All decisions align with constitution principles.
