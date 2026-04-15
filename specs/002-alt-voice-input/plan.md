# Implementation Plan: Alt Key Voice Input

**Branch**: `002-alt-voice-input` | **Date**: 2026-04-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `./spec.md`

## Summary

Alt key voice input for AI Chat allows users to hold the Alt key to record voice, release to transcribe via a configurable OpenAI-compatible endpoint, and have the resulting text inserted into the AI Chat input field with focus. Supports Windows, macOS, and Linux with presets for oMLX, Ollama, and LmStudio.

## Technical Context

**Language/Version**: TypeScript 5.3  
**Primary Dependencies**: Electron 28, React 18, Zustand  
**Storage**: N/A (configuration stored in electron-store or localStorage)  
**Testing**: Vitest + Testing Library  
**Target Platform**: Windows, macOS, Linux (desktop)  
**Project Type**: desktop-app (Electron)  
**Performance Goals**: Voice-to-text completion under 5 seconds, 30-second API timeout  
**Constraints**: Must work offline for recording, requires network for transcription endpoint  
**Scale/Scope**: Single feature addition to existing app

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Test-First Development | ✅ PASS | Feature will require unit tests for voice capture, transcription service, and integration with chat input |
| Specification-Driven | ✅ PASS | SPEC.md created and clarified, ready for implementation |
| Incremental Delivery | ✅ PASS | Feature adds incrementally to existing chat functionality |
| Automated Verification | ✅ PASS | Must pass pnpm run typecheck and pnpm run test:run before PR |
| Documentation as Code | ✅ PASS | Feature specs stored in specs/002-alt-voice-input/ |

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── main/           # Electron main process
├── preload/        # Preload scripts for IPC
├── renderer/       # React UI
│   ├── components/ # UI components
│   ├── services/   # Business logic services
│   └── stores/     # Zustand state management
└── shared/         # Shared types

tests/
├── unit/           # Unit tests
└── integration/    # Integration tests
```

**Structure Decision**: Electron app with renderer process (React). Feature additions go in src/renderer/ for UI and services, src/preload/ for IPC bridge. Tests go in tests/ directory.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. Feature is a single incremental addition to existing application.
