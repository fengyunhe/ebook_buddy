# Quickstart: Alt Key Voice Input

**Feature**: 002-alt-voice-input

## Prerequisites

- Node.js 18+
- pnpm (installed via `corepack enable` or `npm install -g pnpm`)
- Working microphone
- Local AI service running (Ollama, LmStudio, or oMLX)

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Verify existing tests pass:
   ```bash
   pnpm run typecheck
   pnpm run test:run
   ```

## Implementation Checklist

### Phase 1: Voice Capture

- [ ] Add voice recording hook/service in `src/renderer/services/`
- [ ] Implement MediaRecorder setup with getUserMedia
- [ ] Handle Alt key press/release events globally
- [ ] Add minimum duration check (discard < 500ms)
- [ ] Write unit tests for voice capture

### Phase 2: Transcription Service

- [ ] Create transcription service in `src/renderer/services/`
- [ ] Implement OpenAI-compatible API client
- [ ] Add endpoint presets (oMLX, Ollama, LmStudio)
- [ ] Support custom endpoint URL
- [ ] Handle timeout (30s default)
- [ ] Write unit tests for transcription

### Phase 3: Integration

- [ ] Connect transcription to chat input
- [ ] Add focus management after transcription
- [ ] Show recording indicator in UI
- [ ] Handle errors gracefully (no mic, API failure)
- [ ] Add configuration UI in settings
- [ ] Write integration tests

## Running the Feature

1. Start development server:
   ```bash
   pnpm run dev
   ```

2. Open the app and navigate to AI Chat

3. Hold Alt key to record voice

4. Release to transcribe - text appears in input field

## Configuration

Endpoint can be configured via Settings:
- Select preset: oMLX, Ollama, LmStudio
- Or enter custom URL

Default presets:
- Ollama: `http://localhost:11434/v1/audio/transcriptions`
- LmStudio: `http://localhost:1234/v1/audio/transcriptions`
- oMLX: `http://localhost:8080/v1/audio/transcriptions`

## Testing

Run tests:
```bash
pnpm run test:run
```

Type check:
```bash
pnpm run typecheck
```