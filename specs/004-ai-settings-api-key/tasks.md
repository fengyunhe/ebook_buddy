---

description: "Task list for 完善AI助手设置界面 feature implementation"
---

# Tasks: 完善AI助手设置界面

**Input**: Design documents from `/specs/004-ai-settings-api-key/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), data-model.md

**Tests**: 遵循 constitution TDD 要求，需要编写测试

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Foundational (Core Types & Storage)

**Purpose**: Core types and state management updates required before any user story

**Independent Test**: N/A - infrastructure only

- [x] T001 [P] Update TranscriptionConfig type in src/shared/types/transcription.ts (添加 apiKey 字段)
- [x] T002 [P] Update EndpointPreset type in src/shared/types/transcription.ts
- [x] T003 [P] Update DEFAULT_ENDPOINT_PRESETS in src/shared/types/transcription.ts (oMLX端口改为8000/v1)
- [x] T004 [P] Update getTranscriptionEndpoint function in src/shared/types/transcription.ts (直接拼接)
- [x] T005 [P] Add setApiKey and clearApiKey methods in src/renderer/stores/configStore.ts
- [x] T006 Add apiKey state persistence config in src/renderer/stores/configStore.ts

**Checkpoint**: Core types and state ready - user story implementation can now begin

---

## Phase 2: User Story 1 - 安全配置API密钥 (Priority: P1) 🎯 MVP

**Goal**: 用户可以在设置界面安全配置API密钥

**Independent Test**: 用户打开设置界面，输入API密钥并保存，密钥被安全存储且不显示明文

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T007 [P] [US1] Unit test for apiKey storage in tests/unit/configStore.test.ts
- [x] T008 [P] [US1] Unit test for password field display in tests/unit/VoiceSettingsDialog.test.ts

### Implementation for User Story 1

- [x] T009 [P] [US1] Add API key TextField (type="password") in src/renderer/components/VoiceSettingsDialog.tsx
- [x] T010 [US1] Handle apiKey input and save in src/renderer/components/VoiceSettingsDialog.tsx
- [x] T011 [US1] Display empty or masked value when reopening settings in src/renderer/components/VoiceSettingsDialog.tsx

**Checkpoint**: User can configure API key securely

---

## Phase 3: User Story 2 - 修正oMLX默认端口 (Priority: P1)

**Goal**: oMLX默认端口修正为8000

**Independent Test**: 选择oMLX预设时，默认URL为http://localhost:8000/v1

### Implementation for User Story 2

- [x] T012 [P] [US2] Verify DEFAULT_ENDPOINT_PRESETS.omlx = 'http://localhost:8000/v1' in src/shared/types/transcription.ts
- [x] T013 [US2] Update preset change handler in src/renderer/components/VoiceSettingsDialog.tsx (if needed)

**Checkpoint**: oMLX default port fixed to 8000

---

## Phase 4: User Story 3 - 标准化Base URL格式 (Priority: P1)

**Goal**: Base URL直接使用，用户输入完整URL（含/v1）

**Independent Test**: 用户配置Base URL为http://localhost:8000/v1，调用时URL为http://localhost:8000/v1/audio/transcriptions

### Implementation for User Story 3

- [x] T014 [P] [US3] Update preset URLs in src/shared/types/transcription.ts (添加/v1后缀)
- [x] T015 [US3] Update transcription service to use direct concatenation in src/renderer/services/transcriptionService.ts
- [x] T016 [US3] Add Authorization header when apiKey exists in src/renderer/services/transcriptionService.ts

**Checkpoint**: Base URL works correctly with /v1 path

---

## Phase 5: User Story 4 - 保护密钥安全存储 (Priority: P1)

**Goal**: API密钥加密存储，不以明文形式暴露

**Independent Test**: 检查配置文件或localStorage，密钥不以明文保存

### Implementation for User Story 4

- [x] T017 [P] [US4] Implement secure storage using electron-store with safeStorage in src/main/index.ts (IPC)
- [x] T018 [US4] Add IPC handlers for store/getApiKey and store/setApiKey in src/main/index.ts
- [x] T019 [US4] Update configStore to use IPC for apiKey in src/renderer/stores/configStore.ts

**Checkpoint**: API key stored securely

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements and validation

- [x] T020 [P] Update hint text in VoiceSettingsDialog.tsx (提示用户输入完整URL含/v1)
- [x] T021 [P] Run typecheck: `npm run typecheck`
- [x] T022 Run tests: `npm run test:run`
- [x] T023 Verify all acceptance scenarios pass manually

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies - can start immediately
- **User Stories (Phase 2-5)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (different files)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: After Foundational - No dependencies on other stories
- **US2 (P1)**: After Foundational - No dependencies on other stories
- **US3 (P1)**: After Foundational - No dependencies on other stories
- **US4 (P1)**: After Foundational - No dependencies on other stories

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- UI components before business logic
- Core implementation before integration

### Parallel Opportunities

- Phase 1 tasks T001-T006 all marked [P] can run in parallel
- Implementation tasks T009-T011 (US1) can run in parallel
- Phase 6 tasks T020-T021 marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all implementation for User Story 1 together:
Task: "Add API key TextField (type='password') in VoiceSettingsDialog.tsx"
Task: "Handle apiKey input and save in VoiceSettingsDialog.tsx"
Task: "Display empty or masked value when reopening settings"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Foundational
2. Complete Phase 2: User Story 1
3. **STOP and VALIDATE**: Test User Story 1 independently
4. Deploy/demo if ready

### Incremental Delivery

1. Complete Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2 + 3
   - Developer C: User Story 4
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence