# Ebook Buddy Constitution

## Core Principles

### I. Test-First Development
All features must have tests before implementation. Tests define expected behavior; implementation fulfills it. Unit tests required for all new components and services; integration tests required for user workflows.

### II. Specification-Driven
All changes must be documented in SPEC.md before code. Feature branches follow the workflow: spec → clarify → plan → tasks → implement → checklist.

### III. Incremental Delivery
Small, frequent releases over large batches. Each user story delivers independent value. MVP first: PDF viewing, then AI chat capability.

### IV. Automated Verification
CI/CD must pass before any merge. `pnpm run typecheck` and `pnpm run test:run` must pass locally before push.

### V. Documentation as Code
Docs live next to the code they describe. Feature specs in `specs/[feature-branch]/`, tasks track implementation progress.

### VI. Conventional Commits
All git commit messages must follow the Conventional Commits specification. Format: `<type>(<scope>): <description>` where type is one of: feat, fix, docs, style, refactor, test, chore, perf, ci, build. Use imperative mood in description.

### VII. Package Manager
This project uses **pnpm** as the package manager. All developers must use pnpm commands (install, add, remove, etc.) instead of npm or yarn. Lockfiles must be committed. Rationale: pnpm's strict node_modules improves consistency and reduces disk usage.

### VIII. Git Automation Prohibition
NEVER automatically commit or push code to git. All commits must be explicitly requested by the user. Rationale: prevents unintended changes from being recorded and gives the user full control over what gets committed.

## Additional Constraints

### Technology Stack
- **Frontend**: Electron 28 + React 18 + TypeScript 5.3
- **State Management**: Zustand
- **PDF Rendering**: PDF.js (pdfjs-dist)
- **Markdown Rendering**: react-markdown + remark + rehype + katex
- **Testing**: Vitest + Testing Library
- **Build**: electron-vite (pnpm required)

### Desktop-Specific Requirements
- Offline-capable core reading (PDF viewing works without network)
- Local file access for PDF selection
- Persistent reading position per book
- Responsive UI to window resizing

## Development Workflow

### Feature Branch Lifecycle
1. Create branch: `###-feature-name`
2. Write SPEC.md with user stories
3. Clarify requirements if needed
4. Create plan.md with technical approach
5. Generate tasks.md from user stories
6. Implement: tests first → code → verify
7. Checklist validation before PR

### Quality Gates
Before any PR:
- [ ] Tests written first (TDD)
- [ ] Feature spec updated
- [ ] Code follows TypeScript conventions
- [ ] `pnpm run typecheck` passes
- [ ] `pnpm run test:run` passes
- [ ] Documentation updated
- [ ] Commit messages follow Conventional Commits

## Governance

This constitution supersedes all other practices. Amendments require documented changes with version bump per semantic versioning rules: MAJOR for removals, MINOR for additions, PATCH for clarifications.

**Version**: 1.2.0 | **Ratified**: 2026-04-15 | **Last Amended**: 2026-04-16
