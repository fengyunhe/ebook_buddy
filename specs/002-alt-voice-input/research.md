# Research: Alt Key Voice Input for AI Chat

**Feature**: 002-alt-voice-input  
**Date**: 2026-04-15

## Research Tasks

### Technology Research

| Topic | Research Question | Findings |
|-------|-------------------|----------|
| Browser Audio Capture | How to capture audio in Electron/React app? | Use MediaRecorder API in renderer process. Requires getUserMedia for microphone access. Works cross-platform (Windows/macOS/Linux). |
| OpenAI Audio Transcription | What format does OpenAI-compatible API expect? | OpenAI Whisper API expects audio in mp3, wav, mp4, m4a, webm formats. Send as FormData with 'file' and 'model' fields. |
| Local AI Presets | What are default endpoints for Ollama/LmStudio/oMLX? | Ollama: http://localhost:11434, LmStudio: http://localhost:1234/v1, oMLX: typically http://localhost:8080 (configurable) |
| Electron IPC | How to safely communicate between renderer and main? | Use contextBridge in preload. Expose specific APIs rather than nodeIntegration. |

### Best Practices

1. **Audio Recording**: Use MediaRecorder with mimeType detection for cross-browser compatibility
2. **Error Handling**: Implement timeout (30s) for API requests, handle network errors gracefully
3. **Security**: Never expose raw audio data; process in renderer, send via IPC if needed
4. **UX**: Show visual feedback during recording (indicator), handle permission denied gracefully

### Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Audio Format | webm/opus | Best cross-platform support in MediaRecorder, can convert if endpoint requires different format |
| API Client | fetch API | Native browser API, no additional dependencies needed |
| State Management | Zustand | Already in use by project, consistent with existing patterns |
| Configuration Storage | electron-store | Persistent storage for endpoint configuration |

### Alternatives Considered

- **Web Speech API**: Not suitable - requires internet, not local transcription
- **Third-party audio libraries**: Not needed - MediaRecorder sufficient
- **Direct main process audio**: Unnecessary complexity - renderer can handle recording