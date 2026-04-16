# Tasks: Page Image Capture for AI Chat

**Branch**: `005-page-image-chat` | **Date**: 2026-04-16 | **Plan**: [plan.md](./plan.md)
**Input**: User stories from [spec.md](./spec.md)

## Task Summary

| Metric | Count |
|--------|-------|
| Total Tasks | 23 |
| User Story 1 (P1) | 7 |
| User Story 2 (P2) | 3 |
| User Story 3 (P2) | 3 |
| User Story 4 (P2) | 3 |
| Setup/Foundational | 5 |
| Parallelizable | 8 |

## MVP Scope (User Story 1 only)

Core feature: Right-click to capture current page as image and add to AI chat.

---

## Phase 1: Setup

- [X] T001 Create Zustand store for conversation images in src/renderer/stores/conversationImageStore.ts
- [X] T002 [P] Add PageImage types to src/shared/types/index.ts

## Phase 2: Foundational

- [X] T003 Implement PDF page capture service in src/renderer/services/pdfPageCapture.ts
- [X] T004 Create Electron main process context menu handler in src/main/menu/contextMenuTemplate.ts
- [X] T005 Set up IPC channels for page capture communication between main and renderer

## Phase 3: User Story 1 - Right-click to capture current page as image (P1)

**Story Goal**: Users can right-click on the current reading page to capture it as an image and add it to AI chat's image input.

**Independent Test**: Right-click on any page while reading an ebook and verify the page image appears in AI chat image input.

- [X] T006 [P] [US1] Create PDFViewer component with right-click handling in src/renderer/components/PDFViewer.tsx
- [X] T007 [US1] Implement context menu UI for "Add to AI Chat" option in src/main/menu/contextMenuTemplate.ts
- [X] T008 [US1] Wire up IPC to trigger page capture from context menu in src/preload/index.ts
- [X] T009 [US1] Integrate page capture with AI chat image input in src/main/index.ts
- [X] T010 Add right-click event listener to PDF viewer in src/renderer/components/PDFViewer/index.tsx
- [ ] T011 [P] [US1] Add notification toast for successful capture in src/renderer/components/Notification.tsx
- [ ] T012 [US1] Test right-click capture flow end-to-end in tests/integration/pageCapture.test.ts

## Phase 4: User Story 2 - Add multiple pages to AI chat (P2)

**Story Goal**: Users can add multiple different pages as images to a single AI conversation.

**Independent Test**: Add 3 different pages as images and verify all appear in AI chat.

- [X] T013 [P] [US2] Update Zustand store to support array of PageImages in src/renderer/stores/conversationImageStore.ts
- [X] T014 [US2] Create UI component to display list of added images in src/renderer/components/ImageList.tsx
- [X] T015 [P] [US2] Implement new conversation detection (reset image list) in src/renderer/stores/conversationImageStore.ts

## Phase 5: User Story 3 - Prevent duplicate page additions (P2)

**Story Goal**: The system prevents adding the same page number twice to the same conversation.

**Independent Test**: Attempt to add the same page twice and verify the system rejects with appropriate feedback.

- [X] T016 [P] [US3] Add duplicate check logic in page capture service in src/renderer/stores/conversationImageStore.ts
- [X] T017 [US3] Display "Page X has already been added" notification in src/renderer/components/Notification.tsx
- [ ] T018 [US3] Test duplicate prevention in tests/integration/duplicatePrevention.test.ts

## Phase 6: User Story 4 - Limit maximum images per conversation (P2)

**Story Goal**: The system enforces a maximum of 10 images per AI conversation.

**Independent Test**: Attempt to add an 11th image and verify the system rejects it.

- [X] T019 [P] [US4] Add max limit check (10 images) in page capture service in src/renderer/stores/conversationImageStore.ts
- [X] T020 [US4] Display "Maximum 10 images per conversation" notification in src/renderer/components/Notification.tsx
- [ ] T021 [US4] Test 10 image limit enforcement in tests/integration/imageLimit.test.ts

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T022 Verify typecheck passes: `pnpm run typecheck` in tests/
- [ ] T023 Run all tests: `pnpm run test:run` in tests/

---

## Dependencies

```
Phase 1 (Setup)
    |
    v
Phase 2 (Foundational) <-- Phase 1
    |
    v
Phase 3 (US1) <-- Phase 2
    |
    +----> Phase 4 (US2)  [can run in parallel after Phase 2]
    +----> Phase 5 (US3)  [can run in parallel after Phase 2]
    +----> Phase 6 (US4)  [can run in parallel after Phase 2]
    |
    v
Phase 7 (Polish)
```

## Parallel Execution Examples

### Example 1: User Story 1 only (MVP)
```
T001 -> T002 -> T003 -> T004 -> T005 -> T006 -> T007 -> T008 -> T009 -> T010 -> T011 -> T012
```

### Example 2: MVP + US2 (multiple pages)
```
T001 -> T002 -> T003 -> T004 -> T005 -> T006 -> T007 -> T008 -> T009 -> T010 -> T011 -> T012
                                                                  |
                                                                  v
                                                            T013 -> T014 -> T015
```

### Example 3: All Stories (full feature)
```
# Phase 1-2: Sequential
T001 -> T002 -> T003 -> T004 -> T005

# Phase 3: US1 (P1) - REQUIRED first
T006 -> T007 -> T008 -> T009 -> T010 -> T011 -> T012

# Phases 4-6: Can run in parallel after US1
T013 -> T014 -> T015
T016 -> T017 -> T018
T019 -> T020 -> T021

# Phase 7: Polish
T022 -> T023
```

## Implementation Strategy

**MVP First (User Story 1)**:
- Focus on the core interaction: right-click → capture → add to chat
- This delivers value: users can now capture page content and ask AI about it
- T012 (e2e test) validates the complete flow

**Incremental Delivery**:
- US2 adds multiple page support (users can reference more content)
- US3 adds duplicate protection (prevents user errors)
- US4 adds limit enforcement (protects system resources)

Each story phase is independently testable and delivers user value.