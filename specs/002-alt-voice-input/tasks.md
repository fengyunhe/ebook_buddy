# Implementation Tasks: Alt Key Voice Input

**Feature Branch**: `002-alt-voice-input` | **Date**: 2026-04-15 | **Spec**: [spec.md](./spec.md)

## Overview

| Metric | Value |
|--------|-------|
| Total Tasks | 19 |
| User Stories | 3 |
| MVP Scope | User Story 1 only |

## Phase 1: Setup

- [ ] T001 Create voice recording types in src/shared/types/voice.ts
- [ ] T002 Create transcription config types in src/shared/types/transcription.ts

## Phase 2: Foundational

- [ ] T003 [P] Implement voice recording state machine in src/renderer/stores/voiceStore.ts
- [ ] T004 [P] Implement transcription config store in src/renderer/stores/configStore.ts
- [ ] T005 Create error types for voice input errors in src/shared/types/errors.ts

## Phase 3: User Story 1 - Voice-to-Text via Alt Key (P1)

**Goal**: Allow users to hold Alt key to record voice, release to transcribe, and have text inserted into AI Chat input with focus.

**Independent Test**: Hold Alt key to record, release to transcribe, verify text appears in chat input field with focus.

**Implementation**:

- [ ] T006 [US1] Create useVoiceRecorder hook in src/renderer/services/useVoiceRecorder.ts
- [ ] T007 [US1] Implement MediaRecorder setup with getUserMedia in useVoiceRecorder hook
- [ ] T008 [US1] Add global Alt key event listeners in useVoiceRecorder
- [ ] T009 [US1] Implement minimum duration check (discard < 500ms) in useVoiceRecorder
- [ ] T010 [US1] Add ignore new press while recording in progress logic
- [ ] T011 [US1] Create transcription service in src/renderer/services/transcriptionService.ts
- [ ] T012 [US1] Implement OpenAI-compatible API client with fetch in transcriptionService
- [ ] T013 [US1] Add 15-second timeout handling in transcriptionService
- [ ] T014 [US1] Create recording indicator component in src/renderer/components/VoiceRecordingIndicator.tsx
- [ ] T015 [US1] Implement insert text into chat input and focus in ChatInput component

## Phase 4: User Story 2 - Configurable Speech-to-Text Endpoint (P2)

**Goal**: Allow users to configure which local AI endpoint handles voice transcription.

**Independent Test**: Change endpoint configuration, verify voice transcription works with new endpoint.

**Implementation**:

- [ ] T016 [P] [US2] Add custom endpoint URL input in settings UI
- [ ] T017 [US2] Implement URL validation for custom endpoints
- [ ] T018 [US2] Add error notification for invalid endpoint configuration

## Phase 5: User Story 3 - Endpoint Presets (P3)

**Goal**: Provide preset options for oMLX, Ollama, and LmStudio.

**Independent Test**: Select each preset, verify endpoint URL is correctly configured.

**Implementation**:

- [ ] T019 [P] [US3] Add preset selection UI with oMLX, Ollama, LmStudio options

## Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational)
    ↓
Phase 3 (US1) ← US1 is MVP, can ship after this phase
    ↓
Phase 4 (US2) ← depends on Phase 2
    ↓
Phase 5 (US3) ← depends on Phase 2
```

## Parallel Execution Opportunities

| Tasks | Reason |
|-------|--------|
| T003, T004 | Independent stores, no shared dependencies |
| T006, T011 | Different services, can implement in parallel |
| T016, T019 | Settings UI components, no dependencies between them |

## Implementation Strategy

### MVP Scope (User Story 1)

The MVP includes only User Story 1 and can be shipped after completing Phase 3. This delivers the core voice-to-text functionality that allows users to:
1. Hold Alt key to record voice
2. Release to transcribe via configurable endpoint
3. Have text inserted into chat input with focus

### Incremental Delivery

1. **Increment 1**: Phase 1 + Phase 2 + Phase 3 → MVP with basic voice-to-text
2. **Increment 2**: Phase 4 → Add custom endpoint configuration
3. **Increment 3**: Phase 5 → Add preset options

## Testing

Per constitution requirements, tests should be written before implementation. Test tasks should be added per the constitution: "Unit tests required for all new components and services".
