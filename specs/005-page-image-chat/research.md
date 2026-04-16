# Research: Page Image Capture for AI Chat

## Research Tasks

### Task 1: PDF.js Page Capture

**Question**: How to capture a PDF page as an image using pdfjs-dist?

**Findings**:
- PDF.js renders pages to a canvas element
- Use `page.getViewport({ scale })` to get page dimensions
- Create an offscreen canvas, render the page to it, then use `canvas.toDataURL()` or `canvas.toBlob()` to get the image
- For high quality, use scale of 1.5-2.0
- Memory management: reuse canvas, call `page.cleanup()` after render

**Decision**: Use PDF.js canvas rendering approach with `toDataURL('image/png')`
**Rationale**: Native PDF.js approach, no additional dependencies, works offline
**Alternatives considered**: html2canvas (adds dependency, may not capture PDF accurately)

---

### Task 2: Electron Context Menu

**Question**: How to implement right-click context menu in Electron renderer?

**Findings**:
- Two approaches: main process `webContents.on('context-menu')` or renderer `contextmenu` event
- Main process approach provides more control via `params` object (selection, link, etc.)
- For custom menu items, use IPC: renderer sends message, main process builds and pops menu
- Can pass current page number via IPC when menu is requested

**Decision**: Use main process `context-menu` event with IPC
**Rationale**: Cleaner separation, better control over menu items, follows Electron best practices
**Alternatives considered**: Renderer-only contextmenu event (less control, potential security concerns)

---

### Task 3: Zustand State Management

**Question**: Best practices for managing image list state in Zustand?

**Findings**:
- Use Zustand for session-based state (not persisted)
- Store images as array of objects with page number, image data, timestamp
- Implement actions: addImage, removeImage, clearImages
- Add duplicate check before adding
- Add limit check (max 10) before adding

**Decision**: Create a Zustand store for conversation images
**Rationale**: Matches existing project patterns (003-ai-chat-voice-image uses Zustand), simple and effective
**Alternatives considered**: React Context (more boilerplate), local state (no persistence within session)

---

### Task 4: Integration with Existing AI Chat

**Question**: How does existing AI chat handle image inputs?

**Findings from 003-ai-chat-voice-image**:
- Messages support `type: 'image'` with base64 content
- Chat request format supports `image_url: { url: string }` in message content
- MediaAttachment entity stores image data as base64 or URL

**Decision**: Reuse existing chat infrastructure, pass page images as base64 data URLs
**Rationale**: Already implemented and tested, reduces duplication
**Alternatives considered**: New image handling (unnecessary, would duplicate functionality)

---

## Consolidated Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Page capture method | PDF.js canvas + toDataURL | Native, offline-capable, no extra deps |
| Context menu | Main process + IPC | Standard Electron pattern |
| State management | Zustand store | Matches project conventions |
| Image integration | Reuse existing chat | Reduces code duplication |

## Open Questions Resolved

1. **Q: Should we capture full scroll or visible area?**
   - A: Visible area only (as per spec assumption). Full scroll would add complexity.

2. **Q: What image format?**
   - A: PNG via toDataURL('image/png'). Good balance of quality and compatibility.

3. **Q: How to handle image size limit (5MB from 003)?**
   - A: Check image size before adding. If > 5MB, show error message.

## Next Steps

Proceed to Phase 1: Design with these decisions as foundation.