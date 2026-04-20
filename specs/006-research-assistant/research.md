# Research: Research Assistant — Knowledge Vault

**Feature**: 006-research-assistant  
**Date**: 2026-04-20  
**Status**: Complete — all NEEDS CLARIFICATION resolved

---

## 1. OCR Engine: Tesseract.js vs Umi-OCR Detection

### Decision
默认使用 Tesseract.js（Web Worker），自动检测 Umi-OCR 本地服务（localhost:16656），检测到则优先使用。

### Rationale
- **Tesseract.js**：零配置，离线可用，Electron renderer Web Worker 中运行良好。速度 ~1-2s/页（macOS Apple Silicon）
- **Umi-OCR**：用户已安装 PaddleOCR 本地服务，速度 ~0.1s/页（10x 提升），精度更高。但需要用户安装
- **混合策略**：启动时检测 Umi-OCR 是否运行（HTTP HEAD /api/health），检测到则自动切换，未检测到则降级 Tesseract.js

### Alternatives Evaluated
| 选项 | 优点 | 缺点 |
|------|------|------|
| Tesseract.js only | 零依赖 | 速度慢，精度一般 |
| Umi-OCR only | 速度快，精度高 | 需要用户安装 |
| 云端 API (GPT-4o) | 最佳精度 | 隐私顾虑，依赖网络，成本 |
| **Tesseract + Umi-OCR 检测** | **平衡速度与可用性** | **需维护两个路径** |

### Research Sources
- Tesseract.js docs: https://github.com/naptha/tesseract.js
- Umi-OCR API: https://github.com/hiroi-sora/Umi-OCR/blob/dev/doc/api.md

---

## 2. Embedding: LLM API vs @xenova/transformers

### Decision
优先使用用户已配置的 LLM API（如果支持 `/v1/embeddings` endpoint）。不支持则自动加载 `@xenova/transformers` + `all-MiniLM-L6-v2` 模型。

### Rationale
- **LLM API**：用户已配置 Ollama/LM Studio/oMLX，复用已有基础设施。但多数本地 LLM server 不支持 embedding endpoint
- **@xenova/transformers**：HuggingFace 的浏览器端推理库，`all-MiniLM-L6-v2` 模型 22MB，首次加载慢但后续快。768 维，Cosine 相似度与 OpenAI text-embedding-3-small 兼容
- **降级策略**：尝试 LLM API → 404/405/错误 → 自动加载 transformers.js

### Model Comparison
| 模型 | 维度 | 大小 | 速度 | 质量 (MTEB) |
|------|------|------|------|-------------|
| all-MiniLM-L6-v2 | 768 | 22MB | ~50ms/query | 61.4 |
| text-embedding-3-small (API) | 1536 | N/A | ~200ms/query | 63.1 |
| E5-small (API) | 384 | N/A | ~150ms/query | 58.2 |

### Alternatives Evaluated
| 选项 | 优点 | 缺点 |
|------|------|------|
| LLM API (优先) | 复用已有配置 | 多数不支持 embedding |
| @xenova/transformers (降级) | 零配置，离线 | 首次加载慢，质量略低 |
| OpenAI API | 最佳质量 | 需要 API key，依赖网络 |
| **LLM API → transformers 降级** | **平衡可用性与质量** | **需维护两条路径** |

### Research Sources
- @xenova/transformers: https://huggingface.co/docs/transformers.js
- MTEB leaderboard: https://huggingface.co/spaces/mteb/leaderboard
- all-MiniLM-L6-v2: https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2

---

## 3. Qdrant Integration: qdrant-client vs native HTTP

### Decision
使用 `qdrant-client` npm 包（TypeScript SDK），而非手写 HTTP 请求。

### Rationale
- **qdrant-client**：官方 TypeScript SDK，类型安全，支持多向量（text + image）
- **手写 HTTP**：零依赖，但需要手动处理 payload 格式、向量命名等
- **多向量支持**：需要 `text` 和 `image` 两个向量，qdrant-client 原生支持

### Collection Design
```
Collection: ebook_buddy_pdf_knowledge
Vectors:
  - "text": size=768, distance=Cosine
  - "image": size=512, distance=Cosine  (可选，插图截图)
Payload indices:
  - pdf_id: text
  - page_number: keyword
  - block_type: keyword
```

### Alternatives Evaluated
| 选项 | 优点 | 缺点 |
|------|------|------|
| qdrant-client (npm) | 类型安全，多向量支持 | +1 依赖 |
| 手写 HTTP | 零依赖 | 易出错，无类型安全 |
| LanceDB (嵌入式) | 零进程依赖 | 无 Qdrant payload filtering |
| **qdrant-client** | **最佳平衡** | **已有 Qdrant 实例** |

### Research Sources
- qdrant-client: https://github.com/qdrant/qdrant-client
- Qdrant multi-vector search: https://qdrant.tech/documentation/concepts/search/#multi-vector-search

---

## 4. PDF Text Extraction: pdfjs-dist getTextContent vs pdf-parse

### Decision
使用已有的 `pdfjs-dist` `page.getTextContent()`（已有依赖），而非新增 `pdf-parse`。

### Rationale
- **已有 pdfjs-dist**：4.0.379 已安装，`getTextContent()` 返回文本项 + bounding box
- **pdf-parse**：需要 main process（Node.js fs），Electron renderer 需 IPC，增加复杂度
- **pdfjs-dist 优势**：bounding box 数据可用于插图检测（文本块之间的空白区域）

### Chunking Strategy
- 每块 ~500 tokens（约 1500-2000 字符）
- 按段落边界切分（连续空白行 = 段落分隔）
- 表格使用 HTML 解析（pdfjs-dist 的 `getOperatorList()` + `annotationStorage`）

### Alternatives Evaluated
| 选项 | 优点 | 缺点 |
|------|------|------|
| pdfjs-dist getTextContent | 已有依赖，bounding box | 对扫描 PDF 返回空 |
| pdf-parse (main process) | 更可靠 | 需新增依赖 + IPC |
| **pdfjs-dist (已有)** | **零新增依赖** | **扫描 PDF 需 OCR** |

---

## 5. IndexedDB Caching: idb vs native IDB

### Decision
使用 `idb` npm 包（IndexedDB 的 Promise API 封装），而非手写 native IDB。

### Rationale
- **idb**：Luke Hoban 维护，零依赖，Promise API，类型安全
- **native IDB**：callback-based，代码冗长
- **缓存策略**：key = pdfPath，value = { fileHash, pages[], updatedAt }

### Cache Invalidation
- TTL: 24 小时
- 文件变化检测：文件大小 + mtime（通过 Electron fs.stat IPC）
- 手动清除：知识面板"清空知识"按钮

### Alternatives Evaluated
| 选项 | 优点 | 缺点 |
|------|------|------|
| idb (npm) | Promise API，类型安全 | +1 依赖 |
| native IDB | 零依赖 | callback hell |
| localStorage | 简单 | 5MB 限制，不适合大文件 |
| **idb** | **最佳平衡** | **适合 KB 存储** |

### Research Sources
- idb: https://github.com/jakearchibald/idb
- IndexedDB best practices: https://web.dev/indexeddb-buffered/

---

## 6. Figure Detection: Bounding Box Clustering

### Decision
通过 OCR 结果的 bounding box 聚类检测插图区域：大面积空白区域 = 可能的插图。

### Algorithm
1. OCR 返回所有文本行的 bounding box
2. 将页面划分为网格（如 10x10）
3. 统计每格的文本覆盖率
4. 覆盖率 < 10% 的格 → 候选插图区域
5. 合并相邻低覆盖率格 → 插图边界
6. 对每个插图区域截图 → 多模态 LLM 生成描述

### Alternatives Evaluated
| 选项 | 优点 | 缺点 |
|------|------|------|
| BBox 聚类 | 零额外依赖 | 可能误检复杂排版 |
| YOLO 目标检测 | 高精度 | 需新增模型，计算量大 |
| pdfjs 布局分析 | 利用已有数据 | 对扫描 PDF 无布局信息 |
| **BBox 聚类** | **零依赖，可接受** | **复杂排版可能误检** |

---

## Summary of All Decisions

| 决策 | 选择 | 降级方案 |
|------|------|----------|
| OCR 引擎 | Tesseract.js → Umi-OCR 检测 | Umi-OCR 未安装 → Tesseract.js |
| Embedding | LLM API → @xenova/transformers | API 不支持 → 本地 transformers |
| 向量库 | Qdrant (qdrant-client) | Qdrant 未运行 → 内存关键词搜索 |
| 文本提取 | pdfjs-dist getTextContent | 扫描 PDF → OCR |
| 缓存 | IndexedDB (idb) | IDB 不可用 → 内存 |
| 插图检测 | BBox 聚类 | 复杂排版 → 用户手动标注 |
