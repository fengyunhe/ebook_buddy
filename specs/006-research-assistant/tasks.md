# Tasks: Research Assistant — Knowledge Vault

**Feature**: 006-research-assistant  
**Branch**: `006-research-assistant`  
**Date**: 2026-04-20  
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

---

## Implementation Strategy

**MVP first**: User Story 1 (PDF 自动索引) delivers independent value — user opens a PDF and AI already knows its content. Subsequent stories add progressively richer capabilities on top of this foundation.

**Dependency order**: US1 → US2 → US3 → US4 → US5 (each story depends on US1's infrastructure)

---

## Phase 1: Setup

- [x] T001 [P] Install new dependencies: `pnpm add tesseract.js qdrant-client idb @xenova/transformers`
- [x] T002 [P] Verify typecheck passes: `pnpm run typecheck`

## Phase 2: Foundational (blocking prerequisites)

- [x] T003 Create shared types in `src/shared/types/knowledge.ts`: KnowledgeBlock, KnowledgeIndex, AnalysisProgress, CachedAnalysis interfaces
- [x] T004 [P] Implement IndexedDB cache layer in `src/renderer/services/pdfCache.ts`: openDB, get/put/delete cached analysis, cache invalidation by file hash
- [x] T005 Implement IPC handler `file:stat` in `src/main/index.ts`: return file size + mtime for cache validation
- [x] T006 Update preload in `src/preload/index.ts`: expose `fileStat` method via contextBridge
- [x] T007 [P] Implement OCR engine in `src/renderer/services/ocrEngine.ts`: Tesseract.js worker setup, Umi-OCR detection (HTTP HEAD /api/health), language pack config (eng + chi_sim default), `recognize(pageImage, lang)` → text + bounding boxes
- [x] T008 [P] Implement embedding service in `src/renderer/services/embeddingService.ts`: LLM API embedding (try first), @xenova/transformers fallback, `embedText(text) → vector[]`, `embedImage(imageBase64) → vector[]`, batch with 500ms throttle
- [x] T009 Implement Qdrant service in `src/renderer/services/qdrantService.ts`: ensureCollection (ebook_buddy_pdf_knowledge, multi-vector text+image), upsertEntries, search with payload filter, deleteByPdfId, fallback to in-memory keyword search when Qdrant unavailable
- [x] T010 Implement knowledge store in `src/renderer/stores/knowledgeStore.ts`: Zustand store with setPdfInfo, startAnalysis (with cancel), cancelAnalysis, syncFromQdrant, getBlocksByPage, analyze state transitions

## Phase 3: User Story 1 — 打开 PDF 自动索引，零操作延迟 (P1)

**Goal**: 用户打开任意 PDF（文字版或扫描版），应用自动在后台分析内容并建立索引，用户无需任何额外操作即可立即开始对话。

**Independent Test**: 打开一个 50 页的 PDF，等待分析完成，然后问一个关于 PDF 具体内容的问题。AI 应能引用原文回答。

**Acceptance**:
1. **Given** 用户打开一个 50 页的文字版 PDF，**When** 分析进度指示器显示完成，**Then** 用户向 AI 提问 PDF 中的任意内容，AI 能引用具体页码回答
2. **Given** 用户打开一个 50 页的扫描版 PDF，**When** OCR 分析进度指示器显示完成，**Then** 用户向 AI 提问 PDF 中的任意内容，AI 能引用具体页码回答
3. **Given** 同一 PDF 已分析过，**When** 用户再次打开，**Then** 应用跳过分析，直接使用缓存结果，对话立即可用

**Tasks**:

- [x] T011 [US1] Implement PDF text extraction in `src/renderer/services/pdfAnalyzer.ts`: `hasTextLayer(pdfDoc)` → boolean, `extractText(pdfDoc)` → TextBlock[] using pdfjs getTextContent with ~500 token chunking
- [x] T012 [US1] Implement figure detection in `src/renderer/services/pdfAnalyzer.ts`: `detectFigures(ocrResult, pageCanvas)` → FigureBlock[] using bounding box clustering (grid-based text coverage analysis)
- [x] T013 [US1] Integrate analysis trigger in `src/renderer/components/PDFViewer/index.tsx`: on loadPDF, call knowledgeStore.startAnalysis(), connect to analysis progress state
- [x] T014 [US1] Implement analysis progress indicator in `src/renderer/components/AnalysisProgress/index.tsx`: floating UI with progress bar, page count, estimated time, cancel button
- [x] T015 [US1] Wire analysis pipeline: pdfAnalyzer → embeddingService → qdrantService in knowledgeStore, with progress callbacks and error handling
- [x] T016 [US1] Implement cache integration: on loadPDF, check pdfCache before analysis; if valid, skip analysis and load from cache

## Phase 4: User Story 2 — 基于当前页的上下文感知对话 (P1)

**Goal**: 用户正在阅读 PDF 的某一页，向 AI 提问时，AI 自动将该页内容作为对话上下文，无需用户手动截图或复制粘贴。

**Independent Test**: 翻到 PDF 第 10 页，问一个只有第 10 页有答案的问题，AI 应能正确回答并引用页码。

**Acceptance**:
1. **Given** 用户正在查看 PDF 第 10 页，**When** 用户向 AI 提问，**Then** AI 的回答自动包含第 10 页的内容作为上下文
2. **Given** 用户的问题涉及 PDF 中其他页面的内容，**When** AI 回答时，**Then** AI 同时引用相关页面的内容并标注页码
3. **Given** AI 的回答引用了 PDF 内容，**When** 用户点击引用标注，**Then** PDF 自动跳转到对应页码

**Tasks**:

- [x] T017 [US2] Implement context injection in `src/renderer/services/chatService.ts`: `buildContextualPrompt(query, currentPage, pdfId)` → prepends current page blocks + cross-page search results to messages
- [x] T018 [US2] Implement cross-page search in `src/renderer/services/qdrantService.ts`: `searchByQuery(pdfId, query, options)` → top-k relevant blocks, merge with page context
- [x] T019 [US2] Update ChatPanel in `src/renderer/components/ChatPanel/index.tsx`: pass current page to chatService on send, display citation markers in assistant messages
- [x] T020 [US2] Implement citation click handler: click on page citation → PDFViewer goToPage(pageNumber)

## Phase 5: User Story 3 — 知识面板浏览 PDF 结构化内容 (P2)

**Goal**: 用户可以在侧边栏查看 PDF 被分析后的结构化内容（文本段落、插图、表格），按页组织。

**Independent Test**: 打开一个包含插图和表格的 PDF，在知识面板中查看分析结果，确认插图和表格被正确识别。

**Acceptance**:
1. **Given** PDF 分析完成，**When** 用户打开知识面板，**Then** 按页展示所有文本段落、插图和表格条目
2. **Given** 知识面板中显示了一个插图条目，**When** 用户点击该条目，**Then** PDF 跳转到该插图所在页码
3. **Given** 用户打开一个 PDF 并查看知识面板，**When** 用户关闭 PDF 后重新打开同一文件，**Then** 知识面板内容保持不变（使用缓存）

**Tasks**:

- [x] T021 [US3] Implement KnowledgePanel component in `src/renderer/components/KnowledgePanel/index.tsx`: tabbed interface (知识/搜索/对话), block cards grouped by page, block type icons (text/figure/table)
- [x] T022 [US3] Implement KnowledgePanel block card UI: text preview, figure thumbnail (if available), caption, page number, word count
- [x] T023 [US3] Implement KnowledgePanel navigation: click block → PDFViewer goToPage(pageNumber), scroll to bounding box area
- [x] T024 [US3] Implement export feature: `knowledgeStore.exportKnowledge(pdfId, format)` → Markdown or JSON file download
- [x] T025 [US3] Implement clear knowledge: button to delete Qdrant entries + IndexedDB cache for current PDF

## Phase 6: User Story 4 — 扫描 PDF 的插图理解 (P2)

**Goal**: 对于扫描版 PDF 中的插图，用户可以向 AI 提问"这个图是什么意思"，AI 基于对插图的理解回答。

**Independent Test**: 打开一个包含图表的扫描 PDF，问 AI 关于图表内容的问题，AI 应能描述图表信息。

**Acceptance**:
1. **Given** 扫描 PDF 中有一张包含数据的图表，**When** 用户问"这张图讲了什么"，**Then** AI 基于对图表的理解给出准确描述
2. **Given** 插图有图注，**When** 用户提问时，**Then** AI 同时利用图注和插图内容给出回答
3. **Given** 插图分析需要时间，**When** 用户提问时，**Then** AI 显示"正在分析插图"的提示，分析完成后给出回答

**Tasks**:

- [x] T026 [US4] Implement figure description generation in `src/renderer/services/embeddingService.ts`: `describeFigure(imageBase64, config)` → send to multimodal LLM → caption + description text
- [x] T027 [US4] Integrate figure description into analysis pipeline: during background analysis, generate figure descriptions for all detected figures
- [x] T028 [US4] Implement on-demand figure description: if user asks about a figure before background analysis completes, trigger on-demand description with "正在分析插图" progress indicator
- [x] T029 [US4] Update KnowledgePanel to display figure thumbnails with descriptions

## Phase 7: User Story 5 — 搜索 PDF 内容 (P3)

**Goal**: 用户在知识面板中有搜索框，可以按关键词或自然语言搜索 PDF 内容。

**Independent Test**: 在知识面板搜索框中输入关键词，确认搜索结果准确，点击跳转到对应页码。

**Acceptance**:
1. **Given** PDF 已分析完成，**When** 用户在搜索框中输入关键词，**Then** 显示匹配的段落/插图/表格摘要卡片
2. **Given** 用户输入自然语言查询，**When** 搜索执行，**Then** 返回语义相关的结果而不仅是关键词匹配
3. **Given** 搜索结果中有插图条目，**When** 用户点击，**Then** PDF 跳转到该插图所在页码

**Tasks**:

- [x] T030 [US5] Implement search in KnowledgePanel: text input → keyword search (IndexedDB) + semantic search (Qdrant vector search), merge and deduplicate results
- [x] T031 [US5] Implement search result display: summary cards with page number, block type, text snippet, relevance score
- [x] T032 [US5] Implement search result navigation: click result → PDFViewer goToPage(pageNumber)

## Phase 8: Polish & Cross-Cutting Concerns

- [x] T033 [P] Edge case: large PDF (>500 pages) — show estimated remaining time, allow pause/resume
- [x] T034 [P] Edge case: OCR single-page failure — mark page as error, allow manual retry
- [x] T035 [P] Edge case: PDF file moved/deleted — cache invalidation, re-analysis on next open
- [x] T036 [P] Edge case: analysis cancel — preserve partial results, allow resume from breakpoint
- [x] T037 [P] Edge case: multi-language PDF — Tesseract language pack config (eng + chi_sim default, user appendable)
- [x] T038 Update AGENTS.md: add Research Assistant tech stack (tesseract.js, qdrant-client, idb, @xenova/transformers)
- [x] T039 [P] Run `pnpm run typecheck` — verify no TypeScript errors
- [x] T040 [P] Run `pnpm run test:run` — verify all existing tests pass

---

## Dependency Graph

```
Phase 1 (Setup)
  └─→ Phase 2 (Foundational)
       ├─ T004 (IndexedDB cache) ──────────────────────┐
       ├─ T007 (OCR engine) ────────────────────────────┤
       ├─ T008 (Embedding service) ─────────────────────┤
       └─ T009 (Qdrant service) ────────────────────────┤
       └─ T010 (Knowledge store) ───────────────────────┤
                                                         ▼
Phase 3 (US1: PDF 自动索引) ←── all Phase 2 deps ──────┘
  └─ T011 (Text extraction)
  └─ T012 (Figure detection)
  └─ T013 (Analysis trigger in PDFViewer)
  └─ T014 (Progress indicator)
  └─ T015 (Pipeline wiring)
  └─ T016 (Cache integration)
                                                         ▼
Phase 4 (US2: 上下文感知对话) ←── US1 infrastructure ────┘
  └─ T017 (Context injection)
  └─ T018 (Cross-page search)
  └─ T019 (ChatPanel update)
  └─ T020 (Citation click handler)
                                                         ▼
Phase 5 (US3: 知识面板) ←── US1 + US2 infrastructure ──┘
  └─ T021 (KnowledgePanel component)
  └─ T022 (Block card UI)
  └─ T023 (Navigation)
  └─ T024 (Export)
  └─ T025 (Clear knowledge)
                                                         ▼
Phase 6 (US4: 插图理解) ←── US1 + US4 infrastructure ──┘
  └─ T026 (Figure description)
  └─ T027 (Pipeline integration)
  └─ T028 (On-demand description)
  └─ T029 (Thumbnail display)
                                                         ▼
Phase 7 (US5: 搜索) ←── US3 + US5 infrastructure ──────┘
  └─ T030 (Search implementation)
  └─ T031 (Search results UI)
  └─ T032 (Search navigation)
                                                         ▼
Phase 8 (Polish)
```

## Parallel Execution Examples

**Phase 2 (Foundational) — 4 parallel tasks:**
```
T004 (IndexedDB cache)     ─┐
T007 (OCR engine)          ├─→ Run in parallel
T008 (Embedding service)   ├─→ Run in parallel
T009 (Qdrant service)      ─┘
```

**Phase 3 (US1) — 3 parallel groups:**
```
T011 (Text extraction)     ─┐
T012 (Figure detection)    ├─→ Run in parallel (different files)
T016 (Cache integration)   ─┘
T013 (Analysis trigger)    ──→ After T011+T012+T016
T014 (Progress indicator)  ──→ After T013
T015 (Pipeline wiring)     ──→ After T013+T014
```

**Phase 8 (Polish) — 4 parallel tasks:**
```
T033 (Large PDF edge case)      ─┐
T034 (OCR failure edge case)    ├─→ Run in parallel
T035 (File moved edge case)     ├─→ Run in parallel
T036 (Cancel edge case)         ─┘
T037 (Multi-language config)    ──→ After T033-T036
T039 (Typecheck)                ──→ After all implementation
T040 (Test run)                 ──→ After T039
```

## Task Summary

| Phase | Story | Tasks | Cumulative |
|-------|-------|-------|------------|
| Phase 1 | Setup | T001-T002 | 2 |
| Phase 2 | Foundational | T003-T010 | 8 |
| Phase 3 | US1: PDF 自动索引 | T011-T016 | 6 |
| Phase 4 | US2: 上下文感知对话 | T017-T020 | 4 |
| Phase 5 | US3: 知识面板 | T021-T025 | 5 |
| Phase 6 | US4: 插图理解 | T026-T029 | 4 |
| Phase 7 | US5: 搜索 | T030-T032 | 3 |
| Phase 8 | Polish | T033-T040 | 8 |
| **Total** | | **40 tasks** | |

## MVP Scope

**Recommended MVP**: Phase 1 + Phase 2 + Phase 3 (T001-T016, 16 tasks)

This delivers the core value proposition: user opens a PDF, AI automatically indexes it and can answer questions about its content. All subsequent stories build on this foundation.

**MVP acceptance criteria (SC-001)**:
- Users can ask a question about any page of a newly opened PDF within 10 seconds (text PDF) or 2 minutes (scanned PDF, 100 pages) and receive a relevant answer
