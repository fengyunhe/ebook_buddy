# Data Model: Alt Key Voice Input

**Feature**: 002-alt-voice-input  
**Date**: 2026-04-15

## Entities

### VoiceRecording

Represents captured audio data from the user's microphone.

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| id | string | UUID | Unique identifier |
| audioBlob | Blob | Required, non-empty | Captured audio data |
| duration | number | >= 500ms | Recording duration in milliseconds |
| timestamp | number | Unix timestamp | When recording started |
| format | string | 'audio/webm' | Audio format |

### TranscriptionConfig

Stores user preferences for the transcription endpoint.

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| preset | string | 'omlx' \| 'ollama' \| 'lmstudio' \| 'custom' | Selected preset |
| endpointUrl | string | Valid URL | Full endpoint URL |
| timeout | number | 1000-60000ms | Request timeout (default: 30000ms) |

### TranscriptionResult

Contains the result from the transcription API.

| Field | Type | Validation | Description |
|-------|------|------------|-------------|
| text | string | Non-empty | Transcribed text |
| success | boolean | Required | Whether transcription succeeded |
| error | string? | Optional | Error message if failed |

### EndpointPreset

Predefined configuration for local AI services.

| Preset | Default URL | Model |
|--------|-------------|-------|
| omlx | http://localhost:8080/v1/audio/transcriptions | whisper-1 |
| ollama | http://localhost:11434/v1/audio/transcriptions | whisper-1 |
| lmstudio | http://localhost:1234/v1/audio/transcriptions | whisper-1 |

## State Transitions

### Voice Recording State Machine

```
IDLE → (Alt key pressed) → RECORDING → (Alt released) → TRANSCRIBING → IDLE
         ↓                              ↓                    ↓
       ERROR                        ERROR                ERROR
```

| State | Description |
|-------|-------------|
| IDLE | Waiting for user input |
| RECORDING | Alt key held, actively capturing audio |
| TRANSCRIBING | Audio sent to API, waiting for response |
| ERROR | Something went wrong (no mic, API error, etc.) |

## Validation Rules

1. **Minimum Recording Duration**: Recordings < 500ms are discarded
2. **Maximum API Timeout**: 30 seconds, after which request is cancelled
3. **URL Validation**: Custom endpoint URLs must be valid HTTP/HTTPS URLs
4. **Audio Format**: Must be a valid audio type supported by MediaRecorder

## Integration Points

- **ChatStore**: Insert transcribed text into chat input
- **Settings**: Store/load TranscriptionConfig
- **UI Components**: Show recording indicator, error messages