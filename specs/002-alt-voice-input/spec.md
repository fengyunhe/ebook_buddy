# Feature Specification: Alt Key Voice Input for AI Chat

**Feature Branch**: `002-alt-voice-input`  
**Created**: 2026-04-15  
**Status**: Draft  
**Input**: User description: "在按下alt键时开启语音输入，松开alt键时向一个OpenAI兼容的endpoint（可配置地址，可从预设中选择oMLX，Ollama、LmStudio）发送请求将语音转换为文本，转换后将文本输入到AI Chat的输入框中并让次输入框获取到焦点便于用户调整文字已进行后续操作（后续操作不在本需求中）"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Voice-to-Text via Alt Key (Priority: P1)

As a user, I want to use voice input to populate the AI Chat text field so that I can quickly create messages without typing.

**Why this priority**: This is the core functionality that enables hands-free message creation, significantly improving user convenience and accessibility.

**Independent Test**: Can be tested by holding Alt key to record voice, releasing to transcribe, and verifying the resulting text appears in the chat input field with focus.

**Acceptance Scenarios**:

1. **Given** the application is running and AI Chat is open, **When** the user presses and holds the Alt key, **Then** voice recording begins
2. **Given** voice recording is in progress, **When** the user releases the Alt key, **Then** recording stops and transcription request is sent to the configured endpoint
3. **Given** transcription is successful, **When** the text is received, **Then** the text is inserted into the AI Chat input field and that field receives focus
4. **Given** transcription fails, **When** the user releases Alt key, **Then** a user-friendly error message is displayed and input field remains available for manual entry

---

### User Story 2 - Configurable Speech-to-Text Endpoint (Priority: P2)

As a user, I want to configure which local AI endpoint handles voice transcription so that I can use my preferred local LLM service.

**Why this priority**: Users have different local AI setups (oMLX, Ollama, LmStudio), and the feature should support their existing infrastructure.

**Independent Test**: Can be tested by changing the endpoint configuration and verifying voice transcription works with the new endpoint.

**Acceptance Scenarios**:

1. **Given** the application settings are accessible, **When** the user selects an endpoint preset (oMLX, Ollama, LmStudio) or enters a custom URL, **Then** the configuration is saved and used for subsequent transcription requests
2. **Given** an invalid endpoint URL is configured, **When** a transcription is attempted, **Then** the user is notified of the configuration issue

---

### User Story 3 - Endpoint Presets (Priority: P3)

As a user, I want to quickly select from common local AI transcription services so that I can set up voice input with minimal configuration.

**Why this priority**: Simplifies initial setup by providing preset options for the most popular local AI platforms.

**Independent Test**: Can be tested by selecting each preset and verifying the endpoint URL is correctly configured.

**Acceptance Scenarios**:

1. **Given** the endpoint settings are displayed, **When** the user selects "Ollama" preset, **Then** the endpoint URL is set to the default Ollama transcription endpoint
2. **Given** the endpoint settings are displayed, **When** the user selects "LmStudio" preset, **Then** the endpoint URL is set to the default LmStudio transcription endpoint
3. **Given** the endpoint settings are displayed, **When** the user selects "oMLX" preset, **Then** the endpoint URL is set to the default oMLX transcription endpoint

---

### Edge Cases

- What happens when the user presses Alt key but no microphone is available? → Clarified: Show error and guide to settings
- How does the system handle very long voice recordings (e.g., over 60 seconds)? → Clarified: No maximum limit
- What happens when the network request times out during transcription? → Clarified: 15 second timeout, show error with retry option
- How does the system handle multiple rapid Alt key presses? → Clarified: Ignore new press until current recording completes
- What happens if the user releases Alt before minimum recording time (e.g., less than 500ms)? → Clarified: Recordings under 500ms are discarded

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST capture audio input when Alt key is pressed and held
- **FR-002**: System MUST stop audio capture when Alt key is released
- **FR-003**: System MUST send captured audio to the configured OpenAI-compatible endpoint for transcription
- **FR-004**: System MUST support endpoint presets: oMLX, Ollama, and LmStudio
- **FR-005**: System MUST allow users to configure a custom endpoint URL
- **FR-006**: System MUST insert transcribed text into the AI Chat input field
- **FR-007**: System MUST set focus to the AI Chat input field after transcription completes
- **FR-008**: System MUST display clear error messages when transcription fails
- **FR-009**: System MUST handle microphone permission requests gracefully
- **FR-013**: System MUST implement 15-second timeout for transcription requests
- **FR-014**: System MUST ignore new Alt key presses while recording is in progress
- **FR-011**: System MUST discard audio recordings shorter than 500ms
- **FR-012**: System MUST display an error message with guidance to settings when no microphone is available

### Key Entities *(include if data is involved)*

- **VoiceRecording**: Represents captured audio data with timestamps and duration
- **TranscriptionConfig**: Stores endpoint URL, selected preset, and authentication settings
- **TranscriptionResult**: Contains the transcribed text and any error information

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can successfully complete voice-to-text input in under 5 seconds from Alt release to text appearing in input field
- **SC-002**: 95% of successful transcription requests complete without timeout (15-second limit)
- **SC-003**: 90% of users can configure their preferred endpoint and complete a transcription on first attempt
- **SC-004**: Users receive actionable error feedback within 2 seconds when transcription fails

## Assumptions

- Users have a working microphone connected and have granted microphone permissions
- The configured local AI endpoint is running and accessible on the user's network
- The AI Chat input field exists and is accessible in the application UI
- Users are familiar with the concept of local AI services (oMLX, Ollama, LmStudio)
- The application has a settings or configuration area where users can set the endpoint
- Feature supports Windows, macOS, and Linux desktop platforms

## Clarifications

### Session 2026-04-15

- Q: Which platforms should this voice input feature support? → A: Windows, macOS, and Linux
- Q: What should be the minimum voice recording duration before transcription is attempted? → A: 500ms (shorter recordings are discarded)
- Q: What should be the maximum voice recording duration? → A: No limit (unlimited duration)
- Q: What should happen when the user presses Alt but no microphone is available? → A: Show error message and guide user to settings
- Q: What should happen when the network request times out during transcription? → A: 15 second timeout, show error with retry option
- Q: How should the system handle multiple rapid Alt key presses? → A: Ignore new press until current recording completes