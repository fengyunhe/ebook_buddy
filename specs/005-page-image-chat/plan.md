# Implementation Plan: Page Image Capture for AI Chat

**Branch**: `005-page-image-chat` | **Date**: 2026-04-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-page-image-chat/spec.md`

## Summary

This feature allows ebook readers to right-click on the current page to capture it as an image and add it to the AI chat's image input. Users can add multiple pages (up to 10) to a single conversation, with duplicate page numbers automatically prevented.

## Technical Context

**Language/Version**: TypeScript 5.3  
**Primary Dependencies**: Electron 28, React 18, Zustand, PDF.js (pdfjs-dist)  
**Storage**: In-memory state with Zustand (session-based)  
**Testing**: Vitest + Testing Library  
**Target Platform**: Desktop (Electron 28)  
**Project Type**: desktop-app  
**Performance Goals**: Page capture < 500ms, immediate feedback on duplicate/limit errors (< 1s)  
**Constraints**: Offline-capable, max 10 images per conversation  
**Scale/Scope**: Single user session, typical 1-10 images per conversation  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Notes |
|------|--------|-------|
| Test-First Development | ✅ Pass | Feature will implement TDD with Vitest |
| Specification-Driven | ✅ Pass | SPEC.md created, following workflow |
| Incremental Delivery | ✅ Pass | User stories are independently testable |
| Automated Verification | ✅ Pass | Will use pnpm run typecheck and pnpm run test:run |
| Package Manager (pnpm) | ✅ Pass | Project uses pnpm |
| Git Automation Prohibition | ✅ Pass | No auto-commit enabled |

## Project Structure

### Documentation (this feature)

```text
specs/005-page-image-chat/
├── plan.md              # This file
├── research.md          # Phase 0 output ✅
├── data-model.md        # Phase 1 output ✅
├── quickstart.md        # Phase 1 output ✅
├── contracts/           # Skipped (internal feature)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── main/                # Electron main process
├── preload/            # Preload scripts
├── renderer/           # React frontend
│   ├── components/    # UI components
│   ├── pages/         # Page components
│   ├── stores/        # Zustand stores
│   ├── services/      # Business logic
│   └── hooks/         # Custom React hooks
└── shared/            # Shared types and utilities

tests/
├── unit/               # Unit tests
├── integration/        # Integration tests
└── e2e/                # End-to-end tests
```

**Structure Decision**: Standard Electron + React + TypeScript structure. Feature will add components to renderer/components/ and create a Zustand store for managing conversation images in renderer/stores/.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | - | - |

---

## Phase Outputs

| Phase | Output | Status |
|-------|--------|--------|
| Phase 0 | research.md | ✅ Complete |
| Phase 1 | data-model.md | ✅ Complete |
| Phase 1 | quickstart.md | ✅ Complete |
| Phase 1 | contracts/ | Skipped (internal feature) |

---

## Key Technical Decisions

1. **Page capture**: Use PDF.js canvas rendering with `toDataURL('image/png')`
2. **Context menu**: Main process `context-menu` event with IPC for custom menu
3. **State management**: Zustand store (matches project conventions from 003)
4. **Image integration**: Reuse existing chat infrastructure from 003-ai-chat-voice-image

---

## Next Steps

Proceed to `/speckit.tasks` to generate implementation tasks from user stories.