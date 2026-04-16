# Implementation Checklist: Page Image Capture for AI Chat

**Purpose**: Track implementation progress
**Created**: 2026-04-16
**Feature**: [Link to spec.md](../005-page-image-chat/spec.md)

## Phase 1: Setup

- [X] T001 Create Zustand store for conversation images in src/renderer/stores/conversationImageStore.ts
- [X] T002 [P] Add PageImage types to src/shared/types/index.ts

## Phase 2: Foundational

- [X] T003 Implement PDF page capture service in src/renderer/services/pdfPageCapture.ts
- [X] T004 Create Electron main process context menu handler in src/main/menu/contextMenuTemplate.ts
- [X] T005 Set up IPC channels for page capture communication between main and renderer

## Phase 3: User Story 1 - Right-click to capture current page as image (P1)

- [X] T006 [P] [US1] Create PDFViewer component with right-click handling in src/renderer/components/PDFViewer.tsx
- [X] T007 [US1] Implement context menu UI for "Add to AI Chat" option in src/main/menu/contextMenuTemplate.ts
- [X] T008 [US1] Wire up IPC to trigger page capture from context menu in src/preload/index.ts
- [X] T009 [US1] Integrate page capture with AI chat image input in src/main/index.ts
- [X] T010 Add right-click event listener to PDF viewer in src/renderer/pages/ReaderPage.tsx
- [X] T011 [P] [US1] Add notification toast for successful capture in src/renderer/components/Notification.tsx
- [ ] T012 [US1] Test right-click capture flow end-to-end in tests/integration/pageCapture.test.ts

## Phase 4: User Story 2 - Add multiple pages to AI chat (P2)

- [X] T013 [P] [US2] Update Zustand store to support array of PageImages in src/renderer/stores/conversationImageStore.ts
- [X] T014 [US2] Create UI component to display list of added images in src/renderer/components/ImageList.tsx
- [X] T015 [P] [US2] Implement new conversation detection (reset image list) in src/renderer/stores/conversationImageStore.ts

## Phase 5: User Story 3 - Prevent duplicate page additions (P2)

- [X] T016 [P] [US3] Add duplicate check logic in page capture service in src/renderer/stores/conversationImageStore.ts
- [X] T017 [US3] Display "Page X has already been added" notification in src/renderer/components/Notification.tsx
- [ ] T018 [US3] Test duplicate prevention in tests/integration/duplicatePrevention.test.ts

## Phase 6: User Story 4 - Limit maximum images per conversation (P2)

- [X] T019 [P] [US4] Add max limit check (10 images) in page/renderer/stores/conversationImageStore.ts
- [X] T020 [US4] Display "Maximum 10 images per conversation" notification in src/renderer/components/Notification.tsx
- [ ] T021 [US4] Test 10 image limit enforcement in tests/integration/imageLimit.test.ts

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T022 Verify typecheck passes: `pnpm run typecheck` in tests/
- [ ] T023 Run all tests: `pnpm run test:run` in tests/