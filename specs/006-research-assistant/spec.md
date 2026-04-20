# Feature Specification: Research Assistant — Knowledge Vault

**Feature Branch**: `[006-research-assistant]`  
**Created**: 2026-04-20  
**Status**: Draft  
**Input**: User description: "PDF 加载后自动分析（OCR + 文本提取），向量化索引到 Qdrant，支持无文字层 PDF 的上下文感知对话"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — 打开 PDF 自动索引，零操作延迟（Priority: P1）

用户打开任意 PDF（文字版或扫描版），应用自动在后台分析内容并建立索引。用户无需任何额外操作，即可立即开始对话，AI 已掌握 PDF 内容。

**Why this priority**: 这是整个功能的核心价值主张。如果打开 PDF 后 AI 仍然不知道 PDF 内容，用户就没有理由使用这个功能。这是 MVP 的最小交付。

**Independent Test**: 打开一个 50 页的 PDF，等待分析完成，然后问一个关于 PDF 具体内容的问题。AI 应能引用原文回答。

**Acceptance Scenarios**:

1. **Given** 用户打开一个 50 页的文字版 PDF，**When** 分析进度指示器显示完成，**Then** 用户向 AI 提问 PDF 中的任意内容，AI 能引用具体页码回答
2. **Given** 用户打开一个 50 页的扫描版 PDF，**When** OCR 分析进度指示器显示完成，**Then** 用户向 AI 提问 PDF 中的任意内容，AI 能引用具体页码回答
3. **Given** 同一 PDF 已分析过，**When** 用户再次打开，**Then** 应用跳过分析，直接使用缓存结果，对话立即可用

---

### User Story 2 — 基于当前页的上下文感知对话（Priority: P1）

用户正在阅读 PDF 的某一页，向 AI 提问时，AI 自动将该页内容作为对话上下文，无需用户手动截图或复制粘贴。当问题涉及跨页内容时，AI 自动搜索相关片段补充上下文。

**Why this priority**: 这是"被动研究助手"区别于"侧边栏聊天机器人"的关键体验。用户不需要思考"怎么让 AI 看到 PDF"，AI 自动感知当前阅读位置。

**Independent Test**: 翻到 PDF 第 10 页，问一个只有第 10 页有答案的问题，AI 应能正确回答并引用页码。

**Acceptance Scenarios**:

1. **Given** 用户正在查看 PDF 第 10 页，**When** 用户向 AI 提问，**Then** AI 的回答自动包含第 10 页的内容作为上下文
2. **Given** 用户的问题涉及 PDF 中其他页面的内容，**When** AI 回答时，**Then** AI 同时引用相关页面的内容并标注页码
3. **Given** AI 的回答引用了 PDF 内容，**When** 用户点击引用标注，**Then** PDF 自动跳转到对应页码

---

### User Story 3 — 知识面板浏览 PDF 结构化内容（Priority: P2）

用户可以在侧边栏查看 PDF 被分析后的结构化内容（文本段落、插图、表格），按页组织。点击任意条目可跳转到 PDF 对应位置。用户可导出知识内容。

**Why this priority**: 让用户"看到"AI 分析了什么，建立信任感。同时为无法依赖对话的用户提供直接浏览 PDF 结构化内容的能力。

**Independent Test**: 打开一个包含插图和表格的 PDF，在知识面板中查看分析结果，确认插图和表格被正确识别。

**Acceptance Scenarios**:

1. **Given** PDF 分析完成，**When** 用户打开知识面板，**Then** 按页展示所有文本段落、插图和表格条目
2. **Given** 知识面板中显示了一个插图条目，**When** 用户点击该条目，**Then** PDF 跳转到该插图所在页码
3. **Given** 用户打开一个 PDF 并查看知识面板，**When** 用户关闭 PDF 后重新打开同一文件，**Then** 知识面板内容保持不变（使用缓存）

---

### User Story 4 — 扫描 PDF 的插图理解（Priority: P2）

对于扫描版 PDF 中的插图、图表，用户可以向 AI 提问"这个图是什么意思"或"描述这张图"，AI 基于对插图的理解回答。

**Why this priority**: 扫描 PDF 的核心痛点是插图无法被搜索和理解。这是区分"普通 OCR"和"智能研究助手"的关键能力。

**Independent Test**: 打开一个包含图表的扫描 PDF，问 AI 关于图表内容的问题，AI 应能描述图表信息。

**Acceptance Scenarios**:

1. **Given** 扫描 PDF 中有一张包含数据的图表，**When** 用户问"这张图讲了什么"，**Then** AI 基于对图表的理解给出准确描述
2. **Given** 插图有图注，**When** 用户提问时，**Then** AI 同时利用图注和插图内容给出回答
3. **Given** 插图分析需要时间，**When** 用户提问时，**Then** AI 显示"正在分析插图"的提示，分析完成后给出回答

---

### User Story 5 — 搜索 PDF 内容（Priority: P3）

用户在知识面板中有搜索框，可以按关键词或自然语言搜索 PDF 内容。搜索结果以摘要卡片形式展示，点击跳转到对应页码。

**Why this priority**: 当 PDF 内容较多时，用户需要快速定位特定信息，而非逐页浏览。

**Independent Test**: 在知识面板搜索框中输入关键词，确认搜索结果准确，点击跳转到对应页码。

**Acceptance Scenarios**:

1. **Given** PDF 已分析完成，**When** 用户在搜索框中输入关键词，**Then** 显示匹配的段落/插图/表格摘要卡片
2. **Given** 用户输入自然语言查询（如"关于实验方法的描述"），**When** 搜索执行，**Then** 返回语义相关的结果而不仅是关键词匹配
3. **Given** 搜索结果中有插图条目，**When** 用户点击，**Then** PDF 跳转到该插图所在页码

---

### Edge Cases

- **超大 PDF（>500 页）**：分析时间过长时，显示预估剩余时间，允许用户暂停/继续/取消；取消后 PDF 仍可用但只有已分析的部分可搜索
- **OCR 识别失败（单页）**：该页标记为"分析失败"，不影响其他页，用户可手动重试
- **Qdrant 服务不可用**：显示通知告知用户，降级为内存中的关键词搜索（不丢失已分析内容，向量搜索能力降级）
- **PDF 文件被移动/删除**：缓存自动失效，重新打开时重新分析
- **分析中途关闭应用**：已分析的内容保留在缓存中，重新打开时从断点继续
- **多语言 PDF**：OCR 默认加载英文 + 中文语言包，用户可在设置中追加其他语言（如日文、韩文等）

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST automatically analyze any opened PDF in the background without requiring user action
- **FR-002**: System MUST support both text-based PDFs and scanned image PDFs
- **FR-003**: System MUST extract text content from PDFs (via native text layer or OCR for scanned PDFs; prioritizing Umi-OCR local service if detected, falling back to Tesseract.js)
- **FR-004**: System MUST detect and separately index figures/illustrations within scanned PDFs, including their captions
- **FR-005**: System MUST detect and separately index tables within PDFs
- **FR-006**: System MUST create a searchable knowledge base from analyzed PDF content using text embeddings (prioritizing user's LLM API, falling back to local `@xenova/transformers` if unavailable)
- **FR-007**: System MUST automatically include the current PDF page content as context when the user sends a message
- **FR-008**: System MUST search for relevant cross-page content when user questions go beyond the current page
- **FR-009**: System MUST display analysis progress to the user with an indicator
- **FR-010**: System MUST show a knowledge panel listing analyzed content organized by page
- **FR-011**: System MUST allow users to export analyzed knowledge content
- **FR-012**: System MUST cache analysis results to avoid re-analyzing the same PDF
- **FR-013**: System MUST allow users to navigate from knowledge panel entries to the corresponding PDF page

### Key Entities *(include if feature involves data)*

- **PDF Document**: Represents an opened PDF file, identified by file path; contains pages, each with text content, figures, and tables
- **Knowledge Block**: A unit of analyzed content — either a text passage, a figure with caption/description, or a table; associated with a specific page number
- **Knowledge Index**: The searchable representation of all knowledge blocks for a PDF, enabling both keyword and semantic search; each PDF has its own isolated index (not shared across documents)
- **Analysis Progress**: Tracks the state of PDF analysis (idle, analyzing, completed, error) including current page and estimated completion time

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can ask a question about any page of a newly opened PDF within 10 seconds (text PDF) or 2 minutes (scanned PDF, 100 pages) and receive a relevant answer
- **SC-002**: 95% of questions answered by AI include a citation to the specific PDF page number where the information was found
- **SC-003**: Users can open a previously analyzed PDF and resume conversation without any perceptible delay (cached analysis loads in under 1 second)
- **SC-004**: Users can browse the knowledge panel and find any specific piece of content (text, figure, or table) within 3 clicks from the current page
- **SC-005**: Scanned PDF figure descriptions are generated within 3 seconds per figure when asked in conversation (on-demand) or during background analysis

## Clarifications

### Session 2026-04-20

- Q: Embedding 生成策略？ → A: 优先使用用户现有 LLM API（如支持 embedding endpoint），不支持则自动安装 `@xenova/transformers` 本地模型作为零配置降级

## Assumptions

- Users have a local Qdrant instance running on localhost:6333 (or the app will guide them to start one)
- Users have internet connectivity or a local LLM running for text embedding generation
- If the user's configured LLM API does not support embedding generation, the system will automatically use the browser-based `@xenova/transformers` library with the `all-MiniLM-L6-v2` model (22MB, 768-dim) as a zero-configuration fallback
- PDF files are not password-protected (password-protected PDFs will show an error message)
- The app runs on macOS (Windows/Linux support is out of scope for v1)
- OCR accuracy is sufficient for standard printed documents but may vary for handwritten content
- Existing LLM API configuration (model, API key, base URL) will be reused for embedding generation
- Users are comfortable with background processing that may consume CPU/memory resources during PDF analysis
