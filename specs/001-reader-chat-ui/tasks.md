---

description: "Task list for Ebook Buddy Reader UI"
---

# Tasks: 设计阅读器主界面

**Input**: Design documents from `/specs/001-reader-chat-ui/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Tests**: Test-First approach (TDD) as per Constitution - tests written before implementation

**Organization**: Tasks grouped by user story to enable independent implementation and testing

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1, US2, US3, US4)

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Initialize Electron + React + TypeScript project with all dependencies

- [x] T001 Initialize Electron + React + TypeScript project using electron-vite
- [x] T002 Configure TypeScript (tsconfig.json) with strict mode
- [x] T003 [P] Install core dependencies: pdfjs-dist, react-markdown, remark-gfm, remark-math, rehype-katex, zustand, i18next
- [x] T004 [P] Install dev dependencies: vitest, @testing-library/react, @testing-library/jest-dom, eslint, prettier
- [ ] T005 Configure Vitest with React Testing Library setup
- [ ] T006 [P] Setup ESLint and Prettier configuration

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure - MUST complete before ANY user story

- [x] T007 Create project directory structure (main/, renderer/, shared/, tests/)
- [x] T008 Setup Electron main process in src/main/index.ts with logging
- [x] T009 Create preload script src/main/preload.ts for IPC communication
- [x] T010 [P] Setup React entry point in src/renderer/main.tsx
- [x] T011 Create base types in src/shared/types/index.ts (PDFDocument, ChatMessage, ChatSession, UserPreferences)
- [x] T012 [P] Setup Zustand store infrastructure in src/renderer/stores/
- [x] T013 Create global styles in src/renderer/styles/index.css

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - 阅读本地PDF电子书 (Priority: P1) 🎯 MVP

**Goal**: 用户能够选择本地PDF文件并在左侧阅读区域显示

**Independent Test**: 用户能够选择本地PDF文件并完整查看内容

### Tests for User Story 1 (TDD - write first, ensure fail) ⚠️

- [ ] T014 [P] [US1] Write unit tests for PDFViewer component in tests/unit/PDFViewer.test.tsx
- [ ] T015 [P] [US1] Write integration tests for PDF loading in tests/integration/pdfLoading.test.ts

### Implementation for User Story 1

- [x] T016 [US1] Implement file dialog service in src/renderer/services/fileService.ts (Electron dialog API)
- [x] T017 [US1] Create PDFViewer component in src/renderer/components/PDFViewer/index.tsx
- [x] T018 [US1] Integrate PDF.js for document loading and rendering
- [x] T019 [US1] Implement page navigation (next/previous/jump to page)
- [x] T020 [US1] Implement smooth scrolling for PDF content
- [ ] T021 [US1] Save and restore reading progress in src/renderer/services/progressService.ts

**Checkpoint**: At this point, User Story 1 should be fully functional - user can open, read, and resume PDF reading

---

## Phase 4: User Story 2 - 与AI助手交互 (Priority: P2)

**Goal**: 用户能够在右侧AI聊天区域发送消息并收到回复

**Independent Test**: 用户发送消息后能收到AI回复，并显示在聊天区域

### Tests for User Story 2 (TDD) ⚠️

- [ ] T022 [P] [US2] Write unit tests for ChatPanel component in tests/unit/ChatPanel.test.tsx
- [ ] T023 [P] [US2] Write unit tests for chat store in tests/unit/chatStore.test.ts

### Implementation for User Story 2

- [x] T024 [US2] Create chat store in src/renderer/stores/chatStore.ts
- [x] T025 [US2] Create ChatPanel component in src/renderer/components/ChatPanel/index.tsx
- [x] T026 [US2] Implement message input component with send functionality
- [x] T027 [US2] Create message list component for displaying messages
- [x] T028 [US2] Implement AI service mock in src/renderer/services/aiService.ts (placeholder for future API integration)

**Checkpoint**: User Story 2 functional - user can send messages and see them in the chat panel

---

## Phase 5: User Story 3 - AI聊天区域渲染Markdown内容 (Priority: P2)

**Goal**: AI返回的Markdown内容能够正确渲染，包括LaTeX公式和图片

**Independent Test**: 包含Markdown的AI回复能正确显示格式

### Tests for User Story 3 (TDD) ⚠️

- [ ] T029 [P] [US3] Write unit tests for MarkdownRenderer in tests/unit/MarkdownRenderer.test.tsx

### Implementation for User Story 3

- [x] T030 [US3] Install and configure Markdown plugins (remark-gfm, remark-math, rehype-katex)
- [x] T031 [US3] Create MarkdownRenderer component in src/renderer/components/MarkdownRenderer/index.tsx
- [x] T032 [US3] Configure KaTeX for LaTeX math formula rendering
- [x] T033 [US3] Add CSS styles for Markdown rendering (headings, lists, code blocks, blockquotes)
- [x] T034 [US3] Integrate MarkdownRenderer into ChatPanel for assistant messages

**Checkpoint**: User Story 3 functional - Markdown content renders correctly in chat

---

## Phase 6: User Story 4 - 高清PDF显示 (Priority: P2)

**Goal**: PDF显示保持原始清晰度，不降低分辨率

**Independent Test**: PDF显示清晰度与原始文件一致

### Tests for User Story 4 (TDD) ⚠️

- [ ] T035 [P] [US4] Write tests for PDF high-resolution rendering in tests/unit/pdfRendering.test.ts

### Implementation for User Story 4

- [x] T036 [US4] Configure PDF.js viewport with 2x scale and devicePixelRatio
- [x] T037 [US4] Implement zoom controls (zoom in/out/fit-width/fit-page)
- [x] T038 [US4] Verify text remains crisp at different zoom levels
- [ ] T039 [US4] Add server book selection placeholder UI in src/renderer/components/BookSelector/index.tsx

**Checkpoint**: All user stories functional - PDF displays clearly and AI chat renders Markdown

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final integration and improvements

- [ ] T040 [P] Run full test suite and fix any failures
- [ ] T041 Perform integration testing across all components
- [ ] T042 [P] Run typecheck and fix any type errors
- [ ] T043 Build production package to verify everything works
- [ ] T044 Code cleanup and refactoring as needed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can proceed in parallel if desired
  - Or sequentially in priority order: US1 → US2 → US3 → US4
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational - Works independently from US1
- **User Story 3 (P3)**: Can start after Foundational - Depends on US2 (needs ChatPanel)
- **User Story 4 (P4)**: Can start after Foundational - Works independently from US1

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD)
- Services before components
- Core implementation before integration

---

## Parallel Opportunities

- Phase 1: T002, T003, T004 can run in parallel
- Phase 2: T009, T010, T011, T012, T013 can run in parallel
- Phase 3-6: User stories can run in parallel (different components)
- Within each story: Tests marked [P] can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test PDF reading independently
5. Deploy/demo if ready (basic PDF reader works!)

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (AI chat basic)
4. Add User Story 3 → Test independently → Deploy/Demo (AI chat with Markdown)
5. Add User Story 4 → Test independently → Deploy/Demo (Full feature!)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests MUST be written first (TDD approach per Constitution)
- Verify tests fail before implementing
- Stop at any checkpoint to validate story independently