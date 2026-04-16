---

description: "Task list template for feature implementation"
---

# Tasks: AI助手语音聊天与图片支持

**Input**: Design documents from `/specs/003-ai-chat-voice-image/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are not explicitly requested in spec - focus on implementation

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

**Note**: Project already exists - skip Phase 1 setup

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T001 Create TypeScript type definitions for API requests/responses in src/types/api.ts
- [x] T002 [P] Setup endpoint configuration and environment handling in src/config/endpoint.ts
- [x] T003 Create base API client with fetch wrapper in src/services/apiClient.ts
- [x] T004 Setup error handling types and utilities in src/utils/errors.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - 语音输入转文字发送 (Priority: P1) 🎯 MVP

**Goal**: 实现语音识别功能，发送音频到endpoint，返回识别文字

**Independent Test**: 发送音频Blob到transcribe函数，返回识别文字

### Implementation for User Story 1

- [x] T005 [P] [US1] Create VoiceService type definitions in src/types/voice.ts
- [x] T006 [P] [US1] Implement VoiceService with OpenAI-compatible audio transcription in src/services/voiceService.ts
- [x] T007 [US1] Add audio format validation and conversion utility in src/utils/audioUtils.ts
- [x] T008 [US1] Add timeout handling (10s) and error handling for voice service

**Checkpoint**: User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - 与AI助手文字对话 (Priority: P2)

**Goal**: 实现文字对话功能，发送文字消息，获得AI回复

**Independent Test**: 发送文字消息到chat函数，返回AI回复

### Implementation for User Story 2

- [x] T009 [P] [US2] Create ChatService type definitions in src/types/chat.ts
- [x] T010 [P] [US2] Implement ChatService with OpenAI-compatible chat completion in src/services/chatService.ts
- [x] T011 [US2] Implement message history management in src/stores/chatStore.ts
- [x] T012 [US2] Add timeout handling and error recovery for chat service

**Checkpoint**: User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - 发送截图给AI助手 (Priority: P2)

**Goal**: 实现截图功能，捕获屏幕内容并发送给AI分析

**Independent Test**: 调用captureScreen函数，返回截图MediaAttachment

### Implementation for User Story 3

- [x] T013 [P] [US3] Create MediaService type definitions in src/types/media.ts
- [x] T014 [P] [US3] Implement screen capture using Electron desktopCapturer in src/services/mediaService.ts
- [x] T015 [US3] Integrate screenshot with ChatService for AI analysis

**Checkpoint**: User Story 3 should be functional

---

## Phase 6: User Story 4 - 发送本地图片给AI助手 (Priority: P2)

**Goal**: 实现本地图片选择功能，选择图片文件并发送给AI分析

**Independent Test**: 调用selectImage函数，返回图片MediaAttachment

### Implementation for User Story 4

- [x] T016 [P] [US4] Implement image file selection using Electron dialog in src/services/mediaService.ts
- [x] T017 [US4] Add 5MB size validation for image files in src/utils/imageUtils.ts
- [x] T018 [US4] Integrate image selection with ChatService for AI analysis

**Checkpoint**: All user stories should now be independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T019 [P] Add retry logic for failed API requests in src/services/apiClient.ts
- [x] T020 Add logging for all service operations in src/services/
- [x] T021 Run typecheck and verify no errors
- [ ] T022 Update quickstart.md with usage examples

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can proceed in parallel after Phase 2
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational - Uses shared apiClient
- **User Story 3 (P3)**: Can start after Foundational - Uses ChatService from US2
- **User Story 4 (P4)**: Can start after Foundational - Uses ChatService from US2

### Within Each User Story

- Types before services
- Services before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Foundational tasks marked [P] can run in parallel
- US1, US2, US3, US4 can all start in parallel after Phase 2 completes
- Types tasks within stories marked [P] can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (T001-T004)
2. Complete Phase 3: User Story 1 (T005-T008)
3. **STOP and VALIDATE**: Test User Story 1 independently

### Incremental Delivery

1. Complete Foundational → Foundation ready
2. Add User Story 1 → Test independently (MVP!)
3. Add User Story 2 → Test independently
4. Add User Story 3 → Test independently
5. Add User Story 4 → Test independently

---

## Summary

| Metric | Count |
|--------|-------|
| Total Tasks | 22 |
| User Story 1 (P1) | 4 |
| User Story 2 (P2) | 4 |
| User Story 3 (P2) | 3 |
| User Story 4 (P2) | 3 |
| Foundational | 4 |
| Polish | 4 |

**MVP Scope**: User Story 1 - 语音输入转文字发送

**Independent Test Criteria**:
- US1: 发送音频数据到endpoint，返回识别后的文字
- US2: 发送文字消息，收到AI回复
- US3: 发送截屏图片，收到AI分析结果
- US4: 发送图片文件，收到AI分析结果